# ระบบเช็คอินตำแหน่งนักเรียนก่อนกลับบ้าน (Student Check-in)

ระบบให้นักเรียน **เช็คอินตำแหน่งปัจจุบันก่อนกลับบ้าน** ภายในพื้นที่ (geofence)
ที่ครูกำหนด — นักเรียนเข้าใช้งานผ่าน **LINE OA + LIFF**, ครูกำหนดพื้นที่และดูรายงานผ่านเว็บ

## ฟีเจอร์

**ฝั่งนักเรียน (LIFF ใน LINE OA)** — แอปแบบ **bottom menu 4 แท็บ**
- เข้าระบบครั้งแรกด้วย LINE Login → ลงทะเบียนข้อมูลตัวเอง → **รอครูอนุมัติ** ก่อนใช้งาน
- **📍 เช็คอิน** — กดเช็คอินตำแหน่งปัจจุบันเมื่อครูแจ้ง (กดได้ตลอด/ซ้ำได้ ไม่จำกัดครั้ง)
  - อยู่ในพื้นที่ ✅ เช็คอินสำเร็จ / นอกพื้นที่ 🚫 แจ้งระยะห่าง + ดูประวัติเช็คอิน
- **📰 ข่าว** — อ่านประกาศจากครู (ปักหมุดขึ้นบนสุดได้)
- **📝 แจ้งลา** — ส่งคำขอลา (ลาป่วย/ลากิจ + ช่วงวันที่ + เหตุผล) และดูสถานะอนุมัติ
- **👤 บัญชี** — ดู/แก้ไขข้อมูลตัวเอง, ออกจากระบบ

**ฝั่งครู (เว็บ Dashboard)**
- เข้าระบบด้วย username/password
- **ตรวจสอบและอนุมัตินักเรียน** — ดูข้อมูลที่ลงทะเบียน แล้ว อนุมัติ / ปฏิเสธ / แก้ไข / ลบ
- **คำขอลา** — ดูคำขอลาของนักเรียน อนุมัติ/ไม่อนุมัติ (แจ้งผลกลับทาง LINE)
- **ข่าว** — โพสต์/ลบข่าวประกาศให้นักเรียนเห็น (ปักหมุดได้)
- กำหนด/แก้ไข/เปิด-ปิด **พื้นที่เช็คอิน** ได้ 2 แบบ — **วงกลม** (จุด + รัศมี) หรือ
  **รูปหลายเหลี่ยม (polygon)** วาดโดยคลิกบนแผนที่ทีละจุด (หรือกรอกพิกัดเอง) รองรับหลายพื้นที่
- **แผนที่การเช็คอิน** — เห็นหมุดว่านักเรียนแต่ละคนเช็คอินที่ไหน (🟢 ในพื้นที่ / 🔴 นอกพื้นที่)
  พร้อมขอบเขตพื้นที่ที่กำหนด
- **รายงานรายวัน**: ใครเช็คอินผ่าน / นอกพื้นที่ / ยังไม่เช็คอิน + เวลา + ระยะห่าง + เบอร์ผู้ปกครอง
- ดูย้อนหลังตามวันที่

## การอนุมัตินักเรียน (กันคนแปลกปลอม)

นักเรียนแต่ละคนมีสถานะ: `pending` (รอตรวจสอบ) → `approved` (อนุมัติ) / `rejected` (ปฏิเสธ)

- ลงทะเบียนเสร็จ → สถานะ `pending` → **ยังเช็คอินไม่ได้** เห็นหน้า "รอครูตรวจสอบ"
- ครูเปิดแท็บ "นักเรียน" (มี badge แจ้งจำนวนที่รอตรวจสอบ) → ตรวจข้อมูล
  - **อนุมัติ** → นักเรียนเช็คอินได้
  - **ปฏิเสธ** (ใส่เหตุผลได้) → นักเรียนเห็นเหตุผลและแก้ข้อมูลใหม่ → กลับเป็น `pending`
  - **แก้ไข** ข้อมูลเอง (ครูเป็นผู้ตัดสิน สถานะไม่เปลี่ยน) / **ลบ** ทิ้ง
- นักเรียนแก้ข้อมูลตัวเองเมื่อไหร่ → กลับไป `pending` เพื่อให้ครูตรวจใหม่เสมอ
- gate บังคับทั้ง **ฝั่ง server** (เช็คอินถูกปฏิเสธถ้ายังไม่ approved) และ **ฝั่ง UI** — กันเรียก API ตรง ๆ

## การแจ้งเตือน (LINE push)

ระบบส่งแจ้งเตือนอัตโนมัติ 2 จุด:

| เมื่อ | ถึงใคร | ข้อความ |
|------|--------|---------|
| นักเรียนลงทะเบียน / แก้ข้อมูล | ครู (`ADMIN_LINE_TARGET`) | มีนักเรียนรออนุมัติ |
| ครูอนุมัติ | นักเรียนคนนั้น | ✅ อนุมัติแล้ว เช็คอินได้ |
| ครูปฏิเสธ | นักเรียนคนนั้น | ❌ ข้อมูลไม่ถูกต้อง + เหตุผล |

- ส่งผ่าน **LINE Messaging API** (`POST /v2/bot/message/push`)
- **ถ้ายังไม่ตั้ง `LINE_MESSAGING_TOKEN`** → แจ้งเตือนถูกบันทึกลง log/ฐานข้อมูลแต่ไม่ push จริง
  (ครูดูย้อนหลังได้ในแท็บ "นักเรียน" → กล่อง "🔔 การแจ้งเตือนล่าสุด")
- ตั้งค่า: สร้าง **Messaging API channel** ใน LINE Console → เอา channel access token ใส่
  `LINE_MESSAGING_TOKEN`, และใส่ userId/groupId ของครูใน `ADMIN_LINE_TARGET`
- ผู้ปกครองยังไม่รับแจ้งเตือน (ระบบเก็บเป็นเบอร์โทร ไม่ใช่ LINE) — ดู "ต่อยอด" ด้านล่าง

## Tech Stack

| ส่วน | เทคโนโลยี |
|------|-----------|
| Backend | Node.js + Express + TypeScript (รันด้วย `tsx`) |
| Database | SQLite (ผ่าน `node:sqlite` ในตัว Node 22 — ไม่ต้องติดตั้ง DB แยก) |
| Frontend | HTML/CSS/Vanilla JS (ไม่มี build step) |
| นักเรียน | LINE LIFF SDK |
| แผนที่ครู | Leaflet (vendored ใน `public/vendor/` — ไม่พึ่ง CDN) + OpenStreetMap tiles |
| Geofence | วงกลม: Haversine (จุด-ใน-วงกลม) · polygon: ray casting (จุด-ใน-รูป) |
| Auth | HMAC-signed token + scrypt password hash |

> ต้องใช้ **Node.js 22+** (ใช้ `node:sqlite` ที่ยัง experimental)

## เริ่มใช้งาน

```bash
cd projects/student-checkin
npm install
cp .env.example .env      # แล้วแก้ค่า (ดูด้านล่าง)
npm start
```

เปิด:
- นักเรียน: http://localhost:3000/student/
- ครู: http://localhost:3000/teacher/ (default: `teacher` / `teacher1234`)

### โหมด MOCK (ทดสอบโดยไม่ต้องต่อ LINE จริง)

ถ้ายังไม่ได้ตั้งค่า `LINE_LOGIN_CHANNEL_ID` ระบบจะเข้า **MOCK MODE** อัตโนมัติ —
หน้านักเรียนจะให้กรอก "LINE User ID สมมติ" เพื่อทดสอบ flow ทั้งหมดได้ทันที

## เชื่อมต่อ LINE จริง

1. สร้าง **LINE Login Channel** ใน [LINE Developers Console](https://developers.line.biz/)
2. สร้าง **LIFF app** ในช่องนั้น — ตั้ง Endpoint URL เป็น `https://<โดเมนคุณ>/student/`
   และเปิด scope `openid`, `profile`
3. ผูก LIFF กับ **LINE OA** (Official Account) → เพิ่มปุ่ม/Rich menu ที่เปิด LIFF URL
4. ตั้งค่าใน `.env`:

```env
LIFF_ID=xxxxxxxxxx-xxxxxxxx
LINE_LOGIN_CHANNEL_ID=1234567890
APP_SECRET=<สุ่มค่ายาว ๆ>
```

จากนั้นระบบจะออกจาก mock mode และ verify `id_token` จาก LIFF ที่ฝั่ง server จริง

## โครงสร้าง

```
src/
  server.ts            entry (Express + static)
  config.ts            โหลด env / ตรวจ mock mode
  db/index.ts          schema (students, zones, checkins, teachers)
  db/seed.ts           สร้างครูเริ่มต้น + พื้นที่ตัวอย่าง
  lib/geo.ts           haversine + จุดในวงกลม
  lib/auth.ts          token (HMAC) + password hash (scrypt)
  lib/line.ts          verify LINE id_token / mock
  lib/middleware.ts    requireRole('student'|'teacher')
  routes/              auth, students, checkin, zones, reports, manage (ครูจัดการนักเรียน)
public/
  student/             LIFF app (ลงทะเบียน + เช็คอิน)
  teacher/             Dashboard (พื้นที่ + รายงาน)
  shared/              style.css, api.js
```

## API สรุป

| Method | Endpoint | สิทธิ์ | ทำอะไร |
|--------|----------|--------|--------|
| GET  | `/api/auth/config` | - | คืน LIFF ID + โหมด mock |
| POST | `/api/auth/line` | - | นักเรียนเข้าระบบ (idToken หรือ mock) |
| POST | `/api/auth/teacher/login` | - | ครูเข้าระบบ |
| GET  | `/api/students/me` | นักเรียน | ข้อมูลตัวเอง |
| POST | `/api/students/register` | นักเรียน | ลงทะเบียน/แก้ไขข้อมูล |
| POST | `/api/checkin` | นักเรียน | เช็คอินตำแหน่ง (ต้อง approved) |
| GET  | `/api/checkin/mine` | นักเรียน | ประวัติตัวเอง |
| GET/POST/PUT/DELETE | `/api/zones` | ครู | จัดการพื้นที่เช็คอิน |
| GET  | `/api/manage/students` | ครู | รายชื่อ + สรุปสถานะ (`?status=pending`) |
| POST | `/api/manage/students/:id/status` | ครู | อนุมัติ/ปฏิเสธ (`{status, note}`) |
| PUT  | `/api/manage/students/:id` | ครู | แก้ไขข้อมูลนักเรียน |
| DELETE | `/api/manage/students/:id` | ครู | ลบนักเรียน |
| GET  | `/api/manage/notifications` | ครู | กล่องแจ้งเตือนล่าสุด |
| GET  | `/api/reports/daily?date=` | ครู | รายงานรายวัน (เฉพาะ approved) |
| GET  | `/api/reports/student/:id` | ครู | ประวัติรายคน |
| GET  | `/api/news` | นักเรียน/ครู | อ่านข่าว |
| POST/DELETE | `/api/news[/:id]` | ครู | โพสต์/ลบข่าว |
| POST | `/api/leaves` | นักเรียน | ส่งคำขอลา |
| GET  | `/api/leaves/mine` | นักเรียน | คำขอลาของตัวเอง |
| GET  | `/api/leaves?status=` | ครู | คำขอลาทั้งหมด |
| POST | `/api/leaves/:id/status` | ครู | อนุมัติ/ไม่อนุมัติคำขอลา |

## หมายเหตุด้านความปลอดภัย (สำหรับ production)

- ตั้ง `APP_SECRET` เป็นค่าสุ่มยาว และเปลี่ยนรหัสครู default
- เสิร์ฟผ่าน HTTPS เท่านั้น (LIFF และ Geolocation ต้องการ HTTPS)
- ตำแหน่ง GPS จากมือถือปลอมได้ (mock location app) — สำหรับความเข้มงวดสูง
  ควรเสริม server-side signal (เช่น เวลาเช็คอิน, IP/WiFi, ตรวจ mock location flag)
- ระบบบันทึกเช็คอิน "นอกพื้นที่" ไว้เป็นหลักฐานด้วย ไม่ได้ทิ้ง

## ต่อยอด (ยังไม่ได้ทำ)

- **แจ้งเตือนผู้ปกครองผ่าน LINE** เมื่อนักเรียนเช็คอินกลับบ้าน — ต้องให้ผู้ปกครอง
  add เพื่อนกับ OA และผูก LINE userId (ตอนนี้เก็บแค่เบอร์โทร)
- กันการปลอมตำแหน่ง GPS ให้เข้มขึ้น
- นำเข้ารายชื่อนักเรียนล่วงหน้า (import) เพื่อ pre-verify ตอนอนุมัติ
- รายงานสรุป/ส่งออก Excel
