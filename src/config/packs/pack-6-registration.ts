/**
 * Pack 6 Registration - Tools + File System Access
 * 
 * Comprehensive file system tools and code execution capabilities.
 */

import { packRegistry, PackIntegration } from '../pack-registry.js';

const pack6: PackIntegration = {
  id: 'pack-6',
  name: 'Tools + File System Access',
  version: '1.0.0',
  description: 'Comprehensive file system tools and code execution',
  
  features: [
    {
      id: 'pack-6-file-operations',
      name: 'File Operations',
      description: 'Read, write, and manipulate files',
      enabled: true,
      available: true,
      version: '1.0.0'
    },
    {
      id: 'pack-6-code-execution',
      name: 'Code Execution',
      description: 'Execute code in sandboxed environment',
      enabled: true,
      available: true,
      version: '1.0.0'
    },
    {
      id: 'pack-6-shell-service',
      name: 'Shell Service',
      description: 'Execute shell commands',
      enabled: true,
      available: true,
      version: '1.0.0'
    },
    {
      id: 'pack-6-project-scanner',
      name: 'Project Scanner',
      description: 'Scan and analyze project structure',
      enabled: true,
      available: true,
      version: '1.0.0'
    },
    {
      id: 'pack-6-dependency-analyzer',
      name: 'Dependency Analyzer',
      description: 'Analyze project dependencies',
      enabled: true,
      available: true,
      version: '1.0.0'
    },
    {
      id: 'pack-6-diff-service',
      name: 'Diff Service',
      description: 'Generate and apply code diffs',
      enabled: true,
      available: true,
      version: '1.0.0'
    }
  ],

  testCases: [
    {
      category: 'File Operations',
      task: 'Create a file called hello.txt with the text "Hello from the agent"',
      expected: 'Creates text file successfully',
      packId: 'pack-6'
    },
    {
      category: 'File Operations',
      task: 'Create a file called data.json with {"name": "test", "value": 123}',
      expected: 'Creates valid JSON file',
      packId: 'pack-6'
    },
    {
      category: 'File Operations',
      task: 'Create a file with emoji 🚀 and unicode ñ é',
      expected: 'Handles special characters correctly',
      packId: 'pack-6'
    },
    {
      category: 'File Operations',
      task: 'Create a TypeScript file with a simple function',
      expected: 'Creates .ts file with valid TypeScript',
      packId: 'pack-6'
    }
  ],

  enabled: true
};

packRegistry.register(pack6);
export default pack6;

