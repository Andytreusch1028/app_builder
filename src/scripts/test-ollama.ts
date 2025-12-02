/**
 * Test script for Ollama local models
 * Run with: npm run test:ollama
 */

import dotenv from 'dotenv';

dotenv.config();

const OLLAMA_API = 'http://localhost:11434';
const MODEL = 'qwen2.5-coder:7b';
const TEST_PROMPT = 'Write a simple hello world function in TypeScript with proper types and JSDoc comments';

async function testOllamaConnection() {
  console.log('🧪 Testing Ollama Connection\n');
  console.log('='.repeat(60));
  
  try {
    const response = await fetch(`${OLLAMA_API}/api/tags`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Ollama is running!');
    console.log(`\nAvailable models: ${data.models.length}`);
    
    for (const model of data.models) {
      console.log(`  - ${model.name} (${(model.size / 1024 / 1024 / 1024).toFixed(2)} GB)`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Ollama is not running!');
    console.error('Please start Ollama first.');
    console.error('Error:', error instanceof Error ? error.message : error);
    return false;
  }
}

async function testOllamaGeneration() {
  console.log('\n\n' + '='.repeat(60));
  console.log('Testing Text Generation');
  console.log('='.repeat(60));
  console.log(`Model: ${MODEL}`);
  console.log(`Prompt: "${TEST_PROMPT}"\n`);
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${OLLAMA_API}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt: TEST_PROMPT,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 200
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const latency = Date.now() - startTime;
    
    console.log('Response:');
    console.log('-'.repeat(60));
    console.log(data.response);
    console.log('-'.repeat(60));
    console.log(`\nTokens: ${data.eval_count || 'N/A'}`);
    console.log(`Latency: ${latency}ms`);
    console.log(`Tokens/sec: ${data.eval_count ? (data.eval_count / (latency / 1000)).toFixed(2) : 'N/A'}`);
    console.log('Cost: $0.00 (FREE!)');
    
    console.log('\n✅ Generation test PASSED!');
  } catch (error) {
    console.error('\n❌ Generation failed:', error instanceof Error ? error.message : error);
  }
}

async function testOllamaStreaming() {
  console.log('\n\n' + '='.repeat(60));
  console.log('Testing Streaming Generation');
  console.log('='.repeat(60));
  console.log(`Model: ${MODEL}`);
  console.log(`Prompt: "${TEST_PROMPT}"\n`);
  
  console.log('Streaming response:');
  console.log('-'.repeat(60));
  
  const startTime = Date.now();
  let totalTokens = 0;
  
  try {
    const response = await fetch(`${OLLAMA_API}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt: TEST_PROMPT,
        stream: true,
        options: {
          temperature: 0.7,
          num_predict: 200
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    if (!reader) {
      throw new Error('No response body');
    }
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.response) {
            process.stdout.write(data.response);
          }
          if (data.eval_count) {
            totalTokens = data.eval_count;
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
    
    const latency = Date.now() - startTime;
    
    console.log('\n' + '-'.repeat(60));
    console.log(`\nTokens: ${totalTokens}`);
    console.log(`Latency: ${latency}ms`);
    console.log(`Tokens/sec: ${totalTokens ? (totalTokens / (latency / 1000)).toFixed(2) : 'N/A'}`);
    
    console.log('\n✅ Streaming test PASSED!');
  } catch (error) {
    console.error('\n❌ Streaming failed:', error instanceof Error ? error.message : error);
  }
}

async function main() {
  console.log('🚀 OLLAMA LOCAL MODEL TESTING - PHASE 1\n');
  
  const isRunning = await testOllamaConnection();
  
  if (isRunning) {
    await testOllamaGeneration();
    await testOllamaStreaming();
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ All Ollama tests complete!');
  console.log('='.repeat(60));
}

main().catch(console.error);

