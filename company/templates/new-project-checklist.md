# New Project Checklist

ใช้ checklist นี้ทุกครั้งที่เริ่มโปรเจกต์ใหม่

## Project: [ชื่อโปรเจกต์]
## Date: [วันที่เริ่ม]
## Boss Request: [สรุปสิ่งที่ Boss ต้องการ]

---

## Pre-Flight

- [ ] Acceptance criteria ชัดเจน
- [ ] Tech stack ตัดสินใจแล้ว
- [ ] Scope ไม่กว้างเกินไป (MVP first)

## Setup

- [ ] สร้าง project directory ใน `projects/`
- [ ] Initialize project (package.json / pyproject.toml)
- [ ] Setup linting & formatting
- [ ] สร้าง .gitignore
- [ ] สร้าง .env.example (ถ้าต้องใช้ env vars)
- [ ] สร้าง branch: `feature/<project-name>`

## Structure

```
projects/<project-name>/
├── src/
├── tests/
├── .env.example
├── .gitignore
├── package.json / pyproject.toml
└── README.md
```

## Before First PR

- [ ] Tests ทำงานได้
- [ ] ไม่มี secrets ใน code
- [ ] README มีวิธี setup & run
- [ ] Boss review & approve
