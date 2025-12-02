/**
 * Integration test for OllamaProvider with ComputeRouter
 * Run with: npm run test:integration
 */

import dotenv from 'dotenv';
import { OllamaProvider } from '../providers/OllamaProvider.js';
import { GoogleProvider } from '../providers/GoogleProvider.js';
import { ProviderRegistry } from '../providers/ProviderRegistry.js';
import { ComputeRouter } from '../services/ComputeRouter.js';

dotenv.config();

const TEST_PROMPT = 'Write a TypeScript function that adds two numbers';

async function testOllamaProvider() {
  console.log('🧪 Test 1: OllamaProvider Standalone\n');
  console.log('='.repeat(60));
  
  const provider = new OllamaProvider('qwen2.5-coder:7b');
  
  console.log(`Provider: ${provider.name}`);
  console.log(`Available: ${provider.isAvailable()}`);
  
  const modelInfo = provider.getModelInfo();
  console.log(`Model: ${modelInfo.name}`);
  console.log(`Context: ${modelInfo.contextWindow} tokens`);
  console.log(`Cost: $${modelInfo.costPer1kInputTokens} (FREE!)`);
  
  console.log(`\nGenerating...`);
  
  try {
    const response = await provider.generateText(TEST_PROMPT, { maxTokens: 150 });
    
    console.log(`\nResponse:`);
    console.log('-'.repeat(60));
    console.log(response.text);
    console.log('-'.repeat(60));
    console.log(`\nTokens: ${response.tokensUsed.total}`);
    console.log(`Cost: $${response.cost.toFixed(4)}`);
    console.log(`Latency: ${response.latency}ms`);
    console.log(`Provider: ${response.provider}`);
    
    console.log('\n✅ Test 1 PASSED!');
  } catch (error) {
    console.error('\n❌ Test 1 FAILED:', error instanceof Error ? error.message : error);
  }
}

async function testProviderRegistry() {
  console.log('\n\n🧪 Test 2: ProviderRegistry with Ollama\n');
  console.log('='.repeat(60));
  
  const registry = new ProviderRegistry();
  
  // Register Ollama provider
  registry.register(new OllamaProvider('qwen2.5-coder:7b'));
  
  // Optionally register Google if API key is available
  if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY !== 'your_google_key_here') {
    registry.register(new GoogleProvider(process.env.GOOGLE_API_KEY, 'gemini-1.5-flash'));
    console.log('Registered providers: Ollama + Google');
  } else {
    console.log('Registered providers: Ollama only');
  }
  
  console.log(`Total providers: ${registry.getAllProviders().length}`);
  
  // Select provider (should select Ollama by priority)
  const provider = registry.selectProvider();
  if (!provider) {
    console.error('❌ No provider selected');
    return;
  }
  
  console.log(`Selected provider: ${provider.name}`);
  
  try {
    const response = await provider.generateText(TEST_PROMPT, { maxTokens: 100 });
    
    console.log(`\nResponse: ${response.text.substring(0, 150)}...`);
    console.log(`Provider used: ${response.provider}`);
    console.log(`Cost: $${response.cost.toFixed(4)}`);
    
    // Record stats
    registry.recordRequest(
      provider.name,
      true,
      response.tokensUsed.total,
      response.cost,
      response.latency
    );
    
    // Show stats
    const stats = registry.getStats(provider.name);
    if (stats) {
      console.log(`\nProvider stats:`);
      console.log(`  Requests: ${stats.totalRequests}`);
      console.log(`  Tokens: ${stats.totalTokens}`);
      console.log(`  Cost: $${stats.totalCost.toFixed(4)}`);
      console.log(`  Avg latency: ${stats.averageLatency}ms`);
    }
    
    console.log('\n✅ Test 2 PASSED!');
  } catch (error) {
    console.error('\n❌ Test 2 FAILED:', error instanceof Error ? error.message : error);
  }
}

async function testComputeRouterCloudMode() {
  console.log('\n\n🧪 Test 3: ComputeRouter in Cloud Mode (Ollama as "cloud")\n');
  console.log('='.repeat(60));
  
  const registry = new ProviderRegistry();
  registry.register(new OllamaProvider('qwen2.5-coder:7b'));
  
  const router = new ComputeRouter(registry, null, 'cloud');
  
  const telemetry = router.getTelemetry();
  console.log(`Router mode: ${telemetry.mode}`);
  console.log(`Cloud providers: ${telemetry.cloudProviders}`);
  
  try {
    const response = await router.generateText(TEST_PROMPT, { maxTokens: 100 });
    
    console.log(`\nProvider used: ${response.provider}`);
    console.log(`Response: ${response.text.substring(0, 150)}...`);
    console.log(`Cost: $${response.cost.toFixed(4)}`);
    
    console.log('\n✅ Test 3 PASSED!');
  } catch (error) {
    console.error('\n❌ Test 3 FAILED:', error instanceof Error ? error.message : error);
  }
}

async function testHybridMode() {
  console.log('\n\n🧪 Test 4: Hybrid Mode (Ollama + Google fallback)\n');
  console.log('='.repeat(60));
  
  const registry = new ProviderRegistry();
  
  // Register Ollama as primary
  registry.register(new OllamaProvider('qwen2.5-coder:7b'), 0);
  
  // Register Google as fallback if available
  if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY !== 'your_google_key_here') {
    registry.register(new GoogleProvider(process.env.GOOGLE_API_KEY, 'gemini-1.5-flash'), 1);
    console.log('Setup: Ollama (primary) → Google (fallback)');
  } else {
    console.log('Setup: Ollama only (no fallback)');
  }
  
  const router = new ComputeRouter(registry, null, 'cloud');
  
  try {
    const response = await router.generateText(TEST_PROMPT, { maxTokens: 100 });
    
    console.log(`\nProvider used: ${response.provider}`);
    console.log(`Response: ${response.text.substring(0, 150)}...`);
    console.log(`Cost: $${response.cost.toFixed(4)}`);
    
    console.log('\n✅ Test 4 PASSED!');
  } catch (error) {
    console.error('\n❌ Test 4 FAILED:', error instanceof Error ? error.message : error);
  }
}

async function main() {
  console.log('🚀 PHASE 1 INTEGRATION TESTING\n');
  console.log('Testing OllamaProvider + ComputeRouter Integration\n');
  
  await testOllamaProvider();
  await testProviderRegistry();
  await testComputeRouterCloudMode();
  await testHybridMode();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ All integration tests complete!');
  console.log('='.repeat(60));
}

main().catch(console.error);

