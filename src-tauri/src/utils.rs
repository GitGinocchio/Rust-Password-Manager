


pub fn empty_to_null(s: &String) -> Option<&str> {
    if s.trim().is_empty() {
        None
    } else {
        Some(s)
    }
}