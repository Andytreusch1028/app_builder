/**
 * Pack 7 Registration - Frontend UI + GitHub
 * 
 * Complete Next.js 14 web UI with real-time features and GitHub integration.
 */

import { packRegistry, PackIntegration } from '../pack-registry.js';

const pack7: PackIntegration = {
  id: 'pack-7',
  name: 'Frontend UI + GitHub',
  version: '1.0.0',
  description: 'Next.js 14 web UI with real-time features and GitHub integration',
  
  features: [
    {
      id: 'pack-7-chat-panel',
      name: 'Chat Panel',
      description: 'Real-time chat interface',
      enabled: true,
      available: true,
      version: '1.0.0'
    },
    {
      id: 'pack-7-file-browser',
      name: 'File Browser',
      description: 'Browse and navigate project files',
      enabled: true,
      available: true,
      version: '1.0.0'
    },
    {
      id: 'pack-7-code-editor',
      name: 'Code Editor',
      description: 'In-browser code editing',
      enabled: true,
      available: true,
      version: '1.0.0'
    },
    {
      id: 'pack-7-diff-viewer',
      name: 'Diff Viewer',
      description: 'Visual diff comparison',
      enabled: true,
      available: true,
      version: '1.0.0'
    },
    {
      id: 'pack-7-git-service',
      name: 'Git Service',
      description: 'GitHub integration and version control',
      enabled: true,
      available: true,
      version: '1.0.0'
    },
    {
      id: 'pack-7-websocket',
      name: 'WebSocket Service',
      description: 'Real-time bidirectional communication',
      enabled: true,
      available: true,
      version: '1.0.0'
    }
  ],

  testCases: [
    {
      category: 'UI Components',
      task: 'Display file browser',
      expected: 'File browser shows project structure',
      packId: 'pack-7'
    }
  ],

  enabled: true
};

packRegistry.register(pack7);
export default pack7;

