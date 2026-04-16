# Lesson: Thai EdTech Research Patterns

**Source**: rrr: jarvis (NLS deep research session)
**Date**: 2026-04-17

## Pattern

เมื่อทำ research ระบบ IT โรงเรียนไทย / ระบบราชการ:

1. **อย่า fetch เว็บราชการตรง** — SSL/TLS errors, 403, self-signed certs เป็นเรื่องปกติ ใช้ search snippets + Pantip + AnyFlip เป็น primary source แทน
2. **Import file capability = bypass API dependency** — ถ้าระบบราชการรับ import file ได้ ไม่ต้องรอ MOU/API access ก็สร้าง export engine ได้เลย
3. **Module-in-system > standalone product** — สำหรับ vertical SaaS (โรงเรียน, โรงพยาบาล) การรวม feature เป็น module ในระบบหลักมี competitive advantage มากกว่าแยกเป็น product เพราะ data integration ข้ามระบบ

## Concepts

- thai-government-it, edtech, research-methodology, vertical-saas, export-engine, e-document
