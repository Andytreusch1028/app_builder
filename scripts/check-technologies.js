#!/usr/bin/env node
/**
 * Quick technology status check script
 * Checks if all required technologies are running
 */

async function checkPort(port) {
  try {
    const response = await fetch(`http://localhost:${port}`, {
      signal: AbortSignal.timeout(2000)
    });
    return true;
  } catch (error) {
    return false;
  }
}

async function checkTechnologies() {
  console.log('🔍 Checking Application Builder Technologies\n');

  // Check Ollama
  const ollamaRunning = await checkPort(11434);
  console.log(`📦 Ollama (port 11434): ${ollamaRunning ? '✅ Running' : '❌ Not Running'}`);

  // Check Letta
  const lettaRunning = await checkPort(8283);
  console.log(`🧠 Letta (port 8283): ${lettaRunning ? '✅ Running' : 'ℹ️  Not Running (optional)'}`);

  // Check Application Server
  const serverRunning = await checkPort(3000);
  console.log(`🏗️  Application Server (port 3000): ${serverRunning ? '✅ Running' : '❌ Not Running'}`);

  console.log('\n');

  if (!ollamaRunning) {
    console.log('⚠️  Ollama is required. Start it with: ollama serve');
  }

  if (!serverRunning) {
    console.log('⚠️  Application server is not running. Start it with: npm start');
  }

  if (ollamaRunning && serverRunning) {
    console.log('✅ All required technologies are running!');
    console.log('🌐 Open: http://localhost:3000/builder.html');
  }
}

checkTechnologies().catch(console.error);

