// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    let end_date = chrono::NaiveDate::from_ymd_opt(2026, 4, 27).unwrap();
    let now = chrono::Utc::now().naive_utc();
    if now.date() > end_date {
        println!("The app has expired. Please contact the developer for an updated version.");
        std::process::exit(0);
    }

    kcard_lib::run()
}
