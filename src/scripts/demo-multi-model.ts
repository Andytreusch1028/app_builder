/**
 * Multi-Model Ollama Demo
 * Interactive demonstration of intelligent model routing
 */

import 'dotenv/config';
import { OllamaProvider } from '../providers/OllamaProvider.js';
import { ProviderRegistry } from '../providers/ProviderRegistry.js';
import { listAvailableModels } from '../config/ollama-models.js';

async function demo() {
  console.log('\n🎯 MULTI-MODEL OLLAMA DEMO\n');
  console.log('============================================================\n');

  // Show available models
  console.log('📋 Available Models:\n');
  const models = listAvailableModels();
  models.forEach(model => {
    console.log(`  ✅ ${model.displayName}`);
    console.log(`     Speed: ${model.speedTier} (${model.estimatedTokensPerSec} tok/sec)`);
    console.log(`     Quality: ${model.qualityTier}`);
    console.log(`     Size: ${model.size}\n`);
  });

  console.log('============================================================\n');

  // Demo 1: Manual model selection
  console.log('🔧 DEMO 1: Manual Model Selection\n');
  
  const qwenProvider = new OllamaProvider('qwen2.5-coder:7b');
  console.log('Using Qwen 2.5 Coder 7B for complex code generation...\n');
  
  const qwenResponse = await qwenProvider.generateText(
    'Write a TypeScript function to calculate fibonacci numbers',
    { maxTokens: 150 }
  );
  
  console.log(`Model: ${qwenResponse.model}`);
  console.log(`Tokens: ${qwenResponse.tokensUsed.total}`);
  console.log(`Latency: ${qwenResponse.latency}ms`);
  console.log(`Response:\n${qwenResponse.text.substring(0, 200)}...\n`);

  console.log('------------------------------------------------------------\n');

  const gemmaProvider = new OllamaProvider('gemma3:1b');
  console.log('Using Gemma 3 1B for quick formatting...\n');
  
  const gemmaResponse = await gemmaProvider.generateText(
    'Quick: what is 2+2?',
    { maxTokens: 50 }
  );
  
  console.log(`Model: ${gemmaResponse.model}`);
  console.log(`Tokens: ${gemmaResponse.tokensUsed.total}`);
  console.log(`Latency: ${gemmaResponse.latency}ms`);
  console.log(`Response: ${gemmaResponse.text}\n`);

  console.log('============================================================\n');

  // Demo 2: Auto model selection
  console.log('🤖 DEMO 2: Automatic Model Selection\n');
  
  const autoProvider = new OllamaProvider('qwen2.5-coder:7b', 'http://localhost:11434', true);
  
  const testPrompts = [
    'Quick: format this code',
    'Implement a complex sorting algorithm in TypeScript',
    'Generate basic documentation'
  ];

  for (const prompt of testPrompts) {
    console.log(`Prompt: "${prompt}"`);
    const response = await autoProvider.generateText(prompt, { maxTokens: 80 });
    console.log(`  → Selected: ${response.model}`);
    console.log(`  → Latency: ${response.latency}ms\n`);
  }

  console.log('============================================================\n');

  // Demo 3: Integration with ProviderRegistry
  console.log('🔀 DEMO 3: Multi-Model Provider Registry\n');
  
  const registry = new ProviderRegistry();
  
  // Register both models as separate providers
  const qwenProv = new OllamaProvider('qwen2.5-coder:7b');
  const gemmaProv = new OllamaProvider('gemma3:1b');

  registry.register(qwenProv, 0); // Priority 0 (higher)
  registry.register(gemmaProv, 1); // Priority 1 (lower)
  
  console.log('Registered providers:');
  console.log('  1. Qwen 2.5 Coder 7B (priority 0)');
  console.log('  2. Gemma 3 1B (priority 1)\n');
  
  const selectedProvider = registry.selectProvider('priority');
  console.log(`Selected by priority: ${selectedProvider?.name}\n`);
  
  const costProvider = registry.selectProvider('cost');
  console.log(`Selected by cost: ${costProvider?.name} (both are free!)\n`);

  console.log('============================================================\n');

  // Demo 4: Performance comparison
  console.log('⚡ DEMO 4: Performance Comparison\n');
  
  const testPrompt = 'Write a simple hello world function';
  
  console.log('Testing same prompt on both models...\n');
  
  const qwenStart = Date.now();
  const qwenResult = await qwenProvider.generateText(testPrompt, { maxTokens: 100 });
  const qwenTime = Date.now() - qwenStart;
  
  const gemmaStart = Date.now();
  const gemmaResult = await gemmaProvider.generateText(testPrompt, { maxTokens: 100 });
  const gemmaTime = Date.now() - gemmaStart;
  
  console.log(`Qwen 2.5 Coder 7B:`);
  console.log(`  Time: ${qwenTime}ms`);
  console.log(`  Tokens: ${qwenResult.tokensUsed.total}`);
  console.log(`  Speed: ${(qwenResult.tokensUsed.total / (qwenTime / 1000)).toFixed(2)} tok/sec\n`);
  
  console.log(`Gemma 3 1B:`);
  console.log(`  Time: ${gemmaTime}ms`);
  console.log(`  Tokens: ${gemmaResult.tokensUsed.total}`);
  console.log(`  Speed: ${(gemmaResult.tokensUsed.total / (gemmaTime / 1000)).toFixed(2)} tok/sec\n`);
  
  const speedup = (qwenTime / gemmaTime).toFixed(2);
  console.log(`⚡ Gemma is ${speedup}x faster for simple tasks!\n`);

  console.log('============================================================');
  console.log('✅ Demo complete!');
  console.log('============================================================\n');
}

demo().catch(console.error);

