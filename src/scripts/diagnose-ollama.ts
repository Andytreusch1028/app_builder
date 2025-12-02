/**
 * Diagnostic script to test Ollama's JSON generation capability
 */

import { OllamaProvider } from '../providers/OllamaProvider.js';

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

async function testJSONGeneration() {
  log('╔════════════════════════════════════════════════════════════╗', colors.cyan);
  log('║         🔍 OLLAMA JSON GENERATION DIAGNOSTIC              ║', colors.bright + colors.cyan);
  log('╚════════════════════════════════════════════════════════════╝', colors.cyan);
  
  log(`\nModel: ${TEST_MODEL}`, colors.cyan);
  log(`URL: ${OLLAMA_URL}`, colors.cyan);

  // OllamaProvider constructor: (modelName, apiUrl, autoSelectModel)
  const provider = new OllamaProvider(TEST_MODEL, OLLAMA_URL, false);
  
  // Test 1: Check availability
  log('\n[1/4] Checking Ollama availability...', colors.yellow);
  const isAvailable = await provider.isAvailable();
  if (!isAvailable) {
    log('❌ Ollama is not available!', colors.red);
    log('\n💡 Make sure Ollama is running:', colors.yellow);
    log('   ollama serve', colors.blue);
    process.exit(1);
  }
  log('✓ Ollama is available', colors.green);
  
  // Test 2: Simple JSON generation
  log('\n[2/4] Testing simple JSON generation...', colors.yellow);
  const simplePrompt = `Return ONLY this JSON object, nothing else:
{"status": "ok", "message": "test"}`;
  
  try {
    const response = await provider.generateText(simplePrompt, { temperature: 0.1, maxTokens: 100 });
    log(`Response: ${response.text}`, colors.blue);

    try {
      JSON.parse(response.text);
      log('✓ Valid JSON returned', colors.green);
    } catch {
      log('❌ Invalid JSON returned', colors.red);
      log('   The model added extra text around the JSON', colors.yellow);
    }
  } catch (error: any) {
    log(`❌ Error: ${error.message}`, colors.red);
    if (error.cause) {
      log(`   Cause: ${error.cause}`, colors.yellow);
    }
    if (error.stack) {
      log(`\n   Stack trace:`, colors.yellow);
      console.error(error.stack);
    }
  }
  
  // Test 3: Planning-style JSON
  log('\n[3/4] Testing planning-style JSON generation...', colors.yellow);
  const planPrompt = `You are a task planner. Return ONLY a valid JSON object with this structure:

{
  "steps": [
    {
      "id": "step_1",
      "description": "Write hello world to file",
      "tool": "write_file",
      "parameters": {"path": "hello.txt", "content": "Hello World"},
      "dependencies": []
    }
  ],
  "estimatedTime": 5
}

Return ONLY the JSON, no explanations, no markdown code blocks, just the raw JSON.`;

  try {
    const response = await provider.generateText(planPrompt, { temperature: 0.1, maxTokens: 500 });
    log(`\nRaw response:`, colors.blue);
    log('─'.repeat(60), colors.cyan);
    console.log(response.text);
    log('─'.repeat(60), colors.cyan);
    
    // Try to parse it
    try {
      const parsed = JSON.parse(response.text);
      log('\n✓ Valid JSON returned', colors.green);
      log(`  Steps: ${parsed.steps?.length || 0}`, colors.cyan);
    } catch (parseError) {
      log('\n❌ Invalid JSON returned', colors.red);
      
      // Try to extract JSON from markdown
      const jsonMatch = response.text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        log('\n💡 Found JSON inside markdown code block', colors.yellow);
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          log('✓ Extracted JSON is valid', colors.green);
          log(`  Steps: ${parsed.steps?.length || 0}`, colors.cyan);
          log('\n📝 Note: PlannerService should handle this automatically', colors.blue);
        } catch {
          log('❌ Even extracted JSON is invalid', colors.red);
        }
      } else {
        log('\n❌ No JSON found in response', colors.red);
      }
    }
  } catch (error: any) {
    log(`❌ Error: ${error.message}`, colors.red);
  }
  
  // Test 4: Real planning task
  log('\n[4/4] Testing real planning task...', colors.yellow);
  const realPrompt = `You are a task planning AI. Your job is to decompose a user task into a step-by-step execution plan.

USER TASK:
Create a file called hello.txt with "Hello World"

AVAILABLE TOOLS:
- write_file: Write content to a file
  Parameters: {"path": {"type": "string", "required": true}, "content": {"type": "string", "required": true}}

INSTRUCTIONS:
Return ONLY a valid JSON object with this structure:

{
  "steps": [
    {
      "id": "step_1",
      "description": "Clear description",
      "tool": "tool_name",
      "parameters": { "param1": "value1" },
      "dependencies": []
    }
  ],
  "estimatedTime": 10
}

IMPORTANT: Return ONLY the JSON object, no explanations, no markdown, just raw JSON.`;

  try {
    const response = await provider.generateText(realPrompt, { temperature: 0.3, maxTokens: 1000 });
    log(`\nRaw response:`, colors.blue);
    log('─'.repeat(60), colors.cyan);
    console.log(response.text);
    log('─'.repeat(60), colors.cyan);
    
    // Try to parse
    try {
      const parsed = JSON.parse(response.text);
      log('\n✅ SUCCESS! Model returned valid JSON', colors.green);
      log(`  Steps: ${parsed.steps?.length || 0}`, colors.cyan);
      log(`  Estimated time: ${parsed.estimatedTime}s`, colors.cyan);
    } catch {
      // Try markdown extraction
      const jsonMatch = response.text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          log('\n✅ SUCCESS! Found valid JSON in markdown', colors.green);
          log(`  Steps: ${parsed.steps?.length || 0}`, colors.cyan);
        } catch {
          log('\n❌ FAILED: Invalid JSON even after extraction', colors.red);
        }
      } else {
        log('\n❌ FAILED: No valid JSON found', colors.red);
      }
    }
  } catch (error: any) {
    log(`❌ Error: ${error.message}`, colors.red);
  }
  
  // Summary
  log('\n' + '═'.repeat(60), colors.cyan);
  log('📊 DIAGNOSTIC SUMMARY', colors.bright + colors.cyan);
  log('═'.repeat(60), colors.cyan);
  
  log('\n💡 Recommendations:', colors.yellow);
  log('  1. If JSON is wrapped in markdown, PlannerService handles it', colors.blue);
  log('  2. If JSON is invalid, try lowering temperature (0.1)', colors.blue);
  log('  3. If still failing, try gemma2:2b (faster, simpler)', colors.blue);
  log('  4. For production, use cloud AI for planning (more reliable)', colors.blue);
}

testJSONGeneration().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});

