use kurbo::{BezPath, CubicBez, PathSeg, Point, Vec2, offset};

pub fn offset_path(path: &str, amount: f64) -> String {
    let path = BezPath::from_svg(path).unwrap();
    let tolerance = 0.0001;
    let mut result = BezPath::new();

    for seg in path.segments() {
        match seg {
            PathSeg::Line(l) => {
                // Offset straight line by shifting endpoints along the left normal
                extend_offset_line(&mut result, l.p0, l.p1, amount);
            }
            PathSeg::Quad(q) => {
                let c = q.raise(); // Convert to cubic
                extend_offset_cubic(&mut result, c, amount, tolerance);
            }
            PathSeg::Cubic(c) => {
                // Offset cubic, falling back to a straight-line offset if colinear
                extend_offset_cubic(&mut result, c, amount, tolerance);
            }
        }
    }

    result.to_svg()
}

fn extend_offset_line(result: &mut BezPath, p0: Point, p1: Point, amount: f64) {
    let dir: Vec2 = p1 - p0;
    let len = dir.hypot();
    if len == 0.0 {
        return;
    }
    let n = (dir / len).turn_90();
    result.move_to(p0 + amount * n);
    result.line_to(p1 + amount * n);
}

fn extend_offset_cubic(result: &mut BezPath, c: CubicBez, amount: f64, tolerance: f64) {
    if is_cubic_colinear(&c, tolerance) {
        extend_offset_line(result, c.p0, c.p3, amount);
    } else {
        offset::offset_cubic(c, amount, tolerance, result);
    }
}

fn is_cubic_colinear(seg: &CubicBez, rel_eps: f64) -> bool {
    // Use direction from p0 to p3 as the baseline for colinearity tests.
    let base: Vec2 = seg.p3 - seg.p0;
    let base_len = base.hypot();
    if base_len == 0.0 {
        return true;
    }
    let v1: Vec2 = seg.p1 - seg.p0;
    let v2: Vec2 = seg.p2 - seg.p0;
    let cross1 = base.cross(v1).abs();
    let cross2 = base.cross(v2).abs();
    // Relative threshold scaled by vector magnitudes to be roughly scale-invariant
    let thresh1 = rel_eps * base_len * v1.hypot();
    let thresh2 = rel_eps * base_len * v2.hypot();
    cross1 <= thresh1 && cross2 <= thresh2
}
