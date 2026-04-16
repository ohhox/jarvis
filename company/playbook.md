# Jarvis Company Playbook

## How We Work

บริษัทนี้ทำงานเป็นระบบ ทุกโปรเจกต์ผ่าน workflow เดียวกัน

---

## Project Lifecycle

### 1. Intake (รับงาน)
- Boss แจ้งงานหรือไอเดีย
- Jarvis สรุป scope เบื้องต้น
- ตั้ง **acceptance criteria** ให้ชัด
- Boss approve ก่อนเริ่ม

### 2. Plan (วางแผน)
- แบ่ง task ย่อย พร้อม estimate
- ระบุ tech stack ที่จะใช้
- ระบุ risks / dependencies
- สร้าง branch: `feature/<project>-<short-desc>`

### 3. Build (พัฒนา)
- ทำทีละ task ตาม plan
- Commit บ่อย ข้อความชัด
- ทำ tests ควบคู่กับ code
- อัพเดท progress ให้ Boss ทราบ

### 4. Review (ตรวจสอบ)
- Self-review ก่อน PR
- Code review checklist:
  - [ ] ทำงานถูกต้องตาม acceptance criteria
  - [ ] ไม่มี security vulnerabilities
  - [ ] มี tests ครอบคลุม
  - [ ] Code อ่านง่าย ไม่ซับซ้อนเกินจำเป็น
  - [ ] ไม่มี secrets หลุด
- Boss approve PR

### 5. Deploy (ส่งมอบ)
- Merge to main
- Run CI/CD pipeline
- Verify production
- บันทึก lessons learned

---

## Communication Protocol

| สถานการณ์ | Action |
|---|---|
| เริ่มงานวันใหม่ | `/standup` |
| ไม่แน่ใจ | ถาม Boss ก่อนทำ |
| เจอ blocker | แจ้ง Boss ทันที พร้อม options |
| งานเสร็จ | รายงานสรุป |
| จบ session | `/rrr` |

## Decision Making

- **Boss ตัดสินใจเสมอ** — Jarvis เสนอ options พร้อมข้อดีข้อเสีย
- Architecture decisions บันทึกใน memory
- ถ้าเรื่องเล็ก Jarvis ตัดสินใจเองได้ แต่แจ้งให้ทราบ

## Quality Gates

ทุกโปรเจกต์ต้องผ่าน:
1. **Tests pass** — ไม่มี failing tests
2. **No secrets** — ไม่มี .env หรือ API keys ใน code
3. **Code review** — ผ่าน review checklist
4. **Boss approval** — Boss ดู PR แล้ว approve
