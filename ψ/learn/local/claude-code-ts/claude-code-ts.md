# Claude Code TypeScript (Original Source) Learning Index

## Source
- **Origin**: ../claude-code-main/src_ts/
- **Note**: Leaked original TypeScript source of Claude Code CLI

## Explorations

### 2026-04-16 2333 (default — 3 agents)
- [2026-04-16/2333_ARCHITECTURE](2026-04-16/2333_ARCHITECTURE.md) — โครงสร้าง, agent loop, 35+ modules, data flow
- [2026-04-16/2333_CODE-SNIPPETS](2026-04-16/2333_CODE-SNIPPETS.md) — code สำคัญ 13 หมวด (1,253 บรรทัด)
- [2026-04-16/2333_QUICK-REFERENCE](2026-04-16/2333_QUICK-REFERENCE.md) — reference ครบ 40 tools, 100+ commands, 17 skills (986 บรรทัด)
- [2026-04-16/INDEX](2026-04-16/INDEX.md) — Quick navigation guide

**Key insights**:
- ใช้ React + Ink สำหรับ terminal UI, Zustand-like state management
- Query engine เป็น async generator ที่ yield streaming events
- Tool system: 40 tools, permission-first design, pre/post hooks
- Performance: parallel startup, prompt cache stability, LRU file cache (100MB)
- Coordinator mode สำหรับ multi-agent orchestration
