#!/usr/bin/env node
/**
 * Cross-platform startup script for Application Builder
 * Checks and starts all required technologies, then starts the server
 */

import { spawn } from 'child_process';
import { platform } from 'os';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Application Builder - Starting All Technologies\n');

// Determine which script to run based on platform
const isWindows = platform() === 'win32';
const scriptPath = join(__dirname, isWindows ? 'start-technologies.ps1' : 'start-technologies.sh');

// Run the appropriate startup script
const startupProcess = spawn(
  isWindows ? 'powershell.exe' : 'bash',
  isWindows ? ['-ExecutionPolicy', 'Bypass', '-File', scriptPath] : [scriptPath],
  {
    stdio: 'inherit',
    shell: true
  }
);

startupProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n📦 Building TypeScript...\n');
    
    // Build TypeScript
    const buildProcess = spawn('npm', ['run', 'build'], {
      stdio: 'inherit',
      shell: true,
      cwd: join(__dirname, '..')
    });

    buildProcess.on('close', (buildCode) => {
      if (buildCode === 0) {
        console.log('\n🚀 Starting Application Builder Server...\n');
        
        // Start the server
        const serverProcess = spawn('npm', ['start'], {
          stdio: 'inherit',
          shell: true,
          cwd: join(__dirname, '..')
        });

        serverProcess.on('error', (error) => {
          console.error('❌ Failed to start server:', error);
          process.exit(1);
        });
      } else {
        console.error('❌ Build failed');
        process.exit(1);
      }
    });
  } else {
    console.error('❌ Technology startup check failed');
    console.log('\n⚠️  Some technologies may not be running. You can still start the server manually with: npm start');
    process.exit(code);
  }
});

startupProcess.on('error', (error) => {
  console.error('❌ Failed to run startup script:', error);
  process.exit(1);
});

