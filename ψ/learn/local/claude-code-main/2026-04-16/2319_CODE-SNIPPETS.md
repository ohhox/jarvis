# Claw Code — Python Rewrite of Claude Code Agent Harness

**วันที่**: 2026-04-16
**โปรเจกต์**: Python port of Claude Code runtime/harness
**สภาพ**: ยังอยู่ในขั้นตอน porting จาก TypeScript

---

## 1. Main Entry Point — src/main.py

### Overview
`main()` function เป็น CLI parser ที่กำหนดทุก subcommand ของ Claude Code porting workspace

```python
def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    manifest = build_port_manifest()
    
    # Routes to different command handlers based on args.command
    if args.command == 'summary':
        print(QueryEnginePort(manifest).render_summary())
        return 0
    if args.command == 'tools':
        permission_context = ToolPermissionContext.from_iterables(args.deny_tool, args.deny_prefix)
        tools = get_tools(simple_mode=args.simple_mode, include_mcp=not args.no_mcp, 
                         permission_context=permission_context)
        ...
```

**ที่ไฟล์**: `src/main.py`, lines 94-209

**สิ่งที่ทำ**:
- สร้าง argument parser ด้วย subparsers สำหรับแต่ละ command mode
- เลือก execution path ตามชนิด command
- Return exit code (0 สำเร็จ, 1/2 สำหรับ error)

**ทำไมมาคัตท์**:
- เป็น orchestrator ที่เชื่อมทุก subsystem (manifest, runtime, query engine, tools)
- แสดง pattern ของ "routing" — หา command/tool ที่เหมาะสมตามชนิด request

---

## 2. Core Agent Loop — src/runtime.py

### PortRuntime Class — Smart Routing & Session Management

```python
class PortRuntime:
    def route_prompt(self, prompt: str, limit: int = 5) -> list[RoutedMatch]:
        """ค้นหา commands/tools ที่ match กับ prompt"""
        tokens = {token.lower() for token in prompt.replace('/', ' ').replace('-', ' ').split() 
                 if token}
        by_kind = {
            'command': self._collect_matches(tokens, PORTED_COMMANDS, 'command'),
            'tool': self._collect_matches(tokens, PORTED_TOOLS, 'tool'),
        }
        
        # Select best from each kind, then fill with leftovers
        selected: list[RoutedMatch] = []
        for kind in ('command', 'tool'):
            if by_kind[kind]:
                selected.append(by_kind[kind].pop(0))
        
        leftovers = sorted([match for matches in by_kind.values() for match in matches],
                          key=lambda item: (-item.score, item.kind, item.name))
        selected.extend(leftovers[: max(0, limit - len(selected))])
        return selected[:limit]
    
    @staticmethod
    def _score(tokens: set[str], module: PortingModule) -> int:
        """Token-based scoring: บอกว่า token ของ prompt ตรงกับ module metadata กี่อัน"""
        haystacks = [module.name.lower(), module.source_hint.lower(), 
                     module.responsibility.lower()]
        score = 0
        for token in tokens:
            if any(token in haystack for haystack in haystacks):
                score += 1
        return score
```

**ที่ไฟล์**: `src/runtime.py`, lines 90-192

**สิ่งที่ทำ**:
- **Token-based matching**: แยก prompt เป็น tokens แล้วหา commands/tools ที่มี tokens ตรงกัน
- **Scoring algorithm**: นับจำนวน token matches หา "score"
- **Multi-kind balancing**: เลือกสิ่งที่ดีที่สุดจาก command และ tool แล้วอื่นๆ
- **Return limited results**: จำกัดจำนวน results ตามพารามิเตอร์ limit

**ทำไมมาคัตท์**:
- เป็นแกนของการ agent loop — บอกว่าควร execute อะไร
- Pattern ของ "multi-turn routing" — ทำได้ทุก turn ของ conversation

### RuntimeSession — Bootstrap & Execute Full Interaction

```python
def bootstrap_session(self, prompt: str, limit: int = 5) -> RuntimeSession:
    """สร้าง complete session context + execute commands/tools + persist"""
    context = build_port_context()
    setup_report = run_setup(trusted=True)
    setup = setup_report.setup
    history = HistoryLog()
    engine = QueryEnginePort.from_workspace()
    
    # Log initial state
    history.add('context', f'python_files={context.python_file_count}, '
                          f'archive_available={context.archive_available}')
    history.add('registry', f'commands={len(PORTED_COMMANDS)}, tools={len(PORTED_TOOLS)}')
    
    # Route + execute
    matches = self.route_prompt(prompt, limit=limit)
    registry = build_execution_registry()
    command_execs = tuple(registry.command(match.name).execute(prompt) 
                         for match in matches if match.kind == 'command' 
                         and registry.command(match.name))
    tool_execs = tuple(registry.tool(match.name).execute(prompt) 
                      for match in matches if match.kind == 'tool' 
                      and registry.tool(match.name))
    
    # Stream + execute query engine turn
    denials = tuple(self._infer_permission_denials(matches))
    stream_events = tuple(engine.stream_submit_message(
        prompt, matched_commands=..., matched_tools=..., denied_tools=denials))
    turn_result = engine.submit_message(...)
    
    # Persist session
    persisted_session_path = engine.persist_session()
    history.add('session_store', persisted_session_path)
    
    return RuntimeSession(
        prompt=prompt, context=context, setup=setup, setup_report=setup_report,
        system_init_message=build_system_init_message(trusted=True),
        history=history, routed_matches=matches, turn_result=turn_result,
        command_execution_messages=command_execs, tool_execution_messages=tool_execs,
        stream_events=stream_events, persisted_session_path=persisted_session_path,
    )
```

**ที่ไฟล์**: `src/runtime.py`, lines 109-152

**สิ่งที่ทำ**:
- สร้าง execution context (workspace setup, history tracking)
- Route prompt → match commands/tools
- Execute matched items ผ่าน registry
- Stream events + submit to query engine
- Persist session state เพื่อ resume ทีหลัง

**ทำไมมาคัตท์**:
- เป็น "session orchestrator" — ประสานให้ทีม AI agents ทำงานได้ตั้งแต่ bootstrap จนถึง persist
- แสดง pattern ของ "multi-step workflow" ที่ต้อง preserve state

---

## 3. Tool System — src/tools.py & src/Tool.py

### Tool Definition & Registration

```python
# src/Tool.py
@dataclass(frozen=True)
class ToolDefinition:
    name: str
    purpose: str

DEFAULT_TOOLS = (
    ToolDefinition('port_manifest', 'Summarize the active Python workspace'),
    ToolDefinition('query_engine', 'Render a Python-first porting summary'),
)
```

**ที่ไฟล์**: `src/Tool.py`, lines 6-15

### Tool Loading & Filtering

```python
@lru_cache(maxsize=1)
def load_tool_snapshot() -> tuple[PortingModule, ...]:
    """โหลด tools จาก JSON snapshot file — cached"""
    raw_entries = json.loads(SNAPSHOT_PATH.read_text())
    return tuple(
        PortingModule(
            name=entry['name'],
            responsibility=entry['responsibility'],
            source_hint=entry['source_hint'],
            status='mirrored',
        )
        for entry in raw_entries
    )

PORTED_TOOLS = load_tool_snapshot()  # Singleton

def get_tools(
    simple_mode: bool = False,
    include_mcp: bool = True,
    permission_context: ToolPermissionContext | None = None,
) -> tuple[PortingModule, ...]:
    """ดึง tools ตามเงื่อนไข simple_mode, MCP, permissions"""
    tools = list(PORTED_TOOLS)
    
    # Filter by mode
    if simple_mode:
        tools = [module for module in tools 
                if module.name in {'BashTool', 'FileReadTool', 'FileEditTool'}]
    
    # Filter by MCP
    if not include_mcp:
        tools = [module for module in tools 
                if 'mcp' not in module.name.lower() 
                and 'mcp' not in module.source_hint.lower()]
    
    return filter_tools_by_permission_context(tuple(tools), permission_context)
```

**ที่ไฟล์**: `src/tools.py`, lines 23-72

**สิ่งที่ทำ**:
- **Snapshot loading**: โหลด tool definitions จาก archive JSON file แล้วแคชไว้
- **LRU caching**: ทำให้ repeated calls ไม่ต้องอ่านไฟล์ซ้ำ
- **Permission-based filtering**: กำจัด tools ที่ user denied

**ทำไมมาคัตท์**:
- Pattern of "frozen module definitions" — immutable, cached registry
- Permission system ที่ declarative (tell me what to deny, not what to allow)

### Tool Execution

```python
def execute_tool(name: str, payload: str = '') -> ToolExecution:
    """ค้นหา tool แล้วจำลอง execute"""
    module = get_tool(name)
    if module is None:
        return ToolExecution(name=name, source_hint='', payload=payload, 
                           handled=False, message=f'Unknown mirrored tool: {name}')
    
    action = f"Mirrored tool '{module.name}' from {module.source_hint} would handle payload {payload!r}."
    return ToolExecution(name=module.name, source_hint=module.source_hint, 
                        payload=payload, handled=True, message=action)
```

**ที่ไฟล์**: `src/tools.py`, lines 81-86

---

## 4. Query Engine — src/query_engine.py

### QueryEnginePort — Message Submit & State Management

```python
@dataclass
class QueryEnginePort:
    manifest: PortManifest
    config: QueryEngineConfig = field(default_factory=QueryEngineConfig)
    session_id: str = field(default_factory=lambda: uuid4().hex)
    mutable_messages: list[str] = field(default_factory=list)
    permission_denials: list[PermissionDenial] = field(default_factory=list)
    total_usage: UsageSummary = field(default_factory=UsageSummary)
    transcript_store: TranscriptStore = field(default_factory=TranscriptStore)
    
    @classmethod
    def from_workspace(cls) -> 'QueryEnginePort':
        """สร้าง engine สำหรับ current workspace"""
        return cls(manifest=build_port_manifest())
    
    @classmethod
    def from_saved_session(cls, session_id: str) -> 'QueryEnginePort':
        """โหลด engine จาก persisted session"""
        stored = load_session(session_id)
        transcript = TranscriptStore(entries=list(stored.messages), flushed=True)
        return cls(
            manifest=build_port_manifest(),
            session_id=stored.session_id,
            mutable_messages=list(stored.messages),
            total_usage=UsageSummary(stored.input_tokens, stored.output_tokens),
            transcript_store=transcript,
        )
```

**ที่ไฟล์**: `src/query_engine.py`, lines 36-59

### Message Submission Loop

```python
def submit_message(
    self,
    prompt: str,
    matched_commands: tuple[str, ...] = (),
    matched_tools: tuple[str, ...] = (),
    denied_tools: tuple[PermissionDenial, ...] = (),
) -> TurnResult:
    """ส่ง message และ track usage/state"""
    
    # Check turn limit
    if len(self.mutable_messages) >= self.config.max_turns:
        output = f'Max turns reached before processing prompt: {prompt}'
        return TurnResult(
            prompt=prompt, output=output, matched_commands=matched_commands,
            matched_tools=matched_tools, permission_denials=denied_tools,
            usage=self.total_usage, stop_reason='max_turns_reached',
        )
    
    # Format output
    summary_lines = [
        f'Prompt: {prompt}',
        f'Matched commands: {", ".join(matched_commands) if matched_commands else "none"}',
        f'Matched tools: {", ".join(matched_tools) if matched_tools else "none"}',
        f'Permission denials: {len(denied_tools)}',
    ]
    output = self._format_output(summary_lines)
    
    # Track usage (projected)
    projected_usage = self.total_usage.add_turn(prompt, output)
    stop_reason = 'completed'
    if projected_usage.input_tokens + projected_usage.output_tokens > self.config.max_budget_tokens:
        stop_reason = 'max_budget_reached'
    
    # Update state
    self.mutable_messages.append(prompt)
    self.transcript_store.append(prompt)
    self.permission_denials.extend(denied_tools)
    self.total_usage = projected_usage
    self.compact_messages_if_needed()
    
    return TurnResult(
        prompt=prompt, output=output, matched_commands=matched_commands,
        matched_tools=matched_tools, permission_denials=denied_tools,
        usage=self.total_usage, stop_reason=stop_reason,
    )
```

**ที่ไฟล์**: `src/query_engine.py`, lines 61-104

**สิ่งที่ทำ**:
- รับ prompt + metadata (matched commands/tools, denied tools)
- Check constraint (max turns, max budget)
- Track message history + usage
- Compact old messages เมื่อเกินขีด
- Return structured result พร้อม stop reason

**ทำไมมาคัตท์**:
- Central decision-making point — ควรหยุด loop หรือ continue?
- State mutation pattern — mutable history ที่ต้อง manage อย่างระวัง

### Stream Events

```python
def stream_submit_message(
    self,
    prompt: str,
    matched_commands: tuple[str, ...] = (),
    matched_tools: tuple[str, ...] = (),
    denied_tools: tuple[PermissionDenial, ...] = (),
):
    """ส่ง message ที่จำลอง streaming events"""
    yield {'type': 'message_start', 'session_id': self.session_id, 'prompt': prompt}
    if matched_commands:
        yield {'type': 'command_match', 'commands': matched_commands}
    if matched_tools:
        yield {'type': 'tool_match', 'tools': matched_tools}
    if denied_tools:
        yield {'type': 'permission_denial', 'denials': [denial.tool_name for denial in denied_tools]}
    
    result = self.submit_message(prompt, matched_commands, matched_tools, denied_tools)
    yield {'type': 'message_delta', 'text': result.output}
    yield {
        'type': 'message_stop',
        'usage': {'input_tokens': result.usage.input_tokens, 'output_tokens': result.usage.output_tokens},
        'stop_reason': result.stop_reason,
        'transcript_size': len(self.transcript_store.entries),
    }
```

**ที่ไฟล์**: `src/query_engine.py`, lines 106-127

**ทำไมมาคัตท์**:
- Generator pattern สำหรับ streaming events
- Structured event types ที่ UI/CLI สามารถ render ได้

### Error Handling with Retry

```python
def _render_structured_output(self, payload: dict[str, object]) -> str:
    """Retry structured output serialization ถ้า fail"""
    last_error: Exception | None = None
    for _ in range(self.config.structured_retry_limit):
        try:
            return json.dumps(payload, indent=2)
        except (TypeError, ValueError) as exc:  # pragma: no cover - defensive branch
            last_error = exc
            # Simplify payload and retry
            payload = {'summary': ['structured output retry'], 'session_id': self.session_id}
    raise RuntimeError('structured output rendering failed') from last_error
```

**ที่ไฟล์**: `src/query_engine.py`, lines 161-169

**สิ่งที่ทำ**:
- ลอง serialize JSON
- ถ้า fail ให้ simplify payload แล้วลองอีก
- ถ้า fail หลายครั้ง ให้ raise พร้อม `from last_error` (better traceback)

**ทำไมมาคัตท์**:
- Defensive programming — ไม่ให้ serialization errors crash session
- Error chaining ให้ root cause ชัด

---

## 5. Permission System — src/permissions.py

```python
@dataclass(frozen=True)
class ToolPermissionContext:
    deny_names: frozenset[str] = field(default_factory=frozenset)
    deny_prefixes: tuple[str, ...] = ()
    
    @classmethod
    def from_iterables(cls, deny_names: list[str] | None = None, 
                       deny_prefixes: list[str] | None = None) -> 'ToolPermissionContext':
        """สร้าง context จาก lists — normalize เป็น lowercase"""
        return cls(
            deny_names=frozenset(name.lower() for name in (deny_names or [])),
            deny_prefixes=tuple(prefix.lower() for prefix in (deny_prefixes or [])),
        )
    
    def blocks(self, tool_name: str) -> bool:
        """Check ว่า tool name ถูก block หรือไม่"""
        lowered = tool_name.lower()
        return lowered in self.deny_names or any(lowered.startswith(prefix) 
                                                 for prefix in self.deny_prefixes)
```

**ที่ไฟล์**: `src/permissions.py`, lines 6-20

**สิ่งที่ทำ**:
- **Frozen dataclass**: immutable permission context
- **Deny-by-name**: specific tool names ที่ block
- **Deny-by-prefix**: tool name patterns ที่ block (e.g. "bash_", "mcp_")
- **Case-insensitive**: normalize ทุก names เป็น lowercase

**ทำไมมาคัตท์**:
- Simple allow-by-default philosophy (safe by default)
- Prefix matching สำหรับ tool families

---

## 6. Data Models — src/models.py

```python
@dataclass(frozen=True)
class PortingModule:
    """หน่วย code ที่อาจจะ mirrored หรือ planned"""
    name: str
    responsibility: str
    source_hint: str  # ที่มาของ code (file path หรือ archive ref)
    status: str = 'planned'  # 'planned', 'mirrored', 'completed'

@dataclass(frozen=True)
class UsageSummary:
    input_tokens: int = 0
    output_tokens: int = 0
    
    def add_turn(self, prompt: str, output: str) -> 'UsageSummary':
        """Calculate projected usage สำหรับ new turn"""
        return UsageSummary(
            input_tokens=self.input_tokens + len(prompt.split()),
            output_tokens=self.output_tokens + len(output.split()),
        )

@dataclass
class PortingBacklog:
    """Collection of modules ที่จะ port"""
    title: str
    modules: list[PortingModule] = field(default_factory=list)
    
    def summary_lines(self) -> list[str]:
        return [
            f'- {module.name} [{module.status}] — {module.responsibility} '
            f'(from {module.source_hint})'
            for module in self.modules
        ]
```

**ที่ไฟล์**: `src/models.py`, lines 14-49

**ทำไมมาคัตท์**:
- **Immutable frozen models**: ใช้สำหรับ caching/hashing
- **Incremental builders**: `add_turn()` สร้าง new object แล้ว return (functional style)
- **Markdown rendering**: models รู้วิธี render เองเป็น markdown

---

## 7. Setup & Initialization — src/setup.py

```python
def run_setup(cwd: Path | None = None, trusted: bool = True) -> SetupReport:
    """Initialize workspace — detect Python version, run prefetches, init deferred"""
    root = cwd or Path(__file__).resolve().parent.parent
    
    # Start background prefetches
    prefetches = [
        start_mdm_raw_read(),           # macOS Keychain prefetch
        start_keychain_prefetch(),      # Keychain data
        start_project_scan(root),       # Scan for Python files
    ]
    
    return SetupReport(
        setup=build_workspace_setup(),
        prefetches=tuple(prefetches),
        deferred_init=run_deferred_init(trusted=trusted),  # Trust-gated init
        trusted=trusted,
        cwd=root,
    )

def build_workspace_setup() -> WorkspaceSetup:
    """Collect environment info"""
    return WorkspaceSetup(
        python_version='.'.join(str(part) for part in sys.version_info[:3]),
        implementation=platform.python_implementation(),
        platform_name=platform.platform(),
    )
```

**ที่ไฟล์**: `src/setup.py`, lines 56-77

**สิ่งที่ทำ**:
- Detect Python version, implementation, platform
- Start background prefetches (parallel)
- Run trust-gated deferred initialization

---

## 8. Execution Registry — src/execution_registry.py

```python
@dataclass(frozen=True)
class MirroredCommand:
    name: str
    source_hint: str
    
    def execute(self, prompt: str) -> str:
        """ค้นหา command shim แล้ว execute"""
        return execute_command(self.name, prompt).message

@dataclass(frozen=True)
class ExecutionRegistry:
    """Lookup table สำหรับ commands + tools"""
    commands: tuple[MirroredCommand, ...]
    tools: tuple[MirroredTool, ...]
    
    def command(self, name: str) -> MirroredCommand | None:
        """Case-insensitive lookup"""
        lowered = name.lower()
        for command in self.commands:
            if command.name.lower() == lowered:
                return command
        return None

def build_execution_registry() -> ExecutionRegistry:
    """สร้าง registry จาก loaded snapshots"""
    return ExecutionRegistry(
        commands=tuple(MirroredCommand(module.name, module.source_hint) 
                      for module in PORTED_COMMANDS),
        tools=tuple(MirroredTool(module.name, module.source_hint) 
                   for module in PORTED_TOOLS),
    )
```

**ที่ไฟล์**: `src/execution_registry.py`, lines 9-51

**ทำไมมาคัตท์**:
- **Two-level lookup**: ProtingModule (definition) → MirroredCommand (executor)
- **Case-insensitive matching**: สำหรับ CLI UX
- **Late binding**: registry สร้างตอน runtime ไม่ตอน load

---

## 9. Graph Structures — src/command_graph.py & src/bootstrap_graph.py

### Command Graph — Classify Commands by Type

```python
@dataclass(frozen=True)
class CommandGraph:
    builtins: tuple[PortingModule, ...]
    plugin_like: tuple[PortingModule, ...]
    skill_like: tuple[PortingModule, ...]
    
    def flattened(self) -> tuple[PortingModule, ...]:
        """Merge all layers"""
        return self.builtins + self.plugin_like + self.skill_like

def build_command_graph() -> CommandGraph:
    """Segment commands ตามชนิด"""
    commands = get_commands()
    builtins = tuple(module for module in commands 
                    if 'plugin' not in module.source_hint.lower() 
                    and 'skills' not in module.source_hint.lower())
    plugin_like = tuple(module for module in commands 
                       if 'plugin' in module.source_hint.lower())
    skill_like = tuple(module for module in commands 
                      if 'skills' in module.source_hint.lower())
    return CommandGraph(builtins=builtins, plugin_like=plugin_like, skill_like=skill_like)
```

**ที่ไฟล์**: `src/command_graph.py`, lines 9-34

### Bootstrap Graph — Execution Stages

```python
def build_bootstrap_graph() -> BootstrapGraph:
    """Define startup phases"""
    return BootstrapGraph(
        stages=(
            'top-level prefetch side effects',
            'warning handler and environment guards',
            'CLI parser and pre-action trust gate',
            'setup() + commands/agents parallel load',
            'deferred init after trust',
            'mode routing: local / remote / ssh / teleport / direct-connect / deep-link',
            'query engine submit loop',
        )
    )
```

**ที่ไฟล์**: `src/bootstrap_graph.py`, lines 16-27

---

## 10. Interesting Patterns & Idioms

### Pattern 1: Frozen Dataclasses with Defaults

```python
@dataclass(frozen=True)
class QueryEngineConfig:
    max_turns: int = 8
    max_budget_tokens: int = 2000
    compact_after_turns: int = 12
    structured_output: bool = False
    structured_retry_limit: int = 2
```

**ประโยชน์**:
- Immutable config ไม่มีการ mutate accidentally
- Default values ที่ reasnoable
- Can be used as hashable key (frozen=True)

### Pattern 2: LRU Caching for Expensive Loads

```python
@lru_cache(maxsize=1)
def load_command_snapshot() -> tuple[PortingModule, ...]:
    raw_entries = json.loads(SNAPSHOT_PATH.read_text())
    # Parse and construct...
```

**ประโยชน์**:
- File I/O expensive → cache ทำให้ instant ครั้งที่ 2+
- Single source of truth (maxsize=1)
- Automatic cache invalidation (Python manages)

### Pattern 3: Factory Methods for Construction

```python
@classmethod
def from_workspace(cls) -> 'QueryEnginePort':
    return cls(manifest=build_port_manifest())

@classmethod
def from_saved_session(cls, session_id: str) -> 'QueryEnginePort':
    stored = load_session(session_id)
    # Reconstruct from stored state...
```

**ประโยชน์**:
- Multiple construction paths ชัดเจน
- Setup logic encapsulated
- Named constructors readable than `QueryEnginePort(...)`

### Pattern 4: Functional Immutable Updates

```python
def add_turn(self, prompt: str, output: str) -> 'UsageSummary':
    # Don't mutate self
    return UsageSummary(
        input_tokens=self.input_tokens + len(prompt.split()),
        output_tokens=self.output_tokens + len(output.split()),
    )
```

**ประโยชน์**:
- Thread-safe (ไม่มี side effects)
- Easy to trace data flow
- Can be composed into chains

### Pattern 5: Generator for Streaming

```python
def stream_submit_message(self, ...):
    yield {'type': 'message_start', ...}
    yield {'type': 'command_match', ...}
    # ... more yields
    yield {'type': 'message_stop', ...}
```

**ประโยชน์**:
- Real-time event streaming
- Memory efficient (lazy evaluation)
- Can interrupt/cancel mid-stream

### Pattern 6: Denial Denials (Permission Inference)

```python
def _infer_permission_denials(self, matches: list[RoutedMatch]) -> list[PermissionDenial]:
    denials: list[PermissionDenial] = []
    for match in matches:
        if match.kind == 'tool' and 'bash' in match.name.lower():
            denials.append(PermissionDenial(tool_name=match.name, 
                          reason='destructive shell execution remains gated in the Python port'))
    return denials
```

**ประโยชน์**:
- Auto-deny certain tools based on naming/type
- Doesn't require user to specify — intelligent defaults

---

## 11. Type Annotations & Generics

```python
# Union types
def route_prompt(self, prompt: str, limit: int = 5) -> list[RoutedMatch]:

# Optional with default factory
mutable_messages: list[str] = field(default_factory=list)

# Forward references
@classmethod
def from_workspace(cls) -> 'QueryEnginePort':

# Tuple constants
denied_tools: tuple[PermissionDenial, ...] = ()

# Type unions (PEP 604)
session_id: str | None = None
```

---

## 12. Module Organization

```
src/
├── main.py                    # CLI entry + routing
├── runtime.py                 # PortRuntime: core agent loop
├── query_engine.py            # QueryEnginePort: message handling
├── tools.py                   # Tool registry + filtering
├── commands.py                # Command registry
├── permissions.py             # ToolPermissionContext
├── execution_registry.py       # Lookup + execute commands/tools
├── models.py                  # Data classes
├── context.py                 # PortContext: workspace info
├── setup.py                   # Startup initialization
├── command_graph.py           # Command segmentation
├── bootstrap_graph.py         # Startup phases
├── history.py                 # Session history logging
├── hooks/                     # Hook system (archived)
└── reference_data/            # Snapshots (JSON files)
    ├── commands_snapshot.json
    └── tools_snapshot.json
```

---

## 13. Key Learnings

### Design Principles
1. **Immutability First**: Most data structures frozen (safer)
2. **Lazy Loading**: Snapshots loaded on-demand + cached
3. **Streaming**: Support event streaming for real-time UI
4. **Permissions**: Deny-by-default (safe), infer some rules automatically
5. **Modularity**: Registry pattern for extensible commands/tools

### Python Idioms
- `from __future__ import annotations` — PEP 563 postponed evaluation
- `@dataclass(frozen=True)` — immutable value objects
- `@lru_cache(maxsize=1)` — singleton pattern via caching
- `yield` — generator pattern for streaming
- `@classmethod` — factory methods
- `field(default_factory=...)` — mutable defaults safely

### Testing/Validation
- Parity audit command (`parity-audit`) — compare Python against TypeScript archive
- `turn-loop` — simulate multi-turn agent interaction
- `bootstrap` — full session initialization test

---

## ข้อมูลอ้างอิง

- **Project**: Claw Code — Python rewrite of Claude Code harness
- **Snapshot Date**: 2026-04-16
- **Status**: ยังในการ port — TypeScript archive available สำหรับ reference
- **Architecture**: Mirrored modules from TS + Python-specific implementations

