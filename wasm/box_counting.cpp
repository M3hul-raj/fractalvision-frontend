/**
 * Box-counting fractal dimension algorithm — WebAssembly implementation.
 *
 * Mirrors the Python backend (app/core/box_counting.py + regression.py)
 * for client-side benchmarking. Compiled to WASM via Emscripten.
 */

#include <emscripten.h>
#include <vector>
#include <cmath>
#include <string>
#include <sstream>
#include <algorithm>
#include <numeric>
#include <cstdint>
#include <cstdlib>
#include <cstring>

// ---------------------------------------------------------------------------
// auto_select_box_sizes — powers of 2 from 4 up to min(width, height) / 4
// ---------------------------------------------------------------------------
static std::vector<int> auto_select_box_sizes(int width, int height) {
    int min_dim = std::min(width, height);
    int max_box = min_dim / 4;
    std::vector<int> sizes;
    int bs = 4;
    while (bs <= max_box) {
        sizes.push_back(bs);
        bs *= 2;
    }
    return sizes;
}

// ---------------------------------------------------------------------------
// box_count — count boxes of `box_size` that contain at least one white pixel
// ---------------------------------------------------------------------------
static int box_count(const uint8_t* pixels, int width, int height, int box_size) {
    int count = 0;

    // Iterate over each box in the grid (no padding, partial edge boxes included)
    for (int by = 0; by < height; by += box_size) {
        for (int bx = 0; bx < width; bx += box_size) {
            bool occupied = false;

            // Scan every pixel inside this box
            int y_end = std::min(by + box_size, height);
            int x_end = std::min(bx + box_size, width);

            for (int y = by; y < y_end && !occupied; ++y) {
                for (int x = bx; x < x_end && !occupied; ++x) {
                    if (pixels[y * width + x] == 255) {
                        occupied = true;
                    }
                }
            }

            if (occupied) {
                ++count;
            }
        }
    }

    return count;
}

// ---------------------------------------------------------------------------
// Helper: build a JSON array string from a vector of ints
// ---------------------------------------------------------------------------
static std::string json_int_array(const std::vector<int>& v) {
    std::ostringstream oss;
    oss << "[";
    for (size_t i = 0; i < v.size(); ++i) {
        if (i > 0) oss << ",";
        oss << v[i];
    }
    oss << "]";
    return oss.str();
}

// ---------------------------------------------------------------------------
// Helper: build a JSON array string from a vector of doubles
// ---------------------------------------------------------------------------
static std::string json_double_array(const std::vector<double>& v) {
    std::ostringstream oss;
    oss.precision(12);
    oss << "[";
    for (size_t i = 0; i < v.size(); ++i) {
        if (i > 0) oss << ",";
        oss << v[i];
    }
    oss << "]";
    return oss.str();
}

// ---------------------------------------------------------------------------
// run_box_counting — execute box counting at every auto-selected scale
// ---------------------------------------------------------------------------
static std::string run_box_counting(const uint8_t* pixels, int width, int height) {
    std::vector<int> box_sizes = auto_select_box_sizes(width, height);
    std::vector<int> box_counts;
    std::vector<double> log_inverse_sizes;
    std::vector<double> log_counts;

    for (int bs : box_sizes) {
        int c = box_count(pixels, width, height, bs);
        box_counts.push_back(c);
        // log(1/bs) == -log(bs)  — matches Python: x = -np.log(box_sizes)
        log_inverse_sizes.push_back(-std::log(static_cast<double>(bs)));
        log_counts.push_back(std::log(std::max(c, 1)));  // guard against log(0)
    }

    std::ostringstream oss;
    oss << "{";
    oss << "\"box_sizes\":" << json_int_array(box_sizes) << ",";
    oss << "\"box_counts\":" << json_int_array(box_counts) << ",";
    oss << "\"log_inverse_sizes\":" << json_double_array(log_inverse_sizes) << ",";
    oss << "\"log_counts\":" << json_double_array(log_counts);
    oss << "}";
    return oss.str();
}

// ---------------------------------------------------------------------------
// compute_fractal_dimension — OLS linear regression on log-log data
// ---------------------------------------------------------------------------

// Minimal JSON double-array parser (no external library)
static std::vector<double> parse_json_double_array(const std::string& src, const std::string& key) {
    std::vector<double> result;
    std::string search_key = "\"" + key + "\"";
    size_t key_pos = src.find(search_key);
    if (key_pos == std::string::npos) return result;

    size_t bracket_start = src.find('[', key_pos);
    size_t bracket_end   = src.find(']', bracket_start);
    if (bracket_start == std::string::npos || bracket_end == std::string::npos) return result;

    std::string arr_str = src.substr(bracket_start + 1, bracket_end - bracket_start - 1);
    std::istringstream iss(arr_str);
    std::string token;
    while (std::getline(iss, token, ',')) {
        if (!token.empty()) {
            result.push_back(std::stod(token));
        }
    }
    return result;
}

static std::string compute_fractal_dimension(const std::string& json_input) {
    std::vector<double> x = parse_json_double_array(json_input, "log_inverse_sizes");
    std::vector<double> y = parse_json_double_array(json_input, "log_counts");

    size_t n = x.size();

    double slope     = 0.0;
    double intercept = 0.0;
    double r_squared = 0.0;

    if (n >= 2) {
        // Means
        double sum_x  = std::accumulate(x.begin(), x.end(), 0.0);
        double sum_y  = std::accumulate(y.begin(), y.end(), 0.0);
        double mean_x = sum_x / static_cast<double>(n);
        double mean_y = sum_y / static_cast<double>(n);

        // Sums for OLS
        double ss_xy = 0.0;
        double ss_xx = 0.0;
        for (size_t i = 0; i < n; ++i) {
            double dx = x[i] - mean_x;
            double dy = y[i] - mean_y;
            ss_xy += dx * dy;
            ss_xx += dx * dx;
        }

        if (ss_xx > 0.0) {
            slope     = ss_xy / ss_xx;
            intercept = mean_y - slope * mean_x;

            // R² = 1 - SS_res / SS_tot
            double ss_res = 0.0;
            double ss_tot = 0.0;
            for (size_t i = 0; i < n; ++i) {
                double y_pred = slope * x[i] + intercept;
                ss_res += (y[i] - y_pred) * (y[i] - y_pred);
                ss_tot += (y[i] - mean_y) * (y[i] - mean_y);
            }
            r_squared = (ss_tot > 0.0) ? (1.0 - ss_res / ss_tot) : 0.0;
        }
    }

    std::ostringstream oss;
    oss.precision(12);
    oss << "{";
    oss << "\"fractal_dimension\":" << slope << ",";
    oss << "\"r_squared\":" << r_squared << ",";
    oss << "\"intercept\":" << intercept;
    oss << "}";
    return oss.str();
}

// ---------------------------------------------------------------------------
// Emscripten exports
// ---------------------------------------------------------------------------
extern "C" {

/**
 * Run the full analysis pipeline: box counting → regression → combined JSON.
 * Caller must free the returned pointer via wasm_free().
 */
EMSCRIPTEN_KEEPALIVE
char* wasm_run_analysis(uint8_t* pixels, int width, int height) {
    // Step 1: box counting
    std::string bc_json = run_box_counting(pixels, width, height);

    // Step 2: regression on the box-counting output
    std::string fd_json = compute_fractal_dimension(bc_json);

    // Step 3: merge both JSON objects into one
    // bc_json = { "box_sizes":..., "box_counts":..., "log_inverse_sizes":..., "log_counts":... }
    // fd_json = { "fractal_dimension":..., "r_squared":..., "intercept":... }
    // Combined: all fields in one object.
    std::ostringstream oss;
    oss << "{";
    // Strip leading '{' from bc_json and trailing '}'
    oss << bc_json.substr(1, bc_json.size() - 2);
    oss << ",";
    // Strip leading '{' from fd_json and trailing '}'
    oss << fd_json.substr(1, fd_json.size() - 2);
    oss << "}";

    std::string result = oss.str();

    // Allocate on the heap so the caller can read it and free it later
    char* buf = static_cast<char*>(std::malloc(result.size() + 1));
    std::memcpy(buf, result.c_str(), result.size() + 1);
    return buf;
}

/**
 * Free a char* previously returned by wasm_run_analysis.
 */
EMSCRIPTEN_KEEPALIVE
void wasm_free(char* ptr) {
    std::free(ptr);
}

} // extern "C"
