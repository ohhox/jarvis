# Claude Code TypeScript - Key Code Snippets and Architecture

**วันที่บันทึก**: 2026-04-16  
**แหล่งที่มา**: `D:\DEV\jarvis\projects\claude-code-main\src_ts\src\`  
**ขนาดโปรเจกต์**: 1,884 files, 40 tools, Bun runtime

---

## 1. Application Entry Point & Boot Sequence

### File: `main.tsx` (785 KB - หลัก entry)

**สิ่งที่ทำ**: เป็น CLI entry point หลัก ขึ้นต้นด้วย performance profiling พร้อมเรียก setup screens

**เนื้อหาสำคัญ**:

```typescript
// === STARTUP PROFILING (ลำดับสำคัญ - ต้องวิ่งก่อน imports อื่น) ===
import { profileCheckpoint, profileReport } from './utils/startupProfiler.js';
profileCheckpoint('main_tsx_entry');

import { startMdmRawRead } from './utils/settings/mdm/rawRead.js';
startMdmRawRead(); // เรียก macOS MDM reading in parallel

import { ensureKeychainPrefetchCompleted, startKeychainPrefetch } from './utils/secureStorage/keychainPrefetch.js';
startKeychainPrefetch(); // เรียก Keychain reads for OAuth + API keys in parallel

// === CONDITIONAL IMPORTS (Dead Code Elimination via bun:bundle feature flags) ===
const coordinatorModeModule = feature('COORDINATOR_MODE') 
  ? require('./coordinator/coordinatorMode.js') 
  : null;

const assistantModule = feature('KAIROS') 
  ? require('./assistant/index.js') 
  : null;

// === การเรียก getTools() ===
import { getTools } from './tools.js';
// ใช้ getTools(permissionContext) เพื่อสร้าง tool pool ที่ respect permission rules
```

**ทำไมสำคัญ**:
- เริ่มต้นด้วย profiling เพื่อวัด startup time
- Parallel MDM + Keychain read เพื่อ optimize boot (macOS specific)
- Feature gating ช่วยให้ dead code elimination ทำงาน (ลดขนาด binary)

---

## 2. Tool System - Base Class Definition

### File: `Tool.ts` (500+ lines)

**สิ่งที่ทำ**: ประกาศ interface `Tool<Input, Output, Progress>` ที่ทุก tool ต้องสร้าง (BashTool, FileEditTool, AgentTool, etc.)

```typescript
// === TOOL INTERFACE ===
export type Tool<
  Input extends AnyObject = AnyObject,
  Output = unknown,
  P extends ToolProgressData = ToolProgressData,
> = {
  aliases?: string[]                    // backward compatibility names
  searchHint?: string                   // 3-10 words for ToolSearch keyword matching
  
  call(
    args: z.infer<Input>,
    context: ToolUseContext,
    canUseTool: CanUseToolFn,
    parentMessage: AssistantMessage,
    onProgress?: ToolCallProgress<P>,
  ): Promise<ToolResult<Output>>
  
  description(
    input: z.infer<Input>,
    options: { isNonInteractiveSession: boolean; ... },
  ): Promise<string>
  
  readonly inputSchema: Input                      // Zod schema
  readonly inputJSONSchema?: ToolInputJSONSchema   // JSON Schema alternative
  readonly outputSchema?: z.ZodType<unknown>
  
  isConcurrencySafe(input: z.infer<Input>): boolean
  isEnabled(): boolean
  isReadOnly(input: z.infer<Input>): boolean
  isDestructive?(input: z.infer<Input>): boolean   // delete, overwrite, send
  
  interruptBehavior?(): 'cancel' | 'block'         // what happens on Ctrl+C
  isSearchOrReadCommand?(input: z.infer<Input>): {
    isSearch: boolean; isRead: boolean; isList?: boolean;
  }
  
  shouldDefer?: boolean                            // tool requires ToolSearch lookup
  alwaysLoad?: boolean                             // always shown in initial prompt
  
  maxResultSizeChars: number                       // threshold for persisting to disk
  strict?: boolean                                 // strict mode for API (tengu_tool_pear)
  
  validateInput?(input: z.infer<Input>, context: ToolUseContext): Promise<ValidationResult>
  checkCanUseTool?(input: z.infer<Input>, context: ToolUseContext): Promise<PermissionResult>
}

// === TOOL CONTEXT (passed to every tool call) ===
export type ToolUseContext = {
  options: {
    commands: Command[]
    debug: boolean
    mainLoopModel: string
    tools: Tools
    verbose: boolean
    thinkingConfig: ThinkingConfig
    mcpClients: MCPServerConnection[]
    mcpResources: Record<string, ServerResource[]>
    isNonInteractiveSession: boolean
    agentDefinitions: AgentDefinitionsResult
  }
  abortController: AbortController
  readFileState: FileStateCache
  getAppState(): AppState
  setAppState(f: (prev: AppState) => AppState): void
  setToolJSX?: SetToolJSXFn
  addNotification?: (notif: Notification) => void
  // ... 30+ more context fields
}

// === PERMISSION CONTEXT (ควบคุมว่า tool ไหนทำงานได้) ===
export type ToolPermissionContext = DeepImmutable<{
  mode: PermissionMode  // 'default' | 'auto' | 'plan' | 'bypass'
  additionalWorkingDirectories: Map<string, AdditionalWorkingDirectory>
  alwaysAllowRules: ToolPermissionRulesBySource
  alwaysDenyRules: ToolPermissionRulesBySource
  alwaysAskRules: ToolPermissionRulesBySource
  isBypassPermissionsModeAvailable: boolean
  isAutoModeAvailable?: boolean
  shouldAvoidPermissionPrompts?: boolean  // for background agents
  awaitAutomatedChecksBeforeDialog?: boolean  // for coordinator workers
}>
```

**ทำไมสำคัญ**:
- ทุก tool ในระบบ (built-in + MCP) ต้องสำเร็จ interface นี้
- `ToolUseContext` บรรจุ app state, permissions, MCP clients
- `ToolPermissionContext` ควบคุมว่า tool ไหนได้รันได้บ้าง

---

## 3. Tool Registry & Assembly

### File: `tools.ts` (390 lines)

**สิ่งที่ทำ**: ลงทะเบียน 40+ built-in tools และสร้าง tool pool

```typescript
// === GET ALL BASE TOOLS (ที่ available ในสภาพแวดล้อม) ===
export function getAllBaseTools(): Tools {
  return [
    AgentTool,
    TaskOutputTool,
    BashTool,
    ...(hasEmbeddedSearchTools() ? [] : [GlobTool, GrepTool]),
    ExitPlanModeV2Tool,
    FileReadTool,
    FileEditTool,
    FileWriteTool,
    NotebookEditTool,
    WebFetchTool,
    TodoWriteTool,
    WebSearchTool,
    TaskStopTool,
    AskUserQuestionTool,
    SkillTool,
    EnterPlanModeTool,
    // Conditional tools (feature gates)
    ...(process.env.USER_TYPE === 'ant' ? [ConfigTool] : []),
    ...(SuggestBackgroundPRTool ? [SuggestBackgroundPRTool] : []),
    ...(WebBrowserTool ? [WebBrowserTool] : []),
    ...(isTodoV2Enabled() ? [TaskCreateTool, TaskGetTool, TaskUpdateTool, TaskListTool] : []),
    ...(MonitorTool ? [MonitorTool] : []),
    ...(isWorktreeModeEnabled() ? [EnterWorktreeTool, ExitWorktreeTool] : []),
    // ... 20+ more
  ]
}

// === FILTER OUT DENIED TOOLS ===
export function filterToolsByDenyRules<T extends { name: string; mcpInfo?: ... }>(
  tools: readonly T[],
  permissionContext: ToolPermissionContext
): T[] {
  return tools.filter(tool => !getDenyRuleForTool(permissionContext, tool))
}

// === GET TOOLS FOR CURRENT CONTEXT ===
export const getTools = (permissionContext: ToolPermissionContext): Tools => {
  // SIMPLE MODE: only Bash, Read, Edit
  if (isEnvTruthy(process.env.CLAUDE_CODE_SIMPLE)) {
    if (isReplModeEnabled() && REPLTool) {
      return filterToolsByDenyRules([REPLTool], permissionContext)
    }
    return filterToolsByDenyRules([BashTool, FileReadTool, FileEditTool], permissionContext)
  }
  
  // FULL MODE: get all, then filter
  const specialTools = new Set([
    ListMcpResourcesTool.name,
    ReadMcpResourceTool.name,
    SYNTHETIC_OUTPUT_TOOL_NAME,
  ])
  
  const tools = getAllBaseTools().filter(tool => !specialTools.has(tool.name))
  let allowedTools = filterToolsByDenyRules(tools, permissionContext)
  
  // When REPL mode enabled, hide primitive tools (they're inside REPL VM)
  if (isReplModeEnabled()) {
    const replEnabled = allowedTools.some(tool => toolMatchesName(tool, REPL_TOOL_NAME))
    if (replEnabled) {
      allowedTools = allowedTools.filter(tool => !REPL_ONLY_TOOLS.has(tool.name))
    }
  }
  
  const isEnabled = allowedTools.map(_ => _.isEnabled())
  return allowedTools.filter((_, i) => isEnabled[i])
}

// === MERGE BUILT-IN + MCP TOOLS ===
export function assembleToolPool(
  permissionContext: ToolPermissionContext,
  mcpTools: Tools,
): Tools {
  const builtInTools = getTools(permissionContext)
  const allowedMcpTools = filterToolsByDenyRules(mcpTools, permissionContext)
  
  // Sort for prompt-cache stability: built-ins as contiguous prefix
  const byName = (a: Tool, b: Tool) => a.name.localeCompare(b.name)
  return uniqBy(
    [...builtInTools].sort(byName).concat(allowedMcpTools.sort(byName)),
    'name',  // deduplicate by name (built-ins win)
  )
}
```

**ทำไมสำคัญ**:
- `getAllBaseTools()` เป็น source of truth สำหรับทุก built-in tools
- `getTools()` ใช้ permission context เพื่อกรอง tools
- `assembleToolPool()` รวม built-in + MCP tools พร้อม dedup
- Cache stability: sorted tool order ช่วยให้ prompt cache invalidate น้อยครั้ง

---

## 4. Query Engine - Core Loop

### File: `QueryEngine.ts` (500+ lines)

**สิ่งที่ทำ**: เป็น main conversation loop ที่จัดการ turns, API calls, permission tracking

```typescript
// === QUERY ENGINE CONFIG ===
export type QueryEngineConfig = {
  cwd: string
  tools: Tools
  commands: Command[]
  mcpClients: MCPServerConnection[]
  agents: AgentDefinition[]
  canUseTool: CanUseToolFn
  getAppState: () => AppState
  setAppState: (f: (prev: AppState) => AppState) => void
  initialMessages?: Message[]
  readFileCache: FileStateCache
  customSystemPrompt?: string
  appendSystemPrompt?: string
  userSpecifiedModel?: string
  thinkingConfig?: ThinkingConfig
  maxTurns?: number
  maxBudgetUsd?: number
  jsonSchema?: Record<string, unknown>
  verbose?: boolean
  handleElicitation?: ToolUseContext['handleElicitation']
  abortController?: AbortController
}

// === QUERY ENGINE CLASS ===
export class QueryEngine {
  private config: QueryEngineConfig
  private mutableMessages: Message[]
  private abortController: AbortController
  private permissionDenials: SDKPermissionDenial[]
  private totalUsage: NonNullableUsage
  private discoveredSkillNames = new Set<string>()
  private loadedNestedMemoryPaths = new Set<string>()

  constructor(config: QueryEngineConfig) {
    this.config = config
    this.mutableMessages = config.initialMessages ?? []
    this.abortController = config.abortController ?? createAbortController()
    this.permissionDenials = []
  }

  async *submitMessage(
    prompt: string | ContentBlockParam[],
    options?: { uuid?: string; isMeta?: boolean },
  ): AsyncGenerator<SDKMessage, void, unknown> {
    // === CLEAR TURN-SCOPED STATE ===
    this.discoveredSkillNames.clear()
    
    // === FETCH SYSTEM PROMPT PARTS ===
    const {
      defaultSystemPrompt,
      userContext: baseUserContext,
      systemContext,
    } = await fetchSystemPromptParts({
      tools,
      mainLoopModel: initialMainLoopModel,
      additionalWorkingDirectories: Array.from(
        initialAppState.toolPermissionContext.additionalWorkingDirectories.keys(),
      ),
      mcpClients,
      customSystemPrompt: customPrompt,
    })
    
    // === WRAP canUseTool TO TRACK DENIALS ===
    const wrappedCanUseTool: CanUseToolFn = async (...args) => {
      const result = await canUseTool(...args)
      
      // Track denials for SDK reporting
      if (result.behavior !== 'allow') {
        this.permissionDenials.push({
          tool_name: sdkCompatToolName(tool.name),
          tool_use_id: toolUseID,
          tool_input: input,
        })
      }
      
      return result
    }
    
    // === CALL CORE QUERY FUNCTION ===
    // (ส่วน actual API communication — อยู่ใน query.ts)
    for await (const message of query({
      ...commonOptions,
      canUseTool: wrappedCanUseTool,
      cwd,
      tools,
      // ... pass all options
    })) {
      // === YIELD MESSAGES TO CALLER ===
      yield message
    }
  }
}
```

**ทำไมสำคัญ**:
- QueryEngine เป็น stateful wrapper สำหรับ multi-turn conversations
- tracked permission denials สำหรับ SDK reporting
- Clear turn-scoped state (skills, memory paths) เพื่อหลีกเลี่ยง memory leaks
- `async *submitMessage()` generator ยอมให้ streaming results

---

## 5. Coordinator Mode - Multi-Agent Orchestration

### File: `coordinator/coordinatorMode.ts` (200+ lines)

**สิ่งที่ทำ**: enable/disable coordinator mode และ build system prompts สำหรับ worker delegation

```typescript
// === CHECK COORDINATOR MODE ===
export function isCoordinatorMode(): boolean {
  if (feature('COORDINATOR_MODE')) {
    return isEnvTruthy(process.env.CLAUDE_CODE_COORDINATOR_MODE)
  }
  return false
}

// === INTERNAL WORKER TOOLS (ต้องซ่อนจาก model) ===
const INTERNAL_WORKER_TOOLS = new Set([
  TEAM_CREATE_TOOL_NAME,
  TEAM_DELETE_TOOL_NAME,
  SEND_MESSAGE_TOOL_NAME,
  SYNTHETIC_OUTPUT_TOOL_NAME,
])

// === BUILD WORKER TOOLS CONTEXT ===
export function getCoordinatorUserContext(
  mcpClients: ReadonlyArray<{ name: string }>,
  scratchpadDir?: string,
): { [k: string]: string } {
  if (!isCoordinatorMode()) {
    return {}
  }

  const workerTools = isEnvTruthy(process.env.CLAUDE_CODE_SIMPLE)
    ? [BASH_TOOL_NAME, FILE_READ_TOOL_NAME, FILE_EDIT_TOOL_NAME]
        .sort()
        .join(', ')
    : Array.from(ASYNC_AGENT_ALLOWED_TOOLS)
        .filter(name => !INTERNAL_WORKER_TOOLS.has(name))
        .sort()
        .join(', ')

  let content = `Workers spawned via the ${AGENT_TOOL_NAME} tool have access to these tools: ${workerTools}`

  if (mcpClients.length > 0) {
    const serverNames = mcpClients.map(c => c.name).join(', ')
    content += `\n\nWorkers also have access to MCP tools from connected MCP servers: ${serverNames}`
  }

  if (scratchpadDir && isScratchpadGateEnabled()) {
    content += `\n\nScratchpad directory: ${scratchpadDir}\nWorkers can read and write here without permission prompts.`
  }

  return { workerToolsContext: content }
}

// === COORDINATOR SYSTEM PROMPT ===
export function getCoordinatorSystemPrompt(): string {
  return `You are Claude Code, an AI assistant that orchestrates software engineering tasks across multiple workers.

## Your Role
- Help the user achieve their goal
- Direct workers to research, implement and verify code changes
- Synthesize results and communicate with the user
- Answer questions directly when possible — don't delegate work that you can handle

## Your Tools
- **Agent** - Spawn a new worker
- **SendMessage** - Continue an existing worker
- **TaskStop** - Stop a running worker

When calling Agent:
- Do not use one worker to check on another. Workers will notify you when done.
- Do not delegate trivial file reads or single commands.
- Do not set the model parameter.
- Continue workers whose work is complete via SendMessage to reuse their loaded context.

## Worker Results

Worker results arrive as <task-notification> XML inside user-role messages:

\`\`\`xml
<task-notification>
<task-id>{agentId}</task-id>
<status>completed|failed|killed</status>
<summary>{human-readable status}</summary>
<result>{agent's final text response}</result>
<usage>
  <total_tokens>N</total_tokens>
  <tool_uses>N</tool_uses>
  <duration_ms>N</duration_ms>
</usage>
</task-notification>
\`\`\`
`
}
```

**ทำไมสำคัญ**:
- Coordinator mode ช่วยให้ main agent delegate work ให้ worker agents
- System prompt บรรยาย how to spawn/manage workers
- `getCoordinatorUserContext()` inject ข้อมูล tools/MCP ให้ main agent
- Worker results มาเป็น `<task-notification>` XML ใน user messages

---

## 6. BashTool - Most Important Tool

### File: `tools/BashTool/BashTool.tsx` (1000+ lines)

**สิ่งที่ทำ**: เรียก shell commands, handle sandbox, permission checks, background tasks

```typescript
// === BASH TOOL NAME & INPUT SCHEMA ===
const BASH_TOOL_NAME = 'Bash'

const fullInputSchema = lazySchema(() => z.strictObject({
  command: z.string().describe('The command to execute'),
  timeout: semanticNumber(z.number().optional()).describe(
    `Optional timeout in milliseconds (max ${getMaxTimeoutMs()})`
  ),
  description: z.string().optional().describe(
    `Clear, concise description of what this command does in active voice...`
  ),
  run_in_background: semanticBoolean(z.boolean().optional()).describe(
    `Set to true to run this command in the background. Use Read to read the output later.`
  ),
  dangerouslyDisableSandbox: semanticBoolean(z.boolean().optional()).describe(
    'Set this to true to dangerously override sandbox mode and run commands without sandboxing.'
  ),
  _simulatedSedEdit: z.object({
    filePath: z.string(),
    newContent: z.string()
  }).optional().describe('Internal: pre-computed sed edit result from preview')
}));

// === SEARCH/READ DETECTION ===
export function isSearchOrReadBashCommand(command: string): {
  isSearch: boolean;
  isRead: boolean;
  isList: boolean;
} {
  let partsWithOperators: string[];
  try {
    partsWithOperators = splitCommandWithOperators(command);
  } catch {
    return { isSearch: false, isRead: false, isList: false };
  }
  
  // BASH_SEARCH_COMMANDS = find, grep, rg, ag, ack, locate, which, whereis
  // BASH_READ_COMMANDS = cat, head, tail, less, more, wc, stat, file, strings, jq, awk, cut, sort, uniq, tr
  // BASH_LIST_COMMANDS = ls, tree, du
  // BASH_SEMANTIC_NEUTRAL_COMMANDS = echo, printf, true, false, :
  
  let hasSearch = false, hasRead = false, hasList = false, hasNonNeutralCommand = false;
  
  for (const part of partsWithOperators) {
    if (BASH_SEMANTIC_NEUTRAL_COMMANDS.has(baseCommand)) {
      continue;  // Skip neutral commands
    }
    hasNonNeutralCommand = true;
    
    const isPartSearch = BASH_SEARCH_COMMANDS.has(baseCommand);
    const isPartRead = BASH_READ_COMMANDS.has(baseCommand);
    const isPartList = BASH_LIST_COMMANDS.has(baseCommand);
    
    if (!isPartSearch && !isPartRead && !isPartList) {
      return { isSearch: false, isRead: false, isList: false };  // Not collapsible
    }
    
    if (isPartSearch) hasSearch = true;
    if (isPartRead) hasRead = true;
    if (isPartList) hasList = true;
  }
  
  if (!hasNonNeutralCommand) {
    return { isSearch: false, isRead: false, isList: false };  // Only neutral commands
  }
  
  return { isSearch: hasSearch, isRead: hasRead, isList: hasList };
}

// === CHECK IF SILENT COMMAND (no output expected) ===
function isSilentBashCommand(command: string): boolean {
  // BASH_SILENT_COMMANDS = mv, cp, rm, mkdir, rmdir, chmod, chown, chgrp, touch, ln, cd, export, unset, wait
  // Commands that produce no stdout on success
}

// === BACKGROUND TASKS HANDLING ===
const PROGRESS_THRESHOLD_MS = 2000;  // Show progress after 2s
const ASSISTANT_BLOCKING_BUDGET_MS = 15_000;  // Auto-background after 15s in assistant mode
const isBackgroundTasksDisabled = isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_BACKGROUND_TASKS);

// === AUTO-BACKGROUND CONFIGURATION ===
const DISALLOWED_AUTO_BACKGROUND_COMMANDS = ['sleep'];  // Sleep must be explicit

// === BASH TOOL CALL ===
// Inside BashTool.call():
// 1. Validate input via validateInput()
// 2. Check permissions via checkCanUseTool()
// 3. Detect sandbox requirement via shouldUseSandbox()
// 4. Execute via exec() or SandboxManager
// 5. Track git operations via trackGitOperations()
// 6. Render results with renderToolResultMessage()
// 7. Handle background tasks via spawnShellTask() or backgroundExistingForegroundTask()
```

**ทำไมสำคัญ**:
- BashTool คือ tool ที่ใช้มากที่สุด — run shell commands
- `isSearchOrReadBashCommand()` detect collapsible UI for long outputs
- Background task management ด้วย `run_in_background` flag
- Permission checks + sandbox integration
- Git operation tracking สำหรับ attribution

---

## 7. AgentTool - Spawn Subagents

### File: `tools/AgentTool/AgentTool.tsx` (1000+ lines)

**สิ่งที่ทำ**: spawn sub-agents (workers) ที่รัน async tasks และ report results

```typescript
// === INPUT SCHEMA ===
const baseInputSchema = lazySchema(() => z.object({
  description: z.string().describe('A short (3-5 word) description of the task'),
  prompt: z.string().describe('The task for the agent to perform'),
  subagent_type: z.string().optional().describe('The type of specialized agent to use'),
  model: z.enum(['sonnet', 'opus', 'haiku']).optional(),
  run_in_background: z.boolean().optional(),
}));

// Multi-agent extension (KAIROS feature)
const multiAgentInputSchema = z.object({
  name: z.string().optional().describe('Name for the spawned agent. Makes it addressable via SendMessage({to: name})'),
  team_name: z.string().optional().describe('Team name for spawning'),
  mode: permissionModeSchema().optional().describe('Permission mode (e.g., "plan")'),
});

// === ISOLATION MODES ===
// - worktree: Create temporary git worktree (isolated repo copy)
// - remote: Launch in remote CCR environment (always background, ANT only)

// === OUTPUT SCHEMA ===
// Sync case:
// {
//   status: 'completed',
//   prompt: string,
//   result: string,  // Agent's final response
//   files_changed?: number,
// }

// Async case:
// {
//   status: 'async_launched',
//   agentId: string,
//   description: string,
//   outputFile: string,  // Path to check progress
// }

// === AGENT SPAWNING LOGIC ===
async function call(input: AgentToolInput, context: ToolUseContext) {
  // 1. Choose agent type (fork, custom agent, general-purpose)
  const agentDef = resolveAgentTools(
    input.subagent_type,
    context.options.agentDefinitions
  )
  
  // 2. Check MCP requirements
  if (!hasRequiredMcpServers(agentDef, context.options.mcpClients)) {
    throw new Error(`Agent requires MCP servers: ${agentDef.requiredMcp}`)
  }
  
  // 3. Setup isolation (worktree or remote)
  if (input.isolation === 'worktree') {
    await createAgentWorktree(agentId)
  } else if (input.isolation === 'remote') {
    // Teleport to remote CCR environment
    const remoteTaskId = await teleportToRemote(...)
    return { status: 'remote_launched', taskId: remoteTaskId, sessionUrl: ... }
  }
  
  // 4. Spawn async agent (background task)
  if (input.run_in_background) {
    const agentId = await registerAsyncAgent({
      description: input.description,
      prompt: input.prompt,
      agentDefinition: agentDef,
      ...options
    })
    
    return {
      status: 'async_launched',
      agentId,
      description: input.description,
      outputFile: getTaskOutputPath(agentId),
    }
  }
  
  // 5. Run sync agent (wait for completion)
  const result = await runAgent({
    agentId,
    description: input.description,
    prompt: input.prompt,
    agentDefinition: agentDef,
    ...commonAgentOptions,
  })
  
  return {
    status: 'completed',
    prompt: input.prompt,
    result: result.text,
    files_changed: result.filesChanged,
  }
}
```

**ทำไมสำคัญ**:
- AgentTool spawn agents ใน coordinator mode
- Support isolation modes: worktree (git), remote (CCR)
- Support both sync (wait) และ async (background) execution
- Result comes via task notification messages
- Forum named agents via `name` parameter + SendMessage tool

---

## 8. FileEditTool - Safe File Editing

### File: `tools/FileEditTool/FileEditTool.tsx` (500+ lines)

**สิ่งที่ทำ**: edit files safely ด้วย diff preview และ conflict detection

```typescript
// === FILE EDIT INPUT SCHEMA ===
const fullInputSchema = lazySchema(() => z.strictObject({
  file_path: z.string().describe('Absolute path of the file to edit'),
  new_content: z.string().describe('The complete new content of the file'),
  old_str: z.string().optional().describe(
    'DEPRECATED: exact string to replace (causes entire file replacement)'
  ),
}))

// === FILE EDIT LOGIC ===
async function call(input: FileEditInput, context: ToolUseContext) {
  // 1. Read current file
  const currentContent = await context.readFileState.read(input.file_path)
  
  // 2. Detect changes (via diff)
  const diff = computeDiff(currentContent, input.new_content)
  
  // 3. Check for conflicts
  const hasConflicts = detectConflicts(input.file_path)
  
  // 4. Try to do 3-way merge if there are conflicts
  if (hasConflicts && input.allowMerge) {
    const mergedContent = do3wayMerge(...)
  }
  
  // 5. Permission check
  const canUse = await canUseTool(FileEditTool, input, context)
  
  // 6. Write file
  await writeTextContent(input.file_path, input.new_content)
  
  // 7. Track in file history (if enabled)
  if (fileHistoryEnabled()) {
    fileHistoryTrackEdit(input.file_path, currentContent, input.new_content)
  }
  
  // 8. Notify IDE
  await notifyVscodeFileUpdated(input.file_path)
  
  return {
    data: {
      file_path: input.file_path,
      status: 'success',
      diff_preview: truncate(diff, DIFF_PREVIEW_SIZE),
    }
  }
}
```

**ทำไมสำคัญ**:
- File editing ต้อง careful — ต้อง verify changes
- Diff preview ให้ user เห็นอะไรจะเปลี่ยน
- File history tracking (when enabled) ให้ undo capability
- IDE notification ให้ IDE reload the file

---

## 9. Hooks System - Permission & Automation

### File: `hooks/useCanUseTool.ts` (300+ lines)

**สิ่งที่ทำ**: centralized permission logic — ask user หรือ auto-approve tools

```typescript
// === PERMISSION DECISION FLOW ===
// 1. PreToolUse hooks (run first — can modify input)
// 2. Classifier (auto-mode: check if safe)
// 3. Permission check:
//    - alwaysAllowRules? → ALLOW
//    - alwaysDenyRules? → DENY
//    - alwaysAskRules? → PROMPT user
// 4. PostToolUse hooks (run after approval)
// 5. Tool execution
// 6. PostToolUseResult hooks (run after tool returns)

export type CanUseToolFn = (
  tool: Tool,
  input: Record<string, unknown>,
  context: ToolUseContext,
  parentMessage: AssistantMessage,
  toolUseID: string,
  forceDecision?: PermissionDecision,
) => Promise<{
  behavior: 'allow' | 'deny'
  reason?: string  // Why tool was denied
  updatedInput?: Record<string, unknown>  // If hooks modified input
}>;

// === USE CAN USE TOOL HOOK (React) ===
export default function useCanUseTool(
  messages: Message[],
  permission: ToolPermissionContext,
) {
  return React.useCallback(
    async (
      tool: Tool,
      input: Record<string, unknown>,
      context: ToolUseContext,
      parentMessage: AssistantMessage,
      toolUseID: string,
      forceDecision?: PermissionDecision,
    ): Promise<{ behavior: 'allow' | 'deny'; reason?: string }> => {
      // === RUN PRE-TOOL-USE HOOKS ===
      const preHookMessages = await runPreToolUseHooks(
        tool, input, context, parentMessage, toolUseID
      )
      
      // Let hooks modify input
      let effectiveInput = input;
      if (preHookMessages.some(m => m.data?.updatedInput)) {
        effectiveInput = { ...input, ...preHookMessages[0].data?.updatedInput }
      }
      
      // === PERMISSION CHECK ===
      const permissionResult = await checkToolPermission(
        tool, effectiveInput, permission, context
      )
      
      if (permissionResult.behavior !== 'allow') {
        return { behavior: 'deny', reason: permissionResult.reason }
      }
      
      // === RUN POST-TOOL-USE HOOKS ===
      const postHookMessages = await runPostToolUseHooks(
        tool, input, context, parentMessage, toolUseID
      )
      
      // === RUN POST-TOOL-USE-RESULT HOOKS ===
      // (After tool actually returns)
      
      return { behavior: 'allow' }
    },
    [messages, permission]
  )
}
```

**ทำไมสำคัญ**:
- `canUseTool` ควบคุมว่า agent จะใช้ tool ได้มั้ย
- Support pre/post hooks ให้ customize logic
- Permission modes: default, auto, plan, bypass
- Denial tracking สำหรับ stats

---

## 10. MCP Integration - Tool Provider System

### File: `services/mcp/client.ts` (1000+ lines)

**สิ่งที่ทำ**: เชื่อมต่อ MCP (Model Context Protocol) servers เพื่อ load external tools/resources

```typescript
// === MCP CLIENT CONNECTION ===
export type MCPServerConnection = {
  name: string  // e.g., "github", "slack", "linear"
  client: Client  // @modelcontextprotocol/sdk client
  transport: Transport  // SSE, Stdio, WebSocket, HTTP
  tools: Tool[]  // Converted MCP tools to Claude Tool format
  resources: ServerResource[]  // MCP resources (documents, knowledge bases)
}

// === MCP TOOL CALL ===
async function callMcpTool(
  serverName: string,
  toolName: string,
  args: Record<string, unknown>,
  context: ToolUseContext,
): Promise<MCPToolResult> {
  // 1. Find MCP client
  const client = context.options.mcpClients.find(c => c.name === serverName)
  if (!client) {
    throw new Error(`MCP server "${serverName}" not connected`)
  }
  
  // 2. Call tool on MCP server
  const result = await client.callTool({
    name: toolName,
    arguments: args,
  })
  
  // 3. Handle errors
  if (result.isError) {
    throw new McpToolCallError(result.content[0].text, {
      _meta: result._meta,
    })
  }
  
  // 4. Truncate if too large
  if (mcpContentNeedsTruncation(result.content)) {
    const truncated = truncateMcpContentIfNeeded(result.content)
    // Persist to disk
    const filePath = await persistToolResult(truncated)
    return {
      content: [{
        type: 'text',
        text: `[Large output saved to ${filePath}]`,
      }],
    }
  }
  
  return { content: result.content, _meta: result._meta }
}

// === MCP SERVER STARTUP ===
async function ensureConnectedClient(
  serverName: string,
  config: ScopedMcpServerConfig,
): Promise<Client> {
  // 1. Check if already connected
  const existing = this.clientCache.get(serverName)
  if (existing?.client) {
    return existing.client
  }
  
  // 2. Choose transport based on config
  let transport: Transport;
  if (config.command) {
    // Stdio transport (local command)
    transport = new StdioClientTransport({
      command: config.command,
      args: config.args,
      env: { ...process.env, ...config.env },
    })
  } else if (config.url?.startsWith('sse://') || config.url?.startsWith('http')) {
    // SSE transport (HTTP server)
    transport = new SSEClientTransport({
      url: config.url,
      fetch: createFetchWithInit({
        headers: getMcpServerHeaders(config),
        init: { timeout: 30_000 },
      }),
    })
  } else if (config.url?.startsWith('ws')) {
    // WebSocket transport
    transport = new WebSocketTransport({
      url: config.url,
      wsImplementation: WebSocket,
      tlsOptions: getWebSocketTLSOptions(),
    })
  }
  
  // 3. Initialize MCP client
  const client = new Client({ name: 'claude-code' })
  await client.connect(transport)
  
  // 4. Get tools & resources
  const toolsResult = await client.listTools()
  const resourcesResult = await client.listResources()
  
  // 5. Convert MCP tools to Claude Tool format
  const tools = toolsResult.tools.map(mcpTool =>
    MCPTool({
      serverName,
      toolName: mcpTool.name,
      inputSchema: mcpTool.inputSchema,
      description: mcpTool.description,
      call: (...) => callMcpTool(serverName, mcpTool.name, ...),
    })
  )
  
  // 6. Cache
  this.clientCache.set(serverName, { client, transport, tools, resources })
  
  return client
}

// === ERROR HANDLING ===
export class McpAuthError extends Error {
  constructor(readonly serverName: string, message: string) {
    super(message)
    this.name = 'McpAuthError'
  }
}

export class McpSessionExpiredError extends Error {
  constructor(serverName: string) {
    super(`MCP server "${serverName}" session expired`)
    this.name = 'McpSessionExpiredError'
  }
}

export class McpToolCallError extends TelemetrySafeError {
  constructor(
    message: string,
    telemetryMessage: string,
    readonly mcpMeta?: { _meta?: Record<string, unknown> },
  ) {
    super(message, telemetryMessage)
    this.name = 'McpToolCallError'
  }
}
```

**ทำไมสำคัญ**:
- MCP protocol ยอมให้ Claude Code เชื่อมต่อ 3rd-party services
- Support multiple transports: Stdio (local), SSE/HTTP (server), WebSocket
- Tools จาก MCP servers convert เป็น Claude Tool format
- Error handling: AuthError (needs re-auth), SessionExpiredError (reconnect), ToolCallError (tool failed)

---

## 11. System Context Injection

### File: `context.ts` (190 lines)

**สิ่งที่ทำ**: inject git status, CLAUDE.md, มาตรฐาน context ให้ system prompt

```typescript
// === SYSTEM CONTEXT (injected to all conversations) ===
export const getSystemContext = memoize(
  async (): Promise<{ [k: string]: string }> => {
    // Get git status (branch, changes, recent commits)
    const gitStatus = shouldIncludeGitInstructions()
      ? await getGitStatus()
      : null
    
    // Get cache-breaking injection (ant-only debugging)
    const injection = feature('BREAK_CACHE_COMMAND')
      ? getSystemPromptInjection()
      : null
    
    return {
      ...(gitStatus && { gitStatus }),
      ...(injection ? { cacheBreaker: `[CACHE_BREAKER: ${injection}]` } : {}),
    }
  },
)

// === GIT STATUS MEMOIZED ===
export const getGitStatus = memoize(async (): Promise<string | null> => {
  // Run in parallel:
  const [branch, mainBranch, status, log, userName] = await Promise.all([
    getBranch(),
    getDefaultBranch(),
    execFileNoThrow(gitExe(), ['--no-optional-locks', 'status', '--short']),
    execFileNoThrow(gitExe(), ['--no-optional-locks', 'log', '--oneline', '-n', '5']),
    execFileNoThrow(gitExe(), ['config', 'user.name']),
  ])
  
  // Truncate if exceeds 2000 chars
  const truncatedStatus = status.length > MAX_STATUS_CHARS
    ? status.substring(0, MAX_STATUS_CHARS) + '\n... (truncated)'
    : status
  
  return [
    'This is the git status at the start of the conversation.',
    `Current branch: ${branch}`,
    `Main branch: ${mainBranch}`,
    `Git user: ${userName}`,
    `Status:\n${truncatedStatus || '(clean)'}`,
    `Recent commits:\n${log}`,
  ].join('\n\n')
})

// === USER CONTEXT (CLAUDE.md + cwd walk) ===
export const getUserContext = memoize(
  async (): Promise<{ [k: string]: string }> => {
    // Discover CLAUDE.md files (auto-discovery unless --bare)
    const shouldDisableClaudeMd =
      isEnvTruthy(process.env.CLAUDE_CODE_DISABLE_CLAUDE_MDS) ||
      (isBareMode() && getAdditionalDirectoriesForClaudeMd().length === 0)
    
    const claudeMd = shouldDisableClaudeMd
      ? null
      : getClaudeMds(filterInjectedMemoryFiles(await getMemoryFiles()))
    
    // Cache for auto-mode classifier
    setCachedClaudeMdContent(claudeMd || null)
    
    return {
      ...(claudeMd && { claudeMd }),
      currentDate: `Today's date is ${getLocalISODate()}.`,
    }
  },
)
```

**ทำไมสำคัญ**:
- Git status + recent commits ให้ agent เข้าใจ repo state
- CLAUDE.md auto-discovery ให้ project-specific instructions
- Memoization ประหยัด I/O (reads once per conversation)
- `MAX_STATUS_CHARS` limit (2000) เพื่อ avoid huge context injection

---

## 12. Key Patterns & Insights

### A. Permission Mode Hierarchy

```
┌─────────────────────────────────────────────────────┐
│ PERMISSION MODES (from permissive to restrictive)   │
├─────────────────────────────────────────────────────┤
│ 1. bypass: Run any tool without asking (dangerous)   │
│ 2. auto: Use classifier to auto-approve/deny         │
│ 3. default: Ask user for destructive tools           │
│ 4. plan: Require explicit user approval in plan mode │
│ 5. (future) supervisor: Require org approval         │
└─────────────────────────────────────────────────────┘
```

### B. Streaming Architecture

```
REPL Component
    ↓
useQueueProcessor hook (batches inputs)
    ↓
handlePromptSubmit()
    ↓
query() generator
    ↓
QueryEngine.submitMessage() generator
    ↓
API streaming (messages, tool_results, progress)
    ↓
Message updates (mutableMessages array)
    ↓
Re-render REPL with new messages
```

### C. Tool Pool Assembly

```
Built-in tools (40+)
  ├── Feature-gated (PROACTIVE, KAIROS, COORDINATOR_MODE, etc.)
  ├── Environment-conditional (USER_TYPE=ant, ENABLE_LSP_TOOL)
  ├── Filtered by permission rules (deny, allow, ask)
  └── Filtered by isEnabled() checks
  
MCP tools (from connected servers)
  ├── Filtered by permission rules
  ├── Deduplicated (built-ins win on name collision)
  └── Sorted for prompt cache stability

Final pool:
  [built-in1, built-in2, ..., mcp1, mcp2, ...]
```

### D. Error Handling Strategy

```
Tool Call Error → Classify:
├── Retryable (network timeout, rate limit)
│   └── Retry with exponential backoff
├── Permission (denied, needs auth)
│   └── Show UI request or deny
├── Input Validation (bad args)
│   └── Report to model with error message
├── Tool Not Found
│   └── Try ToolSearch to find it
└── MCP Server Error
    ├── Auth error (-32001, 401) → McpAuthError (needs re-auth)
    ├── Session expired (404 + -32001) → McpSessionExpiredError (reconnect)
    └── Tool failed → McpToolCallError (with _meta for SDK)
```

### E. File Handling Optimization

```
readFileState: LRU FileStateCache
├── Max size: READ_FILE_STATE_CACHE_SIZE (100 MB)
├── Keyed by (filePath, encoding, lineEndings)
├── Deduplicated across tool calls
├── Evicts old entries when full
└── Used by:
    ├── FileReadTool (direct read)
    ├── FileEditTool (current content check)
    ├── GrepTool (search)
    └── CLAUDE.md loading

toolResultStorage:
├── In-memory up to maxResultSizeChars
├── Persist to disk if exceeds limit
├── Preview text + file path returned to model
└── Used by all tools for large outputs
```

---

## 13. Performance Optimization Techniques

### A. Startup Profiling

```typescript
// main.tsx performs parallel initialization:
startMdmRawRead()         // Start in background, wait later
startKeychainPrefetch()   // Start in background, wait later
// ... other imports run in parallel

// Saves ~65ms on macOS (prevents sequential keychain reads)
```

### B. System Prompt Caching

```typescript
// Sorted tool order maintains cache stability
// claude_code_system_cache_policy places breakpoint
// after last prefix-matched built-in tool

// Uniqby deduplication preserves insertion order
// Built-in tools form contiguous prefix in final pool
// MCP tools appended in sorted order
// When MCP tool connects mid-query: cache invalidates
// but only downstream of the MCP tool section
```

### C. Feature Gating via bun:bundle

```typescript
// Dead code eliminated at compile time
const coordinatorModeModule = feature('COORDINATOR_MODE')
  ? require('./coordinator/coordinatorMode.js')
  : null;

// If feature('COORDINATOR_MODE') is false:
// - Entire require() is tree-shaken
// - Module never loaded
// - Binary size reduced
// - Runtime checks still work (isCoordinatorMode() checks env var)
```

### D. Lazy Schema Definition

```typescript
export const inputSchema = lazySchema(() => {
  // Evaluated only when needed (tool description time)
  // Delays Zod parsing until first use
  // Speeds up tool registration
  
  const schema = feature('KAIROS')
    ? fullInputSchema()
    : fullInputSchema().omit({ cwd: true })
  
  return isBackgroundTasksDisabled
    ? schema.omit({ run_in_background: true })
    : schema
})
```

---

## Summary: Key Takeaways

| Component | Purpose | Key File |
|-----------|---------|----------|
| **Tool System** | Define interface for any executable tool | `Tool.ts` |
| **Tool Registry** | Assemble 40+ built-in + MCP tools | `tools.ts` |
| **Query Engine** | Multi-turn conversation loop | `QueryEngine.ts` |
| **Bash Tool** | Execute shell commands | `tools/BashTool/` |
| **Agent Tool** | Spawn subagents (workers) | `tools/AgentTool/` |
| **Coordinator** | Orchestrate multi-agent tasks | `coordinator/coordinatorMode.ts` |
| **Permissions** | Ask users before running tools | `hooks/useCanUseTool.ts` |
| **MCP Client** | Connect 3rd-party tools/resources | `services/mcp/client.ts` |
| **REPL** | Interactive command shell (UI) | `screens/REPL.tsx` |
| **Context** | Inject git status, CLAUDE.md | `context.ts` |

**Architecture Style**: 
- Functional + hooks-based (React)
- Event-driven streaming (generators)
- Permission-first design
- Feature-gated compilation (dead code elimination)
- Memoized context (cache system prompts)

