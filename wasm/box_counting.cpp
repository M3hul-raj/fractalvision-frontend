/**
 * Box-counting fractal dimension algorithm — WebAssembly implementation.
 *
 * Mirrors the Python backend (app/core/box_counting.py + regression.py)
 * and TypeScript mirror (src/lib/wasm/boxCountingJs.ts). Returns numeric
 * results directly into a Float64 output buffer with zero JSON serialization.
 */

#include <emscripten.h>
#include <algorithm>
#include <cmath>
#include <cstdint>

namespace {

// Count grid boxes of `box_size` containing at least one foreground pixel (255).
int box_count(const uint8_t* pixels, int width, int height, int box_size) {
    int count = 0;

    for (int by = 0; by < height; by += box_size) {
        const int y_end = std::min(by + box_size, height);
        for (int bx = 0; bx < width; bx += box_size) {
            const int x_end = std::min(bx + box_size, width);
            bool occupied = false;

            for (int y = by; y < y_end && !occupied; ++y) {
                const uint8_t* row = pixels + y * width;
                for (int x = bx; x < x_end; ++x) {
                    if (row[x] == 255) {
                        occupied = true;
                        break;
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

// Compute OLS linear regression directly on log arrays in memory.
void ols_regression(
    const double* x,
    const double* y,
    int n,
    double& out_slope,
    double& out_r_squared,
    double& out_intercept
) {
    out_slope = 0.0;
    out_r_squared = 0.0;
    out_intercept = 0.0;

    if (n < 2) {
        return;
    }

    double sum_x = 0.0;
    double sum_y = 0.0;
    for (int i = 0; i < n; ++i) {
        sum_x += x[i];
        sum_y += y[i];
    }
    const double mean_x = sum_x / static_cast<double>(n);
    const double mean_y = sum_y / static_cast<double>(n);

    double ss_xy = 0.0;
    double ss_xx = 0.0;
    for (int i = 0; i < n; ++i) {
        const double dx = x[i] - mean_x;
        const double dy = y[i] - mean_y;
        ss_xy += dx * dy;
        ss_xx += dx * dx;
    }

    if (ss_xx <= 0.0) {
        return;
    }

    out_slope = ss_xy / ss_xx;
    out_intercept = mean_y - out_slope * mean_x;

    double ss_res = 0.0;
    double ss_tot = 0.0;
    for (int i = 0; i < n; ++i) {
        const double y_pred = out_slope * x[i] + out_intercept;
        const double r = y[i] - y_pred;
        const double t = y[i] - mean_y;
        ss_res += r * r;
        ss_tot += t * t;
    }
    out_r_squared = (ss_tot > 0.0) ? (1.0 - ss_res / ss_tot) : 0.0;
}

}  // namespace

extern "C" {

/**
 * Run box counting + OLS regression, writing results into caller-owned float64
 * buffer `out_buf` (capacity >= 4 + 4 * max_scales doubles):
 *   out_buf[0]                       = n_scales
 *   out_buf[1]                       = fractal_dimension (slope)
 *   out_buf[2]                       = r_squared
 *   out_buf[3]                       = intercept
 *   out_buf[4          .. 4 + n - 1] = box_sizes
 *   out_buf[4 + n      .. 4 + 2n-1]  = box_counts
 *   out_buf[4 + 2n     .. 4 + 3n-1]  = log_inverse_sizes
 *   out_buf[4 + 3n     .. 4 + 4n-1]  = log_counts
 *
 * Returns n_scales on success, or -1 on invalid inputs / insufficient capacity.
 */
EMSCRIPTEN_KEEPALIVE
int wasm_run_analysis(
    const uint8_t* pixels,
    int width,
    int height,
    double* out_buf,
    int max_scales
) {
    if (pixels == nullptr || out_buf == nullptr || width <= 0 || height <= 0 || max_scales <= 0) {
        return -1;
    }

    const int min_dim = std::min(width, height);
    const int max_box = min_dim / 4;

    int n = 0;
    for (int bs = 4; bs <= max_box; bs *= 2) {
        ++n;
    }
    if (n > max_scales) {
        return -1;
    }

    double* box_sizes = out_buf + 4;
    double* box_counts = box_sizes + n;
    double* log_inv = box_counts + n;
    double* log_cnt = log_inv + n;

    int idx = 0;
    for (int bs = 4; bs <= max_box; bs *= 2) {
        const int c = box_count(pixels, width, height, bs);
        box_sizes[idx] = static_cast<double>(bs);
        box_counts[idx] = static_cast<double>(c);
        log_inv[idx] = -std::log(static_cast<double>(bs));
        log_cnt[idx] = std::log(static_cast<double>(c > 0 ? c : 1));
        ++idx;
    }

    double slope = 0.0;
    double r_squared = 0.0;
    double intercept = 0.0;
    ols_regression(log_inv, log_cnt, n, slope, r_squared, intercept);

    out_buf[0] = static_cast<double>(n);
    out_buf[1] = slope;
    out_buf[2] = r_squared;
    out_buf[3] = intercept;

    return n;
}

}  // extern "C"
