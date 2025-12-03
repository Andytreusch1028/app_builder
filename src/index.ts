import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { createAgentRouter } from './api/agent.routes.js';
import { createBuilderRouter } from './api/builder.routes.js';
import { createHybridAgentRouter } from './api/hybrid-agent.routes.js';
import { createMemoryRouter } from './api/memory.routes.js';
import { createRAGRouter } from './api/rag.routes.js';
import { createDeepAgentsRouter } from './api/deepagents.routes.js';
import technologyRoutes from './api/technology.routes.js';
import { ToolRegistry } from './services/ToolRegistry.js';
import { FileSystemService } from './services/FileSystemService.js';
import { OllamaProvider } from './providers/OllamaProvider.js';
import { AnthropicProvider } from './providers/AnthropicProvider.js';
import { AdaptiveProviderService } from './services/AdaptiveProviderService.js';
import { EmbeddingService } from './services/EmbeddingService.js';
import { MemoryService } from './services/MemoryService.js';
import { RAGService } from './services/RAGService.js';
import { webSocketManager } from './services/WebSocketManager.js';
import { WebSocketService } from './services/WebSocketService.js';
import { packRegistry } from './config/pack-registry.js';
import { ProviderOrchestrator } from './services/ProviderOrchestrator.js';
import { PlannerService } from './services/PlannerService.js';
import { AgentExecutor } from './services/AgentExecutor.js';

// Load pack registrations (auto-discovery of all technologies)
import './config/packs/pack-3-registration.js';
import './config/packs/pack-4-registration.js';
import './config/packs/pack-5-registration.js';
import './config/packs/pack-6-registration.js';
import './config/packs/pack-7-registration.js';
import './config/packs/pack-8-registration.js';
import './config/packs/pack-9-registration.js';
import './config/packs/pack-10-registration.js';
import './config/packs/pack-11-registration.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Debug: Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Serve static files from public directory
// When compiled, __dirname is 'dist', so we need to look in 'dist/public'
const publicPath = path.join(__dirname, 'public');
console.log('Static files directory:', publicPath);
console.log('__dirname:', __dirname);
app.use(express.static(publicPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// Serve built projects for preview
const projectsPath = path.join(__dirname, '..', 'projects');
app.use('/projects', express.static(projectsPath));

// Favicon route to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No content
});

// Initialize services for agent routes
const toolRegistry = new ToolRegistry();
const fileService = new FileSystemService({
  workspaceRoot: process.cwd()
});

// Register file system tools
toolRegistry.register({
  name: 'create_file',
  description: 'Create a new file with content',
  parameters: {
    path: { type: 'string', required: true, description: 'Path to the file' },
    content: { type: 'string', required: true, description: 'Content to write' }
  },
  execute: async (params: any) => {
    await fileService.writeFile(params.path, params.content);
    return { success: true, output: `File created: ${params.path}` };
  }
});

toolRegistry.register({
  name: 'write_file',
  description: 'Write content to a file (creates or overwrites)',
  parameters: {
    path: { type: 'string', required: true, description: 'Path to the file' },
    content: { type: 'string', required: true, description: 'Content to write' }
  },
  execute: async (params: any) => {
    await fileService.writeFile(params.path, params.content);
    return { success: true, output: `File written: ${params.path}` };
  }
});

toolRegistry.register({
  name: 'read_file',
  description: 'Read content from a file',
  parameters: {
    path: { type: 'string', required: true, description: 'Path to the file' }
  },
  execute: async (params: any) => {
    const content = await fileService.readFile(params.path);
    return { success: true, output: content };
  }
});

// Initialize Ollama providers
// Main provider: qwen2.5-coder:7b for code execution (high quality)
const ollamaProvider = new OllamaProvider(
  process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b',
  process.env.OLLAMA_URL || 'http://localhost:11434',
  false
);

// Fast planning provider: qwen2.5-coder:1.5b for task planning (speed optimized)
const fastPlanningProvider = new OllamaProvider(
  process.env.OLLAMA_PLANNING_MODEL || 'qwen2.5-coder:1.5b',
  process.env.OLLAMA_URL || 'http://localhost:11434',
  false
);

// Initialize Claude provider for cloud fallback (optional)
let claudeProvider: AnthropicProvider | undefined;
if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_key_here') {
  claudeProvider = new AnthropicProvider(
    process.env.ANTHROPIC_API_KEY,
    'claude-3-5-sonnet-20241022' // Fast Sonnet 3.5 for speed
  );
  console.log('✅ Claude provider initialized for cloud fallback');
} else {
  console.log('⚠️  Claude provider not available (no API key)');
}

// Initialize Adaptive Provider Service for intelligent provider selection
const adaptiveProvider = new AdaptiveProviderService({
  fastProvider: fastPlanningProvider,      // 1.5b for simple tasks
  standardProvider: ollamaProvider,        // 7b for complex tasks
  cloudProvider: claudeProvider || ollamaProvider, // Claude fallback or 7b
  minQualityScore: 70,                     // Escalate if quality < 70%
  maxValidationFailures: 2,                // Escalate after 2 failures
  maxResponseTime: 30000,                  // Escalate if > 30s
  timeoutWarningThreshold: 20000           // Warn if > 20s
});

console.log('🚀 Initialized provider hierarchy:');
console.log('   - Fast provider:', fastPlanningProvider.name, '(1.5b - planning/validation)');
console.log('   - Standard provider:', ollamaProvider.name, '(7b - code generation)');
console.log('   - Cloud fallback:', claudeProvider ? claudeProvider.name : 'disabled', '(quality/time escalation)');
console.log('🔍 DEBUG: adaptiveProvider created:', !!adaptiveProvider);
console.log('🔍 DEBUG: adaptiveProvider type:', adaptiveProvider.constructor.name);

// Mount agent routes with Pack 11 enabled
app.use('/api/agent', createAgentRouter({
  provider: ollamaProvider,
  toolRegistry,
  enableEnhancements: true // Enable advanced features (Letta, Context, Self-Improvement, etc.)
}));

// Mount hybrid agent routes (Pack 4: Two-Brain System)
app.use('/api/hybrid-agent', createHybridAgentRouter({
  cloudProvider: ollamaProvider, // Will use cloud provider when needed
  localProvider: ollamaProvider, // Local Ollama for fast execution
  toolRegistry
}));

// Initialize Pack 5: Memory + RAG services
const embeddingService = new EmbeddingService();
const memoryService = new MemoryService(
  embeddingService,
  path.join(__dirname, '..', 'data', 'memory')
);
const ragService = new RAGService(memoryService);

// Mount memory routes (Pack 5: Memory + RAG)
app.use('/api/memory', createMemoryRouter({
  memoryService,
  ragService
}));

// Mount RAG routes (Pack 5: Memory + RAG)
app.use('/api/rag', createRAGRouter({
  ragService
}));

// Mount DeepAgentsJS routes
app.use('/api/deepagents', createDeepAgentsRouter({
  provider: ollamaProvider,
  fileSystemService: new FileSystemService({ workspaceRoot: path.join(__dirname, '..') }),
  workspaceRoot: path.join(__dirname, '..')
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Create HTTP server
const server = http.createServer(app);

// Mount technology management routes
app.use('/api/technologies', technologyRoutes);

// Mount builder routes with Pack 11 Phase 2 + DeepAgentsJS + Adaptive Provider enabled
// Note: agentExecutor will be created lazily on first build request
app.use('/api/builder', createBuilderRouter({
  workspaceRoot: path.join(__dirname, '..'),
  llmProvider: ollamaProvider,
  planningProvider: fastPlanningProvider, // Use fast 1.5b model for planning
  adaptiveProvider: adaptiveProvider, // Intelligent provider selection with cloud fallback
  enableSelfImprovement: true,
  enableQwenOptimization: true,
  enableDeepAgents: true,
  wsService: webSocketManager, // Pass WebSocket manager for real-time updates
  toolRegistry: toolRegistry // Pass toolRegistry so executor can be created on-demand
}));

// Catch-all 404 handler (must be last)
app.use((req, res) => {
  console.log(`404 Not Found: ${req.url}`);
  res.status(404).send(`Cannot ${req.method} ${req.url}`);
});

// Start server
server.listen(PORT, async () => {
  console.log(`Coding AI Platform v2 running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Agent Testing: http://localhost:${PORT}/test-agent.html`);
  console.log(`🏗️  Application Builder: http://localhost:${PORT}/builder.html`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);

  // Initialize WebSocket server for real-time updates
  console.log('\n🔌 Initializing WebSocket server...');
  webSocketManager.initialize(server);
  console.log('✅ WebSocket server initialized');

  // Initialize Pack 5: Memory service
  console.log('\n📦 Initializing Memory + RAG services...');
  await memoryService.initialize();
  console.log('✅ Memory service initialized');

  // Initialize registered packs
  console.log('\n🎯 Initializing registered packs...');
  await packRegistry.initializeAll();

  const summary = packRegistry.getStatusSummary();
  console.log(`\n✅ ${summary.enabledPacks}/${summary.totalPacks} packs enabled`);
  console.log(`✅ ${summary.enabledFeatures}/${summary.totalFeatures} features available\n`);
});

export default app;

