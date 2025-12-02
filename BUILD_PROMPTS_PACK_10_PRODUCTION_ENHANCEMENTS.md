# 📦 PACK 10: PRODUCTION ENHANCEMENTS

## 🎯 Goal
Enhance existing packs with production-ready technologies: Monaco Editor (Pack 7), pgvector (Pack 5), Vercel AI SDK (Pack 1-2), and evaluate WebContainers for browser-based code execution.

## 📋 Overview
Pack 10 is a **cross-pack enhancement layer** that adds enterprise-grade features to the builder app:
- **Monaco Editor** - VS Code editor in browser (Pack 7 enhancement)
- **pgvector** - PostgreSQL vector search (Pack 5 enhancement)
- **Vercel AI SDK** - Unified LLM provider API (Pack 1-2 enhancement)
- **WebContainers** - Browser-based Node.js runtime (evaluation)

## 🏗️ Components (4 major enhancements)

### Enhancement 1: Monaco Editor Integration (Pack 7)
### Enhancement 2: pgvector Integration (Pack 5)
### Enhancement 3: Vercel AI SDK Migration (Pack 1-2)
### Enhancement 4: WebContainers Evaluation (Optional)

---

## 🎨 ENHANCEMENT 1: MONACO EDITOR INTEGRATION (PACK 7)

### Goal
Add VS Code-quality code editor to the frontend UI with syntax highlighting, IntelliSense, and themes.

### Components (5 files, 800+ lines)

**Files to Create:**
1. `src/ui/components/CodeEditor.tsx` (200 lines)
2. `src/ui/components/MonacoConfig.ts` (150 lines)
3. `src/ui/hooks/useMonacoEditor.ts` (100 lines)
4. `src/ui/themes/monaco-themes.ts` (150 lines)
5. `src/ui/components/DiffEditor.tsx` (200 lines)

### Build Prompt

```
Add Monaco Editor integration to Pack 7 (Frontend UI) with the following requirements:

PHASE 1 - DEPENDENCIES:
1. Install packages:
   npm install @monaco-editor/react monaco-editor
   npm install --save-dev @types/monaco-editor

2. Configure Vite/Webpack for Monaco workers:
   - Setup web workers for syntax highlighting
   - Configure language services
   - Setup editor workers

PHASE 2 - CODE EDITOR COMPONENT:
1. Create src/ui/components/CodeEditor.tsx:
   - Wrapper around @monaco-editor/react
   - Props: language, value, onChange, theme, options
   - Support for TypeScript, JavaScript, Python, JSON, Markdown, etc.
   - Auto-save functionality
   - Error markers and diagnostics
   - Keyboard shortcuts (Cmd+S, Cmd+F, etc.)

2. Features:
   - Syntax highlighting for 100+ languages
   - Line numbers and minimap
   - Code folding
   - Find/replace
   - Multi-cursor editing
   - Bracket matching
   - Auto-indentation

PHASE 3 - INTELLISENSE SETUP:
1. Create src/ui/components/MonacoConfig.ts:
   - TypeScript language configuration
   - JavaScript language configuration
   - Custom language definitions
   - IntelliSense providers (autocomplete, hover, signature help)
   - Diagnostic providers (error checking)

2. TypeScript IntelliSense:
   - Load TypeScript definitions from @types packages
   - Support for project-specific types
   - Import suggestions
   - Parameter hints

PHASE 4 - THEME CONFIGURATION:
1. Create src/ui/themes/monaco-themes.ts:
   - VS Code Dark+ theme (default)
   - VS Code Light+ theme
   - High Contrast theme
   - Custom "Jony Ive" minimal theme (matching existing UI)
   - Theme switcher integration

2. Theme Structure:
   - Base colors (background, foreground, selection)
   - Token colors (keywords, strings, comments, etc.)
   - UI colors (scrollbar, minimap, line numbers)

PHASE 5 - DIFF EDITOR:
1. Create src/ui/components/DiffEditor.tsx:
   - Side-by-side diff view
   - Inline diff view
   - Original vs Modified comparison
   - Syntax highlighting in diff
   - Navigation between changes

PHASE 6 - CUSTOM HOOK:
1. Create src/ui/hooks/useMonacoEditor.ts:
   - Hook for editor instance management
   - Auto-save logic
   - Undo/redo management
   - Content change tracking
   - Editor state persistence

PHASE 7 - INTEGRATION:
1. Update existing UI components to use CodeEditor:
   - Replace textarea elements with CodeEditor
   - Add language detection based on file extension
   - Add theme switcher to settings panel
   - Add keyboard shortcut help modal

REQUIREMENTS:
- TypeScript with React 18
- Lazy loading (Monaco is 5MB, load on-demand)
- Web worker configuration for performance
- Accessibility (ARIA labels, keyboard navigation)
- Mobile-responsive (graceful degradation on mobile)
- Error boundaries for editor crashes
- Performance monitoring (track load time, render time)

DEPENDENCIES:
```json
{
  "dependencies": {
    "@monaco-editor/react": "^4.6.0",
    "monaco-editor": "^0.45.0"
  },
  "devDependencies": {
    "@types/monaco-editor": "^0.45.0"
  }
}
```

CONFIGURATION (vite.config.ts):
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';

export default defineConfig({
  plugins: [
    react(),
    monacoEditorPlugin({
      languageWorkers: ['typescript', 'javascript', 'json', 'css', 'html']
    })
  ]
});
```

SUCCESS CRITERIA:
- ✅ Monaco Editor loads in <2 seconds
- ✅ Syntax highlighting works for TS, JS, Python, JSON, Markdown
- ✅ IntelliSense shows autocomplete suggestions
- ✅ Themes switch correctly (Dark+, Light+, Custom)
- ✅ Diff editor shows side-by-side comparison
- ✅ Auto-save works (debounced, 500ms delay)
- ✅ Keyboard shortcuts work (Cmd+S, Cmd+F, Cmd+Z)
- ✅ No memory leaks (editor cleanup on unmount)
- ✅ Accessible (keyboard navigation, screen reader support)
- ✅ Tests pass (component tests, integration tests)
```

---

## 🔍 ENHANCEMENT 2: PGVECTOR INTEGRATION (PACK 5)

### Goal
Add vector search capabilities to Pack 5 (Memory + RAG) using PostgreSQL pgvector extension.

### Components (6 files, 1,000+ lines)

**Files to Create:**
1. `src/services/VectorEmbeddingService.ts` (200 lines)
2. `src/services/SemanticSearchService.ts` (250 lines)
3. `src/services/HybridSearchService.ts` (200 lines)
4. `src/api/vector-search.routes.ts` (150 lines)
5. `src/scripts/setup-pgvector.ts` (100 lines)
6. `src/types/vector.types.ts` (100 lines)

### Build Prompt

```
Add pgvector integration to Pack 5 (Memory + RAG) with the following requirements:

PHASE 1 - POSTGRESQL EXTENSION SETUP:
1. Create src/scripts/setup-pgvector.ts:
   - Check if PostgreSQL is installed
   - Install pgvector extension (CREATE EXTENSION vector)
   - Create embeddings table with vector column
   - Create indexes (IVFFlat, HNSW)
   - Seed with sample data

2. Database Schema:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;

   CREATE TABLE embeddings (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     content TEXT NOT NULL,
     embedding vector(1536),  -- OpenAI ada-002 dimension
     metadata JSONB,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   -- Create HNSW index for fast similarity search
   CREATE INDEX ON embeddings USING hnsw (embedding vector_cosine_ops);

   -- Create GIN index for metadata filtering
   CREATE INDEX ON embeddings USING gin (metadata);
   ```

PHASE 2 - VECTOR EMBEDDING SERVICE:
1. Create src/services/VectorEmbeddingService.ts:
   - Generate embeddings using OpenAI ada-002 or local model
   - Batch embedding generation (up to 100 texts)
   - Caching layer (Redis or in-memory)
   - Error handling and retries
   - Cost tracking

2. Methods:
   - embedText(text: string): Promise<number[]>
   - embedBatch(texts: string[]): Promise<number[][]>
   - getEmbeddingDimension(): number
   - estimateCost(textCount: number): number

PHASE 3 - SEMANTIC SEARCH SERVICE:
1. Create src/services/SemanticSearchService.ts:
   - Vector similarity search (cosine, L2, inner product)
   - Metadata filtering
   - Pagination and limits
   - Result ranking and scoring
   - Query optimization

2. Methods:
   - search(query: string, options): Promise<SearchResult[]>
   - searchByVector(vector: number[], options): Promise<SearchResult[]>
   - searchWithFilter(query: string, filter: object): Promise<SearchResult[]>
   - rerank(results: SearchResult[]): SearchResult[]

3. Search Options:
   - limit: number (default: 10)
   - threshold: number (minimum similarity score)
   - filter: object (metadata filters)
   - distanceMetric: 'cosine' | 'l2' | 'inner_product'

PHASE 4 - HYBRID SEARCH SERVICE:
1. Create src/services/HybridSearchService.ts:
   - Combine vector search + full-text search
   - Reciprocal Rank Fusion (RRF) for result merging
   - Weighted scoring (vector weight + text weight)
   - Query expansion and synonyms

2. Methods:
   - hybridSearch(query: string, options): Promise<SearchResult[]>
   - fullTextSearch(query: string): Promise<SearchResult[]>
   - mergeResults(vectorResults, textResults): SearchResult[]
   - calculateRRF(results): SearchResult[]

PHASE 5 - API ENDPOINTS:
1. Create src/api/vector-search.routes.ts:
   - POST /api/vector/embed - Generate embeddings
   - POST /api/vector/search - Semantic search
   - POST /api/vector/hybrid-search - Hybrid search
   - POST /api/vector/insert - Insert embeddings
   - DELETE /api/vector/:id - Delete embedding
   - GET /api/vector/stats - Get statistics

2. Request/Response Formats:
   ```typescript
   // POST /api/vector/search
   {
     "query": "How to implement authentication?",
     "limit": 10,
     "threshold": 0.7,
     "filter": { "category": "auth" }
   }

   // Response
   {
     "results": [
       {
         "id": "uuid",
         "content": "...",
         "score": 0.95,
         "metadata": {...}
       }
     ],
     "total": 42,
     "took": 15  // ms
   }
   ```

PHASE 6 - TYPES:
1. Create src/types/vector.types.ts:
   - Embedding interface
   - SearchResult interface
   - SearchOptions interface
   - VectorMetadata interface

REQUIREMENTS:
- PostgreSQL 11+ with pgvector extension
- Node.js pg library for database access
- OpenAI SDK for embeddings (or local embedding model)
- TypeScript with ES Modules
- Error handling and validation
- Connection pooling
- Query optimization
- Monitoring and logging

DEPENDENCIES:
```json
{
  "dependencies": {
    "pg": "^8.11.3",
    "pgvector": "^0.1.8",
    "openai": "^6.9.1"
  },
  "devDependencies": {
    "@types/pg": "^8.10.9"
  }
}
```

ENVIRONMENT VARIABLES:
- DATABASE_URL: PostgreSQL connection string
- OPENAI_API_KEY: For embeddings (if using OpenAI)
- VECTOR_DIMENSION: Embedding dimension (default: 1536)
- VECTOR_INDEX_TYPE: 'hnsw' | 'ivfflat' (default: 'hnsw')

SUCCESS CRITERIA:
- ✅ pgvector extension installed and working
- ✅ Embeddings table created with vector column
- ✅ HNSW index created for fast search
- ✅ Embedding generation works (OpenAI or local)
- ✅ Semantic search returns relevant results
- ✅ Hybrid search combines vector + full-text
- ✅ API endpoints work correctly
- ✅ Search performance <100ms for 10k vectors
- ✅ Tests pass (unit, integration, performance)
- ✅ Documentation complete
```

---

## 🚀 ENHANCEMENT 3: VERCEL AI SDK MIGRATION (PACK 1-2)

### Goal
Migrate existing provider system to Vercel AI SDK for unified API, streaming support, and React hooks.

### Components (7 files, 900+ lines)

**Files to Create/Modify:**
1. `src/providers/VercelAIProvider.ts` (250 lines) - NEW
2. `src/services/StreamingService.ts` (200 lines) - NEW
3. `src/ui/hooks/useChat.ts` (150 lines) - NEW
4. `src/ui/hooks/useCompletion.ts` (100 lines) - NEW
5. `src/api/streaming.routes.ts` (200 lines) - NEW

**Files to Modify:**
1. `src/providers/ProviderRegistry.ts` - Add Vercel AI SDK support
2. `src/services/MultiProviderService.ts` - Integrate streaming

### Build Prompt

```
Migrate Pack 1-2 (Hybrid Compute) to use Vercel AI SDK with the following requirements:

PHASE 1 - DEPENDENCIES:
1. Install Vercel AI SDK:
   npm install ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google

2. Keep existing SDKs for fallback:
   - @anthropic-ai/sdk (fallback)
   - openai (fallback)
   - @google/generative-ai (fallback)

PHASE 2 - VERCEL AI PROVIDER:
1. Create src/providers/VercelAIProvider.ts:
   - Implement ICloudProvider interface
   - Support all existing providers (OpenAI, Anthropic, Google)
   - Unified API using Vercel AI SDK
   - Streaming support with callbacks
   - Tool calling support
   - Error handling and retries

2. Provider Configuration:
   ```typescript
   import { createOpenAI } from '@ai-sdk/openai';
   import { createAnthropic } from '@ai-sdk/anthropic';
   import { createGoogle } from '@ai-sdk/google';

   const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
   const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
   const google = createGoogle({ apiKey: process.env.GOOGLE_API_KEY });
   ```

3. Methods:
   - generateText(prompt, options): Promise<string>
   - streamText(prompt, options, callback): Promise<void>
   - generateObject(prompt, schema): Promise<object>
   - callTool(tool, args): Promise<any>

PHASE 3 - STREAMING SERVICE:
1. Create src/services/StreamingService.ts:
   - Server-Sent Events (SSE) support
   - WebSocket support (optional)
   - Stream buffering and backpressure
   - Error handling in streams
   - Stream cancellation

2. Methods:
   - createStream(prompt, provider): ReadableStream
   - streamToSSE(stream, response): void
   - streamToWebSocket(stream, ws): void
   - cancelStream(streamId): void

PHASE 4 - REACT HOOKS:
1. Create src/ui/hooks/useChat.ts:
   - Chat interface with message history
   - Streaming message updates
   - Auto-scroll to bottom
   - Message retry and edit
   - Typing indicators

2. Hook API:
   ```typescript
   const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
     api: '/api/chat',
     initialMessages: [],
     onFinish: (message) => console.log('Done:', message)
   });
   ```

3. Create src/ui/hooks/useCompletion.ts:
   - Single completion interface
   - Streaming completion updates
   - Completion retry
   - Stop generation

4. Hook API:
   ```typescript
   const { completion, input, handleInputChange, handleSubmit, isLoading, stop } = useCompletion({
     api: '/api/completion',
     onFinish: (completion) => console.log('Done:', completion)
   });
   ```

PHASE 5 - API ENDPOINTS:
1. Create src/api/streaming.routes.ts:
   - POST /api/chat - Chat with streaming
   - POST /api/completion - Single completion with streaming
   - POST /api/generate-object - Structured output
   - POST /api/call-tool - Tool calling

2. Streaming Response Format:
   ```typescript
   // Server-Sent Events format
   data: {"type":"text","content":"Hello"}
   data: {"type":"text","content":" world"}
   data: {"type":"done"}
   ```

PHASE 6 - MIGRATION STRATEGY:
1. Keep existing providers as fallback:
   - If Vercel AI SDK fails, fall back to direct SDK
   - Gradual migration (feature flag)
   - A/B testing between old and new

2. Update ProviderRegistry:
   - Add 'vercel-ai' as new provider type
   - Support both old and new providers
   - Migration flag: USE_VERCEL_AI_SDK (default: true)

3. Update MultiProviderService:
   - Detect if streaming is requested
   - Route to VercelAIProvider if streaming needed
   - Otherwise use existing providers

PHASE 7 - SIMPLIFY ABSTRACTION:
1. Reduce code in existing providers:
   - Remove duplicate streaming logic
   - Remove duplicate error handling
   - Consolidate retry logic
   - Simplify cost calculation

2. Expected code reduction:
   - AnthropicProvider: 200 lines → 100 lines
   - OpenAIProvider: 200 lines → 100 lines
   - GoogleProvider: 200 lines → 100 lines
   - Total reduction: ~300 lines

REQUIREMENTS:
- TypeScript with ES Modules
- Backward compatibility (keep existing providers)
- Feature flag for gradual rollout
- Streaming support (SSE and WebSocket)
- React hooks for UI integration
- Error handling and retries
- Performance monitoring
- Cost tracking

DEPENDENCIES:
```json
{
  "dependencies": {
    "ai": "^3.0.0",
    "@ai-sdk/openai": "^0.0.20",
    "@ai-sdk/anthropic": "^0.0.20",
    "@ai-sdk/google": "^0.0.20"
  }
}
```

ENVIRONMENT VARIABLES:
- USE_VERCEL_AI_SDK: 'true' | 'false' (default: 'true')
- VERCEL_AI_DEBUG: 'true' | 'false' (default: 'false')

SUCCESS CRITERIA:
- ✅ Vercel AI SDK integrated with all providers
- ✅ Streaming works (SSE format)
- ✅ React hooks work (useChat, useCompletion)
- ✅ Backward compatibility maintained
- ✅ Code reduced by ~300 lines
- ✅ Performance same or better
- ✅ All existing tests pass
- ✅ New streaming tests pass
- ✅ Documentation updated
```

---

## 🌐 ENHANCEMENT 4: WEBCONTAINERS EVALUATION (OPTIONAL)

### Goal
Evaluate WebContainers for browser-based code execution. Conduct licensing review, proof-of-concept, and performance testing.

### Components (3 evaluation tasks)

**Tasks:**
1. Licensing Review (1 day)
2. Proof-of-Concept (2-3 days)
3. Performance Testing (1 day)

### Evaluation Prompt

```
Evaluate WebContainers for browser-based code execution:

PHASE 1 - LICENSING REVIEW:
1. Research StackBlitz WebContainers licensing:
   - Is it open-source or proprietary?
   - Commercial use restrictions?
   - Cost for commercial projects?
   - Self-hosting allowed?
   - Attribution requirements?

2. Document findings in docs/WEBCONTAINERS_LICENSE_REVIEW.md

PHASE 2 - PROOF-OF-CONCEPT:
1. Create minimal POC (src/poc/webcontainers-test.ts):
   - Install @webcontainer/api
   - Boot WebContainer instance
   - Create simple Node.js file
   - Execute code in container
   - Capture output
   - Measure boot time and execution time

2. Test Cases:
   - Simple console.log
   - NPM package installation
   - Express server
   - File system operations
   - Error handling

PHASE 3 - PERFORMANCE TESTING:
1. Benchmark WebContainers vs native Node.js:
   - Boot time (WebContainers vs native)
   - Execution speed (WebContainers vs native)
   - Memory usage
   - NPM install time
   - File I/O performance

2. Document results in docs/WEBCONTAINERS_PERFORMANCE.md

DECISION CRITERIA:
- ✅ Licensing allows commercial use
- ✅ Boot time <2 seconds
- ✅ Execution speed within 3x of native
- ✅ Memory usage <500MB
- ✅ NPM install works reliably
- ✅ File system API complete

If all criteria met → Integrate into Pack 6 (Tools + FS)
If criteria not met → Document and skip
```

---

## 📊 PACK 10 SUMMARY

### Total Components: 18 files, 2,700+ lines

**Enhancement 1 (Monaco Editor):** 5 files, 800 lines  
**Enhancement 2 (pgvector):** 6 files, 1,000 lines  
**Enhancement 3 (Vercel AI SDK):** 7 files, 900 lines  
**Enhancement 4 (WebContainers):** Evaluation only  

### Integration Points

**Pack 1-2 (Hybrid Compute):**
- Add Vercel AI SDK as new provider
- Add streaming support
- Add React hooks

**Pack 5 (Memory + RAG):**
- Add pgvector for vector search
- Add semantic search API
- Add hybrid search

**Pack 7 (Frontend UI):**
- Add Monaco Editor component
- Add code editor to UI
- Add diff editor

### Dependencies

```json
{
  "dependencies": {
    "@monaco-editor/react": "^4.6.0",
    "monaco-editor": "^0.45.0",
    "pg": "^8.11.3",
    "pgvector": "^0.1.8",
    "ai": "^3.0.0",
    "@ai-sdk/openai": "^0.0.20",
    "@ai-sdk/anthropic": "^0.0.20",
    "@ai-sdk/google": "^0.0.20",
    "@webcontainer/api": "^1.1.0"
  },
  "devDependencies": {
    "@types/monaco-editor": "^0.45.0",
    "@types/pg": "^8.10.9",
    "vite-plugin-monaco-editor": "^1.1.0"
  }
}
```

### Environment Variables

```
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

---

## ✅ SUCCESS CRITERIA

Pack 10 is complete when:
- ✅ Monaco Editor integrated and working in Pack 7
- ✅ pgvector integrated and working in Pack 5
- ✅ Vercel AI SDK integrated and working in Pack 1-2
- ✅ WebContainers evaluated (decision documented)
- ✅ All existing tests still pass
- ✅ New tests pass (Monaco, pgvector, Vercel AI SDK)
- ✅ Performance benchmarks meet targets
- ✅ Documentation complete
- ✅ User approved

---

**Use this pack to enhance the builder app with production-ready technologies!**

