/**
 * Manual test script for cloud providers
 * Run with: npm run build && node dist/scripts/test-providers.js
 */

import dotenv from 'dotenv';
import { AnthropicProvider } from '../providers/AnthropicProvider.js';
import { OpenAIProvider } from '../providers/OpenAIProvider.js';
import { GoogleProvider } from '../providers/GoogleProvider.js';
import { ProviderRegistry } from '../providers/ProviderRegistry.js';
import { LocalModelService } from '../services/LocalModelService.js';
import { ComputeRouter } from '../services/ComputeRouter.js';

// Load environment variables
dotenv.config();

const TEST_PROMPT = 'Write a simple hello world function in TypeScript';

async function testProvider(name: string, testFn: () => Promise<void>) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${name}`);
  console.log('='.repeat(60));
  
  try {
    await testFn();
    console.log(`✅ ${name} - SUCCESS`);
  } catch (error) {
    console.error(`❌ ${name} - FAILED`);
    console.error(error instanceof Error ? error.message : error);
  }
}

async function testAnthropicProvider() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your_anthropic_key_here') {
    throw new Error('ANTHROPIC_API_KEY not configured in .env');
  }

  const provider = new AnthropicProvider(apiKey);
  console.log(`Provider: ${provider.name}`);
  console.log(`Available: ${provider.isAvailable()}`);
  
  const modelInfo = provider.getModelInfo();
  console.log(`Model: ${modelInfo.name}`);
  console.log(`Context: ${modelInfo.contextWindow} tokens`);
  
  console.log(`\nGenerating response...`);
  const response = await provider.generateText(TEST_PROMPT, { maxTokens: 100 });
  
  console.log(`\nResponse:`);
  console.log(response.text);
  console.log(`\nTokens: ${response.tokensUsed.total}`);
  console.log(`Cost: $${response.cost.toFixed(4)}`);
  console.log(`Latency: ${response.latency}ms`);
}

async function testOpenAIProvider() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_key_here') {
    throw new Error('OPENAI_API_KEY not configured in .env');
  }

  const provider = new OpenAIProvider(apiKey);
  console.log(`Provider: ${provider.name}`);
  console.log(`Available: ${provider.isAvailable()}`);
  
  const modelInfo = provider.getModelInfo();
  console.log(`Model: ${modelInfo.name}`);
  console.log(`Context: ${modelInfo.contextWindow} tokens`);
  
  console.log(`\nGenerating response...`);
  const response = await provider.generateText(TEST_PROMPT, { maxTokens: 100 });
  
  console.log(`\nResponse:`);
  console.log(response.text);
  console.log(`\nTokens: ${response.tokensUsed.total}`);
  console.log(`Cost: $${response.cost.toFixed(4)}`);
  console.log(`Latency: ${response.latency}ms`);
}

async function testGoogleProvider() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey || apiKey === 'your_google_key_here') {
    throw new Error('GOOGLE_API_KEY not configured in .env');
  }

  const provider = new GoogleProvider(apiKey, 'gemini-1.5-flash');
  console.log(`Provider: ${provider.name}`);
  console.log(`Available: ${provider.isAvailable()}`);
  
  const modelInfo = provider.getModelInfo();
  console.log(`Model: ${modelInfo.name}`);
  console.log(`Context: ${modelInfo.contextWindow} tokens`);
  
  console.log(`\nGenerating response...`);
  const response = await provider.generateText(TEST_PROMPT, { maxTokens: 100 });
  
  console.log(`\nResponse:`);
  console.log(response.text);
  console.log(`\nTokens: ${response.tokensUsed.total}`);
  console.log(`Cost: $${response.cost.toFixed(4)}`);
  console.log(`Latency: ${response.latency}ms`);
}

async function testProviderRegistry() {
  const registry = new ProviderRegistry();
  
  // Register available providers
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_key_here') {
    registry.register(new AnthropicProvider(process.env.ANTHROPIC_API_KEY));
  }
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_key_here') {
    registry.register(new OpenAIProvider(process.env.OPENAI_API_KEY));
  }
  if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY !== 'your_google_key_here') {
    registry.register(new GoogleProvider(process.env.GOOGLE_API_KEY, 'gemini-1.5-flash'));
  }

  console.log(`\nRegistered providers: ${registry.getAllProviders().length}`);

  // Test priority selection (default strategy is already 'priority')
  const provider = registry.selectProvider();
  if (!provider) {
    throw new Error('No providers available');
  }
  
  console.log(`Selected provider (priority): ${provider.name}`);
  
  const response = await provider.generateText(TEST_PROMPT, { maxTokens: 50 });
  console.log(`\nResponse: ${response.text.substring(0, 100)}...`);
  
  // Show stats
  const stats = registry.getAllStats();
  console.log(`\nProvider Statistics:`);
  for (const [name, stat] of Object.entries(stats)) {
    if (stat && typeof stat === 'object' && 'totalRequests' in stat && 'totalCost' in stat) {
      console.log(`  ${name}: ${stat.totalRequests} requests, $${stat.totalCost.toFixed(4)} cost`);
    }
  }
}

async function testComputeRouter() {
  const registry = new ProviderRegistry();
  
  // Register available providers
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_key_here') {
    registry.register(new AnthropicProvider(process.env.ANTHROPIC_API_KEY));
  }
  
  const localModel = new LocalModelService(process.env.LOCAL_MODEL_PATH);
  const router = new ComputeRouter(registry, localModel, 'hybrid');
  
  const telemetry = router.getTelemetry();
  console.log(`\nRouter Mode: ${telemetry.mode}`);
  console.log(`Local Available: ${telemetry.localAvailable}`);
  console.log(`Cloud Providers: ${telemetry.cloudProviders}`);
  
  console.log(`\nGenerating with router...`);
  const response = await router.generateText(TEST_PROMPT, { maxTokens: 50 });
  
  console.log(`\nProvider used: ${response.provider}`);
  console.log(`Response: ${response.text.substring(0, 100)}...`);
  console.log(`Cost: $${response.cost.toFixed(4)}`);
}

async function main() {
  console.log('🧪 PHASE 1 PROVIDER TESTING');
  console.log('Testing Hybrid Compute System\n');
  
  // Test individual providers
  await testProvider('Anthropic Provider', testAnthropicProvider);
  await testProvider('OpenAI Provider', testOpenAIProvider);
  await testProvider('Google Provider', testGoogleProvider);
  
  // Test registry
  await testProvider('Provider Registry', testProviderRegistry);
  
  // Test router
  await testProvider('Compute Router', testComputeRouter);
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ All tests complete!');
  console.log('='.repeat(60));
}

main().catch(console.error);

