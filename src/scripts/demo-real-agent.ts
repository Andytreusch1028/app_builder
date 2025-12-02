/**
 * Interactive demo of the real agent system
 * Allows users to input tasks and see the agent execute them
 */

import * as readline from 'readline';
import { OllamaProvider } from '../providers/OllamaProvider.js';
import { PlannerService } from '../services/PlannerService.js';
import { AgentExecutor } from '../services/AgentExecutor.js';
import { ToolRegistry } from '../services/ToolRegistry.js';
import { FileSystemService } from '../services/FileSystemService.js';
import * as fs from 'fs/promises';
import * as path from 'path';

// Configuration
const TEST_MODEL = 'qwen2.5-coder:7b';
const OLLAMA_URL = 'http://localhost:11434';
const WORKSPACE_DIR = './agent-workspace';

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function setupEnvironment() {
  // Create workspace if it doesn't exist
  await fs.mkdir(WORKSPACE_DIR, { recursive: true });
  
  // Initialize services
  // OllamaProvider constructor: (modelName, apiUrl, autoSelectModel)
  const provider = new OllamaProvider(TEST_MODEL, OLLAMA_URL, false);
  const toolRegistry = new ToolRegistry();
  const fileService = new FileSystemService({ workspaceRoot: WORKSPACE_DIR });
  
  // Register tools
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

  toolRegistry.register({
    name: 'delete_file',
    description: 'Delete a file',
    parameters: {
      path: { type: 'string', description: 'File path', required: true },
    },
    execute: async (params) => {
      await fileService.deleteFile(params.path);
      return { success: true, output: `File deleted: ${params.path}` };
    },
  });

  const planner = new PlannerService(provider, toolRegistry);
  const executor = new AgentExecutor(planner, toolRegistry);

  return { provider, planner, executor, toolRegistry, fileService };
}

async function executeTask(task: string, env: any) {
  try {
    log('\n⏳ Generating execution plan...', colors.yellow);
    const startTime = Date.now();

    // Try to generate plan first to see what's happening
    let plan;
    try {
      plan = await env.planner.generatePlan(task);
      log(`✓ Plan generated with ${plan.steps.length} steps`, colors.green);
    } catch (planError: any) {
      log(`\n❌ Plan generation failed: ${planError.message}`, colors.red);
      log(`\n💡 This usually means Ollama returned invalid JSON.`, colors.yellow);
      log(`   Try a simpler task or check if Ollama is working correctly.`, colors.yellow);
      return;
    }

    const result = await env.executor.execute(task);

    const duration = Date.now() - startTime;

    if (result.success) {
      log(`\n✅ Task completed successfully!`, colors.green);
      log(`   Steps: ${result.completedSteps.length}/${result.plan.steps.length}`, colors.cyan);
      log(`   Duration: ${duration}ms`, colors.cyan);

      if (result.metadata) {
        log(`   Iterations: ${result.metadata.iterations}`, colors.cyan);
        log(`   Tools used: ${result.metadata.toolsUsed?.join(', ')}`, colors.cyan);
      }
    } else {
      log(`\n❌ Task failed`, colors.red);
      log(`   Steps completed: ${result.completedSteps.length}/${result.plan.steps.length}`, colors.yellow);
      if (result.error) {
        log(`   Error: ${result.error}`, colors.red);
      }
      if (result.failedSteps.length > 0) {
        log(`   Failed steps:`, colors.red);
        result.failedSteps.forEach((step: any) => {
          log(`     - ${step.description}: ${step.error || 'Unknown error'}`, colors.red);
        });
      }
    }
  } catch (error: any) {
    log(`\n❌ Error: ${error.message}`, colors.red);

    // Show more helpful error messages
    if (error.message.includes('JSON')) {
      log(`\n💡 Tip: The AI model returned invalid JSON.`, colors.yellow);
      log(`   This can happen with local models. Try:`, colors.yellow);
      log(`   1. A simpler task`, colors.blue);
      log(`   2. Restarting Ollama`, colors.blue);
      log(`   3. Using a different model`, colors.blue);
    }

    console.error('\nFull error:', error);
  }
}

async function main() {
  console.clear();
  log('╔════════════════════════════════════════════════════════════╗', colors.cyan);
  log('║         🤖 INTERACTIVE AGENT DEMO                         ║', colors.bright + colors.cyan);
  log('╚════════════════════════════════════════════════════════════╝', colors.cyan);
  
  log(`\nModel: ${colors.bright}${TEST_MODEL}${colors.reset}`);
  log(`Workspace: ${colors.bright}${path.resolve(WORKSPACE_DIR)}${colors.reset}`);
  
  log('\n🔧 Setting up environment...', colors.yellow);
  const env = await setupEnvironment();

  log('✓ Environment ready!', colors.green);
  log(`✓ ${env.toolRegistry.listTools().length} tools available`, colors.green);

  // Show example tasks
  log('\n📝 Example tasks you can try:', colors.cyan);
  log('  • Create a file called hello.txt with "Hello World"', colors.blue);
  log('  • Write a TypeScript function to calculate fibonacci and save it to math.ts', colors.blue);
  log('  • List all files in the current directory', colors.blue);
  log('  • Create a package.json file with name "my-app" and version "1.0.0"', colors.blue);

  log('\n💡 Type "exit" or "quit" to stop', colors.yellow);
  log('━'.repeat(60), colors.cyan);

  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = (): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(`\n${colors.bright}${colors.magenta}Task >${colors.reset} `, (answer) => {
        resolve(answer.trim());
      });
    });
  };

  // Main loop
  while (true) {
    const task = await askQuestion();

    if (!task) {
      continue;
    }

    if (task.toLowerCase() === 'exit' || task.toLowerCase() === 'quit') {
      log('\n👋 Goodbye!', colors.cyan);
      rl.close();
      break;
    }

    if (task.toLowerCase() === 'help') {
      log('\n📚 Available commands:', colors.cyan);
      log('  • Any natural language task description', colors.blue);
      log('  • "tools" - List available tools', colors.blue);
      log('  • "stats" - Show tool execution statistics', colors.blue);
      log('  • "clear" - Clear the screen', colors.blue);
      log('  • "exit" or "quit" - Exit the demo', colors.blue);
      continue;
    }

    if (task.toLowerCase() === 'tools') {
      log('\n🔧 Available tools:', colors.cyan);
      const tools = env.toolRegistry.listTools();
      tools.forEach((tool: any) => {
        log(`  • ${tool.name}: ${tool.description}`, colors.blue);
      });
      continue;
    }

    if (task.toLowerCase() === 'stats') {
      log('\n📊 Tool execution statistics:', colors.cyan);
      const stats = env.toolRegistry.getAllStats();
      for (const [toolName, toolStats] of Object.entries(stats)) {
        const s = toolStats as any;
        log(`  • ${toolName}:`, colors.blue);
        log(`    - Total: ${s.totalExecutions}`, colors.cyan);
        log(`    - Success: ${s.successfulExecutions}`, colors.green);
        log(`    - Failed: ${s.failedExecutions}`, s.failedExecutions > 0 ? colors.red : colors.cyan);
      }
      continue;
    }

    if (task.toLowerCase() === 'clear') {
      console.clear();
      continue;
    }

    // Execute the task
    await executeTask(task, env);
  }
}

main().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});

