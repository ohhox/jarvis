# University Vision 2030 — Unified Platform Architecture

> Research Date: 2026-04-17

## Vision Statement

> **"One Platform, One Data, One Experience"**
> 
> นักศึกษา อาจารย์ เจ้าหน้าที่ บุคลากร ผู้บริหาร — ทุกคนใช้แพลตฟอร์มเดียว
> ข้อมูลกรอกครั้งเดียว ใช้ได้ทุกที่ — ไม่มี silo อีกต่อไป

## Core Principles

1. **Single Source of Truth** — ข้อมูลอยู่ที่เดียว ไม่ซ้ำซ้อน
2. **Role-Based Experience** — คนละ role เห็นคนละหน้า แต่ข้อมูลเดียวกัน
3. **API-First** — ทุก module เชื่อมกันผ่าน API, คณะพัฒนาต่อยอดได้
4. **Offline-Ready** — ใช้ได้แม้เน็ตไม่เสถียร (สำหรับ ม.ต่างจังหวัด/วิทยาเขต)
5. **Government-Connected** — เชื่อม อว./TCAS/NRIIS/กยศ./GFMIS อัตโนมัติ
6. **AI-Enhanced** — วิเคราะห์ นศ.เสี่ยง, แนะนำหลักสูตร, พยากรณ์งบ, chatbot

## System Architecture

```
                          ┌─────────────────────────┐
                          │       EXPERIENCES        │
                          │                          │
                          │  ┌─────────┐ ┌────────┐ │
                          │  │Student  │ │Faculty │ │  Mobile App (Flutter)
                          │  │Super App│ │Portal  │ │  + PWA
                          │  └────┬────┘ └───┬────┘ │
                          │  ┌────┴──────────┴────┐ │
                          │  │   Admin Dashboard   │ │  Web (Next.js)
                          │  └────────┬───────────┘ │
                          │  ┌────────┴───────────┐ │
                          │  │ Executive Dashboard │ │  BI + Real-time
                          │  └────────────────────┘ │
                          └────────────┬────────────┘
                                       │
                          ┌────────────┴────────────┐
                          │     API GATEWAY          │
                          │  Auth │ Rate │ Routing   │
                          │  Tenant │ Audit │ Cache  │
                          └────────────┬────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         │                             │                             │
    ┌────┴──────┐              ┌───────┴───────┐            ┌───────┴───────┐
    │  CORE     │              │  ACADEMIC     │            │  OPERATIONS   │
    │           │              │               │            │               │
    │ • Identity│              │ • Registration│            │ • Finance     │
    │ • Auth/SSO│              │ • Curriculum  │            │ • HR/Payroll  │
    │ • Org     │              │ • Grading     │            │ • Procurement │
    │ • Workflow│              │ • LMS Bridge  │            │ • Assets      │
    │ • Notify  │              │ • Admission   │            │ • e-Document  │
    │ • File    │              │ • Graduate    │            │ • QA/IQA      │
    └────┬──────┘              └───────┬───────┘            └───────┬───────┘
         │                             │                             │
         └─────────────────────────────┼─────────────────────────────┘
                                       │
                          ┌────────────┴────────────┐
                          │     SHARED SERVICES      │
                          │                          │
                          │  PostgreSQL │ Redis       │
                          │  MinIO │ Elasticsearch   │
                          │  Message Queue (NATS)    │
                          └────────────┬────────────┘
                                       │
                          ┌────────────┴────────────┐
                          │   EXTERNAL CONNECTORS    │
                          │                          │
                          │  TCAS │ NRIIS │ กยศ.DSL   │
                          │  GFMIS │ e-GP │ CHE QA   │
                          │  อว.ข้อมูล │ ThaiLIS     │
                          │  PromptPay │ Bank API    │
                          └─────────────────────────┘
```

## Module Map (54 ระบบ → 10 Super Modules)

### Phase 1: MVP (ปีที่ 1) — Foundation + Quick Win

| Super Module | ระบบย่อย | Priority | ทำไมก่อน |
|-------------|---------|----------|---------|
| **M1: Core Platform** | Identity, Auth/SSO, Org Structure, Role Management | ★★★ | ฐานของทุกอย่าง |
| **M2: Student Registry (SIS)** | ทะเบียน, ข้อมูล นศ., สถานภาพ, ผลการเรียน, Transcript | ★★★ | หัวใจของมหาลัย |
| **M3: Academic** | หลักสูตร, ตารางเรียน, วัดผล, TQF | ★★★ | เชื่อมกับ SIS |
| **M4: HR & Personnel** | ทะเบียนบุคลากร, ลา, ภาระงาน | ★★☆ | ลดงาน HR ทันที |
| **M5: e-Document** | สารบรรณ, บันทึกข้อความ, คำสั่ง, ลงนามดิจิทัล | ★★☆ | ทุกคนใช้ทุกวัน |

### Phase 2 (ปีที่ 2) — Expand

| Super Module | ระบบย่อย | Priority |
|-------------|---------|----------|
| **M6: Finance** | บัญชี, งบประมาณ, ค่าเทอม, เบิกจ่าย | ★★☆ |
| **M7: Student Affairs** | กิจกรรม, ทุน, กยศ., หอพัก, แนะแนว | ★★☆ |
| **M8: Research** | บริหารวิจัย, EC/IRB, IP, Publication DB | ★☆☆ |

### Phase 3 (ปีที่ 3) — Complete + AI

| Super Module | ระบบย่อย | Priority |
|-------------|---------|----------|
| **M9: Quality Assurance** | IQA, EQA, แผนยุทธศาสตร์, ERM | ★☆☆ |
| **M10: AI & Analytics** | นศ.เสี่ยง prediction, Executive BI, Chatbot, แนะนำหลักสูตร | ★☆☆ |

## 4 ประสบการณ์ผู้ใช้ (User Experiences)

### 1. Student Super App (นักศึกษา)

```
เปิด app เดียว:
├── 🏠 Home: ตารางเรียนวันนี้, ประกาศ, deadline
├── 📚 เรียน: LMS, ส่งงาน, ดูเกรด, Transcript
├── 💰 การเงิน: ค่าเทอม, ทุน, กยศ., ใบเสร็จ
├── 🏠 หอพัก: จองห้อง, ค่าหอ, แจ้งซ่อม
├── 🎯 กิจกรรม: ชมรม, ชั่วโมง, transcript กิจกรรม
├── 💼 อาชีพ: ฝึกงาน, สหกิจ, ตลาดงาน
├── 📄 เอกสาร: ขอเอกสาร online, ติดตามสถานะ
├── 🔔 แจ้งเตือน: ทุกอย่างในที่เดียว
└── 🤖 AI Assistant: ถามได้ทุกเรื่อง
```

### 2. Faculty Portal (อาจารย์)

```
├── 📊 Dashboard: ภาระงาน, ตารางสอน, deadline
├── 👥 นักศึกษา: ที่ปรึกษา, เกรด, attendance
├── 📝 วิชาการ: TQF, สื่อการสอน, สอบ
├── 🔬 วิจัย: โครงการ, ทุน, publication
├── 📄 เอกสาร: ใบลา, เบิกค่าใช้จ่าย, หนังสือราชการ
├── 📈 KPI: ประเมินผลงาน, ตำแหน่งวิชาการ
└── 🤖 AI: วิเคราะห์ นศ.เสี่ยง, แนะนำ intervention
```

### 3. Staff Portal (เจ้าหน้าที่)

```
├── 📋 งานประจำ: workflow ตามฝ่าย
├── 📄 สารบรรณ: กล่องงาน, อนุมัติ, ลงนาม
├── 💰 การเงิน: เบิกจ่าย, จัดซื้อ, พัสดุ
├── 👤 HR: ลา, ประวัติ, อบรม
└── 📊 รายงาน: ตามหน้าที่
```

### 4. Executive Dashboard (ผู้บริหาร)

```
├── 📊 ภาพรวม: จำนวน นศ., รายได้, ค่าใช้จ่าย
├── 📈 KPI: ตัวชี้วัดยุทธศาสตร์ real-time
├── ⚠️ Alert: นศ.เสี่ยงพ้นสภาพ, งบเกินแผน
├── 🔄 Benchmark: เทียบกับมหาลัยอื่น
└── 🤖 AI Insights: แนวโน้ม, คาดการณ์
```

## Workflow Engine — หัวใจของระบบ

```
ทุก process ใช้ Workflow Engine เดียวกัน:

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  ใบลา       │     │  จัดซื้อ     │     │  วิจัย ขอทุน │
│  (HR flow)  │     │  (Finance)  │     │  (Research) │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                    │                    │
       └────────────────────┼────────────────────┘
                            │
                ┌───────────┴───────────┐
                │    WORKFLOW ENGINE     │
                │                       │
                │ • Configurable steps  │
                │ • Parallel approval   │
                │ • Conditional routing │
                │ • SLA tracking        │
                │ • Notification        │
                │ • Audit trail         │
                │ • Digital signature   │
                └───────────────────────┘

ข้อดี:
- สร้าง workflow ใหม่ได้เอง ไม่ต้องเขียน code
- ทุกเอกสาร/คำร้อง ใช้ engine เดียว
- ติดตามสถานะได้ทุก step
- เปลี่ยนสายอนุมัติ ได้ตามโครงสร้างที่เปลี่ยน
```

## Tech Stack (Recommended)

| Layer | Technology | เหตุผล |
|-------|-----------|--------|
| **Web** | Next.js (React + TypeScript) | SSR, SEO, modern, ecosystem ใหญ่ |
| **Mobile** | Flutter | iOS+Android จาก codebase เดียว, offline support |
| **API** | Go (Golang) | เร็ว, concurrent, deploy ง่าย, microservices ready |
| **Database** | PostgreSQL | ข้อมูลหลัก, JSONB flexible, proven |
| **Search** | Elasticsearch / Meilisearch | Full-text search เอกสาร, วิจัย |
| **Cache/Queue** | Redis + NATS | Session, cache, async processing |
| **File Storage** | MinIO (S3-compatible) | เอกสาร, สื่อการสอน, self-hosted |
| **BI/Analytics** | Apache Superset / Metabase | Dashboard ผู้บริหาร |
| **LMS Bridge** | Moodle API / LTI | เชื่อม LMS ที่มีอยู่แล้ว ไม่ต้องเปลี่ยน |
| **Infra** | Docker + Kubernetes | Scale, deploy, multi-campus |
| **AI** | Python + LLM API | Chatbot, prediction, analytics |

## Architecture Pattern: Modular Monolith → Microservices

```
ปีที่ 1-2: Modular Monolith
┌──────────────────────────────────────┐
│              GO API SERVER           │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐│
│  │Core│ │SIS │ │Acad│ │HR  │ │Doc ││
│  │    │ │    │ │    │ │    │ │    ││
│  └────┘ └────┘ └────┘ └────┘ └────┘│
│         Internal API boundaries     │
└──────────────────────────────────────┘
            │
        Single DB (PostgreSQL)

ปีที่ 3+: Extract to Microservices (ถ้าจำเป็น)
┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐
│Core│ │SIS │ │Acad│ │HR  │ │Doc │
└──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘
   └──────┴──────┴──────┴──────┘
              API Gateway
              │
        Multiple DBs (if needed)
```

## สิ่งที่ทำให้ Vision 2030 ต่างจากทุกคน

| Feature | ระบบเดิม | Vision 2030 |
|---------|---------|-------------|
| Login | 5-10 ระบบ แยกกัน | **SSO + Super App เดียว** |
| กรอกข้อมูล | ซ้ำ 5-10 ครั้ง | **กรอกครั้งเดียว** |
| เชื่อม อว./TCAS | ส่งข้อมูล manual | **Auto export/import** |
| Dashboard ผู้บริหาร | ไม่มี / Excel | **Real-time AI-powered** |
| นศ.เสี่ยง | ไม่รู้จนพ้นสภาพ | **AI เตือนล่วงหน้า 1 เทอม** |
| Workflow | แยกแต่ละระบบ | **Engine เดียว ใช้ทุกงาน** |
| เอกสาร | กระดาษ + scan | **Digital-first + e-signature** |
| Mobile | ไม่มี / แยกหลาย app | **Super App เดียว** |
| API | ไม่มี / ปิด | **Open API** ให้คณะต่อยอด |
| Offline | ไม่รองรับ | **PWA + sync** |
