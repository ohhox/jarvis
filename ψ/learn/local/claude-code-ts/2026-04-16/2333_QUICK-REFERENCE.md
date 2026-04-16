# Claude Code TypeScript Source - Comprehensive Reference
**Document Date**: 2026-04-16 23:33 | **Source**: `/d/DEV/jarvis/projects/claude-code-main/src_ts/src/`

---

## Executive Summary

Claude Code คือแอปพลิเคชัน TypeScript/TSX บนรันไทม์ Bun ที่มี **40 tools** และ **100+ commands**  
สถาปัตยกรรมแบบ **modular** ที่รองรับ:
- Multi-agent execution (main thread + subagents)
- MCP server integration (Model Context Protocol)
- File system, shell, web, code editing
- Prompt caching และ token budgeting
- Permission system (allow/deny/ask modes)

---

## 1. ALL 40 TOOLS - Complete Reference

### Core I/O Tools (9 tools)

| Tool Name | Location | Purpose | Key Parameters | Output |
|-----------|----------|---------|-----------------|--------|
| **BashTool** | `/tools/BashTool/` | Execute shell commands | `command`, `timeout_ms`, `run_in_background`, `description` | stdout/stderr + file output tracking |
| **PowerShellTool** | `/tools/PowerShellTool/` | Windows PowerShell execution | `command`, `timeout_ms` | command result |
| **FileReadTool** | `/tools/FileReadTool/` | Read file content | `file_path`, `limit`, `offset` | file content with line numbers |
| **FileWriteTool** | `/tools/FileWriteTool/` | Write/create files | `file_path`, `content` | success/error response |
| **FileEditTool** | `/tools/FileEditTool/` | Edit existing file (replace) | `file_path`, `old_string`, `new_string`, `replace_all` | edit result + context |
| **NotebookEditTool** | `/tools/NotebookEditTool/` | Edit Jupyter notebooks | `notebook_path`, `cell_number`, `new_source`, `edit_mode` | notebook update response |
| **GlobTool** | `/tools/GlobTool/` | File pattern matching | `pattern`, `path` | matching file paths (sorted by mtime) |
| **GrepTool** | `/tools/GrepTool/` | Search file contents (ripgrep) | `pattern`, `path`, `type`, `glob`, `-A/-B/-C`, `multiline`, `head_limit`, `offset` | matching content lines |
| **REPLTool** | `/tools/REPLTool/` | Python/Node REPL | `code`, `language` | execution output |

### Network & Data Tools (3 tools)

| Tool Name | Location | Purpose | Key Parameters | Output |
|-----------|----------|---------|-----------------|--------|
| **WebSearchTool** | `/tools/WebSearchTool/` | Web search (Perplexity/BraveAPI) | `query`, `blocked_domains`, `allowed_domains` | search results with URLs |
| **WebFetchTool** | `/tools/WebFetchTool/` | Fetch & parse URLs | `url`, `prompt` | webpage content as markdown |
| **MCPTool** | `/tools/MCPTool/` | Model Context Protocol client | `server_name`, `resource_name`, `method` | MCP resource data |

### File/Code Management (6 tools)

| Tool Name | Location | Purpose | Key Parameters | Output |
|-----------|----------|---------|-----------------|--------|
| **TodoWriteTool** | `/tools/TodoWriteTool/` | Create/update TODO files | `file_path`, `items`, `format` | TODO file path |
| **ListMcpResourcesTool** | `/tools/ListMcpResourcesTool/` | List MCP server resources | `server_name` | available resources |
| **ReadMcpResourceTool** | `/tools/ReadMcpResourceTool/` | Read MCP resource | `server_name`, `resource_uri` | resource content |
| **ToolSearchTool** | `/tools/ToolSearchTool/` | Search available tools by keyword | `query` | matching tools with descriptions |
| **BriefTool** | `/tools/BriefTool/` | Summarize code/files | `path`, `type` | brief summary |
| **ConfigTool** | `/tools/ConfigTool/` | Read/modify settings | `get`/`set`, `key`, `value` | config value/status |

### Task & Process Management (8 tools)

| Tool Name | Location | Purpose | Key Parameters | Output |
|-----------|----------|---------|-----------------|--------|
| **TaskCreateTool** | `/tools/TaskCreateTool/` | Create background task | `title`, `description`, `type` | task ID |
| **TaskGetTool** | `/tools/TaskGetTool/` | Get task details | `task_id` | task status/output |
| **TaskListTool** | `/tools/TaskListTool/` | List all tasks | (none) | task list |
| **TaskUpdateTool** | `/tools/TaskUpdateTool/` | Update task status | `task_id`, `status`, `output` | update result |
| **TaskStopTool** | `/tools/TaskStopTool/` | Stop running task | `task_id` | stop confirmation |
| **TaskOutputTool** | `/tools/TaskOutputTool/` | Get task detailed output | `task_id`, `format` | task output/logs |
| **SleepTool** | `/tools/SleepTool/` | Pause execution | `duration_ms` | sleep confirmation |
| **SendMessageTool** | `/tools/SendMessageTool/` | Send message (inter-agent) | `to_agent_id`, `message` | delivery status |

### Planning & Workflow (4 tools)

| Tool Name | Location | Purpose | Key Parameters | Output |
|-----------|----------|---------|-----------------|--------|
| **EnterPlanModeTool** | `/tools/EnterPlanModeTool/` | Enter model-directed planning | `plan_description` | plan mode active |
| **ExitPlanModeTool** | `/tools/ExitPlanModeTool/` | Exit plan mode | (none) | mode exit confirmation |
| **EnterWorktreeTool** | `/tools/EnterWorktreeTool/` | Create git worktree for parallel work | `name`, `path` | worktree directory |
| **ExitWorktreeTool** | `/tools/ExitWorktreeTool/` | Cleanup worktree | `action` ("keep"/"remove"), `discard_changes` | worktree cleanup status |

### Agent & Infrastructure (5 tools)

| Tool Name | Location | Purpose | Key Parameters | Output |
|-----------|----------|---------|-----------------|--------|
| **AgentTool** | `/tools/AgentTool/` | Spawn subagent (async worker) | `agent_type`, `request`, `cwd` | agent response |
| **SkillTool** | `/tools/SkillTool/` | Invoke skill/command | `skill`, `args` | skill execution result |
| **AskUserQuestionTool** | `/tools/AskUserQuestionTool/` | Request user input | `question`, `type` | user response |
| **RemoteTriggerTool** | `/tools/RemoteTriggerTool/` | Trigger remote agent task | `agent_name`, `task_id` | trigger status |
| **ScheduleCronTool** | `/tools/ScheduleCronTool/` | Create scheduled cron task | `name`, `schedule`, `command` | cron ID / list / delete |

### UI & Output (3 tools)

| Tool Name | Location | Purpose | Key Parameters | Output |
|-----------|----------|---------|-----------------|--------|
| **SyntheticOutputTool** | `/tools/SyntheticOutputTool/` | Render custom UI output | `jsx`, `markdown` | rendered component |
| **LSPTool** | `/tools/LSPTool/` | Language server integration | `query`, `file_path` | LSP response (goto, hover, etc.) |
| **McpAuthTool** | `/tools/McpAuthTool/` | Authenticate MCP server | `server_name`, `auth_type` | auth result |

### Specialized Tools (2 tools)

| Tool Name | Location | Purpose | Key Parameters | Output |
|-----------|----------|---------|-----------------|--------|
| **TeamCreateTool** | `/tools/TeamCreateTool/` | Create team workspace | `name`, `members` | team ID |
| **TeamDeleteTool** | `/tools/TeamDeleteTool/` | Delete team | `team_id` | deletion confirmation |

---

## 2. COMMANDS (100+ available)

### Most-Used Commands (organized by category)

**Shell/Version Control** (15+ commands):
- `/clear` - Clear screen
- `/commit` - Git commit (safety checks)
- `/branch` - Git branch operations
- `/diff` - Show git diff
- `/push` - Git push (prevents `--force` on main)
- `/tag` - Create git tags
- `/stash` - Stash changes
- `/rebase` - Git rebase
- `/merge` - Git merge
- `/cherry-pick` - Cherry-pick commits
- `/autofix-pr` - Auto-fix pull requests
- `/commit-push-pr` - Commit, push, create PR workflow

**Configuration** (10+ commands):
- `/model` - Switch AI model (opus, sonnet, haiku)
- `/advisor` - Set advisor model
- `/settings` - Configure settings
- `/config` - View/edit config
- `/theme` - Change theme
- `/verbose` - Toggle verbose output
- `/debug` - Debug mode
- `/keys` - Manage API keys
- `/oauth` - OAuth configuration

**Information & Help** (8+ commands):
- `/help` - Display help
- `/commands` - List all commands
- `/status` - Session status
- `/cost` - Show token/cost estimates
- `/who` - Show current identity
- `/agent` - Agent info
- `/doctor` - System diagnostics
- `/version` - Show version

**Analysis & Review** (12+ commands):
- `/trace` - Find/trace projects
- `/review` - Code review
- `/lint` - Linting
- `/test` - Run tests
- `/benchmark` - Performance benchmark
- `/profile` - Code profiling
- `/effort` - Estimate effort
- `/analyze` - Code analysis
- `/search` - Search codebase
- `/refactor` - Refactoring
- `/fix` - Auto-fix issues
- `/check` - Validation check

**Content & Documentation** (10+ commands):
- `/readme` - Generate/update README
- `/docs` - Generate documentation
- `/comment` - Add comments
- `/summary` - Summarize file/code
- `/briefing` - Create briefing
- `/export` - Export content
- `/import` - Import content
- `/format` - Format code
- `/lint-fix` - Auto-fix linting
- `/snippet` - Code snippet

**Special/Advanced** (20+ commands):
- `/compact` - Compact context
- `/backfill-sessions` - Backfill session data
- `/break-cache` - Invalidate prompt cache
- `/context` - Show current context
- `/ctx-viz` - Visualize context tree
- `/effort` - Task effort estimation
- `/chrome` - Chrome automation
- `/bridge` - SDK bridge
- `/desktop` - Desktop app control
- `/ant-trace` - Ant-only tracing
- `/buddy` - Buddy mode
- `/bughunter` - Bug hunting workflow
- `/btw` - By the way (FYI message)
- `/clear-cache` - Clear various caches
- `/copy` - Copy to clipboard
- `/create` - Create new resources
- `/delete` - Delete resources
- `/fork` - Fork task/agent
- `/jump` - Jump to session/task
- `/load` - Load state/config

---

## 3. SKILLS (17 bundled skills)

Location: `/src/skills/bundled/`

| Skill | File | Purpose | Trigger |
|-------|------|---------|---------|
| **batch** | `batch.ts` | Batch API operations | `/batch` |
| **claudeApi** | `claudeApi.ts` | Claude API builder | `/api` or SDK usage |
| **claudeApiContent** | `claudeApiContent.ts` | API content generation | helper for API |
| **claudeInChrome** | `claudeInChrome.ts` | Browser automation | `/chrome` |
| **debug** | `debug.ts` | Debug mode toggling | `/debug` |
| **keybindings** | `keybindings.ts` | Keyboard shortcuts | `/keybindings-help` |
| **loop** | `loop.ts` | Recurring tasks | `/loop <interval> <command>` |
| **loremIpsum** | `loremIpsum.ts` | Lorem ipsum generator | `/lorem` |
| **remember** | `remember.ts` | Memory/learning system | `/learn`, `/remember` |
| **scheduleRemoteAgents** | `scheduleRemoteAgents.ts` | Remote agent scheduling | `/schedule` |
| **simplify** | `simplify.ts` | Code simplification | `/simplify` |
| **skillify** | `skillify.ts` | Create custom skills | `/skill create` |
| **stuck** | `stuck.ts` | Troubleshooting helper | `/stuck` |
| **updateConfig** | `updateConfig.ts` | Configuration updates | `/update-config` |
| **verify** | `verify.ts` | Verification system | `/verify` |
| **verifyContent** | `verifyContent.ts` | Content verification | helper |

**Note**: Bundled skills are compiled at build time. Additional skills loaded from:
- User's `.claude/skills/` directory
- MCP-based skills from connected servers

---

## 4. SERVICES & ARCHITECTURE

Location: `/src/services/`

### A. Core Services (11 services)

| Service | Location | Purpose |
|---------|----------|---------|
| **API Service** | `/services/api/` | HTTP/API client wrapper, rate limiting, retry logic |
| **Analytics** | `/services/analytics/` | Event tracking, session metrics, feature usage |
| **MCP Service** | `/services/mcp/` | Model Context Protocol server/client integration |
| **LSP Service** | `/services/lsp/` | Language server protocol (code navigation, completion) |
| **Voice Service** | `/services/voice.ts` | Voice input/output, speech recognition |
| **Session Memory** | `/services/SessionMemory/` | Conversation memory management, recall |
| **Compact Service** | `/services/compact/` | Context compaction for long conversations |
| **Plugins Service** | `/services/plugins/` | Plugin loading, registration, lifecycle |
| **OAuth** | `/services/oauth/` | OAuth authentication flows |
| **Team Memory Sync** | `/services/teamMemorySync/` | Sync memory across team members |
| **Settings Sync** | `/services/settingsSync/` | Sync settings across devices |

### B. Supporting Services (10+ subsystems)

| Service | File | Purpose |
|---------|------|---------|
| **Token Estimation** | `tokenEstimation.ts` | Estimate token usage per message |
| **Rate Limiting** | `rateLimitMessages.ts` | API rate limit handling |
| **Claude AI Limits** | `claudeAiLimits.ts` | Model-specific limits (context, tokens) |
| **VCR (Recording)** | `vcr.ts` | Record/replay HTTP interactions |
| **Diagnostics** | `diagnosticTracking.ts` | Track errors, performance issues |
| **Internal Logging** | `internalLogging.ts` | Telemetry logging |
| **Tool Use Summary** | `toolUseSummary/` | Summarize tool execution for context |
| **Policy Limits** | `policyLimits/` | Enforce usage policies (cost, rate) |
| **Notifier** | `notifier.ts` | Send notifications (OS, in-app) |
| **Prompt Suggestion** | `PromptSuggestion/` | AI-generated prompt suggestions |
| **Away Summary** | `awaySummary.ts` | Auto-summarize while away |
| **Magic Docs** | `MagicDocs/` | Automatic documentation generation |

---

## 5. CONFIGURATION SYSTEM

### Settings Structure (Hierarchical)

```
~/.claude/
├── settings.json           (global defaults)
├── settings.local.json     (machine-specific, NOT committed)
├── .claude.json            (repo-level, uses CLAUDE.md conventions)
└── keybindings.json        (keyboard shortcuts)
```

### Permission Modes (in settings)

```typescript
type PermissionMode = 
  | 'default'              // Ask for each tool use
  | 'allow'                // Auto-allow trusted tools
  | 'deny'                 // Auto-deny risky operations
  | 'bypass'               // Admin mode (no prompts)
  | 'read-only'            // File reads only
```

### Key Config Options

| Setting | Type | Purpose | Default |
|---------|------|---------|---------|
| `mainLoopModel` | string | Main conversation model | `claude-opus-4-6` |
| `advisorModel` | string | Secondary advisor model | undefined |
| `theme` | "light"\|"dark" | UI theme | "auto" |
| `verbose` | boolean | Verbose output | false |
| `permissionMode` | PermissionMode | Tool access control | "default" |
| `modelOverrides` | object | Bedrock model mappings | {} |
| `hooks` | object | Event listeners (pre/post hooks) | {} |
| `workingDirectories` | string[] | Additional allowed directories | [] |
| `costBudgetUsd` | number | Session cost limit | undefined |

### CLAUDE.md Integration

Every repository can have a `CLAUDE.md` file (markdown):
- Documents project structure & conventions
- Specifies test commands
- Sets default models & hooks
- Configures permissions for the repo
- Claude automatically reads & applies it

---

## 6. KEY CONSTANTS & LIMITS

Location: `/src/constants/`

### Model Names & IDs

```typescript
// Canonical models supported:
- "claude-opus-4-6"        // Latest (most capable)
- "claude-sonnet-4-20250514" // Balanced (fastest)
- "claude-haiku-4-5-20251001" // Lightweight

// API Providers:
- "anthropic"              // First-party API
- "bedrock"                // AWS Bedrock
- "vertex"                 // Google Cloud Vertex
```

### Token & Cost Limits

| Limit | Value | Purpose |
|-------|-------|---------|
| Default context window | 200K tokens | Opus 4.6 |
| Session cost budget | Configurable | Prevent runaway costs |
| Tool result max size | 4MB | Output truncation |
| Single file read limit | 100MB | Prevent OOM |
| Bash timeout default | 30 seconds | Command safety |
| REPL timeout | 60 seconds | Execution safety |

### Output Limits

```typescript
const TOOL_SUMMARY_MAX_LENGTH = 1000;  // Truncate summaries
const PREVIEW_SIZE_BYTES = 500_000;    // Preview threshold
const BASH_SEARCH_COMMANDS = new Set([
  'find', 'grep', 'rg', 'ag', 'ack', 'locate'
]);
```

### Feature Flags

Controlled via environment:
- `FEATURE_VOICE` - Voice input/output
- `FEATURE_MCP_RESOURCES` - MCP resource browsing
- `FEATURE_THINKING` - Extended thinking mode
- `FEATURE_AGENTS` - Async agent execution
- `FEATURE_WORKFLOWS` - Workflow scripts

---

## 7. STATE MANAGEMENT ARCHITECTURE

Location: `/src/state/`, `/src/bootstrap/`

### AppState (Main Store)

```typescript
type AppState = {
  // Models & config
  mainLoopModel: string
  advisorModel?: string
  theme: ThemeName
  
  // Permissions & security
  permissionMode: PermissionMode
  toolPermissions: Map<string, ToolPermissionRulesBySource>
  
  // Session data
  conversationId: UUID
  messages: Message[]
  sessionStartDate: string
  
  // File operations
  fileReadingLimits?: { maxTokens?, maxSizeBytes? }
  globLimits?: { maxResults? }
  
  // Background tasks
  backgroundTasks: Map<string, Task>
  
  // Team & agents
  currentTeamId?: string
  agentDefinitions: AgentDefinitionsResult
  
  // Memory & caching
  sessionMemory?: Memory
  fileStateCache: FileStateCache
  
  // UI state
  theme: ThemeName
  spinner?: SpinnerMode
}
```

### State Update Pattern

```typescript
// Functional updates (React-style)
context.setAppState(prev => ({
  ...prev,
  mainLoopModel: "claude-sonnet-4-20250514"
}));

// Special setAppStateForTasks (for infrastructure)
context.setAppStateForTasks?.(prev => ({
  ...prev,
  backgroundTasks: new Map([...prev.backgroundTasks, [id, task]])
}));
```

### State Persistence

- Session state stored in `.claude/state/` (SQLite)
- Settings synced to cloud if configured
- File history tracked separately

---

## 8. MESSAGE & PROTOCOL TYPES

Location: `/src/types/message.ts`

### Message Union Type

```typescript
type Message =
  | UserMessage              // User input
  | AssistantMessage         // Claude response (with tool uses)
  | ToolResultMessage        // Tool execution result
  | AttachmentMessage        // File/memory attachments
  | SystemMessage            // System notifications
  | ProgressMessage          // Real-time progress
  | ProgressCanceledMessage  // Progress termination
  | SystemLocalCommandMessage// Local command output
```

### AssistantMessage Structure

```typescript
{
  role: 'assistant',
  content: [
    { type: 'text', text: '...' },
    {
      type: 'tool_use',
      id: 'tool_use_xyz',
      name: 'BashTool',
      input: { command: '...' }
    }
  ]
}
```

### ToolResultMessage

```typescript
{
  role: 'user',  // Response to assistant
  content: [
    {
      type: 'tool_result',
      tool_use_id: 'tool_use_xyz',
      content: '...'  // stdout/stderr
    }
  ]
}
```

---

## 9. PLUGIN SYSTEM

Location: `/src/plugins/`

### Plugin Hooks

Plugins can hook into:

```typescript
// Lifecycle hooks
- session_start: () => void
- session_end: (summary) => void
- message_sent: (message) => void
- tool_result: (toolName, result) => void

// Customization hooks
- transform_system_prompt: (prompt) => string
- transform_tool_input: (tool, input) => input
- transform_tool_output: (tool, output) => output
- customize_ui: (section) => ReactNode
```

### Plugin Structure

```
~/.claude/plugins/
├── my-plugin/
│  ├── plugin.json          // Metadata
│  ├── index.ts             // Main export
│  └── config.json          // User config
```

### Plugin API

```typescript
export interface Plugin {
  name: string
  version: string
  description: string
  
  activate?(context: PluginContext): void
  deactivate?(): void
  
  hooks?: PluginHooks
  commands?: Command[]
  tools?: Tool[]
}
```

---

## 10. COMPONENT & UI LAYER

Location: `/src/components/`, `/src/screens/`

### Key Components (React TSX)

| Component | File | Purpose |
|-----------|------|---------|
| **Spinner** | `Spinner.tsx` | Loading animation |
| **Progress** | `ProgressBar.tsx` | Progress display |
| **MessageList** | `MessageList.tsx` | Chat history |
| **PromptInput** | `PromptInput.tsx` | User input field |
| **FileViewer** | `FileViewer.tsx` | Code/text preview |
| **TerminalOutput** | `TerminalOutput.tsx` | Shell command output |
| **Diff** | `DiffViewer.tsx` | Git/file diff display |
| **Breadcrumb** | `Breadcrumb.tsx` | Navigation path |
| **Tooltip** | `Tooltip.tsx` | Hover hints |
| **Badge** | `Badge.tsx` | Status badges |

### Screen Components

| Screen | File | Purpose |
|--------|------|---------|
| **MainScreen** | `screens/MainScreen.tsx` | Primary conversation UI |
| **SidebarScreen** | `screens/SidebarScreen.tsx` | Navigation sidebar |
| **FileExplorerScreen** | `screens/FileExplorerScreen.tsx` | File browser |
| **SettingsScreen** | `screens/SettingsScreen.tsx` | Configuration UI |
| **DebugScreen** | `screens/DebugScreen.tsx` | Debugging tools |

---

## 11. ENTRYPOINTS & INITIALIZATION

Location: `/src/entrypoints/`

### Three Runtime Modes

| Mode | Entrypoint | Purpose | Usage |
|------|-----------|---------|-------|
| **Interactive (REPL)** | `interactive.ts` | Terminal REPL, streaming | `claude-code` command |
| **Print Mode** | `print.ts` | One-shot output, non-interactive | Automation, batch |
| **SDK Mode** | `agentSdk.ts` | Managed agents, remote execution | API-based clients |

### Bootstrap Sequence

```
1. CLI argument parsing
2. Load settings.json + .claude.json
3. Initialize AppState (Zustand store)
4. Load MCP servers
5. Load plugins
6. Build tools list
7. Start conversation loop
```

---

## 12. SECURITY & PERMISSIONS

Location: `/src/utils/permissions/`, `/src/tools/BashTool/`

### Permission Framework

```typescript
// Permission decision flow:
1. Check alwaysAllowRules (exact match)
2. Check alwaysDenyRules (exact match)  
3. Check alwaysAskRules (pattern match)
4. Show UI prompt (if interactive)
5. Cache decision for this session
```

### Tool-Specific Validations

**BashTool Security:**
- AST parsing of commands (not regex-based)
- Destructive command warnings (rm, dd, git reset --hard)
- Read-only validation (prevents file writes in readonly mode)
- Sandbox execution (Linux/macOS with bubblewrap)
- Path validation (prevents escaping cwd)

**FileEditTool Safety:**
- Preserves indentation exactly
- Validates old_string matches uniquely
- Atomic writes (no partial updates)
- File history tracking

---

## 13. MEMORY & LEARNING SYSTEM

Location: `/src/services/SessionMemory/`, `/src/memdir/`

### Memory Types

| Memory Type | Storage | Purpose |
|-------------|---------|---------|
| **Session Memory** | `.claude/state/` | Short-term (current session) |
| **Persistent Memory** | `.claude/memory/` | Long-term learnings |
| **Nested Memory** | `ψ/memory/` | Project-specific CLAUDE.md |
| **File History** | `.claude/history/` | File change tracking |

### Memory Format (YAML/Markdown)

```yaml
date: 2026-04-16
category: learnings
content: |
  - Pattern: X works better than Y in context Z
  - Tool BashTool needs permission X for operation Y
  - Project structure: [details]
```

---

## 14. AGENT SYSTEM (Subagents)

Location: `/src/tools/AgentTool/`, `/src/coordinator/`

### Agent Types

```typescript
type AgentType =
  | 'worker'          // General purpose worker
  | 'researcher'      // Web/file research
  | 'coder'           // Code generation
  | 'reviewer'        // Code review
  | 'coordinator'     // Manage other agents
  | 'custom:name'     // User-defined agents
```

### Agent Communication

```typescript
// Create & await agent
const result = await agentTool({
  agent_type: 'coder',
  request: 'Implement the logout function',
  cwd: '/path/to/project'
});

// Agent → Main thread messaging
await sendMessageTool({
  to_agent_id: parent_agent_id,
  message: 'Need input on design decision'
});
```

### Coordinator Mode

- Special mode where agents manage other agents
- Tools restricted to: AgentTool, TaskStopTool, SendMessageTool, SyntheticOutputTool
- Enables orchestration of complex workflows

---

## 15. MCP (Model Context Protocol) INTEGRATION

Location: `/src/services/mcp/`

### MCP Server Lifecycle

```
1. Server definition (mcp.json or env vars)
2. MC authentication (OAuth, API key)
3. SSE/stdio transport selection
4. Resource discovery (list)
5. Resource access (read)
6. Interactive elicitation (if needed)
```

### MCP Tools in Claude Code

| Tool | Purpose |
|------|---------|
| **MCPTool** | Call MCP server methods |
| **ListMcpResourcesTool** | Browse available resources |
| **ReadMcpResourceTool** | Read specific resource |
| **McpAuthTool** | Handle MCP authentication |

### Supported Transports

- **SSE** (Server-Sent Events) - Streaming from HTTP servers
- **stdio** - Local processes, built-in tools
- **Hypertext protocols** - WebSocket (future)

---

## 16. HOOK SYSTEM

Location: `/src/hooks/`, `settings.json` hooks section

### Available Hooks (Event-Driven)

| Hook | Trigger | Use Case |
|------|---------|----------|
| `session_start` | Session begins | Initialize state |
| `session_end` | Session ends | Cleanup |
| `before_message_send` | Before API call | Transform prompt |
| `after_message_recv` | After API response | Log metrics |
| `tool_decision` | Permission check | Custom rules |
| `tool_pre_execute` | Before tool runs | Validation |
| `tool_post_execute` | After tool runs | Logging |
| `file_modified` | File written | Tracking |
| `git_operation` | Git command | Audit trail |
| `cache_hit` | Prompt cache reused | Analytics |

### Hook Configuration

```json
{
  "hooks": {
    "session_start": {
      "script": "./hooks/setup.sh",
      "timeout_ms": 5000
    },
    "tool_decision": {
      "approval_threshold": 0.8,
      "auto_approve": ["ls", "pwd"]
    }
  }
}
```

---

## 17. COMPARISON: Source Code ↔ User-Facing Features

### What We Use Daily → Internals

| Feature | Tool/Command | Source Location |
|---------|--------------|-----------------|
| `/commit` workflow | Custom command hook | `/commands/commit.ts` |
| Git safety checks | Permission system | `/tools/BashTool/bashSecurity.ts` |
| `/model opus` switching | ConfigTool | `/commands/model/` |
| Bash permission prompts | Permission framework | `/utils/permissions/` |
| File edit (exact match) | FileEditTool | `/tools/FileEditTool/` |
| Search with ripgrep | GrepTool | `/tools/GrepTool/` |
| Web search | WebSearchTool | `/tools/WebSearchTool/` |
| Agent subprocessing | AgentTool | `/tools/AgentTool/` |
| Session memory recall | SessionMemory service | `/services/SessionMemory/` |
| Prompt caching | System prompt generation | `/utils/systemPromptType.ts` |
| Token budgeting | Token estimation | `/services/tokenEstimation.ts` |
| MCP resource browsing | MCP services | `/services/mcp/` |
| CLAUDE.md auto-loading | Context builder | `/context/` |
| Keyboard shortcuts | Keybindings system | `/keybindings/` |
| Plugin loading | Plugin system | `/plugins/` |
| Voice input | Voice service | `/services/voice.ts` |
| Extended thinking | Thinking config | `/utils/thinking.ts` |
| Team sync | TeamMemorySync | `/services/teamMemorySync/` |

---

## 18. CRITICAL SYSTEM PATHS & FILES

```
src_ts/src/
├── Tool.ts                    ← Core tool type definitions
├── commands.ts                ← Command registry
├── bootstrap/
│  ├── state.ts               ← Initial state setup
│  └── initialize.ts          ← Bootstrap sequence
├── context/
│  ├── userContext.ts         ← User context builder
│  └── systemPrompt.ts        ← Prompt generation
├── coordinator/
│  └── inProcessRunner.ts     ← Subagent execution
├── utils/
│  ├── bash/
│  │  ├── ast.ts             ← Command parsing (AST)
│  │  ├── commands.ts        ← Command splitting
│  │  └── shellToolUtils.ts  ← Shell utilities
│  ├── permissions/
│  │  ├── PermissionResult.ts ← Permission types
│  │  └── denialTracking.ts  ← Denial counter
│  ├── model/
│  │  ├── configs.ts         ← Model configurations
│  │  ├── modelCapabilities.ts
│  │  └── providers.ts       ← API providers
│  ├── settings/
│  │  └── settings.ts        ← Settings management
│  └── systemPromptType.ts   ← System prompt type
├── types/
│  ├── message.ts            ← Message protocols
│  ├── permissions.ts        ← Permission types
│  └── tools.ts              ← Tool progress types
└── constants/
   ├── tools.ts              ← Tool allowlists
   ├── apiLimits.ts          ← Rate limits
   └── models.ts             ← Model lists (if exists)
```

---

## 19. BUILD & RUNTIME INFO

### Runtime Environment

- **Language**: TypeScript 5.x
- **Runtime**: Bun (bunjs.sh)
- **Build**: `bun build`
- **Package manager**: Bun package manager

### Key Dependencies

```json
{
  "@anthropic-ai/sdk": "^1.x",
  "@modelcontextprotocol/sdk": "^1.x",
  "react": "^19.x",
  "zod": "^4.x",
  "lodash-es": "^4.x",
  "zustand": "^4.x"
}
```

### File Size Info

- **Total source files**: 1,884 (approx)
- **Tool directory**: 40 tools in separate directories
- **Commands directory**: 100+ command files
- **Services**: 35+ service modules

---

## 20. TESTING & DEBUG INFRASTRUCTURE

Location: `/src/tools/testing/`, `/commands/` debug-related

### Testing Tools

| Tool | Purpose |
|------|---------|
| **TestingPermissionTool** | Mock permission system |
| **Debug commands** | `/debug`, `/doctor`, `/verbose` |
| **VCR service** | Record/replay HTTP |

### Debug Outputs

- `--verbose` flag enables detailed logging
- `--debug` mode logs tool execution details
- `.claude/state/` contains state snapshots
- `.claude/logs/` contains session logs (if enabled)

---

## 21. PERFORMANCE OPTIMIZATIONS

### Prompt Caching

- Session start date memoized to prevent cache busting
- Month/year used for monthly rotation (not daily)
- System prompt cached using prefix caching
- Nested attachments deduplicated

### Token Budgeting

```typescript
// Session-level cost tracking
maxBudgetUsd?: number  // Stop if exceeded

// Tool result budgeting
contentReplacementState: {
  replacements: Map<uuid, string>
  budget: number (bytes)
}
```

### Concurrency

- Bash commands can background (`run_in_background: true`)
- TaskCreateTool for long-running operations
- Async agent execution via AgentTool
- Coordinator mode for orchestrating agents

---

## 22. SUMMARY: Architecture Layers

```
┌─────────────────────────────────────────┐
│         CLI / Entrypoints                │ (print, interactive, sdk)
├─────────────────────────────────────────┤
│    Commands / Skills / Hooks             │ (100+ commands, 17 skills)
├─────────────────────────────────────────┤
│    Tool Execution Engine                 │ (40 tools, permission system)
├─────────────────────────────────────────┤
│  Services (MCP, LSP, Analytics, etc)    │ (15+ services)
├─────────────────────────────────────────┤
│    AppState Store (Zustand)              │ (centralized state)
├─────────────────────────────────────────┤
│  Core Utilities (bash AST, file ops)    │ (100+ utility modules)
├─────────────────────────────────────────┤
│    Anthropic SDK / Claude API            │ (message protocol)
└─────────────────────────────────────────┘
```

---

## 23. KEY CONFIGURATION FILES

### In a Project (Git Repo)

```
.claude.json              ← Project-level settings
CLAUDE.md                 ← Documentation & conventions
```

### User Home (~/.claude/)

```
settings.json             ← Global defaults
settings.local.json       ← Machine-specific (not tracked)
keybindings.json          ← Keyboard shortcuts
state/                    ← Session database
memory/                   ← Persistent learnings
skills/                   ← Custom skill scripts
plugins/                  ← Custom plugins
hooks/                    ← Hook scripts
```

---

## 24. QUICK LOOKUP TABLES

### Model Aliases

```
opus, o   → claude-opus-4-6
sonnet, s → claude-sonnet-4-20250514
haiku, h  → claude-haiku-4-5-20251001
```

### Permission Symbols

```
✓ allow   (auto-approve)
✗ deny    (auto-reject)
? ask     (prompt user)
```

### Tool Categories

```
I/O:           BashTool, FileReadTool, FileWriteTool, FileEditTool
Search:        GrepTool, GlobTool, ToolSearchTool
Network:       WebSearchTool, WebFetchTool, MCPTool
Code:          FileEditTool, NotebookEditTool, LSPTool
Task Mgmt:     TaskCreateTool, TaskGetTool, TaskListTool, etc.
Agents:        AgentTool, SkillTool, SendMessageTool
Planning:      EnterPlanModeTool, ExitPlanModeTool
Worktrees:     EnterWorktreeTool, ExitWorktreeTool
Scheduling:    ScheduleCronTool, RemoteTriggerTool
```

---

**END OF REFERENCE DOCUMENT**

Generated: 2026-04-16 23:33 | Source: `/d/DEV/jarvis/projects/claude-code-main/src_ts/src/` | **1,884 files analyzed**
