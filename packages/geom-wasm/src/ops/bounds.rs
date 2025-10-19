use kurbo::{BezPath, Rect, Shape};

pub fn bounds_path(path: &str) -> Option<Vec<f64>> {
    let path = BezPath::from_svg(path).unwrap();
    let mut bbox: Option<Rect> = None;

    for seg in path.segments() {
        let seg_box = seg.bounding_box();
        bbox = Some(match bbox {
            Some(acc) => acc.union(seg_box),
            None => seg_box,
        });
    }

    if let Some(b) = bbox {
        Some(vec![b.x0, b.y0, b.x1, b.y1])
    } else {
        None
    }
}
