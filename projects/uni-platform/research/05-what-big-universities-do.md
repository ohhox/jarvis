# สิ่งที่มหาลัยใหญ่ๆ ทำ — ศึกษาเพื่อเอามาใช้

> Research Date: 2026-04-17

## มหาวิทยาลัยมหิดล (ตัวอย่างที่ดีที่สุดในไทย)

มหิดลมี **กองเทคโนโลยีสารสนเทศ (MUIT)** พัฒนาเอง เป็นมหาลัยที่ระบบ digital ครบสุดในไทย

### ระบบที่มหิดลทำ

| กลุ่ม | ระบบ | รายละเอียด |
|-------|------|-----------|
| **ERP** | **MUERP** | ระบบบริหารงบประมาณ — เบิกจ่าย, โอน, คืน, ตรวจสอบคงเหลือ + ใบเสร็จอิเล็กทรอนิกส์ (e-Receipt พร้อม Digital Signature) |
| **HR** | **MUHR** | ทะเบียนบุคลากร, ลาอิเล็กทรอนิกส์, ตรวจสอบเวลาเข้า-ออกงาน (ปกติ+ยืดหยุ่น), สมัครงาน (e-Recruitment) |
| **Admin** | **MU Administration** | e-Document (สารบรรณ: ร่าง→ตรวจ→ลงนาม→เลขที่→ทำลาย), ลงนามหลายหน้าพร้อมกัน |
| **Student** | **MU Student** | e-Profile (ประวัติ นศ.), Health MIS, MU-Contract, Enrollment, Grade Report, English Score, Advisor, MU Survey |
| **AI** | **MARVIS** | Generative AI chatbot ของมหิดลเอง |
| **Event** | **Mahidol Open House** | ระบบจัดงาน open house |
| **Alumni** | **Alumni Member** | ระบบศิษย์เก่า |

### สิ่งที่เรียนรู้จากมหิดล

- **พัฒนาเอง 100%** — ไม่ซื้อ vendor, MUIT เป็นทีม dev ภายใน
- **แยกเป็น product ชัด** — MUERP, MUHR, MU Administration, MU Student แยกกัน แต่ใช้ SSO เดียว
- **Digital Signature** — ใช้ลงนามจริงใน e-Document + e-Receipt
- **AI** — มี MARVIS (Gen AI) ให้บริการแล้ว
- **ข้อจำกัด**: แต่ละระบบยัง **แยกกันอยู่** (ไม่ใช่ unified platform จริงๆ) — ยังมี silo

## มหาวิทยาลัยธรรมศาสตร์

### ระบบที่ธรรมศาสตร์มี

| ระบบ | รายละเอียด |
|------|-----------|
| **REG TU** | ทะเบียนนักศึกษา |
| **HR TU** | บริหารบุคลากร, สวัสดิการ, พัฒนาทรัพยากรมนุษย์ |
| **Finance TU** | บริหารการเงิน |
| **SA TU** | กิจการนักศึกษา |
| **ICT TU** | บริการ IT |
| **Library TU** | ห้องสมุด |

### สิ่งที่เรียนรู้
- แยกระบบตามฝ่ายชัดเจน (REG, HR, Finance, SA)
- แต่ละระบบเป็น **silo** — ไม่มี unified dashboard

## มหาวิทยาลัยเชียงใหม่ (CMU)

### ระบบที่ มช. ทำ

| ระบบ | รายละเอียด |
|------|-----------|
| **CMU MIS** | ระบบสารสนเทศ ด้านพัฒนานักศึกษา |
| **REG CMU** | ทะเบียนนักศึกษา |
| **HR-CMU** | ระบบ HR บุคลากร |
| **KKU TQF MIS** | (อ้างอิง: มข. มีระบบ TQF ดี) |
| **CMU Transformation** | โครงการ "ก้าวใหม่ มช." — digital transformation |
| **Smart Classroom** | ห้องเรียนอัจฉริยะ |

### สิ่งที่เรียนรู้
- มช. เน้น **CMU Transformation** — vision ชัดว่าจะเป็น "มหาวิทยาลัยนวัตกรรม"
- แต่ระบบ backend ยังแยกส่วน

## มหาวิทยาลัยขอนแก่น (KKU)

### ระบบที่ มข. ทำ

| ระบบ | รายละเอียด |
|------|-----------|
| **KKU e-Learning** | LMS (Moodle-based) |
| **KKU Exam** | สอบออนไลน์ |
| **KKUX** | เรียนรู้ตลอดชีวิต (MOOC) |
| **KKU DigiClass** | ห้องเรียนดิจิทัล |
| **KKU Smart Learning** | โครงการเสริมทักษะ วิทย์/คณิต/อังกฤษ |
| **Smart Classroom & Studio** | ห้องเรียนอัจฉริยะ + สตูดิโอ |
| **KKU TQF MIS** | ระบบ TQF/มคอ. |

### สิ่งที่เรียนรู้
- มข. เด่นมากด้าน **e-Learning / Smart Learning**
- มี ecosystem การเรียนรู้ครบ (LMS, Exam, MOOC, DigiClass)
- แต่ระบบบริหาร (HR, Finance, e-Doc) ไม่เด่นเท่า

## จุฬาลงกรณ์มหาวิทยาลัย

### ระบบที่จุฬาทำ

| ระบบ | รายละเอียด |
|------|-----------|
| **สำนักบริหารเทคโนโลยีสารสนเทศ** | เสนอแนวนโยบาย, วางมาตรฐาน, กำกับ MIS |
| **ระบบทะเบียน** | reg.chula.ac.th |
| **CU Account Portal** | SSO / จัดการ account |
| **ChulaGENIE** | AI app — "University of AI" |
| **iThesis** | ระบบจัดการวิทยานิพนธ์ |
| **อักขราวิสุทธิ์** | ตรวจจับการลอกเลียนวรรณกรรม |

### สิ่งที่เรียนรู้
- จุฬาเน้น **AI** เป็น direction หลัก (ChulaGENIE, "University of AI")
- **อักขราวิสุทธิ์** เป็นตัวอย่าง product ที่มหาลัยสร้างแล้วใช้ข้ามมหาลัยได้
- ระบบ MIS ค่อนข้างปิด ข้อมูลสาธารณะน้อย

## กรุงไทย University App (U App) — ตัวอย่าง Super App

กรุงไทย ร่วมกับ 3 มหาลัย (วลัยลักษณ์, แม่โจ้, บูรพา) สร้าง **University Application**:
- QR Payment ในมหาลัย
- ระบบสะสมแต้ม
- บริการ digital สำหรับ นศ. + บุคลากร

**สิ่งที่เรียนรู้**: ธนาคารมองเห็นโอกาส super app ในมหาลัย — แต่ทำได้แค่ payment + lifestyle ไม่ได้ทำ academic/admin

---

## มหาวิทยาลัยระดับโลก

### MIT — SAP Implementation (Case Study)

- MIT เป็น **มหาลัยที่ 3 ของโลก** ที่ implement SAP ERP
- ผลลัพธ์: **customize หนักมาก** → ตอนนี้ยากมากที่จะ upgrade SAP version ใหม่
- **บทเรียน**: อย่า customize ERP มากเกินไป — ใช้ standard + configure แทน

### Stanford — Digital Transformation

- Stanford เน้นสอน Digital Transformation (มีหลักสูตร executive)
- ใช้ระบบผสม (ไม่มี single vendor)

### NUS (National University of Singapore) — ตัวอย่างที่ดีที่สุด

| สิ่งที่ NUS ทำ | รายละเอียด |
|---------------|-----------|
| **EduRec** | Education Records System — เชื่อมกับทุกระบบ |
| **Rosetta** | "From Data to Intelligences" — แปลง data silo → unified intelligence platform |
| **Integrated Operations Centre (IOC)** | เปิด ม.ค. 2025 — รวม security, emergency, building management บน platform เดียว |
| **NUS Digital Office** | EDMS — เอกสารอิเล็กทรอนิกส์ |
| **DocuSign** | ลงนามดิจิทัล |
| **RPA** | Robotic Process Automation — ลดงาน manual |
| **SSO** | NUS-ID + Smartcard — login ครั้งเดียว |

**NUS คือ benchmark ที่ดีที่สุด** — เพราะทำ "Rosetta" ที่แปลง fragmented systems → unified intelligence

### Trend ระดับโลก 2025-2026

| Trend | รายละเอียด |
|-------|-----------|
| **Cloud ERP** | มหาลัยย้ายจาก on-prem → cloud (Workday, Oracle Cloud) |
| **ERP + AI** | AI-driven ERP ช่วย predict enrollment, นศ.เสี่ยง, optimize budget |
| **Standardize > Customize** | บทเรียนจาก MIT: ใช้ standard workflow ดีกว่า customize |
| **Unified Data Platform** | แทนที่จะเชื่อม silo → สร้าง data lake/warehouse กลาง |
| **Student Super App** | One app for everything (trend จากเอเชีย) |
| **RPA** | Automate งาน manual (กรอกข้อมูลซ้ำ, ส่งรายงาน อว.) |

---

## สรุป: สิ่งที่เราเอามาใช้

### จากมหาลัยไทย

| จาก | เอามาใช้ |
|-----|---------|
| **มหิดล** | โครงสร้าง product (MUERP, MUHR, MU Student แยกชัด), Digital Signature, e-Receipt |
| **มข.** | Ecosystem การเรียนรู้ (LMS, Exam, MOOC, DigiClass) |
| **จุฬา** | AI direction (ChulaGENIE), product ข้ามมหาลัย (อักขราวิสุทธิ์) |
| **กรุงไทย U App** | Super App concept — แต่เราทำได้ครบกว่า (academic + admin + payment) |

### จากมหาลัยโลก

| จาก | เอามาใช้ |
|-----|---------|
| **NUS Rosetta** | Unified Intelligence Platform — ไม่ใช่แค่รวมระบบ แต่รวม data → insights |
| **NUS IOC** | Integrated Operations Centre — real-time dashboard ทุกมิติ |
| **MIT** | บทเรียน: **อย่า customize มาก** → ใช้ config + standard workflow |
| **Workday/UNLV** | Modular rollout — เปิดทีละ module ไม่ต้อง big bang |
| **Global trend** | AI-driven ERP, RPA, Student Super App |

### Gap ที่ยังไม่มีใครทำ (โอกาสของเรา)

```
มหาลัยไทยทุกแห่ง:
  ✗ ระบบยัง silo (แม้แต่มหิดลที่ดีสุด)
  ✗ ไม่มี unified data platform จริงๆ
  ✗ ไม่มี Student Super App ที่ครบทุกฟังก์ชัน
  ✗ ไม่มี AI-driven analytics สำหรับผู้บริหาร
  ✗ ไม่มี auto export ไป อว./NRIIS/กยศ.
  ✗ Workflow แยกแต่ละระบบ ไม่มี shared engine

เราทำ:
  ✓ Unified Platform จริง (single codebase, shared data)
  ✓ Student Super App (ครบ: เรียน + เงิน + กิจกรรม + เอกสาร)
  ✓ Workflow Engine เดียว ใช้ทุกงาน
  ✓ AI Analytics Dashboard สำหรับผู้บริหาร
  ✓ Auto connector → อว./NRIIS/กยศ./TCAS/GFMIS
  ✓ Multi-tenant → มหาลัยอื่นเอาไปใช้ได้
```
