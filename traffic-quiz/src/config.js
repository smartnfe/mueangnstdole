// Google Apps Script Web App URL
// หลัง Deploy Apps Script แล้ว ให้นำ URL มาวางที่นี่
const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyTV3FVXCKP4Uu8-RLX70WhTGxYyKKPCouMDnM6GQflAkjXYB8nsPrvGH1kQEn9Ip8E/exec';

// ดึง URL จาก localStorage (ถ้ามีการแก้ไขจากหน้า Dashboard) หรือใช้ค่า Default
export function getAppsScriptUrl() {
  return localStorage.getItem('appsScriptUrl') || DEFAULT_APPS_SCRIPT_URL;
}

export function setAppsScriptUrl(url) {
  if (url && url.trim()) {
    localStorage.setItem('appsScriptUrl', url.trim());
  } else {
    localStorage.removeItem('appsScriptUrl');
  }
}

export function getDefaultAppsScriptUrl() {
  return DEFAULT_APPS_SCRIPT_URL;
}

// Google Sheets ID (จาก URL ของ Sheet)
export const SHEET_ID = '1oz3xibksS8R36g9Ss-6hxI7w8vf3ynQo3Vbxw9xenPU';

// Polling interval สำหรับ Host dashboard (ms)
export const POLL_INTERVAL = 5000;

// จำนวนข้อสอบทั้งหมด
export const TOTAL_QUESTIONS = 30;

// รหัส PIN สำหรับวิทยากร (Host)
export const HOST_PIN = '1234';
