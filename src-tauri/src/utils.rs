use serde::Serialize;

#[derive(Serialize)]
pub struct Credential {
    pub id: i32,
    pub title: String,
    pub username: Option<String>,
    pub email: Option<String>,
    pub url: Option<String>,
    pub notes: Option<String>,
    pub category: Option<String>,
    pub favorites: bool,
    // pub password: String,
}

#[derive(Serialize)]
pub struct Category {
    pub name: String,
}



pub fn empty_to_null(s: &String) -> Option<&str> {
    if s.trim().is_empty() {
        None
    } else {
        Some(s)
    }
}