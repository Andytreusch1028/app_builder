# 📦 PACK 9: AGENT SOP INTEGRATION

## 🎯 Goal
Integrate Agent SOP (Standard Operating Procedures) concepts from https://github.com/strands-agents/agent-sop to enable structured, reusable workflows with RFC 2119 constraints, progressive disclosure, and intelligent workflow selection.

## 📋 Overview
Agent SOPs are markdown-based instruction sets that guide AI agents through sophisticated workflows using:
- **RFC 2119 constraints** (MUST, SHOULD, MAY) for precise control
- **Parameterized inputs** for flexible reuse
- **Progressive disclosure** - load workflows only when needed
- **Multi-modal distribution** - MCP tools, Anthropic Skills, Python modules
- **Intelligent selection** - AI chooses appropriate workflow based on task

## 🏗️ Components (12 services/modules, 1,800+ lines)

### Services:
1. **SOPLoaderService** - Load and parse SOP markdown files
2. **SOPValidatorService** - Validate SOP format and structure
3. **SOPRegistryService** - Manage available SOPs and metadata
4. **SOPExecutorService** - Execute SOPs with parameter injection
5. **SOPProgressTracker** - Track workflow step progress
6. **SkillConverterService** - Convert SOPs to Anthropic Skills format
7. **MCPServerService** - Expose SOPs as MCP tools

### Workflow Templates:
8. **Built-in SOPs** - code-assist, codebase-summary, pdd, code-task-generator
9. **Custom SOP Templates** - User-defined workflows

### Integration:
10. **AgentExecutor Enhancement** - Integrate SOP execution
11. **Workflow Detection Enhancement** - Use SOPs for complex tasks
12. **API Routes** - SOP management endpoints

---

## 🔨 BUILD PROMPT

```
Build an Agent SOP integration system with the following requirements:

PHASE 1 - SOP LOADER & PARSER:
1. Create SOPLoaderService:
   - Load SOP markdown files from `workflows/` directory
   - Support external SOP paths (colon-separated)
   - Parse markdown structure (Overview, Parameters, Steps, Examples)
   - Extract RFC 2119 constraints (MUST, SHOULD, MAY)
   - Return structured SOP object

2. SOP File Format:
   - Files must have `.sop.md` postfix
   - Support frontmatter (YAML) for metadata
   - Parse step numbers and descriptions
   - Extract constraint blocks
   - Support parameterized inputs

3. SOP Object Structure:
   ```typescript
   interface SOP {
     name: string;
     description: string;
     parameters: Parameter[];
     steps: Step[];
     examples?: Example[];
     troubleshooting?: string;
   }

   interface Parameter {
     name: string;
     required: boolean;
     default?: any;
     description: string;
   }

   interface Step {
     number: number;
     name: string;
     description: string;
     constraints: {
       must: string[];
       should: string[];
       may: string[];
     };
   }
   ```

PHASE 2 - SOP VALIDATOR:
1. Create SOPValidatorService:
   - Validate markdown structure
   - Check required sections (Overview, Parameters, Steps)
   - Validate RFC 2119 keyword usage
   - Check parameter references in steps
   - Return validation errors with line numbers

2. Validation Rules:
   - Overview section MUST exist
   - At least one step MUST be defined
   - Parameters MUST be documented
   - Constraints MUST use RFC 2119 keywords
   - Examples SHOULD be provided

PHASE 3 - SOP REGISTRY:
1. Create SOPRegistryService:
   - Register built-in SOPs on startup
   - Load external SOPs from custom paths
   - First-wins precedence (external overrides built-in)
   - List available SOPs with metadata
   - Search SOPs by name, description, tags

2. Registry Methods:
   - `register(sop: SOP): void`
   - `get(name: string): SOP | null`
   - `list(): SOPMetadata[]`
   - `search(query: string): SOPMetadata[]`
   - `reload(): void`

PHASE 4 - SOP EXECUTOR:
1. Create SOPExecutorService:
   - Execute SOP with parameter injection
   - Track current step and progress
   - Support resumability (save/restore state)
   - Generate execution context for AI
   - Return structured results

2. Execution Flow:
   - Validate parameters
   - Load SOP from registry
   - Inject parameters into steps
   - Generate AI prompt with current step
   - Track progress in state
   - Handle errors and retries

3. Execution Context:
   ```typescript
   interface ExecutionContext {
     sopName: string;
     parameters: Record<string, any>;
     currentStep: number;
     totalSteps: number;
     stepHistory: StepResult[];
     state: Record<string, any>;
   }
   ```

PHASE 5 - PROGRESS TRACKER:
1. Create SOPProgressTracker:
   - Track step-by-step progress
   - Save execution state to disk
   - Resume from last completed step
   - Generate progress reports
   - Emit progress events

2. Progress State:
   ```typescript
   interface ProgressState {
     executionId: string;
     sopName: string;
     startedAt: Date;
     currentStep: number;
     completedSteps: number[];
     stepResults: Record<number, StepResult>;
     status: 'running' | 'paused' | 'completed' | 'failed';
   }
   ```

PHASE 6 - SKILL CONVERTER:
1. Create SkillConverterService:
   - Convert SOP to Anthropic Skills format
   - Generate SKILL.md with frontmatter
   - Create skill directory structure
   - Support batch conversion
   - Validate skill format

2. Skill Format:
   ```markdown
   ---
   name: sop-name
   description: Brief description
   ---

   # SOP Name

   [Full SOP content with instructions]
   ```

3. Output Structure:
   ```
   skills/
   ├── code-assist/
   │   └── SKILL.md
   ├── codebase-summary/
   │   └── SKILL.md
   └── custom-workflow/
       └── SKILL.md
   ```

PHASE 7 - MCP SERVER (OPTIONAL):
1. Create MCPServerService:
   - Expose SOPs as MCP tools
   - Support tool discovery
   - Handle tool execution requests
   - Return structured responses
   - Support external SOP paths

2. MCP Tool Format:
   - Tool name: SOP name
   - Tool description: SOP description
   - Tool parameters: SOP parameters
   - Tool execution: SOPExecutor

PHASE 8 - BUILT-IN SOPS:
1. Create 4 built-in SOP templates:
   - `workflows/code-assist.sop.md` - TDD-based code implementation
   - `workflows/codebase-summary.sop.md` - Comprehensive codebase analysis
   - `workflows/pdd.sop.md` - Prompt-driven development
   - `workflows/code-task-generator.sop.md` - Task breakdown and planning

2. Follow Agent SOP format specification
3. Include all required sections
4. Use RFC 2119 constraints
5. Provide examples and troubleshooting

PHASE 9 - AGENT EXECUTOR INTEGRATION:
1. Enhance AgentExecutor:
   - Detect when SOP should be used
   - Load appropriate SOP from registry
   - Execute with SOPExecutorService
   - Track progress with SOPProgressTracker
   - Return results with SOP metadata

2. Integration Points:
   ```typescript
   async execute(userTask: string, userId?: string): Promise<AgentExecutionResult> {
     // Analyze task
     const analysis = analyzeTask(userTask);
     
     // Check if SOP exists for task type
     const sop = sopRegistry.findBestMatch(analysis.type);
     
     if (sop && shouldEnableWorkflow(analysis, config)) {
       // Execute with SOP
       return await sopExecutor.execute(sop, extractParameters(userTask));
     } else {
       // Execute freeform
       return await this.executeFreeform(userTask, userId);
     }
   }
   ```

PHASE 10 - API ROUTES:
1. Create /api/sop/* endpoints:
   - `GET /api/sop/list` - List available SOPs
   - `GET /api/sop/:name` - Get SOP details
   - `POST /api/sop/execute` - Execute SOP with parameters
   - `GET /api/sop/progress/:executionId` - Get execution progress
   - `POST /api/sop/resume/:executionId` - Resume paused execution
   - `POST /api/sop/validate` - Validate SOP markdown
   - `POST /api/sop/convert-to-skill` - Convert SOP to Skill format
   - `POST /api/sop/reload` - Reload SOPs from disk

2. Request/Response Formats:
   ```typescript
   // Execute SOP
   POST /api/sop/execute
   {
     "sopName": "code-assist",
     "parameters": {
       "task_description": "Implement user authentication",
       "mode": "interactive"
     }
   }

   // Response
   {
     "success": true,
     "data": {
       "executionId": "uuid",
       "sopName": "code-assist",
       "status": "running",
       "currentStep": 1,
       "totalSteps": 8
     }
   }
   ```

REQUIREMENTS:
- TypeScript with ES Modules
- Markdown parsing (use `marked` or `remark`)
- YAML frontmatter parsing (use `gray-matter`)
- RFC 2119 keyword detection
- Parameter injection and validation
- Progress persistence (JSON files)
- Error handling and validation
- External SOP loading with path expansion
- First-wins precedence for external SOPs
- Graceful error handling for malformed SOPs

ENVIRONMENT VARIABLES:
- SOP_PATHS (optional): Colon-separated paths to external SOPs
- SOP_PROGRESS_DIR (optional, default: ./sop-progress): Progress state directory
- SOP_SKILLS_DIR (optional, default: ./skills): Skills output directory

DEPENDENCIES:
```json
{
  "dependencies": {
    "marked": "^11.0.0",
    "gray-matter": "^4.0.3",
    "uuid": "^9.0.0"
  }
}
```
```

---

## 📁 Key Files to Create

### Services:
- `src/services/SOPLoaderService.ts` (200 lines)
- `src/services/SOPValidatorService.ts` (150 lines)
- `src/services/SOPRegistryService.ts` (180 lines)
- `src/services/SOPExecutorService.ts` (250 lines)
- `src/services/SOPProgressTracker.ts` (200 lines)
- `src/services/SkillConverterService.ts` (150 lines)
- `src/services/MCPServerService.ts` (180 lines) [OPTIONAL]

### Built-in SOPs:
- `workflows/code-assist.sop.md` (200 lines)
- `workflows/codebase-summary.sop.md` (180 lines)
- `workflows/pdd.sop.md` (150 lines)
- `workflows/code-task-generator.sop.md` (170 lines)

### API Routes:
- `src/api/sop.routes.ts` (220 lines)

### Types:
- `src/types/sop.types.ts` (100 lines)

### Documentation:
- `docs/AGENT-SOP-INTEGRATION.md` (150 lines)

---

## ✅ SUCCESS CRITERIA

Pack 9 is complete when:
- ✅ All 4 built-in SOPs created and validated
- ✅ SOP loader can parse markdown with RFC 2119 constraints
- ✅ SOP executor can inject parameters and track progress
- ✅ External SOPs can be loaded from custom paths
- ✅ Skills converter generates valid Anthropic Skills format
- ✅ API endpoints work for list, execute, progress, resume
- ✅ AgentExecutor integrates SOP execution
- ✅ Progress is persisted and resumable
- ✅ Tests pass (100%)
- ✅ Documentation complete
- ✅ User approved

---

## 🎯 INTEGRATION WITH EXISTING PACKS

### Pack 3 (Agent Loop) Enhancement:
- AgentExecutor now supports SOP-based execution
- PlannerService can use SOPs for strategic planning
- ToolRegistry includes SOP execution tools

### Pack 4 (Two-Brain System) Enhancement:
- HybridPlannerService can use `pdd.sop.md` for complex planning
- LocalExecutorService can use `code-assist.sop.md` for implementation
- EscalationEngine considers SOP complexity for escalation decisions

### Workflow Config Enhancement:
- `src/config/workflow-config.ts` now includes SOP matching
- Task analysis suggests specific SOPs (not just generic workflows)
- Confidence scoring based on SOP parameter match

---

## 📊 EXPECTED IMPACT

**Development Speed:** 3-4x faster for complex multi-step tasks  
**Code Quality:** More consistent, follows established patterns  
**Onboarding Time:** 60% reduction (SOPs document best practices)  
**AI Reliability:** 90%+ success rate on complex workflows  
**Reusability:** SOPs work across projects and teams  
**LegalOps Completion:** Estimated 3-4 weeks with SOPs vs 12-16 weeks manual  

---

**Use this pack with BUILD_PROMPTS_EXTRACTED.md to complete the builder application!**

