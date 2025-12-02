/**
 * Test script for local model (Gemma 2 9B)
 * Run with: npm run test:local
 */

import dotenv from 'dotenv';
import { LocalModelService } from '../services/LocalModelService.js';
import { ProviderRegistry } from '../providers/ProviderRegistry.js';
import { ComputeRouter } from '../services/ComputeRouter.js';

dotenv.config();

const TEST_PROMPT = 'Write a simple hello world function in TypeScript';

async function testLocalModel() {
  console.log('🧪 Testing Local Model Service\n');
  console.log('='.repeat(60));
  
  const modelPath = process.env.LOCAL_MODEL_PATH || './models/gemma-2-9b-it-Q4_K_M.gguf';
  console.log(`Model path: ${modelPath}`);
  
  const service = new LocalModelService(modelPath);
  
  // Check availability
  const available = service.isAvailable();
  console.log(`Model available: ${available}`);
  
  if (!available) {
    console.log('\n❌ Model file not found!');
    console.log('\n📥 To download Gemma 2 9B:');
    console.log('1. Install Ollama: https://ollama.com/download');
    console.log('2. Run: ollama pull gemma2:9b');
    console.log('3. Or download GGUF from: https://huggingface.co/google/gemma-2-9b-it-GGUF');
    console.log(`4. Place the .gguf file at: ${modelPath}`);
    return;
  }
  
  // Get model info
  const modelInfo = service.getModelInfo();
  console.log(`\nModel: ${modelInfo.name}`);
  console.log(`Context window: ${modelInfo.contextWindow} tokens`);
  console.log(`Max output: ${modelInfo.maxOutputTokens} tokens`);
  console.log(`Cost: $${modelInfo.costPer1kInputTokens} / $${modelInfo.costPer1kOutputTokens} (FREE!)`);
  
  // Test text generation
  console.log(`\n${'='.repeat(60)}`);
  console.log('Testing text generation...');
  console.log('='.repeat(60));
  console.log(`Prompt: "${TEST_PROMPT}"\n`);
  
  try {
    const response = await service.generateText(TEST_PROMPT, { maxTokens: 200 });
    
    console.log('Response:');
    console.log('-'.repeat(60));
    console.log(response.text);
    console.log('-'.repeat(60));
    console.log(`\nTokens used: ${response.tokensUsed.total} (input: ${response.tokensUsed.input}, output: ${response.tokensUsed.output})`);
    console.log(`Cost: $${response.cost.toFixed(4)} (FREE!)`);
    console.log(`Latency: ${response.latency}ms`);
    console.log(`Provider: ${response.provider}`);
    
    console.log('\n✅ Local model test PASSED!');
  } catch (error) {
    console.error('\n❌ Generation failed:', error instanceof Error ? error.message : error);
  }
}

async function testStreamingGeneration() {
  console.log('\n\n' + '='.repeat(60));
  console.log('Testing streaming generation...');
  console.log('='.repeat(60));
  
  const modelPath = process.env.LOCAL_MODEL_PATH || './models/gemma-2-9b-it-Q4_K_M.gguf';
  const service = new LocalModelService(modelPath);
  
  if (!service.isAvailable()) {
    console.log('❌ Model not available for streaming test');
    return;
  }
  
  console.log(`Prompt: "${TEST_PROMPT}"\n`);
  console.log('Streaming response:');
  console.log('-'.repeat(60));
  
  let fullText = '';
  
  try {
    const response = await service.streamText(
      TEST_PROMPT,
      { maxTokens: 200 },
      (chunk) => {
        process.stdout.write(chunk);
        fullText += chunk;
      }
    );
    
    console.log('\n' + '-'.repeat(60));
    console.log(`\nTokens: ${response.tokensUsed.total}`);
    console.log(`Latency: ${response.latency}ms`);
    console.log('\n✅ Streaming test PASSED!');
  } catch (error) {
    console.error('\n❌ Streaming failed:', error instanceof Error ? error.message : error);
  }
}

async function testHybridRouter() {
  console.log('\n\n' + '='.repeat(60));
  console.log('Testing Hybrid Compute Router (Local Mode)');
  console.log('='.repeat(60));
  
  const modelPath = process.env.LOCAL_MODEL_PATH || './models/gemma-2-9b-it-Q4_K_M.gguf';
  const registry = new ProviderRegistry();
  const localModel = new LocalModelService(modelPath);
  
  // Create router in local mode
  const router = new ComputeRouter(registry, localModel, 'local');
  
  const telemetry = router.getTelemetry();
  console.log(`\nRouter mode: ${telemetry.mode}`);
  console.log(`Local available: ${telemetry.localAvailable}`);
  console.log(`Cloud providers: ${telemetry.cloudProviders}`);
  
  if (!telemetry.localAvailable) {
    console.log('\n❌ Local model not available for router test');
    return;
  }
  
  console.log(`\nGenerating with router...`);
  
  try {
    const response = await router.generateText(TEST_PROMPT, { maxTokens: 150 });
    
    console.log(`\nProvider used: ${response.provider}`);
    console.log(`Response: ${response.text.substring(0, 200)}...`);
    console.log(`Cost: $${response.cost.toFixed(4)}`);
    console.log('\n✅ Router test PASSED!');
  } catch (error) {
    console.error('\n❌ Router failed:', error instanceof Error ? error.message : error);
  }
}

async function main() {
  console.log('🚀 LOCAL MODEL TESTING - PHASE 1\n');
  
  await testLocalModel();
  await testStreamingGeneration();
  await testHybridRouter();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ All local model tests complete!');
  console.log('='.repeat(60));
}

main().catch(console.error);

