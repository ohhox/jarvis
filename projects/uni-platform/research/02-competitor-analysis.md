# Existing Solutions Reference — ระบบที่มีอยู่ในตลาด (สำหรับอ้างอิง)

> Research Date: 2026-04-17
> Note: ไม่ใช่ market analysis — เป็นการศึกษาสิ่งที่มีอยู่เพื่อเรียนรู้ข้อดี/ข้อเสีย ก่อนออกแบบของเรา

## ระบบที่มหาลัยไทยใช้อยู่ปัจจุบัน (สภาพจริง)

```
มหาวิทยาลัยไทยส่วนใหญ่:

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  ระบบทะเบียน  │  │  ระบบ HR      │  │  ระบบการเงิน  │
│  (พัฒนาเอง)  │  │  (Vendor A)   │  │  (Vendor B)   │
│  PHP/Java     │  │  .NET         │  │  Oracle       │
└──────────────┘  └──────────────┘  └──────────────┘
       ↕ ไม่เชื่อม       ↕ ไม่เชื่อม       ↕ ไม่เชื่อม
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Moodle LMS   │  │  e-Document   │  │  ระบบวิจัย    │
│  (Open Source) │  │  (Vendor C)   │  │  (พัฒนาเอง)  │
└──────────────┘  └──────────────┘  └──────────────┘

ปัญหาที่เจอจริง:
- 10+ vendors / เทคโนโลยี / ภาษาโปรแกรม คนละยุค
- ข้อมูลนักศึกษา กรอกซ้ำ 5-10 ระบบ
- ไม่มี Single Dashboard สำหรับผู้บริหาร
- นักศึกษา login 5+ ระบบ แยกกัน
- ค่า maintain + license รวมแพงมาก
- บาง vendor เลิกกิจการ → ระบบ orphan
```

## สิ่งที่เรียนรู้จาก ERP ระดับโลก

| Solution | สิ่งที่ดี (เอามาใช้) | สิ่งที่ไม่ดี (หลีกเลี่ยง) |
|----------|---------------------|--------------------------|
| **Ellucian Banner** | Module structure ชัดเจน, SIS+Finance+HR integrated | UI เก่า, implement นาน, ปรับยาก |
| **Oracle PeopleSoft** | Enterprise-grade, analytics ดี | ซับซ้อนเกินไป, ต้องมีทีมใหญ่ดูแล |
| **OpenEduCat** | Open source, Odoo-based modular | Community เล็ก, customize เยอะ |
| **Moodle** | Plugin ecosystem, community ใหญ่ | แค่ LMS ไม่ใช่ full platform |

**Key takeaway**: ออกแบบ modular + API-first → แต่ละ module อยู่ได้ด้วยตัวเอง แต่ทำงานร่วมกันได้ดี

## Design Principles (จากบทเรียนคนอื่น)

1. **Modular** — เปิด/ปิด module ได้ตามความต้องการแต่ละมหาลัย
2. **Multi-tenant ready** — ออกแบบ tenant_id ตั้งแต่แรก เผื่อมหาลัยอื่นเอาไปใช้
3. **API-First** — ทุก module มี REST API → คณะ/หน่วยงาน ต่อยอดได้
4. **LMS Bridge ไม่ใช่ LMS Replace** — ไม่ต้องสร้าง LMS ใหม่ เชื่อม Moodle ที่มีอยู่ผ่าน LTI
5. **Migration-friendly** — import ข้อมูลจากระบบเก่าได้ง่าย (CSV, API, direct DB)
6. **Config > Code** — Workflow, form, report ปรับได้โดยไม่ต้องแก้ code
