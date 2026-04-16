# Claude Code Harness — Architecture Analysis
**Claw Code: Python Rewrite + Rust Port**

Date: 2026-04-16 | Status: Comprehensive Architecture Overview

---

## บทนำ (Executive Summary)

Claude Code เป็นระบบ Agent Harness ที่ออกแบบมาให้ AI agents ใช้ tools, commands และ skills เพื่อแก้ปัญหา โปรเจกต์ **Claw Code** เป็นการเขียน Clean-room rewrite โดยไม่คัดลอก source จากต้นฉบับ TypeScript ในรูปแบบ:

1. **Python (`src/`)** — porting workspace + CLI orchestration layer
2. **Rust (`rust/`)** — high-performance runtime implementation

ความเป็นไปได้อดทำให้เป็นระบบ **modular agent harness** ที่สามารถส่งต่อได้:
- Tool invocation pipeline ที่ยืดหยุ่น
- Command routing based on semantic matching
- Permission-based tool access control
- Session persistence + context management
- Streaming response handling + cost tracking

---

## ส่วนที่ 1: ภูมิศาสตร์โครงการ (Directory Structure)

### Python Workspace (`src/`)

```
src/
├── main.py                         # CLI entry point + command dispatcher
├── runtime.py                      # PortRuntime class — agent loop orchestration
├── query_engine.py                 # QueryEnginePort — LLM interaction layer
├── commands.py                     # Command registry + routing
├── tools.py                        # Tool registry + filtering
├── permissions.py                  # ToolPermissionContext — access control
├── context.py                      # PortContext — workspace state
├── port_manifest.py                # Manifest generation
├── models.py                       # Dataclasses (Subsystem, PortingModule, etc.)
├── history.py                      # Session history tracking
├── session_store.py                # Session persistence (JSON)
├── transcript.py                   # Message transcript storage
├── execution_registry.py           # Command/tool execution dispatch
├── bootstrap_graph.py              # Startup stage definitions
├── command_graph.py                # Command segmentation analysis
├── setup.py                        # Workspace environment detection
├── tool_pool.py                    # Tool assembly with defaults
├── parity_audit.py                 # TS/Python feature comparison
├── system_init.py                  # System prompt construction
├── direct_modes.py                 # Direct-connect runtime modes
├── remote_runtime.py               # Remote/SSH/Teleport branching
│
├── coordinator/                    # Placeholder for archived coordinator subsystem
├── hooks/                          # Placeholder for archived hooks subsystem
├── assistant/                      # Assistant orchestration
├── bootstrap/                      # Bootstrap utilities
├── cli/                            # CLI subpackages
├── services/                       # Service layer (TBD)
├── skills/                         # Skill definitions
├── state/                          # State management
├── reference_data/                 # Tool/command snapshot JSONs
│   ├── commands_snapshot.json
│   ├── tools_snapshot.json
│   └── subsystems/                 # Archived subsystem metadata
└── [20+ more support modules]
```

### Rust Workspace (`rust/`)

```
rust/
├── Cargo.toml                       # Workspace root
├── Cargo.lock
├── crates/
│   ├── api/                         # HTTP client + OAuth + streaming
│   ├── commands/                    # Slash command registry
│   ├── compat-harness/              # TS manifest extraction
│   ├── runtime/                     # ConversationRuntime core
│   ├── tools/                       # Tool specs + execution
│   └── rusty-claude-cli/            # Main CLI binary (`claw`)
└── README.md
```

---

## ส่วนที่ 2: ขั้นตอนเริ่มต้น (Bootstrap & Initialization)

### Python Bootstrap Flow

```
main.py
  └─> parser = build_parser()
      └─> manifest = build_port_manifest()
          ├─> Scans src/ for Python files
          └─> Returns PortManifest with subsystem summary

  └─> args.command dispatch
      ├─> 'summary'         → QueryEnginePort.render_summary()
      ├─> 'manifest'        → manifest.to_markdown()
      ├─> 'bootstrap'       → PortRuntime.bootstrap_session()
      ├─> 'turn-loop'       → PortRuntime.run_turn_loop()
      └─> ... [17 other commands]
```

### Runtime Initialization (bootstrap_session)

```python
PortRuntime.bootstrap_session(prompt, limit=5):
  1. build_port_context()              # Scan workspace paths
  2. run_setup(trusted=True)           # Detect Python/platform
  3. HistoryLog()                      # Initialize event tracking
  4. QueryEnginePort.from_workspace()  # Build query engine
  5. route_prompt(prompt)              # Token-based command/tool matching
  6. build_execution_registry()        # Load command/tool shims
  7. command_execs, tool_execs         # Execute matched items
  8. engine.stream_submit_message()    # Stream LLM calls
  9. engine.submit_message()           # Final LLM turn
  10. engine.persist_session()         # Save to .port_sessions/
  └─> RuntimeSession (consolidated output)
```

---

## ส่วนที่ 3: นิยมที่เป็นศูนย์กลาง (Core Abstractions)

### 1. PortContext — Workspace State

```python
@dataclass(frozen=True)
class PortContext:
    source_root: Path                  # src/
    tests_root: Path                   # tests/
    assets_root: Path                  # assets/
    archive_root: Path                 # archive/claude_code_ts_snapshot/src/
    python_file_count: int             # Total .py files in src/
    test_file_count: int               # Total test .py files
    asset_file_count: int
    archive_available: bool            # Is TS snapshot present?
```

**จุดประสงค์:** Captures project layout + availability for any point in the runtime.

---

### 2. PortingModule — Registry Entry

```python
@dataclass(frozen=True)
class PortingModule:
    name: str                          # e.g., "BashTool", "EditCommand"
    responsibility: str                # What it does
    source_hint: str                   # Where it came from (ts/src/tools/...)
    status: str                        # 'planned', 'mirrored', 'complete'
```

**จุดประสงค์:** Represents a single command or tool with provenance + status.

Loaded from JSON snapshots:
- `reference_data/commands_snapshot.json` → PORTED_COMMANDS
- `reference_data/tools_snapshot.json` → PORTED_TOOLS

---

### 3. ToolPermissionContext — Access Control

```python
@dataclass(frozen=True)
class ToolPermissionContext:
    deny_names: frozenset[str]         # e.g., {"bash", "write"}
    deny_prefixes: tuple[str, ...]     # e.g., ("mcp", "exec")

    def blocks(self, tool_name: str) -> bool:
        # Returns True if tool is denied
```

**จุดประสงค์:** Implements permission policy that blocks named tools or prefixes. 
Used to filter tool registry before submission.

---

### 4. QueryEnginePort — LLM Interaction

```python
@dataclass
class QueryEnginePort:
    manifest: PortManifest             # Metadata registry
    config: QueryEngineConfig          # Turn limits, budget, etc.
    session_id: str                    # Unique session identifier
    mutable_messages: list[str]        # Conversation history
    permission_denials: list[...]      # Tracked permission blocks
    total_usage: UsageSummary          # Token counter
    transcript_store: TranscriptStore  # Message log

class TurnResult:
    prompt: str                        # User input
    output: str                        # LLM response
    matched_commands: tuple[str, ...]  # Routed commands
    matched_tools: tuple[str, ...]     # Routed tools
    permission_denials: tuple[...]     # Denied tool attempts
    usage: UsageSummary                # Tokens used in turn
    stop_reason: str                   # 'completed', 'max_turns_reached', etc.
```

**Methods:**
- `submit_message(prompt, matched_commands, matched_tools, denied_tools)` → TurnResult
- `stream_submit_message(...)` → Iterator[dict] (streaming events)
- `persist_session()` → Path (saves to .port_sessions/)
- `compact_messages_if_needed()` → None (conversation compaction)

---

### 5. PortRuntime — Agent Loop Orchestrator

```python
class PortRuntime:
    def route_prompt(prompt: str, limit=5) -> list[RoutedMatch]:
        # Token-based semantic matching against command/tool names
        # Returns ranked matches: [RoutedMatch(kind, name, score, hint), ...]

    def bootstrap_session(prompt: str, limit=5) -> RuntimeSession:
        # Full agent startup + one turn execution
        # Returns: RuntimeSession with context, setup, history, turn result

    def run_turn_loop(prompt, limit=5, max_turns=3, ...) -> list[TurnResult]:
        # Multi-turn conversation loop
```

**Responsibilities:**
1. Match user prompts to available commands/tools
2. Execute matched items via `ExecutionRegistry`
3. Coordinate with `QueryEnginePort` for LLM calls
4. Track history + permissions
5. Persist sessions

---

### 6. RoutedMatch — Routing Result

```python
@dataclass(frozen=True)
class RoutedMatch:
    kind: str                          # 'command' or 'tool'
    name: str                          # Module name
    source_hint: str                   # Provenance
    score: int                         # Match confidence (0-100+)
```

**Scoring Logic:**
- Splits prompt on `/`, `-`, whitespace → tokens
- Searches PORTED_COMMANDS + PORTED_TOOLS for matches
- Returns top-N by score

---

### 7. ExecutionRegistry — Shim Dispatcher

```python
class ExecutionRegistry:
    def command(name: str) -> CommandShim | None
    def tool(name: str) -> ToolShim | None

class CommandShim:
    def execute(prompt: str) -> str:
        # Execute mirrored command (currently a stub)

class ToolShim:
    def execute(payload: str) -> str:
        # Execute mirrored tool (currently a stub)
```

**Current state:** Shims return messages indicating what *would* execute.

---

## ส่วนที่ 4: Agent Loop Mechanics (Query Engine)

### Turn Submission Flow

```
QueryEnginePort.submit_message(prompt, matched_commands, matched_tools, denied_tools)
  │
  ├─ 1. Check max_turns limit
  │      └─ If reached → return TurnResult(stop_reason='max_turns_reached')
  │
  ├─ 2. Format output with:
  │      ├─ Prompt text
  │      ├─ Matched commands
  │      ├─ Matched tools
  │      └─ Permission denial count
  │
  ├─ 3. Project token usage:
  │      ├─ Add turn tokens (rough word count)
  │      └─ Check max_budget_tokens
  │      └─ If exceeded → stop_reason='max_budget_reached'
  │
  ├─ 4. Append to mutable_messages
  ├─ 5. Append to transcript_store
  ├─ 6. Update total_usage
  │
  ├─ 7. Compact messages if needed
  │      └─ Triggered after compact_after_turns
  │      └─ Collapses older turns into summary
  │
  └─ 8. Return TurnResult
```

### Streaming Submission

```
QueryEnginePort.stream_submit_message(...) -> Iterator[dict]:
  Yields events like:
    {'type': 'prompt_submitted', 'text': '...'}
    {'type': 'command_routed', 'names': [...]}
    {'type': 'tool_routed', 'names': [...]}
    {'type': 'permission_denied', 'tool': '...'}
    {'type': 'turn_complete', 'output': '...'}
```

---

## ส่วนที่ 5: Command & Tool Registries

### Command Registry (commands.py)

```python
PORTED_COMMANDS: tuple[PortingModule, ...]
  ├─ Loaded from reference_data/commands_snapshot.json
  ├─ ~50+ mirrored commands
  └─ Examples:
       - recap      (session orientation)
       - rrr        (retrospective/wrap-up)
       - learn      (codebase exploration)
       - dig        (session timeline)
       - forward    (handoff preparation)
       - talk-to    (agent communication)
       - trace      (project search)
       - who-are-you (identity check)
       - ... [50+ more]

Functions:
  get_command(name) → PortingModule | None
  get_commands(include_plugin, include_skill) → tuple[PortingModule, ...]
  find_commands(query, limit) → list[PortingModule]
  execute_command(name, prompt) → CommandExecution
```

### Tool Registry (tools.py)

```python
PORTED_TOOLS: tuple[PortingModule, ...]
  ├─ Loaded from reference_data/tools_snapshot.json
  ├─ ~60+ mirrored tools
  └─ Examples:
       - BashTool, ReadFile, WriteFile, EditFile
       - GlobSearch, GrepSearch
       - WebSearch, WebFetch
       - TodoWrite, NotebookEdit
       - Skill, Agent, Config
       - PowerShell, REPL
       - MCP-related tools
       - ... [60+ more]

Functions:
  get_tools(simple_mode, include_mcp, permission_context) → tuple[...]
  get_tool(name) → PortingModule | None
  filter_tools_by_permission_context(...) → tuple[...]
  execute_tool(name, payload) → ToolExecution
```

---

## ส่วนที่ 6: Command & Tool Execution

### Command Execution Stub

```python
@dataclass(frozen=True)
class CommandExecution:
    name: str                          # Module name
    source_hint: str                   # Where from
    prompt: str                        # Input
    handled: bool                      # Was it recognized?
    message: str                       # Stub output

execute_command(name: str, prompt: str) -> CommandExecution:
    module = get_command(name)
    if module is None:
        return CommandExecution(..., handled=False, message='Unknown command')
    return CommandExecution(..., handled=True, message=f"Would execute {name}")
```

---

### Tool Execution Stub

```python
@dataclass(frozen=True)
class ToolExecution:
    name: str                          # Module name
    source_hint: str
    payload: str                       # JSON/string input
    handled: bool
    message: str

execute_tool(name: str, payload: str) -> ToolExecution:
    module = get_tool(name)
    if module is None:
        return ToolExecution(..., handled=False, message='Unknown tool')
    return ToolExecution(..., handled=True, message=f"Would execute {name}")
```

---

## ส่วนที่ 7: Session Persistence

### Session Storage (session_store.py)

```python
@dataclass(frozen=True)
class StoredSession:
    session_id: str                    # UUID hex
    messages: tuple[str, ...]          # Conversation history
    input_tokens: int                  # Tracked usage
    output_tokens: int

def save_session(session, directory=None) -> Path:
    # Writes to directory/.port_sessions/{session_id}.json

def load_session(session_id, directory=None) -> StoredSession:
    # Reads from .port_sessions/{session_id}.json
```

### Transcript Store (transcript.py)

```python
@dataclass
class TranscriptStore:
    entries: list[str]                 # Message strings
    flushed: bool                      # Persisted?

    def append(message: str) -> None
    def as_text() -> str
```

---

## ส่วนที่ 8: Placeholder Subsystems

These are **Python packages that exist to mirror archived TypeScript subsystems**:

### coordinator/
- Purpose: Task coordination + orchestration layer
- Status: Package placeholder with `__init__.py`
- Archive metadata: `reference_data/subsystems/coordinator.json`
- TS equivalent: ~20+ coordinating modules

### hooks/
- Purpose: PreToolUse, PostToolUse, result hooks
- Status: Config parsing only (no execution)
- Archive metadata: `reference_data/subsystems/hooks.json`
- TS equivalent: Hook machinery in services/tools/

### Other placeholders:
- assistant/ (assistant orchestration)
- bootstrap/ (startup utilities)
- plugins/ (plugin system - absent in Rust too)
- skills/ (skill registry)

---

## ส่วนที่ 9: Rust Port Architecture

### Crate Structure

```
Rust Workspace (6 crates)

┌─ api/                    (HTTP + OAuth + Streaming)
│  ├─ Anthropic API client
│  ├─ OAuth token management
│  ├─ SSE stream parser
│  └─ Request/response types
│
├─ commands/               (Slash Command Registry)
│  ├─ /help, /status, /config, /model, etc.
│  ├─ Command help text generation
│  └─ Permission introspection
│
├─ compat-harness/         (TypeScript Compatibility)
│  ├─ Extracts manifests from TS snapshot
│  ├─ Tool spec generation
│  └─ Prompt manifest building
│
├─ runtime/                (Core Conversation Loop)
│  ├─ ConversationRuntime (agent loop)
│  ├─ ConfigLoader (config hierarchy)
│  ├─ Session persistence
│  ├─ Permission policy
│  ├─ MCP client lifecycle
│  ├─ System prompt assembly
│  └─ Usage tracking
│
├─ tools/                  (Built-in Tool Implementations)
│  ├─ BashTool
│  ├─ ReadFile, WriteFile, EditFile
│  ├─ GlobSearch, GrepSearch
│  ├─ WebSearch, WebFetch
│  ├─ TodoWrite, NotebookEdit
│  ├─ Agent, Config, Skill
│  └─ PowerShell, REPL
│
└─ rusty-claude-cli/       (Main Binary: `claw`)
   ├─ REPL (rustyline)
   ├─ One-shot prompt mode
   ├─ Streaming display
   ├─ Tool call rendering
   └─ CLI argument parsing
```

### Rust Runtime Concept

```
ConversationRuntime:
  ├─ session: Session (ID, messages, tokens)
  ├─ config: ConfigLoader (hierarchical settings)
  ├─ permissions: PermissionPolicy
  ├─ mcp_client: MCPLifecycle
  ├─ api_client: AnthropicAPI
  │
  └─ agent_loop(user_input: &str):
       1. Route prompt → matched tools
       2. Check permissions → deny list
       3. Format system prompt + context
       4. Call API (streaming)
       5. Execute tools (streaming)
       6. Accumulate response
       7. Store in session
       8. Return TurnResult
```

---

## ส่วนที่ 10: Parity Status (Python vs TS Original)

### Full Parity ✅
- Command metadata registry
- Tool metadata registry
- Session persistence basics
- Permission filtering

### Partial Parity ⚠️
- Query engine (Python = stub, TS = full LLM integration)
- Tool execution (Python = stub shims, Rust = ~15 tools)
- Hooks (Python config-only, Rust config-only)

### Missing in Python 🔴
- Actual LLM API calls (would use Anthropic SDK)
- Real tool execution (would call bash, file system, etc.)
- Plugin system
- Full hook execution pipeline

### Missing in Rust 🔴
- ~45 tools (Agent, MCP, Schedule, Task, Team, etc.)
- Plugin system
- Hook execution
- Full CLI breadth

### Stats
- **Python modules:** 36 top-level .py files
- **Rust crates:** 6
- **Rust LOC:** ~20K
- **Mirrored commands:** 50+
- **Mirrored tools:** 60+

---

## ส่วนที่ 11: Data Flow Diagrams

### Full Agent Loop (Python)

```
┌─────────────────────────────────────────────────────────────────┐
│                      main.py (CLI Entry)                        │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
         ┌──────────────────────────────────┐
         │   build_port_manifest()          │
         │   (Scan src/ for Python files)   │
         └────────────┬─────────────────────┘
                      │
                      ▼
         ┌──────────────────────────────────┐
         │   Parse command-line args        │
         │   (e.g., "turn-loop", "summary")│
         └────────────┬─────────────────────┘
                      │
         ┌────────────┴───────────┬───────────┬──────────┐
         │                        │           │          │
         ▼                        ▼           ▼          ▼
    summary      manifest    bootstrap   turn-loop   ...
         │                        │           │
         ▼                        ▼           ▼
  Markdown       Manifest    RuntimeSession  [loop]
  Summary        Text        (with context,
                            setup, history)
```

### Turn Loop Execution (Detailed)

```
PortRuntime.run_turn_loop(prompt, max_turns=3)
  │
  ├─ Turn 1:
  │  ├─ route_prompt(prompt)
  │  │  └─ Token matching → [RoutedMatch, ...]
  │  ├─ build_execution_registry()
  │  │  └─ Load command/tool shims
  │  ├─ Execute matched items (stubs)
  │  ├─ engine.submit_message(
  │  │    matched_commands=...,
  │  │    matched_tools=...,
  │  │    denied_tools=...
  │  │  )
  │  │  └─ TurnResult(output, stop_reason, ...)
  │  └─ Accumulate to history
  │
  ├─ Turn 2: [repeat]
  ├─ Turn 3: [repeat]
  │
  └─ Return [TurnResult, TurnResult, TurnResult]
```

### Tool/Command Filtering Pipeline

```
get_tools(...):
  1. Start with PORTED_TOOLS (tuple, ~60 items)
  2. If simple_mode: filter to {BashTool, ReadFile, WriteFile}
  3. If not include_mcp: remove tools with "mcp" in name/hint
  4. If permission_context exists:
     └─ filter_tools_by_permission_context(...)
     └─ Remove denied names + prefixes
  5. Return filtered tuple

get_commands(...):
  1. Start with PORTED_COMMANDS (tuple, ~50 items)
  2. If not include_plugin_commands: remove "plugin" commands
  3. If not include_skill_commands: remove "skills" commands
  4. Return filtered tuple
```

---

## ส่วนที่ 12: CLI Command Reference

### Python CLI Commands (via main.py)

```bash
# Informational
python3 -m src.main summary                    # Markdown summary
python3 -m src.main manifest                   # Workspace manifest
python3 -m src.main subsystems --limit 16      # Module list
python3 -m src.main commands --limit 10        # Command registry
python3 -m src.main tools --limit 10           # Tool registry
python3 -m src.main parity-audit               # TS vs Python comparison
python3 -m src.main setup-report               # Env detection

# Networking
python3 -m src.main command-graph              # Command segments
python3 -m src.main tool-pool                  # Assembled tools
python3 -m src.main bootstrap-graph            # Startup stages

# Execution
python3 -m src.main route "prompt here"        # Route to commands/tools
python3 -m src.main bootstrap "prompt"         # One-shot bootstrap
python3 -m src.main turn-loop "prompt" \
         --max-turns 3 \
         --structured-output               # Multi-turn loop

# Session Management
python3 -m src.main flush-transcript "msg"     # Save session
python3 -m src.main load-session <session-id>  # Load session

# Remote Modes
python3 -m src.main remote-mode <target>       # Remote branching
python3 -m src.main ssh-mode <target>
python3 -m src.main teleport-mode <target>
python3 -m src.main direct-connect-mode <target>
python3 -m src.main deep-link-mode <target>

# Inspection
python3 -m src.main show-command <name>        # Show command details
python3 -m src.main show-tool <name>           # Show tool details
python3 -m src.main exec-command <name> "prompt"  # Execute shim
python3 -m src.main exec-tool <name> '{"payload"}'
```

### Rust CLI Commands (via `claw`)

```bash
# REPL mode
claw

# One-shot
claw prompt "analyze this code"

# Auth
claw login
claw logout

# Config
claw init
claw doctor

# Self-update
claw self-update
```

---

## ส่วนที่ 13: Configuration & Hooks

### Configuration Hierarchy (Rust)

```
1. Workspace defaults
2. ~/.claude/settings.json (global user)
3. .claude.json (project-specific)
4. .claude/settings.local.json (machine-local override)
5. Environment variables (ANTHROPIC_API_KEY, etc.)
```

### Hook Configuration (Config-Only)

Both Python and Rust support hook *configuration* but don't execute:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "tool": "BashTool",
        "action": "deny"
      }
    ],
    "PostToolUse": [
      {
        "tool": "*",
        "action": "log"
      }
    ]
  }
}
```

**Status:** Parsed but not executed in runtime loop.

---

## ส่วนที่ 14: Key Design Principles

### 1. Modularity via Snapshot JSONs
- Commands/tools are mirrored from TS via **JSON snapshots**
- No coupling to actual implementation
- Easy to update registry without code changes
- Supports multi-version compatibility

### 2. Permission-First Design
- Tools explicitly filtered by `ToolPermissionContext`
- Deny lists (names) + deny prefixes (wildcard)
- Checked before LLM submission
- Logged to `TurnResult.permission_denials`

### 3. Session as First-Class
- Every interaction has a `session_id`
- Messages persisted to JSON on demand
- Sessions loadable for resume
- Usage tracking built-in

### 4. Routing via Token Matching
- Prompts tokenized (split on `/`, `-`, space)
- Matched against command/tool names + hints
- Scoring by match frequency
- No LLM needed for routing (fast)

### 5. Streaming-Ready Architecture
- `submit_message()` → single turn
- `stream_submit_message()` → yields events
- Consumable by UI/terminal without blocking
- Cost per event tracked

### 6. Archive-Aware
- Can detect TS snapshot availability
- Parity audit compares feature surfaces
- Allows gradual Python→Rust port without breaking existing workflows

---

## ส่วนที่ 15: Extension Points

### How to Add a New Command

1. Add entry to `reference_data/commands_snapshot.json`:
   ```json
   {
     "name": "my-command",
     "responsibility": "Does something cool",
     "source_hint": "src/commands/mycommand.py"
   }
   ```

2. Create `CommandShim` in `ExecutionRegistry`

3. Call via: `execute_command("my-command", prompt)`

### How to Add a New Tool

1. Add entry to `reference_data/tools_snapshot.json`:
   ```json
   {
     "name": "MyTool",
     "responsibility": "Executes something",
     "source_hint": "src/tools/mytool.py"
   }
   ```

2. Create `ToolShim` in `ExecutionRegistry`

3. Filter via `ToolPermissionContext` if needed

4. Call via: `execute_tool("MyTool", payload)`

### Extending Rust Runtime

1. Add crate under `rust/crates/`
2. Implement tool via `Tool` trait
3. Register in `runtime/src/conversation.rs`
4. Add slash command in `commands/src/lib.rs`

---

## ส่วนที่ 16: Testing & Verification

### Python Testing

```bash
python3 -m unittest discover -s tests -v
```

Covers:
- Manifest generation
- Command/tool loading
- Permission filtering
- Session persistence
- Routing logic

### Rust Testing

```bash
cd rust/
cargo test --workspace
```

Covers:
- API client
- Config loading
- Tool execution
- Session handling

---

## ส่วนที่ 17: Deployment & Usage

### Python Workspace (Development)

```bash
# Inside repository root:
python3 -m src.main summary        # See what's ported
python3 -m src.main turn-loop "debug this" --max-turns 1
```

### Rust CLI (Production)

```bash
cd rust/
cargo build --release
./target/release/claw prompt "what's in this repo?"
./target/release/claw              # REPL
```

---

## ส่วนที่ 18: Architecture Decisions

### ✅ Why JSON Snapshots?

- **Decoupling:** Registry independent of implementation
- **Versioning:** Easy to track which commands/tools existed
- **Comparison:** Supports parity audits
- **Distribution:** Can ship without full source

### ✅ Why Token-Based Routing?

- **Speed:** No LLM call needed
- **Determinism:** Same prompt always routes same way
- **Simplicity:** Works offline
- **Fallback:** For when LLM integration not available

### ✅ Why Separate Python + Rust?

- **Experimentation:** Python for rapid iteration
- **Production:** Rust for performance + safety
- **Compatibility:** Both understand same registry format
- **Migration:** Rust port can follow Python port

### ✅ Why Permission Context Over Global Allow/Deny?

- **Composition:** Multiple policy objects can be combined
- **Filtering:** Applied late in pipeline
- **Auditability:** Every denial logged
- **Flexibility:** Can change per-turn if needed

---

## ส่วนที่ 19: Future Work

### Python Side

- [ ] Integrate Anthropic Python SDK for real LLM calls
- [ ] Implement command/tool execution (not stubs)
- [ ] Complete hook execution pipeline
- [ ] Plugin system
- [ ] Cost tracking integration
- [ ] Extended thinking blocks

### Rust Side

- [ ] Implement missing ~45 tools
- [ ] Hook execution
- [ ] Plugin system
- [ ] Voice input/output
- [ ] Advanced MCP features
- [ ] Distributed agent orchestration

### Both

- [ ] Structured output format
- [ ] Multi-model support
- [ ] Eval framework
- [ ] Comprehensive logging
- [ ] Performance profiling

---

## ส่วนที่ 20: Summary Table

| Layer | Python | Rust | Status |
|-------|--------|------|--------|
| **CLI** | `main.py` (17 commands) | `rusty-claude-cli` REPL | Complementary |
| **Registry** | JSON snapshots (50+ commands, 60+ tools) | Generated from TS | Synchronized |
| **Routing** | Token matching | (In runtime) | Working |
| **Permissions** | `ToolPermissionContext` | Permission policy | Implemented |
| **Session** | JSON files + `TranscriptStore` | In-memory + file | Partial |
| **Tools** | Stubs | 15 implemented | Growing |
| **Commands** | Stub dispatch | Slash commands | Growing |
| **Hooks** | Config-only | Config-only | Planned |
| **Plugins** | Absent | Absent | Planned |
| **LLM Integration** | Not yet | Streaming via API | Rust ready |

---

## สรุป (Conclusion)

**Claw Code** คือการเขียนใหม่อย่าง clean-room ของ Claude Code's agent harness ออกแบบให้เป็น **modular, permission-aware, session-persistent** system สำหรับการทำงานของ AI agents.

**Python workspace** ให้ความเยื่อยหยุ่นในการพัฒนาและสำรวจ registry structures, while **Rust port** มุ่งเน้นไปยังสำเร็จสูงและประสิทธิภาพสำหรับ production workloads.

ทั้งสองตัวใช้ **JSON snapshot registries** เป็นแกนกลาง ทำให้สามารถ **track parity** ระหว่างเวอร์ชัน TypeScript ต้นฉบับและ rewrites ทั้งสองตัว ได้อย่างชัดเจน.

---

**Document compiled:** 2026-04-16 at 2319 UTC  
**Codebase status:** Active porting + Rust implementation in progress  
**Last TS source date:** 2026-04-01 (public snapshot)
