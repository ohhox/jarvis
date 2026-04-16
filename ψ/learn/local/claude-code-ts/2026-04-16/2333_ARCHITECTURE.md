# Claude Code TypeScript Architecture (2026-04-16)

## Executive Summary

Claude Code TypeScript เป็น AI-powered interactive CLI ที่สร้างจาก **React + Ink** framework สำหรับ terminal UI โดยใช้ **Bun runtime**  ระบบนี้ประกอบด้วย **1,884 TypeScript files** และ **40+ built-in tools** ที่เชื่อมต่อกับ Claude API เป็นศูนย์กลาง

**Key architectural principles:**
- **Agent loop** — REPL screen ควบคุม user input → query engine loop
- **Query as async generator** — ทำให้ streaming + multi-turn queries เพื่อให้ UI update real-time
- **Tool system** — Built-in tools + MCP (Model Context Protocol) resources
- **Permission model** — Fine-grained access control (allow/deny/ask)
- **Coordinator mode** — Experimental agentic orchestration layer
- **Hooks system** — Pre/post execution lifecycle hooks
- **State management** — App state store + persistent session storage

---

## Directory Structure

```
src_ts/src/
├── main.tsx                    # Entry point: CLI parsing, initialization, REPL launch
├── query.ts                    # Query loop engine (async generator)
├── Tool.ts                     # Tool type definitions & context
├── tools.ts                    # Tool registry & assembly
├── commands.ts                 # Slash commands (/, /help, /exit, etc.)
│
├── screens/                    # React components for UI layers
│   └── REPL.tsx               # Main interactive REPL loop
│
├── components/                 # React UI components
│   ├── PromptInput/           # User input handling + keybindings
│   ├── Messages.tsx           # Message rendering
│   ├── App.tsx                # Root wrapper
│   ├── Spinner.tsx            # Loading indicators
│   ├── permissions/           # Permission request dialogs
│   └── ... (200+ components)
│
├── tools/                      # Built-in tool implementations
│   ├── BashTool/              # Shell execution
│   ├── FileReadTool/          # File operations
│   ├── FileEditTool/          # File editing
│   ├── WebFetchTool/          # HTTP requests
│   ├── WebSearchTool/         # Search integration
│   ├── SkillTool/             # Skill execution
│   ├── AgentTool/             # Subagent spawning
│   ├── TaskTool*/             # Task management
│   ├── MCPTool*/              # MCP resources
│   └── ... (30+ more tools)
│
├── services/                   # Core services
│   ├── api/                    # Claude API client + error handling
│   │   └── claude.ts          # Main API interaction
│   ├── mcp/                    # MCP (Model Context Protocol)
│   ├── analytics/             # Telemetry, GrowthBook
│   ├── compact/               # Context compaction
│   ├── tools/
│   │   ├── toolOrchestration.ts  # Tool execution scheduling
│   │   ├── toolExecution.ts      # Individual tool execution
│   │   └── StreamingToolExecutor.ts
│   └── ... (lsp, plugins, notifier, etc.)
│
├── coordinator/               # Experimental agentic orchestration
│   └── (feature-gated with COORDINATOR_MODE)
│
├── hooks/                      # Lifecycle hooks (pre/post execution)
│   ├── useCanUseTool.ts       # Permission checking hook
│   ├── useMergedTools.ts      # Tool pool assembly
│   ├── useQueueProcessor.ts   # Command queue processing
│   └── ... (30+ React hooks)
│
├── query/                      # Query engine modularization
│   ├── config.ts              # QueryConfig building
│   ├── deps.ts                # Dependency injection
│   ├── transitions.ts         # Query loop transitions
│   ├── tokenBudget.ts         # Token budget tracking
│   └── stopHooks.ts           # Stop-reason handling
│
├── context/                    # Immutable context & stores
│   ├── AppState.ts            # Central app state store
│   ├── notifications.ts       # Notification system
│   └── stats.ts               # Statistics tracking
│
├── state/                      # State management (Zustand-like)
│   ├── store.ts               # Store creation
│   ├── onChangeAppState.ts    # Listeners
│   └── AppStateStore.ts       # State shape definitions
│
├── bootstrap/                  # Startup initialization
│   ├── state.ts               # Bootstrap state setters
│   └── index.ts               # Init sequence
│
├── entrypoints/               # Mode entrypoints
│   ├── init.ts                # First-run setup
│   └── agentSdkTypes.ts       # SDK mode types
│
├── cli/                        # CLI handling
│   ├── handlers/              # Command handlers
│   └── transports/            # CLI transports (stdio, etc.)
│
├── remote/                     # Remote session support
├── bridge/                     # IDE bridge (VSCode plugin)
├── skills/                     # Bundled skills
├── plugins/                    # Plugin system
├── types/                      # Type definitions
├── utils/                      # Utilities (1000+ files)
│   ├── api.ts                 # API utilities
│   ├── permissions/           # Permission logic
│   ├── sessionStorage.ts      # Session persistence
│   ├── messages.ts            # Message utilities
│   ├── model/                 # Model handling
│   └── ... (massive)
│
└── constants/                  # Constants
    ├── prompts.ts             # System prompts
    └── tools.ts               # Tool constants
```

---

## Core Architecture: The Query Loop

### Entry Point: `main.tsx`

```
Application Boot:
1. profileCheckpoint('main_tsx_entry') — performance tracking
2. startMdmRawRead() — parallel MDM read (macOS settings)
3. startKeychainPrefetch() — parallel OAuth/API key load
4. Commander CLI parsing
5. init() — initialization sequence
   - Load settings, config, mdm
   - Initialize analytics, telemetry
   - Load tools, MCP servers, plugins
6. launchRepl() — launch interactive REPL
```

### Main REPL Loop: `screens/REPL.tsx`

The **REPL.tsx** is the React component that implements the main interaction loop:

```typescript
REPL Component Lifecycle:
├─ useEffect: Initialize session, restore conversation
├─ useEffect: Process session start hooks
├─ render: PromptInput (user input handler)
├─ render: Messages (conversation view)
├─ onPromptSubmit()
│  └─> handlePromptSubmit() — normalize + attach memory/attachments
│      └─> query() — invoke query engine
└─ useState: Track messages, permissions, app state
```

### Query Engine: `query.ts`

The query engine is an **async generator** that yields streaming events:

```typescript
export async function* query(
  params: QueryParams
): AsyncGenerator<StreamEvent | Message | ToolUseSummaryMessage, Terminal>

QueryParams:
  - messages: Message[]
  - systemPrompt: SystemPrompt
  - userContext, systemContext: { [k: string]: string }
  - canUseTool: CanUseToolFn (permission checker)
  - toolUseContext: ToolUseContext (execution environment)
  - querySource: QuerySource (for analytics)
```

**Query Loop Iterations:**

```
Query Loop (while true):
├─ yield { type: 'stream_request_start' }
├─ Prepare messages (compact boundary, token budget)
├─ normalizeMessagesForAPI() — format for Claude API
├─ Fetch API response (streaming)
│  └─> API yields: tool_use | thinking | text_content
├─ For each tool_use:
│  └─> runTools() — execute concurrently or serially
│      └─> runToolUse() → yield tool results
├─ Handle special cases:
│  - max_output_tokens error → recovery loop
│  - stop_reason=stop_sequence → stop hooks
│  - stop_reason=end_turn → compile context compaction
├─ Auto-compact on token threshold
└─ Continue or return Terminal (end of turn)
```

**State Management During Query:**

```typescript
type State = {
  messages: Message[]
  toolUseContext: ToolUseContext
  autoCompactTracking: AutoCompactTrackingState
  maxOutputTokensRecoveryCount: number
  hasAttemptedReactiveCompact: boolean
  turnCount: number
  pendingToolUseSummary?: Promise<ToolUseSummaryMessage>
  stopHookActive: boolean
  transition?: Continue
}
```

---

## Tool System Architecture

### Tool Definition: `Tool.ts`

```typescript
export type Tool = {
  name: string
  description: string
  category: ToolCategory
  inputSchema: ZodType  // Tool input validation
  execute(params, context): AsyncGenerator<ToolProgress> | Promise<ToolResult>
  isEnabled?(): boolean
  isConcurrencySafe?(input): boolean  // Can run parallel?
  isMultiUse?: boolean
  maxResultSizeChars?: number
  mcpInfo?: { serverName, toolName }  // MCP metadata
}

export type ToolUseContext = {
  options: {
    commands: Command[]
    tools: Tools
    mainLoopModel: string
    mcpClients: MCPServerConnection[]
    agentDefinitions: AgentDefinitionsResult
  }
  getAppState(): AppState
  setAppState(f: (AppState) => AppState)
  messages: Message[]
  abortController: AbortController
  readFileState: FileStateCache
  // ... 50+ more fields
}
```

### Tool Registry: `tools.ts`

```typescript
export function getAllBaseTools(): Tools {
  return [
    AgentTool,
    TaskOutputTool,
    BashTool,
    FileReadTool, FileEditTool, FileWriteTool,
    GlobTool, GrepTool,
    WebFetchTool, WebSearchTool,
    SkillTool, EnterPlanModeTool,
    // Feature-gated tools (conditional imports):
    ...(feature('KAIROS') ? [SendUserFileTool] : []),
    ...(feature('COORDINATOR_MODE') ? [CoordinatorTools] : []),
    ...(isReplModeEnabled() ? [] : [REPLTool]),
    // ... many more
  ]
}

export function getTools(
  permissionContext: ToolPermissionContext
): Tools {
  // Filter by permission deny rules
  // Hide REPL_ONLY_TOOLS when REPL enabled
  // Return based on env flags (SIMPLE mode, etc.)
}

export function assembleToolPool(
  permissionContext: ToolPermissionContext,
  mcpTools: Tools
): Tools {
  // Combine built-in + MCP tools
  // Sort for prompt cache stability
  // Deduplicate by name
}
```

### Tool Execution: `services/tools/toolOrchestration.ts`

```typescript
export async function* runTools(
  toolUseBlocks: ToolUseBlock[],
  assistantMessages: AssistantMessage[],
  canUseTool: CanUseToolFn,
  toolUseContext: ToolUseContext
): AsyncGenerator<MessageUpdate>

Execution Strategy:
1. partitionToolCalls(blocks) → { isConcurrencySafe, blocks }[]
2. For each partition:
   ├─ If isConcurrencySafe → runToolsConcurrently()
   │  └─> Parallel execution (max 10 by default)
   └─ Else → runToolsSerially()
      └─> Sequential execution
3. Yield MessageUpdate after each tool completes
4. Update toolUseContext (read file state, etc.)
```

---

## Permission System

### Permission Model: `utils/permissions/`

```typescript
type PermissionMode = 'default' | 'bypass' | 'auto'

type ToolPermissionContext = {
  mode: PermissionMode
  additionalWorkingDirectories: Map<string, AdditionalWorkingDirectory>
  alwaysAllowRules: ToolPermissionRulesBySource
  alwaysDenyRules: ToolPermissionRulesBySource
  alwaysAskRules: ToolPermissionRulesBySource
  isBypassPermissionsModeAvailable: boolean
  isAutoModeAvailable?: boolean
}

Rule matching:
- Pattern: "bash" | "bash:*" | "bash:grep" | "mcp__server:*"
- Evaluation: getDenyRuleForTool() checks blanket denies
```

### Permission Checking Hook: `hooks/useCanUseTool.ts`

```typescript
export const canUseTool: CanUseToolFn = async (
  tool,
  input,
  context
): Promise<PermissionResult> => {
  // 1. Check deny rules (tool.name matching)
  // 2. Check allow rules (auto-approve)
  // 3. Check ask rules (show UI prompt)
  // 4. Default: based on PermissionMode
  // 5. Return { allowed: boolean, denialReason?: string }
}
```

---

## Message Flow & Types

### Message Types: `types/message.ts`

```typescript
type Message =
  | UserMessage
  | AssistantMessage
  | ProgressMessage
  | HookResultMessage
  | ToolUseSummaryMessage
  | TombstoneMessage
  | SystemMessage
  | SystemLocalCommandMessage
  | CommandInputMessage

UserMessage:
  - content: ContentBlockParam[]
  - uuid: UUID
  - sourceToolAssistantUUID?: UUID
  - timestamp: number
  - toolUseResult?: string

AssistantMessage:
  - message: APIResponse (from Claude)
  - uuid: UUID
  - apiError?: string (max_output_tokens, overloaded, etc.)
  - meta: { thinking_budget_used, output_tokens, ... }
```

### Message Normalization: `utils/messages.ts`

```typescript
normalizeMessagesForAPI(
  messages: Message[],
  options: {
    excludeProgress: boolean
    stripSignatures: boolean
  }
): (UserMessage | AssistantMessage)[]

Creates:
- System message (first) — from systemPrompt
- User/Assistant message alternation
- Filters out ephemeral types (Progress, HookResult, etc.)
```

---

## State Management: `state/`

### Central App State: `state/AppStateStore.ts`

```typescript
type AppState = {
  messages: Message[]
  permissionContext: ToolPermissionContext
  mcp: {
    clients: MCPServerConnection[]
    tools: Tools
    resources: Record<string, ServerResource[]>
  }
  plugins: {
    installed: PluginInstance[]
    enabled: Set<string>
  }
  agents: AgentDefinitionsResult
  tasks: TaskState[]
  // ... 30+ more fields (sessions, worktree, etc.)
}

// Zustand-like store with listeners
const store = createStore(initialState)
store.subscribe(oldState, newState) → onChangeAppState()
```

---

## Hooks System

### Hook Types: `types/hooks.ts`

```typescript
Lifecycle hooks execute:
1. Before tool execution (pre_tool_use)
2. After tool execution (post_tool_use)
3. Session start (session_start)
4. Session end (session_end)

Hook input:
  - Tool name, input, output
  - Current messages, app state
  - Abort signal for cancellation

Hook output:
  - PromptRequest (ask user a question)
  - PromptResponse (e.g., approval/denial)
  - State modifications
```

### Hook Processing: `utils/hooks.ts`

```typescript
processSessionStartHooks(context)
→ forEach hook in userConfig.hooks['session_start']
  → Execute in order, await results

executePostSamplingHooks(messages, context)
→ Run before API call (post_sampling)

executeStopFailureHooks(toolUseResult, context)
→ Run when stop_reason=stop_sequence
```

---

## Context System: `context/`

### System & User Context

**System Context** — Built-in instructions:
```typescript
getSystemContext(): { [k: string]: string } = {
  'cwd': current directory
  'platform': darwin/linux/win32
  'shell': bash/zsh/powershell
  'git_branch': current branch
  // ... auto-detected environment info
}
```

**User Context** — From CLAUDE.md & config:
```typescript
getUserContext(): { [k: string]: string } = {
  'company': from CLAUDE.md
  'project': from .claude/config.json
  'memory': from memory files
  // ... user-defined instructions
}
```

### System Prompt Building: `constants/prompts.ts` + `utils/systemPrompt.ts`

```typescript
getSystemPrompt(): SystemPrompt
→ Base instructions (tool descriptions, examples)
  + Tool usage guidelines
  + Safety instructions
  + Model-specific instructions

buildEffectiveSystemPrompt(
  systemPrompt,
  userContext,
  systemContext,
  tools,
  agentDefinitions
): SystemPrompt
→ Inject context + tool descriptions
```

---

## MCP (Model Context Protocol) Integration

### MCP Configuration: `services/mcp/`

```typescript
type McpServerConfig = {
  name: string
  command: string | string[]
  args?: string[]
  env?: Record<string, string>
  autostart?: boolean
  disabled?: boolean
}

// From ~/.claude/settings.json or environment
mcpServers: {
  'name': { command: '/path/to/server' }
}
```

### MCP Tool Registration: `services/mcp/client.ts`

```typescript
getMcpToolsCommandsAndResources(mcpClients)
→ For each client:
  - Call tools/list
  - Call resources/list (LLM)
  - Wrap as Tool objects

MCPTool = {
  name: `mcp__${server}:${toolName}`
  execute() → call via mcp client
  mcpInfo: { serverName, toolName }
}
```

---

## Coordinator Mode (Experimental)

### Coordinator Architecture: `coordinator/`

```
Coordinator Pattern (feature='COORDINATOR_MODE'):
├─ Coordinator (main thread)
│  ├─ Dispatch work to Workers
│  ├─ Aggregate results
│  └─ Manage task queue
└─ Workers (subagents)
   ├─ Execute tool calls
   ├─ Run local queries
   └─ Report progress
```

### Coordinator Tools

```typescript
COORDINATOR_MODE_ALLOWED_TOOLS = [
  'agent',          // Spawn subagents
  'task_output',    // Progress updates
  'send_message',   // Coordinator communication
  'task_stop',      // Cancel work
]

Workers cannot use:
- REPL, shell, file editing (sandboxed)
- Direct user I/O
- Settings/config changes
```

---

## CLI Commands System: `commands.ts`

### Command Registry

```typescript
type Command = {
  name: string
  aliases?: string[]
  description: string
  category: 'system' | 'navigation' | 'debug' | ...
  hidden?: boolean
  enabled?(): boolean
  handler(params): Promise<CommandResult>
}

Built-in commands:
  /help, /exit, /clear, /config
  /skills, /agents, /debug
  /loop, /forward, /rrr, /standup
  /recap, /trace, /dig, /who-are-you
  // 30+ more
```

### Command Processing: `screens/REPL.tsx`

```typescript
When user types "/" → handleCommandInput()
├─ Parse slash command
├─ Look up in commands registry
├─ Check if enabled
├─ Execute handler
└─ Update messages with result
```

---

## Skill System

### Skill Definition: `skills/`

```typescript
type Skill = {
  name: string
  description: string
  arguments?: ZodType
  run(params): Promise<SkillResult>
}

Bundled skills in `skills/bundled/`:
  - pdf: Extract text from PDF
  - web-scrape: Advanced web scraping
  - code-analysis: Static analysis
  - ... (loaded at startup)
```

### Skill Tool: `tools/SkillTool/SkillTool.ts`

```typescript
Input schema: { skill_name, args }
Execute: Find skill by name → run(args)
Output: { result, output, error? }

Skill discovery via:
  1. Bundled skills (embedded)
  2. Dynamic skill directories (CLAUDE.md)
  3. Marketplace (future)
```

---

## Subagent System

### Agent Tool: `tools/AgentTool/`

```typescript
type AgentDefinition = {
  name: string
  description: string
  instructions: string
  tools: Tool[] | string[]  // Tools available to agent
  model?: string
}

Execute:
1. Load agent definition
2. Create subagent context (ToolUseContext fork)
3. Spawn query loop with agent-specific messages
4. Stream results back to parent
5. Cleanup (kill on timeout/error)
```

### Agent Resume: `tools/AgentTool/resumeAgent.ts`

```typescript
When resuming background agent:
1. Load sidechain file (separate session log)
2. Reconstruct ToolUseContext
3. Resume from last message
4. Restore file history, attribution state
```

---

## Session Storage & Recovery

### Session Persistence: `utils/sessionStorage.ts`

```typescript
Session file format:
{
  sessionId: UUID
  sessionTitle: string
  created: timestamp
  messages: Message[]
  // Metadata for recovery
}

Files:
- ~/.claude/sessions/{sessionId}.json
- In-memory log during session

Recovery flows:
  /resume → pick session → loadTranscriptFromFile()
  Resume with changes → processResumedConversation()
```

### Conversation Recovery: `utils/conversationRecovery.ts`

```typescript
loadConversationForResume(filePath)
→ Read JSON
→ deserializeMessages() — reconstruct Message types
→ restoreSessionMetadata()
→ Restore file history snapshots
→ Merge with new user input
```

---

## Performance Optimizations

### 1. **Token Budget Tracking** (`query/tokenBudget.ts`)

```typescript
checkTokenBudget(
  tokenCount,
  maxContext,
  escalatedBudget
): 'within' | 'warning' | 'over'

Auto-compact triggers:
  - 85% of context used
  - Reactive compact (mid-response)
  - Microcompact (surgical token cleanup)
```

### 2. **Context Compaction** (`services/compact/`)

```typescript
Compact strategies:
  1. Full compact — replace history with summary
  2. Partial compact — keep protected tail
  3. Reactive compact — triggered by 200k+ tokens
  4. Snip compact — surgical cleanup of old messages

Tools used:
  - buildPostCompactMessages() → generates summary
  - Tool use summary generator
  - Automatic metadata preservation
```

### 3. **File State Cache** (`utils/fileStateCache.ts`)

```typescript
LRU cache of recently read files:
  - Size limit: ~100-200 entries
  - Keyed by file path
  - Stores: content, size, hash

Benefits:
  - Avoid re-reading unchanged files
  - Fast permission checks
  - Safe for parallel tool execution
```

### 4. **Streaming & Progressive Rendering** (`screens/REPL.tsx`)

```typescript
UI updates as query yields:
  ├─ stream_request_start → show spinner
  ├─ tool_use → show executing tool name
  ├─ progress_message → update progress bar
  ├─ assistant_message → stream text as arrives
  └─ tool_result → render result inline
```

### 5. **MCP Server Connection Pooling** (`services/mcp/MCPConnectionManager.ts`)

```typescript
Maintain persistent connections:
  - Lazy connect on first use
  - Reconnect on failure
  - Broadcast server state (up/down)
```

---

## Plugin System

### Plugin Discovery: `utils/plugins/installedPluginsManager.ts`

```typescript
Search paths:
  1. ~/.claude/plugins/ (user-installed)
  2. Built-in plugins (bundled)
  3. Node modules (@anthropic/claude-code-plugins)

Plugin schema:
  - package.json: name, version, entrypoint
  - index.ts: export { commands, skills, tools, hooks }
```

### Plugin Loading: `utils/plugins/pluginLoader.ts`

```typescript
initializeVersionedPlugins()
→ For each plugin:
  1. Load from cache or fetch
  2. Import module
  3. Register commands/skills/tools
  4. Wire hooks

Plugins can:
  - Add commands
  - Add skills
  - Add hooks (pre/post tool use)
  - Modify system behavior
```

---

## Analytics & Telemetry

### Event Logging: `services/analytics/index.ts`

```typescript
logEvent(
  eventName: string,
  metadata: AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
)

Events tracked:
  - Session start/end
  - Tool execution (counts, timing, success/failure)
  - Query metrics (tokens, turns, cost)
  - User behavior (command usage, model selection)
  - Errors & exceptions
```

### GrowthBook Integration: `services/analytics/growthbook.ts`

```typescript
Dynamic feature flags:
  feature() → runtime check
  e.g., feature('COORDINATOR_MODE')

Can change behavior without recompile:
  - Coordinator mode enable/disable
  - Experimental features (VOICE_MODE, etc.)
  - A/B testing buckets
```

---

## Error Handling

### API Error Recovery: `services/api/errors.ts`

```typescript
Error types:
  - max_output_tokens → auto-recovery loop
  - overloaded → exponential backoff retry
  - invalid_request_error → fail immediately
  - prompt_too_long → auto-compact + retry
  - rate_limited → wait + retry

Recovery strategies:
  1. Retry with exponential backoff
  2. Context compaction
  3. Fallback model
  4. Error message to user
```

### Tool Execution Errors: `services/tools/toolExecution.ts`

```typescript
Tool error handling:
  ├─ Validation error → show schema hint
  ├─ Permission denied → show prompt dialog
  ├─ Timeout → interrupt tool
  ├─ Subprocess crash → recovery message
  └─ API error → retry or fallback
```

---

## Startup Sequence

```
main.tsx execution flow:

1. Performance checkpoints (profileCheckpoint)
2. Parallel tasks start:
   - startMdmRawRead() (macOS management)
   - startKeychainPrefetch() (OAuth)
3. Commander.js CLI parsing
4. init() — main initialization:
   ├─ ensureKeychainPrefetchCompleted()
   ├─ Load settings (.claude/settings.json, env)
   ├─ Load MDM settings (enterprise)
   ├─ Initialize GrowthBook (feature flags)
   ├─ fetchBootstrapData() — server-side config
   ├─ downloadSessionFiles() — file attachments
   ├─ prefetchClaudeAIMcpConfigsIfEligible()
   ├─ initializeVersionedPlugins()
   ├─ initBundledSkills()
   ├─ initBundledPlugins()
   ├─ Load MCP servers (connect)
   ├─ Load agent definitions
   ├─ Setup permissions
   ├─ Create initial AppState
   └─ launchRepl()
5. renderAndRun(App + REPL)
6. REPL.tsx mounts:
   ├─ Restore conversation (resume mode)
   ├─ processSessionStartHooks()
   ├─ startBackgroundHousekeeping()
   ├─ Setup keyboard handlers
   └─ Enter event loop
```

---

## Key Takeaways

### ✅ Strengths
- **Streaming first** — Query engine as async generator enables real-time updates
- **Permission model** — Fine-grained, auditable access control
- **Tool composition** — Built-in + MCP tools + skills + plugins
- **State management** — Immutable app state with listener pattern
- **Session persistence** — Recoverable conversations, background agents
- **Performance** — Token budgets, context compaction, caching
- **Extensibility** — Hooks, plugins, skill system

### 🔧 Complex Areas
- **Query loop transitions** — 7+ continue sites (recovery, compaction, etc.)
- **Message normalization** — Different formats for API vs. internal use
- **Tool orchestration** — Concurrent vs. serial execution logic
- **Permission checking** — Pattern matching, rule precedence
- **MCP integration** — Async server connection management
- **Session recovery** — Reconstructing state across crashes

### 📚 Entry Points for Learning
1. Start with `main.tsx` (initialization)
2. Then `screens/REPL.tsx` (main loop)
3. Then `query.ts` (query engine core)
4. Then `services/tools/toolOrchestration.ts` (tool execution)
5. Then `utils/permissions/` (permission logic)

---

**Document created**: 2026-04-16 23:33
**Source**: `/d/DEV/jarvis/projects/claude-code-main/src_ts/src/`
**TypeScript version**: Targets ES2021+
**Runtime**: Bun (with Node 18+ compatibility)
