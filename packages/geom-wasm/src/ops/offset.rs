use kurbo::{BezPath, CubicBez, PathEl, PathSeg, Point, Vec2, offset};

pub fn offset_path(path: &str, amount: f64) -> String {
    let path = BezPath::from_svg(path).unwrap();
    let tolerance = 0.0001;

    // We'll build the result by processing each contour (subpath) independently
    let mut result = BezPath::new();

    let mut current_contour = BezPath::new();
    let mut contour_closed = false;

    for el in path.elements() {
        match *el {
            PathEl::MoveTo(p) => {
                // flush previous contour
                if !current_contour.elements().is_empty() {
                    offset_contour_into(
                        &current_contour,
                        amount,
                        tolerance,
                        contour_closed,
                        &mut result,
                    );
                    current_contour = BezPath::new();
                    contour_closed = false;
                }
                current_contour.move_to(p);
            }
            PathEl::LineTo(p) => current_contour.line_to(p),
            PathEl::QuadTo(p1, p2) => current_contour.quad_to(p1, p2),
            PathEl::CurveTo(p1, p2, p3) => current_contour.curve_to(p1, p2, p3),
            PathEl::ClosePath => {
                contour_closed = true;
                current_contour.close_path();
            }
        }
    }

    // flush last contour
    if !current_contour.elements().is_empty() {
        offset_contour_into(
            &current_contour,
            amount,
            tolerance,
            contour_closed,
            &mut result,
        );
    }

    result.to_svg()
}

fn extend_offset_line(
    result: &mut BezPath,
    p0: Point,
    p1: Point,
    amount: f64,
    is_first: bool,
) -> Point {
    let dir: Vec2 = p1 - p0;
    let len = dir.hypot();
    if len == 0.0 {
        return p0; // no change in current point
    }
    let n = (dir / len).turn_90();
    let a = p0 + amount * n;
    let b = p1 + amount * n;
    if is_first {
        result.move_to(a);
    } else {
        // connect to next offset segment start to preserve continuity
        result.line_to(a);
    }
    result.line_to(b);
    b
}

fn extend_offset_cubic(
    result: &mut BezPath,
    c: CubicBez,
    amount: f64,
    tolerance: f64,
    is_first: bool,
) -> Point {
    if is_cubic_colinear(&c, tolerance) {
        return extend_offset_line(result, c.p0, c.p3, amount, is_first);
    }
    // offset_cubic truncates the path it writes into; write to a temp and append
    let mut tmp = BezPath::new();
    offset::offset_cubic(c, amount, tolerance, &mut tmp);
    let mut _last_point = c.p0;
    for el in tmp.elements() {
        match *el {
            PathEl::MoveTo(p) => {
                if is_first {
                    result.move_to(p);
                } else {
                    // create a join to the start of this offset segment
                    result.line_to(p);
                }
                _last_point = p;
            }
            PathEl::LineTo(p) => {
                result.line_to(p);
                _last_point = p;
            }
            PathEl::CurveTo(p1, p2, p3) => {
                result.curve_to(p1, p2, p3);
                _last_point = p3;
            }
            PathEl::QuadTo(_, _) => {
                // offset_cubic won't emit quads
            }
            PathEl::ClosePath => {
                result.close_path();
            }
        }
    }
    _last_point
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

fn offset_contour_into(
    contour: &BezPath,
    amount: f64,
    tolerance: f64,
    closed: bool,
    out: &mut BezPath,
) {
    let mut first_segment = true;

    for seg in contour.segments() {
        match seg {
            PathSeg::Line(l) => {
                extend_offset_line(out, l.p0, l.p1, amount, first_segment);
            }
            PathSeg::Quad(q) => {
                let c = q.raise();
                extend_offset_cubic(out, c, amount, tolerance, first_segment);
            }
            PathSeg::Cubic(c) => {
                extend_offset_cubic(out, c, amount, tolerance, first_segment);
            }
        }
        first_segment = false;
    }

    if closed {
        // Close the offset contour to avoid gaps at the seam
        out.close_path();
    }
}
