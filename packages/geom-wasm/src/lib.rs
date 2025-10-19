use wasm_bindgen::prelude::*;

pub mod ops;

#[wasm_bindgen]
pub fn offsetPath(path: &str, amount: f64) -> String {
    ops::offset_path(path, amount)
}
