# Implementation Roadmap — University Vision 2030

> Research Date: 2026-04-17

## Strategy: กินช้างทีละคำ

> ไม่ได้ทำ 54 ระบบพร้อมกัน — เริ่มจาก Core + Quick Win ที่คนเห็นผลทันที

## Phase 1: Foundation + Quick Win (เดือน 1-12)

### Quarter 1 (เดือน 1-3): Core Platform

```
สร้างฐานราก:
├── M1.1 Identity & Auth (SSO)
│   - รองรับ LDAP/AD ที่มีอยู่
│   - Single Sign-On ทุกระบบ
│   - Role-based access control
│
├── M1.2 Organization Structure
│   - มหาลัย → คณะ → ภาค → หลักสูตร
│   - ตำแหน่ง, สายบังคับบัญชา
│
├── M1.3 Notification Engine
│   - Email, LINE OA, Push, In-app
│
└── M1.4 Workflow Engine (v1)
    - Configurable approval chain
    - Digital signature
```

**Deliverable:** ทุกคน login ได้ด้วย SSO เดียว + เห็นโครงสร้างองค์กร

### Quarter 2 (เดือน 4-6): e-Document (Quick Win)

```
ทำไม e-Document ก่อน:
- ★ ทุกคนใช้ทุกวัน (นศ. อาจารย์ เจ้าหน้าที่ ผู้บริหาร)
- ★ เห็นผลทันที — กระดาษ 30 นาที → digital 3 นาที
- ★ Showcase ให้ผู้บริหารเห็นว่า platform ใช้ได้จริง

M5: e-Document
├── สารบรรณ (รับ-ส่งหนังสือราชการ)
├── บันทึกข้อความ
├── คำสั่ง/ประกาศ/หนังสือเวียน
├── สายอนุมัติ (ใช้ Workflow Engine)
├── ลงนามดิจิทัล
├── OCR + Full-text search
└── Dashboard สถิติ
```

**Deliverable:** ทุกหน่วยงานใช้ e-Document ผ่าน platform + ลด paper 50%

### Quarter 3 (เดือน 7-9): HR + ใบลาออนไลน์ (Quick Win #2)

```
M4: HR & Personnel
├── ทะเบียนบุคลากร (sync จากระบบเดิม)
├── ★ ระบบลาออนไลน์ (Quick Win — ทุกคนใช้)
├── ภาระงาน (อาจารย์)
└── ประวัติอบรม
```

**Deliverable:** บุคลากรทุกคนใช้ลาออนไลน์ + ดูข้อมูลตัวเองได้

### Quarter 4 (เดือน 10-12): Student Registry (SIS) v1

```
M2: Student Registry
├── ข้อมูลนักศึกษา (import จากระบบเดิม)
├── สถานภาพนักศึกษา
├── ★ ขอเอกสารออนไลน์ (Quick Win สำหรับ นศ.)
├── ดูผลการเรียน
└── Student Portal v1

M3: Academic v1
├── โครงสร้างหลักสูตร
├── ตารางเรียน (view only, sync จากระบบเดิม)
└── วัดผล/เกรด (view only)
```

**Deliverable:** นักศึกษามี portal ใช้ + ขอเอกสารออนไลน์ได้

### Phase 1 Summary

```
✅ SSO — login ครั้งเดียว
✅ e-Document — ลดกระดาษ 50%
✅ ลาออนไลน์ — ทุกคนสัมผัส platform
✅ Student Portal v1 — นศ.ขอเอกสารได้
✅ Workflow Engine — สายอนุมัติอัตโนมัติ
✅ Mobile App v1 — ใช้ได้บน มือถือ

คน impact: ทุกคนในมหาลัย (นศ. + อาจารย์ + เจ้าหน้าที่ + ผู้บริหาร)
```

## Phase 2: Expand (เดือน 13-24)

### H1 (เดือน 13-18): Finance + Student Affairs

```
M6: Finance
├── ค่าเทอม + ชำระเงินออนไลน์ (PromptPay/QR)
├── งบประมาณ
├── เบิกจ่าย
├── จัดซื้อจัดจ้าง (เชื่อม e-GP)
└── บัญชี

M7: Student Affairs
├── กิจกรรม + ชั่วโมงกิจกรรม
├── ทุนการศึกษา
├── เชื่อม กยศ. DSL
├── หอพัก
└── แนะแนว/ฝึกงาน/สหกิจ
```

### H2 (เดือน 19-24): SIS Full + Research

```
M2: Student Registry (Full)
├── ลงทะเบียนออนไลน์ (replace ระบบเก่า)
├── Admission (เชื่อม TCAS)
├── Transcript อัตโนมัติ
├── บัณฑิตศึกษา
└── ติดตามบัณฑิต

M8: Research
├── บริหารทุนวิจัย (เชื่อม NRIIS)
├── จริยธรรมการวิจัย (EC/IRB)
├── ทรัพย์สินทางปัญญา
├── ฐานข้อมูล Publication
└── บริการวิชาการ
```

## Phase 3: Complete + AI (เดือน 25-36)

```
M3: Academic (Full)
├── TQF 2-7 ออนไลน์ (เชื่อม CHE QA)
├── ประเมินการสอน
├── LMS Bridge (Moodle LTI)
└── ตารางสอน full (จัดอัตโนมัติ)

M4: HR (Full)
├── Payroll (เชื่อม GFMIS)
├── KPI/PA
├── ตำแหน่งวิชาการ
└── สวัสดิการ

M9: Quality Assurance
├── IQA (SAR ออนไลน์)
├── EQA (สมศ.)
├── แผนยุทธศาสตร์ + KPI
└── บริหารความเสี่ยง

M10: AI & Analytics
├── นศ.เสี่ยง Prediction
├── Executive BI Dashboard
├── AI Chatbot (ถาม-ตอบทุกเรื่อง)
├── แนะนำหลักสูตร/อาชีพ
├── พยากรณ์งบประมาณ
└── Workload Optimization
```

## Migration Strategy: ค่อยๆ ย้าย ไม่ต้อง Big Bang

```
ระยะ 1: Run Parallel
┌──────────┐     ┌──────────┐
│ ระบบเก่า  │ ←── │ Sync     │ ──→ ┌──────────┐
│ (ยังใช้อยู่)│     │ Bridge   │     │ Platform │
└──────────┘     └──────────┘     │ (ใหม่)    │
                                   └──────────┘

ระยะ 2: Gradual Cutover
┌──────────┐                      ┌──────────┐
│ ระบบเก่า  │ ──→ ปิดทีละส่วน ──→  │ Platform │
│ (ลดลง)   │                      │ (หลัก)   │
└──────────┘                      └──────────┘

ระยะ 3: Full Migration
                                   ┌──────────┐
                                   │ Platform │
                     (ระบบเก่าปิด)  │ (ทั้งหมด) │
                                   └──────────┘
```

**หลักสำคัญ:**
- ไม่บังคับเปลี่ยนทีเดียว — ค่อยๆ ย้ายทีละ module
- ระบบเก่ายังใช้ได้ระหว่าง transition
- Data migration ทำทีละส่วน ตรวจสอบก่อนเปิดใช้
- Training ทีละกลุ่ม ไม่ overwhelm

## ROI Estimation

| ด้าน | ก่อน | หลัง | ประหยัด |
|------|------|------|---------|
| เวลากรอกข้อมูลซ้ำ | ~500 ชม./ปี/แผนก | ~50 ชม. | 90% |
| ค่ากระดาษ/พิมพ์ | ~200K฿/ปี | ~30K฿ | 85% |
| ค่า license ระบบแยก | ~2-5M฿/ปี | ~500K฿ (ค่า infra) | 75-90% |
| เวลาทำรายงาน ผบ. | ~40 ชม./เดือน | Real-time | 95% |
| เวลาอนุมัติเอกสาร | 3-5 วัน/เรื่อง | < 1 วัน | 70-80% |
| นศ. เดินติดต่อ | 5-10 ครั้ง/เทอม | 0 (online) | 100% |

## Risk & Mitigation

| ความเสี่ยง | ผลกระทบ | แก้ไข |
|-----------|---------|-------|
| ผู้ใช้ต่อต้าน | สูง | เริ่มจาก Quick Win ที่คนเห็นประโยชน์ (e-Doc, ใบลา) |
| Data migration ผิดพลาด | สูง | Run parallel, ตรวจสอบทุก batch |
| ทีม dev ไม่พอ | กลาง | เริ่ม Modular Monolith (ทีมเล็กได้), ขยายทีหลัง |
| ระบบเก่า ไม่มี API | กลาง | Direct DB read (ETL) / CSV export |
| ผู้บริหารเปลี่ยนใจ | กลาง | แสดงผล quick win ทุก quarter |
| Budget ถูกตัด | กลาง | Open source stack, ลด cost ได้ |
