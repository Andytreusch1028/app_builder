/**
 * Pre-flight check - Run before starting any new pack
 * Validates that all dependencies and previous packs are working
 */

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

async function checkNodeVersion() {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);
  
  if (major >= 18) {
    log(`✓ Node.js version: ${version}`, colors.green);
    return true;
  } else {
    log(`✗ Node.js version too old: ${version} (need >= 18)`, colors.red);
    return false;
  }
}

async function checkOllamaAvailability() {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (response.ok) {
      const data = await response.json();
      const models = data.models?.map((m: any) => m.name) || [];
      log(`✓ Ollama is running`, colors.green);
      log(`  Models: ${models.join(', ')}`, colors.cyan);
      return true;
    } else {
      log(`✗ Ollama returned error: ${response.status}`, colors.red);
      return false;
    }
  } catch (error) {
    log(`✗ Ollama is not running`, colors.red);
    log(`  Start with: ollama serve`, colors.yellow);
    return false;
  }
}

async function checkRequiredModels() {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    const data = await response.json();
    const models = data.models?.map((m: any) => m.name) || [];
    
    const requiredModels = ['qwen2.5-coder:7b'];
    const recommendedModels = ['gemma2:2b', 'gemma3:1b'];
    
    let allRequired = true;
    for (const model of requiredModels) {
      if (models.includes(model)) {
        log(`✓ Required model installed: ${model}`, colors.green);
      } else {
        log(`✗ Required model missing: ${model}`, colors.red);
        log(`  Install with: ollama pull ${model}`, colors.yellow);
        allRequired = false;
      }
    }
    
    for (const model of recommendedModels) {
      if (models.includes(model)) {
        log(`✓ Recommended model installed: ${model}`, colors.green);
      } else {
        log(`⚠ Recommended model missing: ${model}`, colors.yellow);
        log(`  Install with: ollama pull ${model}`, colors.blue);
      }
    }
    
    return allRequired;
  } catch (error) {
    return false;
  }
}

async function checkBuildStatus() {
  try {
    // Check if dist directory exists
    const fs = await import('fs/promises');
    await fs.access('./dist');
    log(`✓ Build directory exists`, colors.green);
    return true;
  } catch (error) {
    log(`✗ Build directory missing`, colors.red);
    log(`  Run: npm run build`, colors.yellow);
    return false;
  }
}

async function runPreFlightCheck() {
  log('╔════════════════════════════════════════════════════════════╗', colors.cyan);
  log('║              🚀 PRE-FLIGHT CHECK                          ║', colors.bright + colors.cyan);
  log('╚════════════════════════════════════════════════════════════╝', colors.cyan);
  
  log('\n[1/4] Checking Node.js version...', colors.yellow);
  const nodeOk = await checkNodeVersion();
  
  log('\n[2/4] Checking Ollama availability...', colors.yellow);
  const ollamaOk = await checkOllamaAvailability();
  
  log('\n[3/4] Checking required models...', colors.yellow);
  const modelsOk = await checkRequiredModels();
  
  log('\n[4/4] Checking build status...', colors.yellow);
  const buildOk = await checkBuildStatus();
  
  // Summary
  log('\n' + '═'.repeat(60), colors.cyan);
  log('📊 PRE-FLIGHT CHECK SUMMARY', colors.bright + colors.cyan);
  log('═'.repeat(60), colors.cyan);
  
  const checks = [
    { name: 'Node.js Version', status: nodeOk },
    { name: 'Ollama Running', status: ollamaOk },
    { name: 'Required Models', status: modelsOk },
    { name: 'Build Status', status: buildOk },
  ];
  
  let allPassed = true;
  for (const check of checks) {
    const icon = check.status ? '✓' : '✗';
    const color = check.status ? colors.green : colors.red;
    log(`${icon} ${check.name}`, color);
    if (!check.status) allPassed = false;
  }
  
  log('\n' + '═'.repeat(60), colors.cyan);
  
  if (allPassed) {
    log('✅ ALL CHECKS PASSED - Ready to proceed!', colors.green);
    log('\nNext steps:', colors.cyan);
    log('  1. Run unit tests: npm test', colors.blue);
    log('  2. Start building the next pack', colors.blue);
    process.exit(0);
  } else {
    log('❌ SOME CHECKS FAILED - Fix issues before proceeding', colors.red);
    log('\nRecommended actions:', colors.yellow);
    if (!nodeOk) log('  - Upgrade Node.js to version 18+', colors.blue);
    if (!ollamaOk) log('  - Start Ollama: ollama serve', colors.blue);
    if (!modelsOk) log('  - Install required models (see above)', colors.blue);
    if (!buildOk) log('  - Build the project: npm run build', colors.blue);
    process.exit(1);
  }
}

runPreFlightCheck().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});

