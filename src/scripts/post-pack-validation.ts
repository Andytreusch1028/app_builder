/**
 * Post-pack validation - Run after completing any pack
 * Validates that all tests pass before moving to next pack
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

async function runUnitTests(): Promise<boolean> {
  try {
    log('Running unit tests...', colors.yellow);
    const { stdout, stderr } = await execAsync('npm test', { maxBuffer: 10 * 1024 * 1024 });

    // Jest outputs test results to stderr, not stdout
    // Look for the final Jest summary line
    // Example: "Test Suites: 17 passed, 17 total"
    // Example: "Tests:       232 passed, 232 total"
    const output = stderr + stdout; // Check both

    const suiteMatch = output.match(/Test Suites:\s+(\d+)\s+passed,\s+(\d+)\s+total/);
    const testMatch = output.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+total/);

    if (suiteMatch && testMatch) {
      const [, suitePassed, suiteTotal] = suiteMatch;
      const [, testPassed, testTotal] = testMatch;

      // Check if all tests passed
      if (suitePassed === suiteTotal && testPassed === testTotal) {
        log(`✓ All ${testPassed} unit tests passed (${suitePassed} suites)`, colors.green);
        return true;
      } else {
        log(`✗ Some tests failed: ${testPassed}/${testTotal} passed`, colors.red);
        return false;
      }
    }

    // If we can't find the summary, check for failures
    if (output.match(/Test Suites:.*\d+\s+failed/) || output.match(/Tests:.*\d+\s+failed/)) {
      log(`✗ Some unit tests failed`, colors.red);
      return false;
    }

    // Fallback: assume success if we got here
    log(`⚠ Could not parse test results, but no failures detected`, colors.yellow);
    return true;
  } catch (error: any) {
    log(`✗ Unit tests failed to run`, colors.red);
    console.error(error.stdout || error.message);
    return false;
  }
}

async function runBuild(): Promise<boolean> {
  try {
    log('Running build...', colors.yellow);
    await execAsync('npm run build');
    log(`✓ Build successful`, colors.green);
    return true;
  } catch (error: any) {
    log(`✗ Build failed`, colors.red);
    console.error(error.stdout || error.message);
    return false;
  }
}

async function checkOllama(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (response.ok) {
      log(`✓ Ollama is running`, colors.green);
      return true;
    }
    log(`✗ Ollama returned error`, colors.red);
    return false;
  } catch (error) {
    log(`✗ Ollama is not running`, colors.red);
    return false;
  }
}

async function runPostPackValidation() {
  log('╔════════════════════════════════════════════════════════════╗', colors.cyan);
  log('║           ✅ POST-PACK VALIDATION                         ║', colors.bright + colors.cyan);
  log('╚════════════════════════════════════════════════════════════╝', colors.cyan);
  
  const results: { name: string; status: boolean; required: boolean }[] = [];
  
  // Step 1: Build
  log('\n[1/3] Building project...', colors.magenta);
  const buildOk = await runBuild();
  results.push({ name: 'Build', status: buildOk, required: true });
  
  if (!buildOk) {
    log('\n❌ Build failed - fix errors before proceeding', colors.red);
    process.exit(1);
  }
  
  // Step 2: Unit Tests
  log('\n[2/3] Running unit tests...', colors.magenta);
  const testsOk = await runUnitTests();
  results.push({ name: 'Unit Tests', status: testsOk, required: true });
  
  if (!testsOk) {
    log('\n❌ Unit tests failed - fix errors before proceeding', colors.red);
    process.exit(1);
  }
  
  // Step 3: Ollama Check
  log('\n[3/3] Checking Ollama...', colors.magenta);
  const ollamaOk = await checkOllama();
  results.push({ name: 'Ollama', status: ollamaOk, required: false });
  
  // Summary
  log('\n' + '═'.repeat(60), colors.cyan);
  log('📊 VALIDATION SUMMARY', colors.bright + colors.cyan);
  log('═'.repeat(60), colors.cyan);
  
  for (const result of results) {
    const icon = result.status ? '✓' : '✗';
    const color = result.status ? colors.green : (result.required ? colors.red : colors.yellow);
    const label = result.required ? '' : ' (optional)';
    log(`${icon} ${result.name}${label}`, color);
  }
  
  log('\n' + '═'.repeat(60), colors.cyan);
  
  const requiredPassed = results.filter(r => r.required).every(r => r.status);
  
  if (requiredPassed) {
    log('✅ REQUIRED VALIDATIONS PASSED', colors.green);
    log('\n📋 Next Steps:', colors.cyan);
    log('  1. Run real-world tests:', colors.blue);
    log('     npm run diagnose:ollama', colors.blue);
    log('     npm run demo:agent', colors.blue);
    log('     npm run test:real-agent', colors.blue);
    log('     npm run stress:agent', colors.blue);
    log('  2. Fix any issues found', colors.blue);
    log('  3. Document results in docs/TEST_RESULTS.md', colors.blue);
    log('  4. Mark pack as complete', colors.blue);
    
    if (!ollamaOk) {
      log('\n⚠️  Warning: Ollama is not running', colors.yellow);
      log('   Real-world tests will fail without Ollama', colors.yellow);
      log('   Start with: ollama serve', colors.blue);
    }
    
    process.exit(0);
  } else {
    log('❌ REQUIRED VALIDATIONS FAILED', colors.red);
    log('\n🔧 Fix the following before proceeding:', colors.yellow);
    
    for (const result of results) {
      if (result.required && !result.status) {
        log(`  - ${result.name}`, colors.red);
      }
    }
    
    process.exit(1);
  }
}

runPostPackValidation().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});

