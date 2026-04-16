# NLS Architecture — Technical Design

> Version: v3 (2026-04-17)

## Tech Stack

| Layer | Technology | หน้าที่ |
|-------|-----------|---------|
| Web | Next.js (React + TS) | ครู + Admin dashboard |
| API | Go (Golang) | Backend REST API |
| Mobile App | Flutter (Dart) | ผู้ปกครอง + นักเรียน |
| File Storage | MinIO (S3-compatible) | เอกสาร, exports, รูปภาพ |
| Database | PostgreSQL | Main database |
| Cache | Redis | Session, cache, queue |
| Infra | Docker + Docker Compose | Deploy ทุกอย่าง |

## System Architecture

```
                    ┌─────────────────────┐
                    │      CLIENTS        │
                    │  ┌───────────────┐  │
                    │  │  Next.js Web  │  │  ครู / Admin
                    │  └───────┬───────┘  │
                    │  ┌───────────────���  │
                    │  │ Flutter App   │  │  ผู้ปกครอง / นักเรียน
                    │  ���───────┬───────┘  │
                    └──────────┼──────────┘
                               │
                    ┌──────────┴──────────┐
                    │    Nginx / Traefik  │  Reverse Proxy + LB
                    └──────────┬──────────┘
                               │
                ┌──────────────┴──────────────┐
                │         GO API SERVER       │
                │  Router → Middleware → Service │
                │  Auth │ CORS │ Tenant │ Rate │
                └──┬─────────┬─────────┬───────┘
                   │         │         │
          ┌────────┴──┐ ┌────┴───┐ ┌───┴────────┐
          │PostgreSQL │ │ Redis  │ │   MinIO     │
          └───────────┘ └────────┘ └─────────��───┘
```

## Core Modules (7 MVP)

| # | Module | Description |
|---|--------|-------------|
| M1 | Student Registry | ข้อมูลนักเรียน (เลขบัตร ปชช. 13 หลัก = primary key เชื่อม DMC) |
| M2 | Academic | เกรด, วัดผล, ปพ.1-7, ตารางเรียน, หลักสูตร |
| M3 | Attendance | เช็คชื่อ (QR/รหัส/ครูกดเอง) |
| M4 | Communication | แจ้งเตือน LINE OA / SMS / in-app |
| M5 | Export Engine | สร้างไฟล์ DMC/SchoolMIS/CCT format |
| M6 | Admin Dashboard | จัดการโรงเรียน, บุคลากร, สิทธิ์ |
| M7 | e-Document | สารบรรณ, หนังสือราชการ, สายอนุมัติ, ลงนามดิจิทัล, OCR |

## Phase 2 Modules

| # | Module | Description |
|---|--------|-------------|
| M8 | Finance | ค่าเทอม, บัญชี, พัสดุ, จัดซื้อจัดจ้าง |
| M9 | Student Welfare | SDQ, เยี��ยมบ้าน, คัดกรอง, ระบบดูแลช่วยเหลือ |
| M10 | District Dashboard | เขตพื้นที่ดู dashboard รวมทุกโรงเรียน |
| M11 | AI Analytics | วิเคราะห์นักเรียนเสี่ยง, แนะนำ intervention |

## Go API — Package Structure

```
api/
├── cmd/server/main.go
├── internal/
│   ├── config/config.go
│   ├── middleware/
���   │   ├── auth.go           # JWT
│   │   ├── tenant.go         # Multi-tenant
│   │   ├── ratelimit.go      # Redis
│   │   └── logger.go
│   ├── domain/               # Business entities
│   ���   ├── student.go
│   │   ├── school.go
│   │   ├── grade.go
│   │   ├── attendance.go
│   │   ├── subject.go
│   │   ├── parent.go
│   │   ├── document.go       # e-Document
│   │   └── user.go
│   ├── repository/           # PostgreSQL
│   ├── service/              # Business logic
│   ├── handler/              # HTTP handlers
│   ├── export/               # Export Engine
│   │   ├── engine.go
│   │   ├── dmc.go
│   │   ├── schoolmis.go
│   │   ├── cct.go
│   ���   ├── pdf.go            # ปพ.1-7
│   │   └── excel.go
│   ├── document/             # e-Document
│   │   ├── workflow.go       # Configurable approval chain
│   │   ├── registry.go       # ทะเบียนรับ/ส่ง
│   │   ├── template.go       # แม่แบบหนังสือ
│   │   └── ocr.go            # OCR full-text
│   └── storage/minio.go
├── pkg/
│   ├── response/
│   ├── validator/
│   └── citizenid/            # เลข ปชช. 13 หลัก
├── migrations/
├── Dockerfile
└── go.mod
```

## Next.js Web — Structure

```
web/src/app/
├── (auth)/login, register
├── (dashboard)/
│   ├── students/             # M1
│   ├── attendance/           # M3
│   ├── academic/grades, subjects, reports  # M2
│   ├── export/dmc, schoolmis, documents    # M5
│   ├── documents/            # M7 e-Document
│   │   ├── inbox/            # กล่องหนังสือเข้า
��   │   ├── outbox/           # หนังสือส่ง
│   │   ├── drafts/           # ร่าง
│   │   ├── orders/           # คำสั่ง
│   │   ├── circular/         # หนังสือเวียน
│   │   └── archive/          # เก็บถาวร
│   ├── comms/                # M4
│   └── settings/             # M6
```

## Flutter App — Structure

```
app/lib/features/
├── auth/
├── home/
├── attendance/               # ดูเช็คชื่อลูก
├── grades/                   # ดูเกรดลูก
├── notifications/            # แจ้งเตือน
├── documents/                # ดูหนังสือเวียน (ผู้ปกครอง)
└── profile/
```

## Data Model (Core)

```
School ─────< Student ─────< Grade
  │              │              │
  │              │          Subject
  │              │
  │          Parent
  │
  ├─────< Attendance
  │
  ├─────< User (ครู, Admin, ผอ.)
  │
  ├─────< Document (หนังสือราชการ)
  │          │
  │      DocumentFlow (สายอนุมัติ)
  │          │
  │      DocumentAttachment (ไฟล์แนบ → MinIO)
  │
  └── District (เขตพื้นที่)

Primary Key ข้ามระบบ: citizen_id (เลข ปชช. 13 หลัก)
Multi-tenant: school_id (tenant_id)
```

## API Endpoints

```
# Auth
POST   /api/v1/auth/login
POST   /api/v1/auth/register
POST   /api/v1/auth/refresh

# Students (M1)
GET    /api/v1/students
POST   /api/v1/students
GET    /api/v1/students/:id
PUT    /api/v1/students/:id
POST   /api/v1/students/import

# Attendance (M3)
POST   /api/v1/attendance
GET    /api/v1/attendance/today
GET    /api/v1/attendance/report

# Academic (M2)
GET    /api/v1/subjects
POST   /api/v1/grades
GET    /api/v1/grades/class/:classId

# Export (M5)
POST   /api/v1/export/dmc
POST   /api/v1/export/schoolmis
POST   /api/v1/export/pdf/pp1/:id
GET    /api/v1/export/download/:fileId

# Documents (M7)
GET    /api/v1/documents/inbox
GET    /api/v1/documents/outbox
POST   /api/v1/documents
POST   /api/v1/documents/:id/route       # มอบหมาย/สั่งการ
POST   /api/v1/documents/:id/acknowledge  # รับทราบ
POST   /api/v1/documents/:id/sign         # ลงนาม
GET    /api/v1/documents/search?q=        # Full-text search
GET    /api/v1/documents/stats            # สถิติ

# Communication (M4)
POST   /api/v1/comms/notify
GET    /api/v1/comms/messages

# Admin (M6)
GET    /api/v1/schools/:id/dashboard
PUT    /api/v1/schools/:id/settings
```

## Architecture Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Multi-tenant | Shared DB + tenant_id | ง่าย, District Dashboard query ง่าย |
| Offline | PWA + Service Worker + IndexedDB | โรงเรียนชนบทเน็ตไม่เสถียร |
| File storage | MinIO (S3-compatible) | Self-hosted, ไม่เสียค่า cloud |
| Workflow | Configurable per school size | โรงเรียนเล็กไม่มีรอง ผอ. |
| Export | Generate file → user uploads | ไม่ต้องรอ API จาก สพฐ |
| Auth | JWT + refresh token | Stateless, scale ง่าย |

## Docker Compose

```yaml
services:
  api:        # Go API (port 8080)
  web:        # Next.js (port 3000)
  postgres:   # PostgreSQL 16
  redis:      # Redis 7
  minio:      # MinIO (port 9000/9001)
  nginx:      # Reverse proxy (port 80/443)
```
