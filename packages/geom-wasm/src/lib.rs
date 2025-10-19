use wasm_bindgen::prelude::*;

pub mod ops;

#[wasm_bindgen(js_name = offsetPath)]
pub fn offset_path(path: &str, amount: f64) -> String {
    ops::offset_path(path, amount)
}

#[wasm_bindgen(js_name = boundsPath)]
pub fn bounds_path(path: &str) -> Option<Vec<f64>> {
    ops::bounds_path(path)
}
