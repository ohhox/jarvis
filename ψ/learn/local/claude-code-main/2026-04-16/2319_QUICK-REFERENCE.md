# Claw Code — คู่มือการใช้งานอย่างรวดเร็ว

**วันที่**: 2026-04-16 | **เวอร์ชัน**: v0.1.0 | **สถานะ**: Active Development

---

## 1. โครงการนี้คืออะไร

**Claw Code** เป็นการเขียน rewrite ของ Claude Code harness ด้วยภาษา Python และ Rust เพื่อศึกษาและพัฒนาระบบ agent harness นั่นหมายถึง:

- **Agent Harness** = ระบบที่ให้ AI agent (Claude) ใช้ tools เพื่อทำงาน
- **Tool System** = Bash, File I/O, Web search, Git, etc.
- **Command System** = Slash commands (/help, /status, /memory, etc.)
- **Plugin Architecture** = ขยายความสามารถได้
- **Hook System** = Pre/Post actions บน tool execution

### ประวัติการสร้าง

- **30 มีนาคม 2026** — Claude Code source code leaked
- **31 มีนาคม 4 AM** — ผู้สร้าง Sigrid Jin เริ่มทำ Python rewrite จาก scratch
- **19 ชั่วโมง** — ทำความสำเร็จ ใช้ oh-my-codex (OmX) สำหรับ orchestration
- **ปัจจุบัน** — ทำ Rust port เพื่อประสิทธิภาพและความปลอดภัยที่สูงขึ้น

### สถานะการพัฒนา

| ส่วน | Python | Rust | หมายเหตุ |
|------|--------|------|---------|
| Core harness | ✅ | ✅ | Foundational |
| Tools | ✅ mirrored | 🔧 MVP | Bash, File, Web |
| Commands | ✅ mirrored | 🔧 Narrower | ~13 slash commands |
| Hooks | ✅ parsed | 📋 Config-only | Pre/Post hooks ยังไม่ runtime |
| Plugins | ✅ mapped | ❌ Missing | ต้องเพิ่มใน Rust |
| Skills | ✅ mapped | 🔧 Local only | ไม่มี registry |
| MCP Support | ✅ mapped | ✅ | Stdio bootstrap |

---

## 2. วิธีติดตั้งและรัน

### Python Workspace

#### ติดตั้ง (Setup)

```bash
# Clone repository
git clone https://github.com/instructkr/claw-code.git
cd claw-code

# ไม่ต้อง virtual env สำหรับตอนนี้
# Python 3.10+ required
python3 --version

# (Optional) ติดตั้ง dependencies ถ้ามี
pip install -r requirements.txt  # ยังไม่มีไฟล์นี้ในเวอร์ชันปัจจุบัน
```

#### รัน CLI

```bash
# ดูสรุปของ porting workspace
python3 -m src.main summary

# ดู manifest ของ modules ทั้งหมด
python3 -m src.main manifest

# ทำ parity audit (เปรียบเทียบกับ TypeScript archive)
python3 -m src.main parity-audit

# แสดง command/tool snapshots
python3 -m src.main commands --limit 10
python3 -m src.main tools --limit 10

# รัน tests
python3 -m unittest discover -s tests -v
```

### Rust Implementation

#### ติดตั้ง

```bash
# ต้องมี Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Build
cd rust/
cargo build --release

# Binary จะอยู่ที่
./target/release/claw
```

#### รัน CLI

```bash
# Interactive REPL
./target/release/claw

# One-shot prompt
./target/release/claw prompt "describe this codebase"

# ระบุ model
./target/release/claw --model sonnet prompt "fix the bug"

# Login (OAuth)
./target/release/claw login

# Check health
./target/release/claw doctor

# ดู help
./target/release/claw --help
```

#### ตั้งค่า Credentials

```bash
# Option 1: API Key
export ANTHROPIC_API_KEY="sk-ant-..."

# Option 2: Proxy
export ANTHROPIC_BASE_URL="https://your-proxy.com"

# Option 3: OAuth (interactive)
./target/release/claw login
```

---

## 3. ฟีเจอร์หลัก และ ความสามารถ

### Python Workspace Features

| ฟีเจอร์ | คำอธิบาย |
|--------|---------|
| **Port Manifest** | ตรวจสอบ modules ทั้งหมด ใน Python workspace |
| **Parity Audit** | เปรียบเทียบ Python port กับ TypeScript archived source |
| **Query Engine** | Route prompts ไป commands/tools ที่เหมาะสม |
| **Session Management** | Load/save conversation state ให้สำหรับ persistence |
| **Tool Pool Assembly** | สร้าง tools พร้อม permissions/settings |
| **Bootstrap Graph** | Visualize startup sequence |
| **Command Graph** | Command routing logic |
| **Turn Loop** | Stateful conversation simulation |
| **Transcript Store** | บันทึก message history |

### Rust CLI Features

| ฟีเจอร์ | สถานะ | คำอธิบาย |
|--------|------|---------|
| Anthropic API + Streaming | ✅ | Async HTTP client + SSE |
| OAuth login/logout | ✅ | Interactive browser auth |
| Interactive REPL | ✅ | rustyline + history |
| Tool system | ✅ | 10+ built-in tools |
| Sub-agent orchestration | ✅ | Agent tool for spawning subagents |
| Todo tracking | ✅ | In-memory task management |
| Notebook editing | ✅ | Jupyter notebook support |
| Project memory (CLAUDE.md) | ✅ | Auto-discovery + injection |
| Config hierarchy | ✅ | .claude.json + settings.local.json |
| Permission system | ✅ | Read-only, workspace-write, danger-full-access |
| MCP server lifecycle | ✅ | Connect/spawn/manage stdio servers |
| Session persistence | ✅ | Resume previous conversations |
| Extended thinking | ✅ | Thinking blocks in responses |
| Cost tracking | ✅ | Input/output token counting |
| Git integration | ✅ | `/diff`, branch commands |
| Markdown rendering | ✅ | Terminal ANSI colors |
| Model aliases | ✅ | `opus`, `sonnet`, `haiku` shortcuts |
| Hooks (PreToolUse/PostToolUse) | 🔧 | Config parsed, runtime missing |
| Plugin system | 📋 | Not implemented yet |
| Skills registry | 📋 | Local files only |

---

## 4. Tool System

### ที่ตั้ง

- **Python**: `src/reference_data/tools_snapshot.json` (mirrored ข้อมูล)
- **Rust**: `rust/crates/tools/src/lib.rs` (actual implementation)

### Tools ที่มีอยู่ (Rust MVP)

| Tool | คำอธิบาย | Status |
|------|---------|--------|
| **BashTool** | Execute shell commands | ✅ |
| **FileReadTool** | Read file contents | ✅ |
| **FileWriteTool** | Write/create files | ✅ |
| **FileEditTool** | Edit file ranges | ✅ |
| **GlobSearchTool** | Pattern matching (glob) | ✅ |
| **GrepSearchTool** | Text search (regex) | ✅ |
| **WebSearchTool** | Search the web | ✅ |
| **WebFetchTool** | Fetch & parse URLs | ✅ |
| **AgentTool** | Spawn sub-agents | ✅ |
| **SkillTool** | Load & run skills | ✅ |
| **TodoWriteTool** | Track tasks | ✅ |
| **NotebookEditTool** | Edit Jupyter notebooks | ✅ |
| **ConfigTool** | Read config (.claude.json) | ✅ |
| **GlobSearchTool** | Find files by pattern | ✅ |
| **ToolSearchTool** | Discover available tools | ✅ |

### Tools ที่ขาดไป (ใน Rust)

- `AskUserQuestionTool` — ถามผู้ใช้
- `LSPTool` — Language server protocol
- `MCPTool` — Direct MCP invocation
- `McpAuthTool` — MCP authentication
- `ListMcpResourcesTool` — List MCP resources
- `RemoteTriggerTool` — Remote execution
- `ScheduleCronTool` — Cron scheduling
- `Task*` — Task management tools
- `Team*` — Team collaboration tools

### การใช้ Tools (Prompt Example)

```python
# Python: Mirrored execution
result = execute_tool("BashTool", '{"command": "ls -la"}')
# Output: "Mirrored tool 'BashTool' from tools/BashTool/BashTool.tsx would handle..."

# Rust: Actual execution
# User types: ls -la
# Agent routes to BashTool → executes → returns result
```

---

## 5. Command/Skill System

### ที่ตั้ง

- **Commands**: `src/reference_data/commands_snapshot.json`
- **Skills**: `src/skills/` (local directory scanning)

### Commands ที่มี (Examples)

| Command | คำอธิบาย |
|---------|---------|
| `/help` | Show help |
| `/status` | Session status (tokens, cost, model) |
| `/model [name]` | Show/switch model |
| `/permissions` | Show/switch permission mode |
| `/config [section]` | Display config |
| `/memory` | Display CLAUDE.md |
| `/diff` | Git diff |
| `/clear` | Clear conversation |
| `/compact` | Compact history |
| `/resume [id]` | Resume session |
| `/export [path]` | Export conversation |
| `/cost` | Cost breakdown |
| `/version` | Show version |

### Commands ที่ขาดไป (ใน Rust)

Python source มี ~300+ command entries ใน snapshot แต่ Rust implement แค่ ~13 ตัว ขาดไป:

- `/agents` — Manage sub-agents
- `/hooks` — Configure pre/post tool hooks
- `/mcp` — MCP server management
- `/plugin` — Plugin lifecycle
- `/skills` — Skill registry management
- `/plan` — Multi-step planning
- `/review` — Code review helpers
- `/tasks` — Task tracking
- `/team` — Team collaboration
- และอีกหลายตัว

### Skills Format

```markdown
# SKILL.md

## Identity
- Name: feature-name
- Description: what this skill does

## Commands
/command-name — description

## How to use
Instructions...
```

---

## 6. Configuration

### ไฟล์ Config

| ไฟล์ | ตั้งอยู่ | ลำดับความสำคัญ |
|-----|---------|---------|
| `.claude.json` | Project root | โครงการ (ต่ำสุด) |
| `.claude/settings.local.json` | `.claude/` | เครื่องส่วนตัว (สูงสุด) |
| Environment vars | OS level | Middleware |

### .claude.json Structure

```json
{
  "permissions": {
    "defaultMode": "dontAsk"  // or "readOnly", "workspaceWrite", "dangerFullAccess"
  },
  "hooks": {
    "preToolUse": [],
    "postToolUse": []
  },
  "model": "claude-opus-4-6",
  "mcp": {
    "servers": []
  }
}
```

### Environment Variables

```bash
# API
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_BASE_URL=https://...

# Debug
DEBUG=true
RUST_LOG=debug

# Tool config
HOME=...
EDITOR=vim
```

### Rust CLI Flags

```bash
./target/release/claw [OPTIONS] [COMMAND]

OPTIONS:
  --model MODEL                  Specify model (alias or full name)
  --dangerously-skip-permissions Skip all permission checks
  --permission-mode MODE         read-only | workspace-write | danger-full-access
  --allowedTools TOOLS           Restrict enabled tools (comma-separated)
  --output-format FORMAT         text | json
  --version, -V                  Version
```

---

## 7. CLI Commands และ Modes

### Python Main Entry Point

```bash
python3 -m src.main [COMMAND] [ARGS]
```

#### Commands

| Command | Argument | Purpose |
|---------|----------|---------|
| `summary` | - | Render porting summary |
| `manifest` | - | Show modules list |
| `parity-audit` | - | Compare Python ↔ TypeScript |
| `setup-report` | - | Startup/prefetch info |
| `command-graph` | - | Show routing logic |
| `tool-pool` | - | Show assembled tools |
| `bootstrap-graph` | - | Runtime stages |
| `subsystems` | `--limit N` | List modules (truncate) |
| `commands` | `--limit N`, `--query Q` | Search commands |
| `tools` | `--limit N`, `--query Q` | Search tools |
| `route` | `prompt` | Route prompt to commands/tools |
| `bootstrap` | `prompt` | Session bootstrap |
| `turn-loop` | `prompt`, `--max-turns N` | Run conversation loop |
| `flush-transcript` | `prompt` | Persist session |
| `load-session` | `session_id` | Resume session |
| `show-command` | `name` | Details on command |
| `show-tool` | `name` | Details on tool |
| `exec-command` | `name`, `prompt` | Execute command |
| `exec-tool` | `name`, `payload` | Execute tool |

### Rust REPL Commands

```
claw                      # Interactive REPL
claw prompt "ask"        # One-shot
claw login               # OAuth
claw doctor              # Health check
claw init                # Initialize .claude.json
```

### Slash Commands (Rust REPL)

```
/help                    # Show all commands
/status                  # Session status
/model [name]            # Show/set model
/permissions             # Show/set permission
/config [section]        # Show config
/memory                  # Show CLAUDE.md
/diff                    # Git diff
/cost                    # Cost breakdown
/clear                   # Clear conversation
/compact                 # Compact history
/export [path]           # Export conversation
/session [id]            # Resume session
/version                 # Version info
```

---

## 8. เปรียบเทียบกับ Claude Code ต้นฉบับ

### ข้อแตกต่างหลัก

| Feature | Original TypeScript | Claw Code |
|---------|-------------------|-----------|
| **Language** | TypeScript + Node.js | Python + Rust |
| **Tool count** | 20+ | 10+ (MVP) |
| **Commands** | 300+ | 13 (Rust) |
| **Hooks** | Full runtime | Config-only (Rust) |
| **Plugins** | Full plugin system | Not implemented |
| **Skills** | Registry + bundled | Local files only |
| **Performance** | Good | Faster (Rust) |
| **Memory safety** | Garbage collected | Manual/borrow checker |
| **Startup time** | ~500ms | ~100ms (Rust) |

### สิ่งที่ Claw Code มีดีกว่า

✅ **Cleaner codebase** — เขียนใหม่ดังนั้นไม่มี technical debt เก่า
✅ **Memory-safe** — Rust version มี memory safety guarantees
✅ **Faster** — Rust compiled binary
✅ **Open source** — ไม่ขาดชิ้น/ลักษณ์ของการ leak

### สิ่งที่ขาดไป

❌ **Plugin system** — ยังไม่ implement ใน Rust
❌ **Comprehensive tools** — MVP only
❌ **Hook runtime** — Config parsed but not executed
❌ **Full command parity** — ~13/300+ commands

---

## 9. Rust Port Status

### Directory Structure

```
rust/
├── Cargo.toml                    # Workspace manifest
├── Cargo.lock                    # Dependencies lock
└── crates/
    ├── api/                      # Anthropic HTTP client + SSE
    ├── commands/                 # Slash command registry
    ├── compat-harness/          # Tool/prompt extraction from TS
    ├── runtime/                  # Core loop, config, MCP, session
    ├── rusty-claude-cli/        # Main binary (claw)
    └── tools/                    # Built-in tool implementations
```

### Crate Responsibilities

| Crate | Responsibility |
|-------|----------------|
| **api** | HTTP client, SSE parser, auth (API key + OAuth) |
| **commands** | Slash command registry, help generation |
| **compat-harness** | Tool/prompt extraction from TypeScript source |
| **runtime** | `ConversationRuntime` loop, config hierarchy, session persistence, MCP client, system prompt, usage tracking |
| **rusty-claude-cli** | REPL, one-shot, streaming output, tool rendering, argument parsing |
| **tools** | Tool specs + implementations |

### Key Bugs Fixed (Recent)

✅ Prompt mode tools enabled
✅ Default permission mode = DangerFullAccess
✅ Streaming `{}` tool-input prefix bug fixed
✅ Unlimited max_iterations

### Known Issues

⚠️ JSON prompt output not fully clean (pre-JSON human-readable tool-result lines)
⚠️ Hooks config-only (runtime missing)
⚠️ Plugin system absent
⚠️ Skills registry not implemented

### PARITY.md Snapshot

See `PARITY.md` in repo root for detailed gap analysis:
- **Tools**: Partial core only (~60%)
- **Hooks**: Config-only; runtime behavior missing
- **Plugins**: Missing entirely
- **Skills**: Basic local loading only
- **CLI**: Much narrower than TypeScript
- **Assistant/loop**: Strong core, missing orchestration layers
- **Services**: Core foundation; broader ecosystem missing

---

## 10. Concepts ที่ Developer ต้องรู้

### 1. Agent Harness Architecture

```
┌─────────────────────────────────────────┐
│         Anthropic Claude API            │
│  (Message streaming + tool_calls)       │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────▼───────────┐
        │  Tool Execution Loop │
        │  (run_turn_loop)     │
        └──────────┬───────────┘
                   │
      ┌────────────┴────────────┐
      ▼                         ▼
  ┌────────┐         ┌──────────────┐
  │ Tools  │         │   Commands   │
  │ Bash   │         │   /memory    │
  │ File   │         │   /status    │
  │ Web    │         │   etc.       │
  └────────┘         └──────────────┘
      │                     │
      └─────────┬───────────┘
                ▼
        ┌───────────────┐
        │  Permissions  │
        │  Hooks        │
        │  Config       │
        └───────────────┘
```

### 2. Tool Execution Model

```python
# Python: Mirrored metadata only
PortingModule(
    name="BashTool",
    responsibility="Execute shell commands",
    source_hint="tools/BashTool/BashTool.tsx",
    status="mirrored"
)

# Rust: Actual execution
pub enum ToolResult {
    Success { output: String },
    Error { message: String },
    NeedsPermission { tool: String },
}
```

### 3. Session Lifecycle

```
1. Load session (or create new)
   ├── Load .claude.json config
   ├── Parse CLAUDE.md (project memory)
   └── Initialize tools + permissions
   
2. Conversation loop
   ├── User input
   ├── Send to Claude API
   ├── Stream response
   ├── Parse tool_calls
   ├── Execute tools
   ├── Collect results
   └── Next iteration
   
3. Persist session
   ├── Transcript store
   ├── Message history
   ├── Token usage
   └── Compressed state
```

### 4. Permission Model

```rust
pub enum PermissionMode {
    ReadOnly,           // Can only read files
    WorkspaceWrite,     // Read + write workspace files
    DangerFullAccess,   // All tools allowed
}
```

### 5. Config Hierarchy

```
Environment Variables (highest)
    ↑
.claude/settings.local.json
    ↑
.claude.json (project)
    ↑
Defaults (lowest)
```

### 6. Streaming Architecture

```
Anthropic API (SSE)
    ↓
[message_start]
    ↓
[content_block_start]
    ↓
[content_block_delta] (streamed text)
    ↓
[tool_use] (if tool call)
    ↓
[tool_result] (after execution)
    ↓
[message_stop]
    ↓
REPL Display
```

### 7. MCP (Model Context Protocol) Integration

```
.claude.json
├── mcp:
│   ├── servers:
│   │   ├── name: "my-server"
│   │   ├── command: "python my_server.py"
│   │   └── env: { ... }
│   └── resources: [list of available]
│
Rust runtime
├── Spawn stdio server
├── Establish connection
├── Register tools
├── Handle resource requests
└── Stream results
```

### 8. Key Data Structures

#### Python

```python
# Port manifest
@dataclass(frozen=True)
class PortingModule:
    name: str
    responsibility: str
    source_hint: str
    status: str

# Session state
@dataclass
class QueryEnginePort:
    manifest: PortManifest
    session_id: str
    mutable_messages: list[str]
    total_usage: UsageSummary
    transcript_store: TranscriptStore
```

#### Rust

```rust
// Core loop
pub struct ConversationRuntime {
    client: AnthropicClient,
    config: Config,
    session: Session,
    tools: ToolRegistry,
    mcp_client: Option<McpClient>,
}

// Session state
pub struct Session {
    id: String,
    messages: Vec<Message>,
    usage: UsageTracker,
}
```

### 9. Testing Strategy

```bash
# Python
python3 -m unittest discover -s tests -v

# Rust
cd rust/
cargo test --workspace
cargo clippy --workspace --all-targets -- -D warnings
cargo fmt --all
```

### 10. Extension Points

#### Python: PortingBacklog
```python
def build_command_backlog() -> PortingBacklog:
    return PortingBacklog(
        title='Command surface',
        modules=list(PORTED_COMMANDS)
    )
```

#### Rust: Tool Registry
```rust
pub fn mvp_tool_specs() -> Vec<ToolSpec> {
    vec![
        bash_tool_spec(),
        file_read_tool_spec(),
        // Add more tools here
    ]
}
```

---

## Summary Table

| ลักษณะ | Python | Rust |
|------|--------|------|
| **สถานะ** | porting workspace | active CLI |
| **บทบาท** | Reference/snapshot | Production |
| **Tools** | ~900 mirrored entries | 10+ implemented |
| **Commands** | ~300 mirrored | ~13 implemented |
| **ความสมบูรณ์** | High (mapping) | Medium (MVP) |
| **ประสิทธิภาพ** | Moderate | High |
| **ความปลอดภัย** | Good | Excellent |
| **ใช้งาน** | Development/analysis | End-user |

---

## Quick Links & References

- **GitHub**: https://github.com/instructkr/claw-code
- **Discord**: https://instruct.kr/
- **TypeScript archive**: `src/reference_data/` (Python workspace)
- **Parity gap analysis**: `PARITY.md` (repo root)
- **Wall Street Journal feature**: [The Trillion Dollar Race](https://lnkd.in/gs9td3qd)

---

## Getting Started Now

### For Understanding the Architecture

```bash
# Read the parity analysis
cat PARITY.md

# See what's mirrored
python3 -m src.main summary

# Compare tools
python3 -m src.main tools --limit 20
```

### For Running the Rust Implementation

```bash
cd rust/
cargo build --release
./target/release/claw
# Type: ls -la (test bash tool)
# Type: /status (check session)
# Type: /memory (see CLAUDE.md)
```

### For Contributing

1. Clone the repo
2. Read `PARITY.md` for gaps
3. Pick a missing tool/command
4. Implement in Rust (`rust/crates/tools/src/lib.rs`)
5. Test: `cargo test --workspace`
6. Submit PR

---

**Document Created**: 2026-04-16 23:19 UTC
**By**: Jarvis (Agent Exploration System)
**Next Steps**: Implement missing hooks runtime, plugin system, comprehensive command set
