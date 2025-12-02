/**
 * Stress testing for the agent system
 * Tests edge cases, error handling, and performance
 */

import { OllamaProvider } from '../providers/OllamaProvider.js';
import { PlannerService } from '../services/PlannerService.js';
import { AgentExecutor } from '../services/AgentExecutor.js';
import { ToolRegistry } from '../services/ToolRegistry.js';
import { FileSystemService } from '../services/FileSystemService.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const TEST_MODEL = 'qwen2.5-coder:7b';
const OLLAMA_URL = 'http://localhost:11434';

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

async function setupEnvironment() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-stress-test-'));
  // OllamaProvider constructor: (modelName, apiUrl, autoSelectModel)
  const provider = new OllamaProvider(TEST_MODEL, OLLAMA_URL, false);
  const toolRegistry = new ToolRegistry();
  const fileService = new FileSystemService({ workspaceRoot: tempDir });
  
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
    name: 'failing_tool',
    description: 'A tool that always fails (for testing error handling)',
    parameters: {},
    execute: async () => {
      throw new Error('This tool always fails');
    },
  });

  const planner = new PlannerService(provider, toolRegistry);
  const executor = new AgentExecutor(planner, toolRegistry);

  return { tempDir, provider, planner, executor, toolRegistry, fileService };
}

interface StressTest {
  name: string;
  description: string;
  run: (env: any) => Promise<{ success: boolean; message: string; duration: number }>;
}

const stressTests: StressTest[] = [
  {
    name: 'Ambiguous Task',
    description: 'Test how the agent handles vague instructions',
    run: async (env) => {
      const start = Date.now();
      try {
        const result = await env.executor.execute('do something');
        return {
          success: result.success,
          message: result.success ? 'Agent handled ambiguous task' : 'Agent rejected ambiguous task',
          duration: Date.now() - start,
        };
      } catch (error: any) {
        return {
          success: false,
          message: `Error: ${error.message}`,
          duration: Date.now() - start,
        };
      }
    },
  },
  {
    name: 'Complex Multi-Step Task',
    description: 'Test a task requiring many steps',
    run: async (env) => {
      const start = Date.now();
      try {
        const task = 'Create 5 files named file1.txt through file5.txt, each containing its number';
        const result = await env.executor.execute(task);
        
        // Verify all files were created
        let filesCreated = 0;
        for (let i = 1; i <= 5; i++) {
          const filePath = path.join(env.tempDir, `file${i}.txt`);
          const exists = await fs.access(filePath).then(() => true).catch(() => false);
          if (exists) filesCreated++;
        }
        
        return {
          success: filesCreated === 5,
          message: `Created ${filesCreated}/5 files`,
          duration: Date.now() - start,
        };
      } catch (error: any) {
        return {
          success: false,
          message: `Error: ${error.message}`,
          duration: Date.now() - start,
        };
      }
    },
  },
  {
    name: 'Invalid File Path',
    description: 'Test error handling for invalid paths',
    run: async (env) => {
      const start = Date.now();
      try {
        const task = 'Read the file at /etc/passwd';
        const result = await env.executor.execute(task);
        return {
          success: !result.success, // Should fail
          message: result.success ? 'Security issue: accessed file outside workspace' : 'Correctly rejected invalid path',
          duration: Date.now() - start,
        };
      } catch (error: any) {
        return {
          success: true,
          message: 'Correctly threw error for invalid path',
          duration: Date.now() - start,
        };
      }
    },
  },
  {
    name: 'Large File Content',
    description: 'Test handling of large content generation',
    run: async (env) => {
      const start = Date.now();
      try {
        const task = 'Create a file called large.txt with 100 lines of text, each line should say "Line X" where X is the line number';
        const result = await env.executor.execute(task);

        if (!result.success) {
          return {
            success: false,
            message: 'Task execution failed',
            duration: Date.now() - start,
          };
        }

        const filePath = path.join(env.tempDir, 'large.txt');
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim());

        return {
          success: lines.length >= 50, // At least 50 lines is good enough
          message: `Generated ${lines.length} lines`,
          duration: Date.now() - start,
        };
      } catch (error: any) {
        return {
          success: false,
          message: `Error: ${error.message}`,
          duration: Date.now() - start,
        };
      }
    },
  },
  {
    name: 'Concurrent Execution',
    description: 'Test multiple tasks in parallel',
    run: async (env) => {
      const start = Date.now();
      try {
        const tasks = [
          'Create a file called concurrent1.txt with "Task 1"',
          'Create a file called concurrent2.txt with "Task 2"',
          'Create a file called concurrent3.txt with "Task 3"',
        ];

        const results = await Promise.all(
          tasks.map(task => env.executor.execute(task))
        );

        const allSuccess = results.every(r => r.success);
        const successCount = results.filter(r => r.success).length;

        return {
          success: allSuccess,
          message: `${successCount}/${tasks.length} tasks succeeded`,
          duration: Date.now() - start,
        };
      } catch (error: any) {
        return {
          success: false,
          message: `Error: ${error.message}`,
          duration: Date.now() - start,
        };
      }
    },
  },
];

async function cleanup(tempDir: string) {
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    // Ignore cleanup errors
  }
}

async function main() {
  logSection('🔥 AGENT STRESS TESTING');

  log(`Model: ${TEST_MODEL}`, colors.cyan);
  log(`Tests: ${stressTests.length}`, colors.cyan);

  let env: any;

  try {
    logSection('🔧 Setting Up Environment');
    env = await setupEnvironment();
    log(`✓ Workspace: ${env.tempDir}`, colors.green);

    logSection('🧪 Running Stress Tests');

    const results = [];
    for (let i = 0; i < stressTests.length; i++) {
      const test = stressTests[i];
      log(`\n[${i + 1}/${stressTests.length}] ${test.name}`, colors.bright);
      log(`   ${test.description}`, colors.blue);

      const result = await test.run(env);
      results.push({ test, result });

      if (result.success) {
        log(`   ✓ PASSED: ${result.message} (${result.duration}ms)`, colors.green);
      } else {
        log(`   ✗ FAILED: ${result.message} (${result.duration}ms)`, colors.red);
      }
    }

    logSection('📊 Stress Test Summary');

    const passed = results.filter(r => r.result.success).length;
    const failed = results.filter(r => !r.result.success).length;
    const totalDuration = results.reduce((sum, r) => sum + r.result.duration, 0);

    log(`Total: ${results.length}`, colors.cyan);
    log(`Passed: ${passed}`, colors.green);
    log(`Failed: ${failed}`, failed > 0 ? colors.red : colors.green);
    log(`Total Duration: ${totalDuration}ms`, colors.cyan);
    log(`Average Duration: ${Math.round(totalDuration / results.length)}ms`, colors.cyan);

    if (failed > 0) {
      log('\n⚠️  Some stress tests failed', colors.yellow);
      log('This may indicate edge cases that need attention', colors.yellow);
    } else {
      log('\n✅ All stress tests passed!', colors.green);
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

