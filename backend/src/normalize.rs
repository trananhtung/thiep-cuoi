//! Faithful ports of the normalization helpers from the original `src/server.js`.
//! Keeping these byte-compatible is what guarantees newly-created invitations
//! match the legacy server's output.

use rand::RngCore;
use serde_json::{json, Value};
use unicode_normalization::UnicodeNormalization;

pub const ALPHABET: &[u8] = b"abcdefghijkmnpqrstuvwxyz23456789";

static NULL: Value = Value::Null;

/// `randomId(len)` — same alphabet/scheme as the JS (`crypto.randomBytes` then `% 32`).
pub fn random_id(len: usize) -> String {
    let mut bytes = vec![0u8; len];
    rand::thread_rng().fill_bytes(&mut bytes);
    bytes
        .iter()
        .map(|b| ALPHABET[(*b as usize) % ALPHABET.len()] as char)
        .collect()
}

/// `slugify(str)` — NFD, strip combining marks, đ→d, lowercase, non-alnum→'-', trim, cap 40.
pub fn slugify(s: &str) -> String {
    let stripped: String = s
        .nfd()
        .filter(|c| !('\u{0300}'..='\u{036f}').contains(c))
        .collect();
    let stripped = stripped.replace('đ', "d").replace('Đ', "D");
    let lower = stripped.to_lowercase();

    let mut res = String::new();
    let mut prev_dash = false;
    for c in lower.chars() {
        if c.is_ascii_lowercase() || c.is_ascii_digit() {
            res.push(c);
            prev_dash = false;
        } else if !prev_dash {
            res.push('-');
            prev_dash = true;
        }
    }
    let trimmed = res.trim_matches('-');
    trimmed.chars().take(40).collect()
}

/// JS `String(v)` coercion for the value types that appear in request bodies.
pub fn js_string(v: &Value) -> String {
    match v {
        Value::Null => String::new(),
        Value::Bool(b) => b.to_string(),
        Value::Number(n) => n.to_string(),
        Value::String(s) => s.clone(),
        _ => String::new(),
    }
}

/// `cleanText(v, max)` — `String(v).slice(0, max)` (no trim; callers add `.trim()`).
pub fn clean_text(v: &Value, max: usize) -> String {
    js_string(v).chars().take(max).collect()
}

/// Convenience: clean then trim (matches the very common `cleanText(...).trim()`).
pub fn clean_trim(v: &Value, max: usize) -> String {
    clean_text(v, max).trim().to_string()
}

/// Read a body field as a `Value`, defaulting to `Null` when absent.
pub fn field<'a>(v: &'a Value, k: &str) -> &'a Value {
    v.get(k).unwrap_or(&NULL)
}

fn get<'a>(v: &'a Value, k: &str) -> &'a Value {
    field(v, k)
}

fn is_http(s: &str) -> bool {
    let l = s.trim().to_ascii_lowercase();
    l.starts_with("http://") || l.starts_with("https://")
}

fn http_or_empty(v: &Value, max: usize) -> String {
    let s = js_string(v);
    if is_http(&s) {
        clean_trim(v, max)
    } else {
        String::new()
    }
}

/// Split a textarea string into lines (`/\r?\n/`).
fn lines(s: &str) -> Vec<&str> {
    s.split('\n').map(|l| l.strip_suffix('\r').unwrap_or(l)).collect()
}

/// `parseGallery` — array or newline-separated string, trimmed, non-empty, max 12.
pub fn parse_gallery(v: &Value) -> Value {
    let raw: Vec<String> = match v {
        Value::Array(a) => a.iter().map(|x| clean_text(x, 1000)).collect(),
        Value::String(s) => lines(s).iter().map(|l| clean_text(&json!(l), 1000)).collect(),
        _ => vec![],
    };
    let out: Vec<Value> = raw
        .into_iter()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .take(12)
        .map(Value::String)
        .collect();
    Value::Array(out)
}

/// `parseEvents` — "name | time | place | mapUrl" lines, or array of objects. Max 10.
pub fn parse_events(v: &Value) -> Value {
    let mk = |name: &Value, time: &Value, place: &Value, map_url: &Value| {
        json!({
            "name": clean_trim(name, 100),
            "time": clean_trim(time, 100),
            "place": clean_trim(place, 250),
            "mapUrl": http_or_empty(map_url, 500),
        })
    };
    let items: Vec<Value> = match v {
        Value::Array(a) => a
            .iter()
            .map(|it| mk(get(it, "name"), get(it, "time"), get(it, "place"), get(it, "mapUrl")))
            .collect(),
        Value::String(s) => lines(s)
            .iter()
            .map(|line| {
                let p: Vec<&str> = line.split('|').collect();
                mk(
                    &json!(p.first().copied().unwrap_or("")),
                    &json!(p.get(1).copied().unwrap_or("")),
                    &json!(p.get(2).copied().unwrap_or("")),
                    &json!(p.get(3).copied().unwrap_or("")),
                )
            })
            .collect(),
        _ => vec![],
    };
    let out: Vec<Value> = items
        .into_iter()
        .filter(|it| !it["name"].as_str().unwrap_or("").is_empty() || !it["place"].as_str().unwrap_or("").is_empty())
        .take(10)
        .collect();
    Value::Array(out)
}

/// `parseLoveStory` — "time | title | desc | photo" lines, or array. Max 12.
pub fn parse_love_story(v: &Value) -> Value {
    let mk = |time: &Value, title: &Value, desc: &Value, photo: &Value| {
        let p = js_string(photo);
        let pl = p.trim().to_ascii_lowercase();
        let photo_ok = pl.starts_with("http://") || pl.starts_with("https://") || pl.starts_with("data:image/");
        json!({
            "time": clean_trim(time, 60),
            "title": clean_trim(title, 120),
            "desc": clean_trim(desc, 400),
            "photo": if photo_ok { clean_trim(photo, 600) } else { String::new() },
        })
    };
    let items: Vec<Value> = match v {
        Value::Array(a) => a
            .iter()
            .map(|it| mk(get(it, "time"), get(it, "title"), get(it, "desc"), get(it, "photo")))
            .collect(),
        Value::String(s) => lines(s)
            .iter()
            .map(|line| {
                let p: Vec<&str> = line.split('|').collect();
                mk(
                    &json!(p.first().copied().unwrap_or("")),
                    &json!(p.get(1).copied().unwrap_or("")),
                    &json!(p.get(2).copied().unwrap_or("")),
                    &json!(p.get(3).copied().unwrap_or("")),
                )
            })
            .collect(),
        _ => vec![],
    };
    let out: Vec<Value> = items
        .into_iter()
        .filter(|it| !it["title"].as_str().unwrap_or("").is_empty() || !it["desc"].as_str().unwrap_or("").is_empty())
        .take(12)
        .collect();
    Value::Array(out)
}

/// `parseTimeline` — array {time,title} or "time | event" lines. Max 15.
pub fn parse_timeline(v: &Value) -> Value {
    let items: Vec<Value> = match v {
        Value::Array(a) => a
            .iter()
            .map(|it| json!({
                "time": clean_trim(get(it, "time"), 40),
                "title": clean_trim(get(it, "title"), 120),
            }))
            .collect(),
        Value::String(s) => lines(s)
            .iter()
            .map(|line| {
                let parts: Vec<&str> = line.split('|').collect();
                let time = clean_trim(&json!(parts.first().copied().unwrap_or("")), 40);
                let title = clean_trim(&json!(parts[1..].join("|")), 120);
                if parts.len() > 1 {
                    json!({ "time": time, "title": title })
                } else {
                    json!({ "time": "", "title": clean_trim(&json!(*line), 120) })
                }
            })
            .collect(),
        _ => vec![],
    };
    let out: Vec<Value> = items
        .into_iter()
        .filter(|it| !it["time"].as_str().unwrap_or("").is_empty() || !it["title"].as_str().unwrap_or("").is_empty())
        .take(15)
        .collect();
    Value::Array(out)
}

/// `parseStays` — array {name,note,url} or "name | note | url" lines. Max 12.
pub fn parse_stays(v: &Value) -> Value {
    let mk = |name: &Value, note: &Value, url: &Value| {
        json!({
            "name": clean_trim(name, 150),
            "note": clean_trim(note, 250),
            "url": http_or_empty(url, 500),
        })
    };
    let items: Vec<Value> = match v {
        Value::Array(a) => a.iter().map(|it| mk(get(it, "name"), get(it, "note"), get(it, "url"))).collect(),
        Value::String(s) => lines(s)
            .iter()
            .map(|line| {
                let p: Vec<&str> = line.split('|').collect();
                mk(
                    &json!(p.first().copied().unwrap_or("")),
                    &json!(p.get(1).copied().unwrap_or("")),
                    &json!(p.get(2).copied().unwrap_or("")),
                )
            })
            .collect(),
        _ => vec![],
    };
    let out: Vec<Value> = items
        .into_iter()
        .filter(|it| !it["name"].as_str().unwrap_or("").is_empty())
        .take(12)
        .collect();
    Value::Array(out)
}

/// `parseFaq` — array {q,a} or "q | a" lines. Max 20, both fields required.
pub fn parse_faq(v: &Value) -> Value {
    let items: Vec<Value> = match v {
        Value::Array(a) => a
            .iter()
            .map(|it| json!({
                "q": clean_trim(get(it, "q"), 200),
                "a": clean_trim(get(it, "a"), 600),
            }))
            .collect(),
        Value::String(s) => lines(s)
            .iter()
            .map(|line| {
                let parts: Vec<&str> = line.split('|').collect();
                json!({
                    "q": clean_trim(&json!(parts.first().copied().unwrap_or("")), 200),
                    "a": clean_trim(&json!(parts[1..].join("|")), 600),
                })
            })
            .collect(),
        _ => vec![],
    };
    let out: Vec<Value> = items
        .into_iter()
        .filter(|it| !it["q"].as_str().unwrap_or("").is_empty() && !it["a"].as_str().unwrap_or("").is_empty())
        .take(20)
        .collect();
    Value::Array(out)
}

fn is_hex6(s: &str) -> bool {
    let body = s.strip_prefix('#').unwrap_or(s);
    body.len() == 6 && body.bytes().all(|b| b.is_ascii_hexdigit())
}

/// `parseColors` — hex colors, normalized to lowercase `#rrggbb`, max 6.
pub fn parse_colors(v: &Value) -> Value {
    let raw: Vec<String> = match v {
        Value::Array(a) => a.iter().map(js_string).collect(),
        other => js_string(other)
            .split(|c: char| c == ',' || c.is_whitespace())
            .map(|s| s.to_string())
            .collect(),
    };
    let out: Vec<Value> = raw
        .into_iter()
        .map(|s| s.trim().to_string())
        .filter(|s| is_hex6(s))
        .map(|s| {
            let withhash = if s.starts_with('#') { s } else { format!("#{s}") };
            Value::String(withhash.to_lowercase())
        })
        .take(6)
        .collect();
    Value::Array(out)
}

/// JS truthy-ish opt-in: `x === true || x === 'on' || x === 'yes'`.
pub fn opt_in(v: &Value) -> bool {
    matches!(v, Value::Bool(true)) || matches!(v.as_str(), Some("on") | Some("yes"))
}

/// `intro`: on by default unless explicitly `'off'` or `false`.
pub fn intro_on(v: &Value) -> bool {
    !(matches!(v.as_str(), Some("off")) || matches!(v, Value::Bool(false)))
}

/// Strip everything but `[0-9A-Za-z]` (bank account sanitisation).
pub fn alnum_only(s: &str) -> String {
    s.chars().filter(|c| c.is_ascii_alphanumeric()).collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn slugify_vietnamese() {
        assert_eq!(slugify("Nguyễn Minh Đức & Trần Thuỳ Dương"), "nguyen-minh-duc-tran-thuy-duong");
        assert_eq!(slugify("  Hello, World!  "), "hello-world");
        assert_eq!(slugify("đặng đình"), "dang-dinh");
    }

    #[test]
    fn slugify_caps_at_40() {
        let s = slugify(&"a".repeat(100));
        assert_eq!(s.chars().count(), 40);
    }

    #[test]
    fn random_id_alphabet_and_len() {
        let id = random_id(16);
        assert_eq!(id.chars().count(), 16);
        assert!(id.bytes().all(|b| ALPHABET.contains(&b)));
    }

    #[test]
    fn clean_text_slices() {
        assert_eq!(clean_text(&json!("hello world"), 5), "hello");
        assert_eq!(clean_text(&Value::Null, 5), "");
    }

    #[test]
    fn events_split_on_pipe_not_comma() {
        // mapUrl can contain commas (lat,lng); must survive as one field.
        let v = json!("Lễ cưới | 10:00 | Nhà hàng | https://maps.google.com/?q=10.1,20.2");
        let ev = parse_events(&v);
        assert_eq!(ev[0]["mapUrl"], "https://maps.google.com/?q=10.1,20.2");
        assert_eq!(ev[0]["name"], "Lễ cưới");
    }

    #[test]
    fn events_drops_non_http_mapurl() {
        let v = json!("Lễ cưới | 10:00 | Nhà hàng | javascript:alert(1)");
        let ev = parse_events(&v);
        assert_eq!(ev[0]["mapUrl"], "");
    }

    #[test]
    fn timeline_joins_title_after_first_pipe() {
        let v = json!("08:00 | Đón khách | tại sảnh");
        let t = parse_timeline(&v);
        assert_eq!(t[0]["time"], "08:00");
        assert_eq!(t[0]["title"], "Đón khách | tại sảnh");
    }

    #[test]
    fn colors_validates_hex() {
        let v = json!("#aabbcc, ffffff, notacolor, #zzzzzz");
        let c = parse_colors(&v);
        assert_eq!(c, json!(["#aabbcc", "#ffffff"]));
    }

    #[test]
    fn faq_requires_both_fields() {
        let v = json!("Câu hỏi | Trả lời\nThiếu trả lời |\n| thiếu hỏi");
        let f = parse_faq(&v);
        assert_eq!(f.as_array().unwrap().len(), 1);
    }

    #[test]
    fn opt_in_variants() {
        assert!(opt_in(&json!(true)));
        assert!(opt_in(&json!("on")));
        assert!(opt_in(&json!("yes")));
        assert!(!opt_in(&json!(false)));
        assert!(!opt_in(&json!("off")));
    }

    #[test]
    fn intro_default_on() {
        assert!(intro_on(&Value::Null));
        assert!(!intro_on(&json!("off")));
        assert!(!intro_on(&json!(false)));
    }
}
