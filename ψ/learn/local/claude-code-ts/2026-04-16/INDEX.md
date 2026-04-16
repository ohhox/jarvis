# Claude Code TypeScript - Learning Resources

**Date**: 2026-04-16  
**Source**: D:\DEV\jarvis\projects\claude-code-main\src_ts\src\  
**Project Size**: 1,884 files, 40 tools, Bun runtime

## Files in This Directory

### 1. `2333_CODE-SNIPPETS.md` (1,253 lines, 41 KB)

Comprehensive code snippets and architecture documentation covering:

- **main.tsx** — CLI entry point, boot sequence, parallel startup optimization
- **Tool.ts** — Tool interface definition, ToolUseContext, ToolPermissionContext
- **tools.ts** — Tool registry, getAllBaseTools(), getTools(), assembleToolPool()
- **QueryEngine.ts** — Multi-turn conversation loop, permission tracking
- **coordinator/coordinatorMode.ts** — Multi-agent orchestration, worker delegation
- **BashTool** — Shell command execution, background tasks, sandbox integration
- **AgentTool** — Subagent spawning (workers), isolation modes (worktree, remote)
- **FileEditTool** — Safe file editing with diff preview
- **hooks/useCanUseTool.ts** — Permission decision flow (pre/post hooks)
- **services/mcp/client.ts** — MCP server integration, transport protocols
- **context.ts** — Git status, CLAUDE.md injection
- **Key Patterns** — Permission modes, streaming architecture, tool pool assembly
- **Performance** — Startup profiling, prompt caching, feature gating, lazy schemas

### 2. `2333_ARCHITECTURE.md` (26 KB)

High-level architecture overview (created earlier in session)

## Navigation by Component

### Core Systems
- **Permission System** → See sections "Hooks System" and "Key Patterns: Permission Mode Hierarchy"
- **Tool Execution** → See "Tool System" and "BashTool"
- **Multi-Agent Orchestration** → See "Coordinator Mode" and "AgentTool"
- **MCP Integration** → See "MCP Integration"

### Data Flow
```
User Input → REPL (React/Ink UI)
         → handlePromptSubmit()
         → query() generator
         → QueryEngine.submitMessage()
         → canUseTool permission check
         → Tool.call() execution
         → Message stream output
```

### Key Concepts

**ToolPermissionContext**: Controls which tools can run
- `mode`: permission level (default, auto, plan, bypass)
- `alwaysAllowRules`, `alwaysDenyRules`, `alwaysAskRules`
- Filters applied in getTools() and assembleToolPool()

**ToolUseContext**: What tools receive when called
- `options`: tools, commands, mainLoopModel, mcpClients, agentDefinitions
- Callbacks: setAppState, setToolJSX, addNotification
- File cache: readFileState (LRU)
- Hooks: requestPrompt, handleElicitation

**Tool Interface**: Every tool must implement
- `call()`: Execute the tool
- `description()`: Dynamic description based on input
- `inputSchema`: Zod schema for validation
- `isReadOnly()`, `isDestructive()`, `isConcurrencySafe()`
- Permission checks and hooks integration

### Feature Flags (bun:bundle dead code elimination)
- `COORDINATOR_MODE` - Multi-agent orchestration
- `KAIROS` - Assistant mode (proactive agents)
- `PROACTIVE` - Scheduled/recurring tasks
- `AGENT_TRIGGERS` - Cron-based agents
- `MCP_SKILLS` - Skills via MCP servers
- `VOICE_MODE` - Voice input
- `OVERFLOW_TEST_TOOL`, `CONTEXT_COLLAPSE`, `TERMINAL_PANEL`, `WEB_BROWSER_TOOL`, `HISTORY_SNIP`

### Performance Optimizations
1. **Parallel startup**: MDM + Keychain reads happen in background
2. **Prompt cache stability**: Tools sorted by name, built-ins as contiguous prefix
3. **Feature gating**: Dead code eliminated at compile time
4. **Lazy schemas**: Tool input schemas evaluated only when needed
5. **File cache (LRU)**: 100 MB in-memory file read cache with eviction
6. **Tool result persistence**: Large outputs saved to disk, preview returned

### Error Handling Strategy
- Retryable errors: Network timeout, rate limit → Exponential backoff
- Permission errors: Denied, needs auth → Show UI request
- Input validation: Bad args → Report to model
- MCP errors:
  - AuthError (401, needs re-auth)
  - SessionExpiredError (404 + -32001, reconnect)
  - ToolCallError (tool failed, has _meta)

## Critical Files to Study

1. **Tool.ts** - Start here to understand tool interface
2. **tools.ts** - See how tools are registered and filtered
3. **QueryEngine.ts** - Understand multi-turn conversation loop
4. **BashTool.tsx** - Most important tool, shows pattern for all tools
5. **hooks/useCanUseTool.ts** - Permission decision logic
6. **services/mcp/client.ts** - How external tools are integrated

## Patterns to Remember

✓ **Feature gating via `feature('FLAG')`** — Code eliminated at compile time
✓ **Memoized context** — Git status, CLAUDE.md cached per conversation
✓ **Streaming generators** — `async *submit()` yields messages as they arrive
✓ **Lazy schema evaluation** — Zod schemas evaluated on first use
✓ **LRU caching** — File reads cached with max size + eviction
✓ **Permission-first design** — Every tool call goes through `canUseTool()` hook
✓ **Deferred tools** — ToolSearch used to find tools by keyword
✓ **Sorte tool pool** — Deterministic order for prompt cache stability

