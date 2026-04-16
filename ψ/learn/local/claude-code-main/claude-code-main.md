# Claw Code (Claude Code Rewrite) Learning Index

## Source
- **Origin**: ./origin/
- **GitHub**: https://github.com/instructkr/claw-code

## Explorations

### 2026-04-16 2319 (default — 3 agents)
- [2026-04-16/2319_ARCHITECTURE](2026-04-16/2319_ARCHITECTURE.md) — โครงสร้าง, agent loop, modules, data flow
- [2026-04-16/2319_CODE-SNIPPETS](2026-04-16/2319_CODE-SNIPPETS.md) — code สำคัญ, patterns, tool/query/permission system
- [2026-04-16/2319_QUICK-REFERENCE](2026-04-16/2319_QUICK-REFERENCE.md) — ภาพรวม, features, วิธีใช้, เปรียบเทียบกับ Claude Code

**Key insights**:
- Claw Code มี 2 implementations: Python (src/) เป็น stub/routing layer + Rust (rust/) เป็น working runtime
- ใช้ JSON snapshot registries สำหรับ commands (50+) และ tools (60+) แยกจาก implementation
- Python ยังไม่มี actual LLM calls — Rust port ทำงานได้จริงกว่ามาก
