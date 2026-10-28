# ระบบรายงานผลการปฏิบัติงาน (AI)

หน้าเว็บ static สำหรับร่างรายงานผลการปฏิบัติงานรายวันด้วย AI
เรียกข้อมูลผ่าน Google Apps Script Web App + Google Sheet เดิม

- หน้าเว็บ: `https://smartnfe.github.io/mueangnstdole/report/`
- Backend: โฟลเดอร์ `../apps-script/`
- หน้าแรก Knowledge Hub เดิม: `https://smartnfe.github.io/mueangnstdole/`

## ขั้นตอน Deploy (ทำครั้งเดียว)

### 1. สร้าง Apps Script Web App

1. เปิด Google Sheet เดิม → เมนู **ส่วนขยาย → Apps Script**
2. สร้างไฟล์ให้ตรงกับโฟลเดอร์ `apps-script/` แล้ววางโค้ดตามชื่อไฟล์:
   - `Code.gs` — router + CORS
   - `Sheets.gs` — ชั้นเข้าถึงชีต + `COL` + headers
   - `Auth.gs` — ล็อกอิน/เซสชัน
   - `Users.gs` — จัดการสมาชิก
   - `Reports.gs` — รายงาน
   - `Ai.gs` — Gemini
   - `Stats.gs` — ภาพรวมรายเดือน
3. เปิด **Project Settings → Show "appsscript.json" manifest file** แล้ววางเนื้อหาจาก `appsscript.json`
4. **Project Settings → Script Properties** เพิ่ม `GEMINI_API_KEY` = คีย์ใหม่จาก Google AI Studio
   (คีย์เดิมที่ฝังใน `code.gs` บรรทัด 2 ให้ **revoke แล้วออกคีย์ใหม่** — ห้ามใช้ซ้ำ)
5. **Deploy → New deployment → Web app**
   - Execute as: `Me`
   - Who has access: `Anyone`
6. คัดลอก URL ที่ลงท้ายด้วย `/exec` เก็บไว้

### 2. ตั้งค่าในหน้าเว็บ

1. เปิด `https://smartnfe.github.io/mueangnstdole/report/`
2. วาง URL `/exec` ในช่องตั้งค่าที่แสดงครั้งแรก แล้วกดบันทึก
   (เก็บใน `localStorage` ของเบราว์เซอร์นั้น — ตั้งซ้ำเฉพาะเครื่องใหม่)
3. หรือแก้ `config.js` → `apiUrl: '...'` เพื่อให้ทุกเครื่องใช้ค่าเดียวกัน

### 3. เพิ่มคอลัมน์ในชีต (ระบบทำให้เองอัตโนมัติ)

ระบบจะสร้าง/เติมหัวคอลัมน์ให้เมื่อเรียกใช้ครั้งแรก ไม่ต้องแก้มือ:

- `Users`: `username | password_hash | name | position | salt | role | active | must_change | last_login | created_at`
- `Logs`: `timestamp | username | workDate | plan | location | target | result | id | ai_model | updated_at | updated_by | deleted`
- `Events`: `timestamp | actor | action | target | detail`
- `Config`: `key | value`

รหัสผ่านแบบข้อความธรรมดาในคอลัมน์ B เดิมจะถูกแปลงเป็น hash อัตโนมัติเมื่อผู้ใช้คนนั้นล็อกอินครั้งแรก

## ตัวแปรปรับแต่ง (ชีต `Config`)

| key | ค่าเริ่มต้น | ความหมาย |
|---|---|---|
| `GEMINI_MODEL` | `gemini-flash-latest` | โมเดลที่ใช้ร่างรายงาน |
| `MAX_AI_PER_HOUR` | `20` | จำนวนครั้งที่เรียก AI ได้ต่อชั่วโมงต่อคน |
| `PASSWORD_MIN` | `8` | ความยาวรหัสผ่านขั้นต่ำ |
| `PROMPT_TEMPLATE` | (ใน `Sheets.gs`) | เทมเพลต prompt รองรับ `{{org}}` |

## สิทธิ์

- `user` — เขียน/แก้/ลบรายงานของตัวเอง ดูประวัติของตัวเอง
- `admin` — เพิ่มได้ทั้งหมด: จัดการสมาชิก (สร้าง/แก้ไข/รีเซ็ตรหัส/เปิด-ปิด/เปลี่ยนสิทธิ์), ดูรายงานของทุกคน, ดูภาพรวมรายเดือน
