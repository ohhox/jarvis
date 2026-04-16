# The Next Level School 2030 Vision

ALL-IN-ONE multi-school management platform สำหรับโรงเรียนไทย

## Status: Research Phase

## Quick Links

| Document | Description |
|----------|-------------|
| [Market Research](research/01-market-research.md) | ตลาดการศึกษาไทย, สพฐ, ขนาดตลาด |
| [Competitor Analysis](research/02-competitor-analysis.md) | School Bright, iSchoolSIS, Schoolcore, ZCHOOLMATE, etc. |
| [สพฐ IT Ecosystem](research/03-obec-it-systems.md) | DMC, SchoolMIS, EMIS, CCT + ปัญหาที่ครูเจอ |
| [School Structure](research/04-school-structure.md) | โครงสร้าง 4 ฝ่าย, ขนาดโรงเรียน, สายบังคับบัญชา |
| [Document Flow](research/05-document-flow.md) | Flow สารบรรณ, รับ-ส่งหนังสือ, สายอนุมัติ |
| [e-Document Market](research/06-edocument-market.md) | คู่แข่ง e-Saraban, พ.ร.บ. 2565, โอกาส |
| [Architecture](research/07-architecture.md) | Tech stack, modules, data model, API design |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web | Next.js (React + TS) |
| API | Go (Golang) |
| Mobile App | Flutter (Dart) |
| File Storage | MinIO (S3-compatible) |
| Database | PostgreSQL |
| Cache | Redis |
| Infra | Docker + Docker Compose |

## Core Modules

| # | Module | Description | Priority |
|---|--------|-------------|----------|
| M1 | Student Registry | ข้อมูลนักเรียน (เลข ปชช. = key) | MVP |
| M2 | Academic | เกรด, วัดผล, ปพ.1-7 | MVP |
| M3 | Attendance | เช็คชื่อ | MVP |
| M4 | Communication | แจ้งเตือน LINE/SMS | MVP |
| M5 | Export Engine | สร้างไฟล์ DMC/SchoolMIS/CCT | MVP |
| M6 | Admin Dashboard | จัดการโรงเรียน, สิทธิ์ | MVP |
| M7 | e-Document | สารบรรณอิเล็กทรอนิกส์ | MVP |
| M8 | Finance | ค่าเทอม, บัญชี, พัสดุ | Phase 2 |
| M9 | Student Welfare | SDQ, เยี่ยมบ้าน, คัดกรอง | Phase 2 |
| M10 | District Dashboard | เขตพื้นที่ดูรวม | Phase 2 |
| M11 | AI Analytics | วิเคราะห์, แนะนำ | Phase 2 |
