/**
 * Interactive Agent Testing
 * Allows you to enter queries directly and try to break the agent
 */

import * as readline from 'readline';
import { OllamaProvider } from '../providers/OllamaProvider.js';
import { PlannerService } from '../services/PlannerService.js';
import { AgentExecutor } from '../services/AgentExecutor.js';
import { ToolRegistry } from '../services/ToolRegistry.js';
import { FileSystemService } from '../services/FileSystemService.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Configuration
const TEST_MODEL = 'qwen2.5-coder:7b';
const OLLAMA_URL = 'http://localhost:11434';

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
  // Create temporary workspace
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-interactive-'));

  // Initialize services
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

async function executeTask(task: string, env: any) {
  try {
    log('\n⏳ Generating plan...', colors.yellow);
    const startTime = Date.now();

    const result = await env.executor.execute(task);

    const duration = Date.now() - startTime;

    // Show the plan
    if (result.plan) {
      log(`\n📝 Generated Plan (${result.plan.steps.length} steps):`, colors.cyan);
      result.plan.steps.forEach((step: any, index: number) => {
        log(`  ${index + 1}. [${step.id}] ${step.description}`, colors.cyan);
        log(`     Tool: ${step.tool}`, colors.cyan);
        log(`     Params: ${JSON.stringify(step.parameters)}`, colors.cyan);
      });
    }

    // Show results
    if (result.success) {
      log(`\n✅ Task completed successfully!`, colors.green);
      log(`   Steps: ${result.completedSteps.length}/${result.plan.steps.length}`, colors.cyan);
      log(`   Duration: ${duration}ms`, colors.cyan);

      if (result.metadata) {
        log(`   Iterations: ${result.metadata.iterations}`, colors.cyan);
        log(`   Tools used: ${result.metadata.toolsUsed?.join(', ')}`, colors.cyan);
      }

      // Show output if available
      if (result.output) {
        log(`\n📤 Output:`, colors.blue);
        log(JSON.stringify(result.output, null, 2), colors.blue);
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
  }
}




async function main() {
  log('\n╔════════════════════════════════════════════════════════════╗', colors.bright + colors.cyan);
  log('║       🧪 INTERACTIVE AGENT TESTING - TRY TO BREAK IT!    ║', colors.bright + colors.cyan);
  log('╚════════════════════════════════════════════════════════════╝\n', colors.bright + colors.cyan);

  log(`Model: ${TEST_MODEL}`, colors.cyan);
  log(`Ollama URL: ${OLLAMA_URL}`, colors.cyan);

  let env: any;

  try {
    log('\n🔧 Setting up environment...', colors.yellow);
    env = await setupEnvironment();
    log(`✓ Workspace: ${env.tempDir}`, colors.green);
    log(`✓ Tools registered: ${env.toolRegistry.listTools().length}`, colors.green);

    // Check Ollama
    log('\n🔍 Checking Ollama...', colors.yellow);
    const isAvailable = await env.provider.isAvailable();
    if (!isAvailable) {
      throw new Error('Ollama is not available. Make sure Ollama is running.');
    }
    log('✓ Ollama is available', colors.green);

    log('\n' + '═'.repeat(60), colors.cyan);
    log('💡 TIPS:', colors.bright + colors.yellow);
    log('  - Try simple tasks first: "Create a file called test.txt with Hello"', colors.yellow);
    log('  - Try complex tasks: "Create 5 files with different content"', colors.yellow);
    log('  - Try to break it: Invalid requests, edge cases, etc.', colors.yellow);
    log('  - Type "help" for commands', colors.yellow);
    log('  - Type "exit" to quit', colors.yellow);
    log('═'.repeat(60) + '\n', colors.cyan);

    // Create readline interface
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const askQuestion = (): Promise<string> => {
      return new Promise((resolve) => {
        rl.question(colors.bright + colors.green + '\n🤖 Enter task (or "help"/"exit"): ' + colors.reset, (answer) => {
          resolve(answer.trim());
        });
      });
    };

    // Main loop
    let running = true;
    while (running) {
      const input = await askQuestion();

      if (!input) {
        continue;
      }

      const command = input.toLowerCase();

      if (command === 'exit' || command === 'quit') {
        log('\n👋 Goodbye!', colors.cyan);
        running = false;
        break;
      }

      if (command === 'help') {
        log('\n📚 Available Commands:', colors.cyan);
        log('  help       - Show this help message', colors.cyan);
        log('  tools      - List available tools', colors.cyan);
        log('  workspace  - Show workspace directory', colors.cyan);
        log('  files      - List files in workspace', colors.cyan);
        log('  clear      - Clear the screen', colors.cyan);
        log('  exit       - Exit the program', colors.cyan);
        log('\n💡 Or enter any task for the agent to execute!', colors.yellow);
        continue;
      }

      if (command === 'tools') {
        log('\n🔧 Available Tools:', colors.cyan);
        const tools = env.toolRegistry.listTools();
        tools.forEach((tool: any) => {
          log(`  - ${tool.name}: ${tool.description}`, colors.cyan);
        });
        continue;
      }

      if (command === 'workspace') {
        log(`\n📁 Workspace: ${env.tempDir}`, colors.cyan);
        continue;
      }

      if (command === 'files') {
        try {
          const files = await env.fileService.listFiles('.');
          log('\n📄 Files in workspace:', colors.cyan);
          if (files.length === 0) {
            log('  (empty)', colors.yellow);
          } else {
            files.forEach((file: string) => {
              log(`  - ${file}`, colors.cyan);
            });
          }
        } catch (error: any) {
          log(`Error listing files: ${error.message}`, colors.red);
        }
        continue;
      }

      if (command === 'clear') {
        console.clear();
        continue;
      }

      // Execute the task
      await executeTask(input, env);
    }

    rl.close();

    // Cleanup
    log('\n🧹 Cleaning up...', colors.yellow);
    await fs.rm(env.tempDir, { recursive: true, force: true });
    log('✓ Cleanup complete', colors.green);

  } catch (error: any) {
    log(`\n❌ Fatal error: ${error.message}`, colors.red);
    if (error.stack) {
      log(error.stack, colors.red);
    }
    process.exit(1);
  }
}

main();
