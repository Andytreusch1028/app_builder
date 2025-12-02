/**
 * Test Multi-Model Ollama Routing
 * Demonstrates intelligent model selection based on task complexity
 */

import 'dotenv/config';
import { OllamaProvider } from '../providers/OllamaProvider.js';
import { listAvailableModels } from '../config/ollama-models.js';

async function testMultiModelRouting() {
  console.log('🚀 MULTI-MODEL OLLAMA ROUTING TEST\n');
  console.log('Testing intelligent model selection based on task complexity\n');
  console.log('============================================================\n');

  // Show available models
  console.log('📋 Available Models:\n');
  const models = listAvailableModels();
  models.forEach(model => {
    console.log(`  ${model.displayName} (${model.name})`);
    console.log(`    Size: ${model.size}`);
    console.log(`    Speed: ${model.speedTier} (${model.estimatedTokensPerSec} tokens/sec)`);
    console.log(`    Quality: ${model.qualityTier}`);
    console.log(`    Specialization: ${model.specialization}`);
    console.log(`    Best for: ${model.recommendedFor.slice(0, 3).join(', ')}`);
    console.log('');
  });

  console.log('============================================================\n');

  // Create provider with auto-selection enabled
  const provider = new OllamaProvider('qwen2.5-coder:7b', 'http://localhost:11434', true);

  // Test cases with different complexity levels
  const testCases = [
    {
      name: 'Simple Task (Speed Priority)',
      prompt: 'Quick: format this code snippet to use proper indentation',
      expectedModel: 'gemma3:1b'
    },
    {
      name: 'Complex Task (Code Specialization)',
      prompt: 'Implement a TypeScript function that uses advanced algorithms to optimize database queries',
      expectedModel: 'qwen2.5-coder:7b'
    },
    {
      name: 'Moderate Task (Quality Priority)',
      prompt: 'Write a best quality API design for user authentication',
      expectedModel: 'qwen2.5-coder:7b'
    },
    {
      name: 'Simple Documentation',
      prompt: 'Generate basic documentation for this simple function',
      expectedModel: 'gemma3:1b'
    },
    {
      name: 'Complex Refactoring',
      prompt: 'Refactor this codebase to use dependency injection and improve architecture',
      expectedModel: 'qwen2.5-coder:7b'
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n🧪 Test ${i + 1}: ${testCase.name}\n`);
    console.log(`Prompt: "${testCase.prompt}"\n`);

    try {
      const startTime = Date.now();
      
      // Generate with auto-selection
      const response = await provider.generateText(testCase.prompt, {
        maxTokens: 100, // Keep it short for testing
        temperature: 0.7
      });

      const duration = Date.now() - startTime;

      console.log(`✅ Model Selected: ${response.model}`);
      console.log(`   Expected: ${testCase.expectedModel}`);
      console.log(`   Match: ${response.model === testCase.expectedModel ? '✅ YES' : '⚠️ NO'}`);
      console.log(`   Tokens: ${response.tokensUsed.total}`);
      console.log(`   Duration: ${duration}ms`);
      console.log(`   Response preview: ${response.text.substring(0, 100)}...`);
      console.log('');

    } catch (error) {
      console.error(`❌ Test failed:`, error);
    }
  }

  console.log('\n============================================================');
  console.log('✅ Multi-model routing test complete!');
  console.log('============================================================\n');
}

// Run the test
testMultiModelRouting().catch(console.error);

