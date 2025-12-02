/**
 * Real-world agent testing with actual Ollama models
 * Tests the complete agent system with real AI responses
 */

import { OllamaProvider } from '../providers/OllamaProvider.js';
import { PlannerService } from '../services/PlannerService.js';
import { AgentExecutor } from '../services/AgentExecutor.js';
import { ToolRegistry } from '../services/ToolRegistry.js';
import { FileSystemService } from '../services/FileSystemService.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Test configuration
const TEST_MODEL = 'qwen2.5-coder:7b';
const OLLAMA_URL = 'http://localhost:11434';

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(60) + '\n');
}

async function setupTestEnvironment() {
  // Create temporary workspace
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-real-test-'));
  
  // Initialize services
  // OllamaProvider constructor: (modelName, apiUrl, autoSelectModel)
  const provider = new OllamaProvider(TEST_MODEL, OLLAMA_URL, false);
  const toolRegistry = new ToolRegistry();
  const fileService = new FileSystemService({ workspaceRoot: tempDir });
  
  // Register file system tools
  toolRegistry.register({
    name: 'write_file',
    description: 'Write content to a file',
    parameters: {
      path: { type: 'string', description: 'File path', required: true },
      content: { type: 'string', description: 'File content', required: true },
    },
    execute: async (params) => {
      await fileService.writeFile(params.path, params.content);
      return { success: true, output: `File written: ${params.path}` };
    },
  });

  toolRegistry.register({
    name: 'read_file',
    description: 'Read content from a file',
    parameters: {
      path: { type: 'string', description: 'File path', required: true },
    },
    execute: async (params) => {
      const content = await fileService.readFile(params.path);
      return { success: true, output: content };
    },
  });

  toolRegistry.register({
    name: 'list_files',
    description: 'List files in a directory',
    parameters: {
      path: { type: 'string', description: 'Directory path', required: false, default: '.' },
    },
    execute: async (params) => {
      const files = await fileService.listFiles(params.path || '.');
      return { success: true, output: files };
    },
  });

  const planner = new PlannerService(provider, toolRegistry);
  const executor = new AgentExecutor(planner, toolRegistry);

  return { tempDir, provider, planner, executor, toolRegistry, fileService };
}

async function cleanup(tempDir: string) {
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
    log(`✓ Cleaned up temp directory: ${tempDir}`, colors.green);
  } catch (error) {
    log(`✗ Cleanup failed: ${error}`, colors.red);
  }
}

interface TestCase {
  name: string;
  task: string;
  validate: (tempDir: string, result: any) => Promise<boolean>;
}

const testCases: TestCase[] = [
  {
    name: 'Simple File Creation',
    task: 'Create a file called hello.txt with the text "Hello, World!"',
    validate: async (tempDir, result) => {
      const filePath = path.join(tempDir, 'hello.txt');
      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      if (!exists) return false;
      const content = await fs.readFile(filePath, 'utf-8');
      return content.includes('Hello, World!');
    },
  },
  {
    name: 'Simple Code File Creation',
    task: 'Create a file called math.ts with the text "export function add(a: number, b: number) { return a + b; }"',
    validate: async (tempDir, result) => {
      const filePath = path.join(tempDir, 'math.ts');
      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      if (!exists) return false;
      const content = await fs.readFile(filePath, 'utf-8');
      return content.includes('add') && content.includes('function');
    },
  },
  {
    name: 'Multi-File Workflow',
    task: 'Create a file called config.json with {"name": "test", "version": "1.0.0"}, then create a readme.md file that describes the config',
    validate: async (tempDir, result) => {
      const configPath = path.join(tempDir, 'config.json');
      const readmePath = path.join(tempDir, 'readme.md');
      const configExists = await fs.access(configPath).then(() => true).catch(() => false);
      const readmeExists = await fs.access(readmePath).then(() => true).catch(() => false);
      if (!configExists || !readmeExists) return false;
      const configContent = await fs.readFile(configPath, 'utf-8');
      return configContent.includes('test') && configContent.includes('1.0.0');
    },
  },
];

async function runTest(testCase: TestCase, env: any): Promise<{ success: boolean; duration: number; error?: string }> {
  const startTime = Date.now();

  try {
    log(`\n📋 Task: ${testCase.task}`, colors.blue);

    // Execute the task
    log('⏳ Generating plan...', colors.yellow);
    const result = await env.executor.execute(testCase.task);

    // Debug: Show the plan that was generated
    if (result.plan) {
      log(`\n📝 Generated Plan:`, colors.cyan);
      result.plan.steps.forEach((step: any, index: number) => {
        log(`  ${index + 1}. [${step.id}] ${step.description}`, colors.cyan);
        log(`     Tool: ${step.tool}`, colors.cyan);
        log(`     Params: ${JSON.stringify(step.parameters)}`, colors.cyan);
      });
    }

    if (!result.success) {
      // Debug: Show failed steps
      if (result.failedSteps && result.failedSteps.length > 0) {
        log(`\n❌ Failed Steps:`, colors.red);
        result.failedSteps.forEach((step: any) => {
          log(`  - [${step.id}] ${step.description}`, colors.red);
          log(`    Error: ${step.error || 'Unknown'}`, colors.red);
        });
      }

      return {
        success: false,
        duration: Date.now() - startTime,
        error: `Execution failed: ${result.error || 'Unknown error'}`,
      };
    }

    log(`✓ Plan executed (${result.completedSteps.length}/${result.plan.steps.length} steps)`, colors.green);

    // Validate the result
    log('🔍 Validating output...', colors.yellow);
    const isValid = await testCase.validate(env.tempDir, result);

    const duration = Date.now() - startTime;

    if (isValid) {
      log(`✓ Validation passed (${duration}ms)`, colors.green);
      return { success: true, duration };
    } else {
      return {
        success: false,
        duration,
        error: 'Validation failed',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      duration: Date.now() - startTime,
      error: error.message,
    };
  }
}

async function main() {
  logSection('🤖 REAL-WORLD AGENT TESTING');

  log(`Model: ${TEST_MODEL}`, colors.cyan);
  log(`Ollama URL: ${OLLAMA_URL}`, colors.cyan);

  let env: any;

  try {
    // Setup
    logSection('🔧 Setting Up Test Environment');
    env = await setupTestEnvironment();
    log(`✓ Workspace: ${env.tempDir}`, colors.green);
    log(`✓ Tools registered: ${env.toolRegistry.listTools().length}`, colors.green);

    // Check Ollama availability
    log('\n🔍 Checking Ollama availability...', colors.yellow);
    const isAvailable = await env.provider.isAvailable();
    if (!isAvailable) {
      throw new Error('Ollama is not available. Make sure Ollama is running and the model is pulled.');
    }
    log('✓ Ollama is available', colors.green);

    // Run tests
    logSection('🧪 Running Test Cases');

    const results = [];
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      log(`\n[${i + 1}/${testCases.length}] ${testCase.name}`, colors.bright);

      const result = await runTest(testCase, env);
      results.push({ testCase, result });

      if (result.success) {
        log(`✓ PASSED`, colors.green);
      } else {
        log(`✗ FAILED: ${result.error}`, colors.red);
      }
    }

    // Summary
    logSection('📊 Test Summary');

    const passed = results.filter(r => r.result.success).length;
    const failed = results.filter(r => !r.result.success).length;
    const totalDuration = results.reduce((sum, r) => sum + r.result.duration, 0);

    log(`Total: ${results.length}`, colors.cyan);
    log(`Passed: ${passed}`, colors.green);
    log(`Failed: ${failed}`, failed > 0 ? colors.red : colors.green);
    log(`Total Duration: ${totalDuration}ms`, colors.cyan);
    log(`Average Duration: ${Math.round(totalDuration / results.length)}ms`, colors.cyan);

    if (failed > 0) {
      log('\n❌ Some tests failed', colors.red);
      process.exit(1);
    } else {
      log('\n✅ All tests passed!', colors.green);
    }

  } catch (error: any) {
    log(`\n❌ Error: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  } finally {
    if (env) {
      await cleanup(env.tempDir);
    }
  }
}

main();

