# 🏗️ Coding AI Platform - Build Prompts & Scaffolding Guide

## 📋 Overview

This document extracts the prompts and scaffolding instructions used to build the Coding AI Platform, organized by pack/phase. Use these prompts with the testing framework to rebuild the platform from scratch.

---

## 🎯 Platform Architecture Summary

**Tech Stack:**
- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS, Monaco Editor, Socket.io Client
- **Backend:** Node.js v22, Express, TypeScript (ES Modules), Socket.io Server
- **AI Models:** Local (Gemma 2 9B Instruct Q5_K_M), Cloud (Claude Sonnet 4.5)
- **Infrastructure:** Docker, Git, JWT Authentication

**Total Build:**
- 10 Packs (including Agent SOP Integration + Production Enhancements)
- 81 Components
- 12,700+ lines of code
- 133+ files

---

## 📦 PACK 1-2: HYBRID COMPUTE SYSTEM

### Goal
Build a hybrid AI compute system that can route between local (Gemma 9B) and cloud (Claude Sonnet) models.

### Components (8 services, 1,200+ lines)

**1. Provider Interface & Registry**
- `src/providers/ICloudProvider.ts` - Abstract interface for all AI providers
- `src/providers/ProviderRegistry.ts` - Manages provider selection and statistics

**2. Cloud Providers**
- `src/providers/AnthropicProvider.ts` - Claude Sonnet integration
- `src/providers/OpenAIProvider.ts` - GPT-4 integration
- `src/providers/GoogleProvider.ts` - Gemini integration

**3. Local Model Service**
- `src/services/LocalModelService.ts` - Gemma 9B GGUF model loader using node-llama-cpp

**4. Compute Router**
- `src/services/ComputeRouter.ts` - Routes requests to local or cloud based on strategy

**5. Multi-Provider Service**
- `src/services/MultiProviderService.ts` - High-level service for provider management

### Build Prompt

```
Build a hybrid AI compute system with the following requirements:

PHASE 1 - PROVIDER ABSTRACTION:
1. Create ICloudProvider interface with methods:
   - generateText(prompt, options)
   - streamText(prompt, options, callback)
   - getModelInfo()
   - estimateCost(tokens)

2. Create ProviderRegistry with:
   - Provider registration
   - Selection strategies (priority, cost, performance, round-robin, manual)
   - Statistics tracking per provider
   - Automatic fallback on failure

PHASE 2 - CLOUD PROVIDERS:
1. Implement AnthropicProvider:
   - Support Claude Sonnet 4, Claude 3.5, Opus, Haiku
   - Use @anthropic-ai/sdk
   - Cost calculation per model
   - Streaming support

2. Implement OpenAIProvider:
   - Support GPT-4 Turbo, GPT-4o, GPT-3.5
   - Use openai SDK
   - Cost calculation per model
   - Streaming support

3. Implement GoogleProvider:
   - Support Gemini 2.0 Flash, Gemini 1.5 Pro/Flash
   - Use @google/generative-ai SDK
   - Cost calculation per model
   - Streaming support

PHASE 3 - LOCAL MODEL:
1. Create LocalModelService:
   - Load GGUF models using node-llama-cpp v3.14.2
   - Support Gemma 2 9B Instruct Q5_K_M
   - GPU acceleration if available
   - Streaming support
   - Model caching

PHASE 4 - COMPUTE ROUTER:
1. Create ComputeRouter:
   - Route to local or cloud based on mode (local/cloud/hybrid)
   - Intelligent escalation from local to cloud on failure
   - Telemetry and performance tracking
   - Timeout handling

PHASE 5 - API ROUTES:
1. Create /api/compute/* endpoints:
   - POST /api/compute/generate - Generate text
   - POST /api/compute/stream - Stream text
   - GET /api/compute/providers - List providers
   - GET /api/compute/stats - Provider statistics
   - POST /api/compute/select-provider - Change provider

REQUIREMENTS:
- TypeScript with ES Modules
- Proper error handling
- Cost tracking
- Performance metrics
- Streaming support
- Automatic fallback
- Environment variable configuration

ENVIRONMENT VARIABLES:
- ANTHROPIC_API_KEY
- OPENAI_API_KEY
- GOOGLE_API_KEY
- COMPUTE_MODE (local/cloud/hybrid)
- PROVIDER_SELECTION_STRATEGY
- PREFERRED_PROVIDER
- LOCAL_MODEL_PATH
```

### Key Files Created
- `src/providers/ICloudProvider.ts`
- `src/providers/ProviderRegistry.ts`
- `src/providers/AnthropicProvider.ts`
- `src/providers/OpenAIProvider.ts`
- `src/providers/GoogleProvider.ts`
- `src/services/LocalModelService.ts`
- `src/services/ComputeRouter.ts`
- `src/services/MultiProviderService.ts`
- `src/api/compute.routes.ts`

---

## 📦 PACK 3: AGENT LOOP

### Goal
Build a complete agentic coding system with planning, reasoning, and execution.

### Components (6 services, 800+ lines)

**1. Agent Executor**
- `src/services/AgentExecutor.ts` - Main agent loop

**2. Planner Service**
- `src/services/PlannerService.ts` - Task decomposition and planning

**3. Tool Registry**
- `src/services/ToolRegistry.ts` - Register and execute tools

**4. File System Service**
- `src/services/FileSystemService.ts` - File operations wrapper

### Build Prompt

```
Build an agentic coding system with the following requirements:

PHASE 1 - TOOL REGISTRY:
1. Create ToolRegistry:
   - Register tools with name, description, parameters, execute function
   - Validate tool parameters
   - Execute tools safely
   - Return structured results

2. Define tool interface:
   - name: string
   - description: string
   - parameters: { [key: string]: { type, required, description } }
   - execute: async (params) => { success, output, error }

PHASE 2 - PLANNER SERVICE:
1. Create PlannerService:
   - Decompose user tasks into steps
   - Use cloud AI for strategic planning
   - Generate step-by-step execution plan
   - Validate plan feasibility

2. Plan structure:
   - steps: Array<{ id, description, tool, parameters }>
   - dependencies: Map of step dependencies
   - estimated_time: number

PHASE 3 - AGENT EXECUTOR:
1. Create AgentExecutor:
   - Execute plans step-by-step
   - Handle tool execution
   - Retry on failure
   - Collect results
   - Generate final response

2. Execution loop:
   - Parse user request
   - Generate plan (using PlannerService)
   - Execute each step
   - Handle errors and retries
   - Return aggregated results

PHASE 4 - FILE SYSTEM SERVICE:
1. Create FileSystemService:
   - Wrapper around file operations
   - Sandboxed to workspace root
   - Safe path resolution
   - Error handling

PHASE 5 - API ROUTES:
1. Create /api/agent/* endpoints:
   - POST /api/agent/execute - Execute task
   - GET /api/agent/status - Get execution status
   - POST /api/agent/cancel - Cancel execution

REQUIREMENTS:
- Multi-step execution
- Error recovery
- Tool validation
- Safe file operations
- Structured logging
- Timeout handling
```

### Key Files Created
- `src/services/AgentExecutor.ts`
- `src/services/PlannerService.ts`
- `src/services/ToolRegistry.ts`
- `src/services/FileSystemService.ts`
- `src/api/agent.routes.ts`

---

## 📦 PACK 4: TWO-BRAIN HYBRID SYSTEM

### Goal
Implement strategic brain (cloud) and execution brain (local) with escalation.

### Components (5 services, 900+ lines)

**1. Hybrid Agent Executor**
- `src/services/HybridAgentExecutor.ts` - Orchestrates two-brain system

**2. Hybrid Planner**
- `src/services/HybridPlannerService.ts` - Strategic planning with cloud

**3. Local Executor**
- `src/services/LocalExecutorService.ts` - Fast local execution

**4. Escalation Engine**
- `src/services/EscalationEngine.ts` - Decides when to escalate to cloud

**5. Quality Validator**
- `src/services/QualityValidator.ts` - Validates output quality

### Build Prompt

```
Build a two-brain hybrid system with the following requirements:

PHASE 1 - HYBRID PLANNER:
1. Create HybridPlannerService:
   - Always use cloud (Claude) for strategic planning
   - Generate detailed execution plans
   - Assess task complexity
   - Recommend execution mode (local/cloud)

PHASE 2 - LOCAL EXECUTOR:
1. Create LocalExecutorService:
   - Execute simple tasks with local model (Gemma 9B)
   - Fast code generation
   - Tool execution
   - Return structured results

PHASE 3 - ESCALATION ENGINE:
1. Create EscalationEngine:
   - Decide when to escalate from local to cloud
   - Criteria: timeout, low quality, errors, complexity
   - Track escalation metrics
   - Automatic retry with cloud

2. Escalation triggers:
   - Execution timeout (>30s)
   - Quality score <0.7
   - Repeated errors (>3)
   - High complexity tasks

PHASE 4 - QUALITY VALIDATOR:
1. Create QualityValidator:
   - Validate code syntax
   - Check for common errors
   - Assess completeness
   - Return quality score (0-1)

PHASE 5 - HYBRID AGENT EXECUTOR:
1. Create HybridAgentExecutor:
   - Orchestrate two-brain workflow
   - Plan with cloud (strategic brain)
   - Execute with local (execution brain)
   - Escalate to cloud if needed
   - Return final results

2. Workflow:
   - User request → Cloud planning
   - Plan → Local execution
   - If failure → Escalate to cloud
   - Return results

PHASE 6 - API ROUTES:
1. Create /api/hybrid-agent/* endpoints:
   - POST /api/hybrid-agent/execute - Execute with hybrid system
   - GET /api/hybrid-agent/stats - Escalation statistics

REQUIREMENTS:
- Intelligent escalation
- Quality validation
- Performance tracking
- Cost optimization
- Automatic fallback
```

### Key Files Created
- `src/services/HybridAgentExecutor.ts`
- `src/services/HybridPlannerService.ts`
- `src/services/LocalExecutorService.ts`
- `src/services/EscalationEngine.ts`
- `src/services/QualityValidator.ts`
- `src/api/hybrid-agent.routes.ts`

---

## 📦 PACK 5: MEMORY + RAG INTEGRATION

### Goal
Add vector memory and RAG (Retrieval-Augmented Generation) for context-aware AI.

### Components (7 services, 1,100+ lines)

**Services:**
- Memory Service, Embedding Service, RAG Service, Vector Store

### Build Prompt

```
Build a memory and RAG system with vector embeddings and semantic search.

Follow TESTING_PROTOCOL.md for all phases.

PHASE 1 - EMBEDDING & VECTOR STORE:
Create EmbeddingService (384-dim embeddings) and VectorStore (in-memory with cosine similarity).

PHASE 2 - MEMORY SERVICE:
Create MemoryService with store/search/delete operations for conversation, code, and documentation.

PHASE 3 - RAG SERVICE:
Create RAGService to augment prompts with relevant context from vector store.

PHASE 4 - API ROUTES:
Create /api/memory/* and /api/rag/* endpoints.

REQUIREMENTS:
- 384-dimension embeddings
- Cosine similarity search
- Persistent JSON storage
- Memory types (conversation, code, docs)
- Context limiting
```

### Key Files Created
- `src/services/MemoryService.ts`
- `src/services/EmbeddingService.ts`
- `src/services/RAGService.ts`
- `src/services/VectorStore.ts`
- `src/api/memory.routes.ts`
- `src/api/rag.routes.ts`

---

## 📦 PACK 6: TOOLS + FILE SYSTEM ACCESS

### Goal
Implement comprehensive file system tools and code execution capabilities.

### Components (8 services, 1,420+ lines)

**Services:**
- FileOperationsService, CodeExecutionService, ShellService, ProjectScannerService, DependencyAnalyzerService, DiffService

### Build Prompt

```
Build comprehensive file system tools and code execution layer.

Follow TESTING_PROTOCOL.md for all phases.

PHASE 1 - FILE OPERATIONS:
Create FileOperationsService with read/write/delete/list/search operations. Sandbox to workspace root.

PHASE 2 - CODE EXECUTION:
Create CodeExecutionService for JS, TS, Python, Shell with timeout and output limits.

PHASE 3 - SHELL SERVICE:
Create ShellService with whitelisted commands only (git, npm, node, python, ls, cat).

PHASE 4 - PROJECT SCANNER:
Create ProjectScannerService to analyze project structure, count files, detect languages.

PHASE 5 - DEPENDENCY ANALYZER:
Create DependencyAnalyzerService to parse package.json, requirements.txt, Cargo.toml, go.mod.

PHASE 6 - DIFF SERVICE:
Create DiffService to generate and apply unified diffs.

PHASE 7 - TOOL REGISTRY:
Register all 15 tools in ToolRegistry.

PHASE 8 - API ROUTES:
Create /api/tools/* endpoints for all operations.

REQUIREMENTS:
- Sandboxed file system
- Whitelisted shell commands
- Timeout handling (30s)
- File size limits (10MB)
- Type definitions
```

### Key Files Created
- `src/services/FileOperationsService.ts`
- `src/services/CodeExecutionService.ts`
- `src/services/ShellService.ts`
- `src/services/ProjectScannerService.ts`
- `src/services/DependencyAnalyzerService.ts`
- `src/services/DiffService.ts`
- `src/types/tools.types.ts`
- `src/api/tools.routes.ts`

---

## 📦 PACK 7: FRONTEND UI + OPTION E + GITHUB

### Goal
Build complete Next.js 14 web UI with real-time features and GitHub integration.

### Components (8 UI components, 1,200+ lines)

**Frontend:**
- ChatPanel, FileBrowser, CodeEditor, DiffViewer, MemoryPanel, LogsPanel, SettingsPanel, GitPanel

**Backend:**
- GitService, WebSocketService

### Build Prompt

```
Build a complete Next.js 14 frontend UI with real-time WebSocket features.

Follow TESTING_PROTOCOL.md for all phases.

PHASE 1 - NEXT.JS SETUP:
Initialize Next.js 14 with TypeScript, Tailwind CSS, App Router.
Install: @monaco-editor/react, socket.io-client, axios, lucide-react.

PHASE 2 - LAYOUT:
Create app/layout.tsx, app/page.tsx (multi-panel), app/globals.css (dark mode).

PHASE 3 - CHAT PANEL:
Create ChatPanel.tsx with message list, input, compute mode selector, Option E toggle, GitHub auto-sync toggle.
POST /api/hybrid-agent/execute on send.

PHASE 4 - FILE BROWSER:
Create FileBrowser.tsx with tree view, expand/collapse, file icons.
GET /api/tools/list-directory.

PHASE 5 - CODE EDITOR:
Create CodeEditor.tsx with Monaco editor, syntax highlighting, auto-save.
POST /api/tools/read-file, POST /api/tools/write-file.

PHASE 6 - MEMORY PANEL:
Create MemoryPanel.tsx with search, memory list, type filter.
POST /api/memory/search.

PHASE 7 - LOGS PANEL:
Create LogsPanel.tsx with Socket.io connection, real-time streaming, color-coded levels.

PHASE 8 - SETTINGS PANEL:
Create SettingsPanel.tsx with compute mode, Option E toggle (with warning), GitHub auto-sync.

PHASE 9 - GIT PANEL:
Create GitPanel.tsx with commit history, commit & push button, rollback.
GET /api/git/history, POST /api/git/auto-commit, POST /api/git/rollback.

PHASE 10 - DIFF VIEWER:
Create DiffViewer.tsx with side-by-side diff, syntax highlighting.

PHASE 11 - BACKEND WEBSOCKET:
Create WebSocketService.ts with Socket.io server.
Update Logger.ts to emit logs to WebSocket.

PHASE 12 - BACKEND GIT:
Create GitService.ts with autoCommit, getHistory, rollback.
Create git.routes.ts with /api/git/* endpoints.

REQUIREMENTS:
- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Monaco Editor
- Socket.io (client & server)
- Real-time updates
- localStorage persistence
- Dark mode
```

### Key Files Created
- `ui/app/layout.tsx`, `ui/app/page.tsx`, `ui/app/globals.css`
- `ui/components/ChatPanel.tsx`
- `ui/components/FileBrowser.tsx`
- `ui/components/CodeEditor.tsx`
- `ui/components/DiffViewer.tsx`
- `ui/components/MemoryPanel.tsx`
- `ui/components/LogsPanel.tsx`
- `ui/components/SettingsPanel.tsx`
- `ui/components/GitPanel.tsx`
- `ui/package.json`, `ui/tsconfig.json`, `ui/tailwind.config.js`, `ui/next.config.js`
- `src/services/GitService.ts`
- `src/services/WebSocketService.ts`
- `src/api/git.routes.ts`

---

## 📦 PACK 8: DEPLOYMENT + PACKAGING

### Goal
Production deployment, authentication, Docker, versioning, and packaging.

### Components (9 services/scripts, 1,500+ lines)

**Services:**
- AuthService, ErrorLogger, VersionManager, UpdateService

**Scripts:**
- start-windows.ps1, start-unix.sh, package-windows.ps1, package-unix.sh

**Config:**
- Dockerfile, docker-compose.yml, heroku.yml, railway.json, render.yaml

### Build Prompt

```
Build production deployment infrastructure with authentication and packaging.

Follow TESTING_PROTOCOL.md for all phases.

PHASE 1 - ERROR LOGGING:
Create ErrorLogger with file rotation, structured logging, log levels.
Create /logs directory with rotation policy.

PHASE 2 - AUTHENTICATION:
Create AuthService with JWT tokens, API keys, password hashing (SHA-256).
Create /api/auth/* endpoints (login, register, verify).
Add auth middleware to protect routes.

PHASE 3 - DOCKER:
Create Dockerfile (multi-stage build).
Create docker-compose.yml (backend + frontend).
Add health checks.

PHASE 4 - VERSIONING:
Create VERSION file (1.0.0).
Create CHANGELOG.md.
Create VersionManager service.

PHASE 5 - AUTO-START SCRIPTS:
Create scripts/start-windows.ps1 (PowerShell).
Create scripts/start-unix.sh (Bash).
Create scripts/stop-windows.ps1.
Create scripts/stop-unix.sh.

PHASE 6 - CLOUD DEPLOYMENT:
Create heroku.yml (Heroku config).
Create railway.json (Railway config).
Create render.yaml (Render config).

PHASE 7 - AUTO-UPDATE:
Create UpdateService to check for new versions.
Add /api/update/* endpoints.

PHASE 8 - PACKAGING:
Create scripts/package-windows.ps1 (creates .zip with executable).
Create scripts/package-unix.sh (creates .tar.gz with binary).
Use `pkg` to create standalone executables.

PHASE 9 - DOCUMENTATION:
Create DEPLOYMENT.md with all deployment options.
Update README.md with deployment instructions.

REQUIREMENTS:
- JWT authentication
- Docker support
- Versioning system
- Auto-start scripts
- Cloud deployment configs
- Standalone packaging
- Comprehensive documentation
```

### Key Files Created
- `src/services/AuthService.ts`
- `src/services/ErrorLogger.ts`
- `src/services/VersionManager.ts`
- `src/services/UpdateService.ts`
- `src/middleware/auth.middleware.ts`
- `src/api/auth.routes.ts`
- `Dockerfile`, `docker-compose.yml`
- `heroku.yml`, `railway.json`, `render.yaml`
- `scripts/start-windows.ps1`, `scripts/start-unix.sh`
- `scripts/stop-windows.ps1`, `scripts/stop-unix.sh`
- `scripts/package-windows.ps1`, `scripts/package-unix.sh`
- `VERSION`, `CHANGELOG.md`
- `DEPLOYMENT.md`

---

## 📦 PACK 9: AGENT SOP INTEGRATION

### Goal
Integrate Agent SOP (Standard Operating Procedures) concepts to enable structured, reusable workflows with RFC 2119 constraints and intelligent workflow selection.

### Components (12 services/modules, 1,800+ lines)

**Services:**
- SOPLoaderService, SOPValidatorService, SOPRegistryService, SOPExecutorService, SOPProgressTracker, SkillConverterService, MCPServerService

**Built-in SOPs:**
- code-assist, codebase-summary, pdd, code-task-generator

### Build Prompt

```
Build an Agent SOP integration system with the following requirements:

PHASE 1 - SOP LOADER & PARSER:
Create SOPLoaderService to load and parse SOP markdown files with RFC 2119 constraints (MUST, SHOULD, MAY).

PHASE 2 - SOP VALIDATOR:
Create SOPValidatorService to validate markdown structure and constraint usage.

PHASE 3 - SOP REGISTRY:
Create SOPRegistryService to manage available SOPs with first-wins precedence for external SOPs.

PHASE 4 - SOP EXECUTOR:
Create SOPExecutorService to execute SOPs with parameter injection and progress tracking.

PHASE 5 - PROGRESS TRACKER:
Create SOPProgressTracker for step-by-step progress tracking and resumability.

PHASE 6 - SKILL CONVERTER:
Create SkillConverterService to convert SOPs to Anthropic Skills format.

PHASE 7 - MCP SERVER (OPTIONAL):
Create MCPServerService to expose SOPs as MCP tools.

PHASE 8 - BUILT-IN SOPS:
Create 4 built-in SOP templates following Agent SOP format specification.

PHASE 9 - AGENT EXECUTOR INTEGRATION:
Enhance AgentExecutor to detect and execute with appropriate SOPs.

PHASE 10 - API ROUTES:
Create /api/sop/* endpoints for list, execute, progress, resume, validate, convert-to-skill.

REQUIREMENTS:
- Markdown parsing (marked/remark)
- YAML frontmatter (gray-matter)
- RFC 2119 keyword detection
- Parameter injection
- Progress persistence
- External SOP loading
- First-wins precedence
- Graceful error handling

See BUILD_PROMPTS_PACK_9_AGENT_SOP.md for complete specifications.
```

### Key Files Created
- `src/services/SOPLoaderService.ts`
- `src/services/SOPValidatorService.ts`
- `src/services/SOPRegistryService.ts`
- `src/services/SOPExecutorService.ts`
- `src/services/SOPProgressTracker.ts`
- `src/services/SkillConverterService.ts`
- `src/services/MCPServerService.ts`
- `workflows/code-assist.sop.md`
- `workflows/codebase-summary.sop.md`
- `workflows/pdd.sop.md`
- `workflows/code-task-generator.sop.md`
- `src/api/sop.routes.ts`
- `src/types/sop.types.ts`
- `docs/AGENT-SOP-INTEGRATION.md`

---

## 🎯 COMPLETE BUILD SEQUENCE

### Step-by-Step Rebuild Process

1. **Initialize Project**
   ```bash
   mkdir coding-ai-platform-v2
   cd coding-ai-platform-v2
   npm init -y
   npm install typescript @types/node express @types/express
   npx tsc --init
   ```

2. **Build Pack 1-2** (Hybrid Compute)
   - Use testing prompt with Pack 1-2 requirements
   - Test all providers
   - Verify local model loading
   - Approve before proceeding

3. **Build Pack 3** (Agent Loop)
   - Use testing prompt with Pack 3 requirements
   - Test tool registry
   - Test agent execution
   - Approve before proceeding

4. **Build Pack 4** (Two-Brain System)
   - Use testing prompt with Pack 4 requirements
   - Test escalation logic
   - Test quality validation
   - Approve before proceeding

5. **Build Pack 5** (Memory + RAG)
   - Use testing prompt with Pack 5 requirements
   - Test vector search
   - Test RAG augmentation
   - Approve before proceeding

6. **Build Pack 6** (Tools + File System)
   - Use testing prompt with Pack 6 requirements
   - Test all file operations
   - Test code execution
   - Approve before proceeding

7. **Build Pack 7** (Frontend UI)
   - Use testing prompt with Pack 7 requirements
   - Test all UI components
   - Test WebSocket connection
   - Approve before proceeding

8. **Build Pack 8** (Deployment)
   - Use testing prompt with Pack 8 requirements
   - Test Docker build
   - Test packaging scripts
   - Approve before proceeding

9. **Build Pack 9** (Agent SOP Integration)
   - Use testing prompt with Pack 9 requirements
   - Test SOP loading and parsing
   - Test SOP execution with parameters
   - Test Skills conversion
   - Final approval

---

## 📝 NOTES FOR REBUILD

### Environment Variables Required
```env
# AI Providers
ANTHROPIC_API_KEY=your_key
OPENAI_API_KEY=your_key
GOOGLE_API_KEY=your_key

# Compute Configuration
COMPUTE_MODE=hybrid
PROVIDER_SELECTION_STRATEGY=priority
PREFERRED_PROVIDER=anthropic
LOCAL_MODEL_PATH=./models/gemma-2-9b-it-Q5_K_M.gguf

# Server Configuration
PORT=3000
WORKSPACE_ROOT=./workspace

# Authentication
JWT_SECRET=your_secret
API_KEY=your_api_key

# Git Configuration
GIT_AUTO_SYNC=false

# Agent SOP Configuration
SOP_PATHS=~/my-sops:/path/to/other-sops
SOP_PROGRESS_DIR=./sop-progress
SOP_SKILLS_DIR=./skills
```

### Dependencies to Install

**Backend:**
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "@anthropic-ai/sdk": "^0.20.0",
    "openai": "^4.28.0",
    "@google/generative-ai": "^0.2.0",
    "node-llama-cpp": "^3.14.2",
    "socket.io": "^4.6.1",
    "jsonwebtoken": "^9.0.2",
    "uuid": "^9.0.0",
    "marked": "^11.0.0",
    "gray-matter": "^4.0.3"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.11.0",
    "@types/express": "^4.17.21",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.11"
  }
}
```

**Frontend:**
```json
{
  "dependencies": {
    "next": "14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@monaco-editor/react": "^4.6.0",
    "socket.io-client": "^4.6.1",
    "axios": "^1.6.5",
    "lucide-react": "^0.312.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/react": "^18.2.48",
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33"
  }
}
```

---

## 📦 PACK 10: PRODUCTION ENHANCEMENTS

### Goal
Enhance existing packs with production-ready technologies: Monaco Editor (Pack 7), pgvector (Pack 5), Vercel AI SDK (Pack 1-2), and evaluate WebContainers.

### Components (18 files, 2,700+ lines)

**Enhancement 1: Monaco Editor Integration (Pack 7)**
- 5 files, 800 lines
- VS Code editor in browser
- Syntax highlighting, IntelliSense, themes
- Diff editor

**Enhancement 2: pgvector Integration (Pack 5)**
- 6 files, 1,000 lines
- PostgreSQL vector search
- Semantic search API
- Hybrid search (vector + full-text)

**Enhancement 3: Vercel AI SDK Migration (Pack 1-2)**
- 7 files, 900 lines
- Unified LLM provider API
- Streaming support
- React hooks (useChat, useCompletion)

**Enhancement 4: WebContainers Evaluation (Optional)**
- Licensing review
- Proof-of-concept
- Performance testing

### Build Prompt

```
See BUILD_PROMPTS_PACK_10_PRODUCTION_ENHANCEMENTS.md for complete specifications.

This pack enhances existing packs rather than creating new functionality.
Follow the detailed prompts in the Pack 10 document for each enhancement.

IMPLEMENTATION ORDER:
1. Enhancement 1 (Monaco Editor) - Add to Pack 7
2. Enhancement 2 (pgvector) - Add to Pack 5
3. Enhancement 3 (Vercel AI SDK) - Add to Pack 1-2
4. Enhancement 4 (WebContainers) - Evaluate separately

Each enhancement should be implemented when its parent pack is run or updated.
```

### Key Files Created

**Pack 7 Enhancement (Monaco Editor):**
- `src/ui/components/CodeEditor.tsx`
- `src/ui/components/MonacoConfig.ts`
- `src/ui/hooks/useMonacoEditor.ts`
- `src/ui/themes/monaco-themes.ts`
- `src/ui/components/DiffEditor.tsx`

**Pack 5 Enhancement (pgvector):**
- `src/services/VectorEmbeddingService.ts`
- `src/services/SemanticSearchService.ts`
- `src/services/HybridSearchService.ts`
- `src/api/vector-search.routes.ts`
- `src/scripts/setup-pgvector.ts`
- `src/types/vector.types.ts`

**Pack 1-2 Enhancement (Vercel AI SDK):**
- `src/providers/VercelAIProvider.ts`
- `src/services/StreamingService.ts`
- `src/ui/hooks/useChat.ts`
- `src/ui/hooks/useCompletion.ts`
- `src/api/streaming.routes.ts`

**Evaluation (WebContainers):**
- `docs/WEBCONTAINERS_LICENSE_REVIEW.md`
- `docs/WEBCONTAINERS_PERFORMANCE.md`
- `src/poc/webcontainers-test.ts`

### Environment Variables

```bash
# Pack 7 - Monaco Editor
MONACO_LAZY_LOAD=true
MONACO_DEFAULT_THEME=vs-dark

# Pack 5 - pgvector
DATABASE_URL=postgresql://user:pass@localhost:5432/db
VECTOR_DIMENSION=1536
VECTOR_INDEX_TYPE=hnsw

# Pack 1-2 - Vercel AI SDK
USE_VERCEL_AI_SDK=true
VERCEL_AI_DEBUG=false
```

### Dependencies

**Frontend:**
```json
{
  "dependencies": {
    "@monaco-editor/react": "^4.6.0",
    "monaco-editor": "^0.45.0",
    "ai": "^3.0.0"
  },
  "devDependencies": {
    "@types/monaco-editor": "^0.45.0",
    "vite-plugin-monaco-editor": "^1.1.0"
  }
}
```

**Backend:**
```json
{
  "dependencies": {
    "pg": "^8.11.3",
    "pgvector": "^0.1.8",
    "@ai-sdk/openai": "^0.0.20",
    "@ai-sdk/anthropic": "^0.0.20",
    "@ai-sdk/google": "^0.0.20",
    "@webcontainer/api": "^1.1.0"
  },
  "devDependencies": {
    "@types/pg": "^8.10.9"
  }
}
```

---

## ✅ SUCCESS CRITERIA

Each pack is complete when:
- ✅ All tests pass (100%)
- ✅ Code coverage ≥ 80%
- ✅ No regressions
- ✅ Performance acceptable
- ✅ Security verified
- ✅ Documentation complete
- ✅ User approved

---

**Use this document with TESTING_PROMPT.md to rebuild the platform systematically!**

