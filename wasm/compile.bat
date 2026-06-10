@echo off
emcc wasm/box_counting.cpp ^
  -o public/wasm/box_counting.js ^
  -s WASM=1 ^
  -s MODULARIZE=1 ^
  -s EXPORT_NAME="createBoxCountingModule" ^
  -s EXPORTED_FUNCTIONS="['_wasm_run_analysis','_wasm_free','_malloc','_free']" ^
  -s EXPORTED_RUNTIME_METHODS="['ccall','cwrap','UTF8ToString','lengthBytesUTF8','stringToUTF8','allocate','ALLOC_NORMAL']" ^
  -s ALLOW_MEMORY_GROWTH=1 ^
  -s ENVIRONMENT="web" ^
  -s SINGLE_FILE=0 ^
  -O2 ^
  --no-entry
echo Build complete. Output: public/wasm/box_counting.js + .wasm
