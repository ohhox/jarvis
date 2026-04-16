# University Vision 2030 — Unified Platform

> "One Platform, One Data, One Experience"

## Vision

รวมศูนย์ทุกระบบในมหาวิทยาลัย (54 ระบบ) → แพลตฟอร์มเดียว
นักศึกษา อาจารย์ เจ้าหน้าที่ ผู้บริหาร — ใช้ที่เดียวจบ

## Research

| # | File | เนื้อหา |
|---|------|---------|
| 01 | [University Systems Landscape](research/01-university-systems-landscape.md) | 54 ระบบใน 8 กลุ่ม + ระบบภายนอก อว. |
| 02 | [Existing Solutions Reference](research/02-competitor-analysis.md) | บทเรียนจาก Ellucian, Oracle, OpenEduCat + Design Principles |
| 03 | [Vision 2030 Architecture](research/03-vision-2030-architecture.md) | Architecture, 10 Super Modules, Tech Stack |
| 04 | [Implementation Roadmap](research/04-implementation-roadmap.md) | 3-year roadmap, migration strategy, ROI |
| 05 | [What Big Universities Do](research/05-what-big-universities-do.md) | มหิดล, ธรรมศาสตร์, มช., มข., จุฬา, NUS, MIT |

## 10 Super Modules

| Phase | Module | ระบบย่อย |
|-------|--------|---------|
| **1** | M1: Core Platform | Identity, SSO, Org, Workflow, Notification |
| **1** | M2: Student Registry (SIS) | ทะเบียน, สถานภาพ, เอกสาร, Transcript |
| **1** | M3: Academic | หลักสูตร, ตาราง, วัดผล, TQF |
| **1** | M4: HR & Personnel | ทะเบียนบุคลากร, ลา, ภาระงาน |
| **1** | M5: e-Document | สารบรรณ, คำสั่ง, ลงนามดิจิทัล, OCR |
| **2** | M6: Finance | บัญชี, งบ, ค่าเทอม, จัดซื้อ |
| **2** | M7: Student Affairs | กิจกรรม, ทุน, กยศ., หอพัก |
| **2** | M8: Research | วิจัย, EC/IRB, IP, Publication |
| **3** | M9: Quality Assurance | IQA, EQA, แผน, ERM |
| **3** | M10: AI & Analytics | นศ.เสี่ยง, BI, Chatbot, Prediction |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web | Next.js (React + TypeScript) |
| Mobile | Flutter |
| API | Go (Golang) |
| Database | PostgreSQL |
| Search | Elasticsearch / Meilisearch |
| Cache/Queue | Redis + NATS |
| File Storage | MinIO |
| BI | Superset / Metabase |
| Infra | Docker + Kubernetes |
| AI | Python + LLM API |

## Status

- [x] Research: Systems Landscape
- [x] Research: Competitor Analysis
- [x] Research: Architecture Design
- [x] Research: Implementation Roadmap
- [ ] Database Schema Design
- [ ] Project Scaffolding
- [ ] Prototype
