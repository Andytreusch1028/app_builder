/**
 * Demo Script for Pack 11 Phase 1
 * Tests Letta Memory System + Personal Context Repository
 */

import { LettaProvider } from '../providers/LettaProvider.js';
import { PersonalContextManager } from '../context/PersonalContextManager.js';
import { ContextInjector } from '../context/ContextInjector.js';

async function demoLettaMemory() {
  console.log('=== Pack 11 Phase 1 Demo: Letta Memory System ===\n');

  try {
    // Initialize Letta provider
    console.log('1. Initializing Letta provider with Qwen 2.5 Coder 7B...');
    const letta = new LettaProvider('ollama/qwen2.5-coder:7b');
    
    console.log('   Note: This requires Letta server running on localhost:8283');
    console.log('   To start Letta server: letta server');
    console.log('   Skipping actual initialization for now...\n');

    // Show memory blocks
    console.log('2. Default Memory Blocks:');
    console.log('   - persona: AI assistant role and capabilities');
    console.log('   - user: User preferences and context');
    console.log('   - project: Current project information');
    console.log('   - conversation: Recent conversation context\n');

    console.log('3. Memory Features:');
    console.log('   ✓ Unlimited context (no 8K/32K limit)');
    console.log('   ✓ Self-editing memory (agent updates its own memory)');
    console.log('   ✓ Memory hierarchy (in-context vs out-of-context)');
    console.log('   ✓ Memory search (find relevant information)\n');

  } catch (error) {
    console.error('Error:', error);
  }
}

async function demoPersonalContext() {
  console.log('=== Pack 11 Phase 1 Demo: Personal Context Repository ===\n');

  try {
    // Initialize context manager
    console.log('1. Loading personal context...');
    const contextManager = new PersonalContextManager();
    await contextManager.load();
    console.log('   ✓ Context loaded\n');

    // Show context
    const context = contextManager.getContext();
    console.log('2. User Preferences:');
    console.log(`   Language: ${context?.preferences.codingStyle.language}`);
    console.log(`   Framework: ${context?.preferences.codingStyle.framework}`);
    console.log(`   Communication: ${context?.preferences.communicationStyle}\n`);

    console.log('3. Active Projects:');
    for (const project of context?.projects || []) {
      console.log(`   - ${project.name}`);
      console.log(`     Phase: ${project.currentPhase}`);
      console.log(`     Tech: ${project.techStack.join(', ')}\n`);
    }

    console.log('4. Domain Knowledge:');
    for (const knowledge of context?.knowledge || []) {
      console.log(`   - ${knowledge.domain}`);
      console.log(`     ${knowledge.content.substring(0, 100)}...\n`);
    }

    // Test context injection
    console.log('5. Testing Context Injection:');
    const injector = new ContextInjector(contextManager);
    
    const testPrompt = 'Build a React component for user authentication';
    console.log(`   Original prompt: "${testPrompt}"\n`);
    
    const injectedPrompt = await injector.injectCodeContext(testPrompt);
    console.log('   Injected context:');
    console.log('   ' + injectedPrompt.split('\n').slice(0, 10).join('\n   '));
    console.log('   ...\n');

    // Test relevant context
    console.log('6. Testing Relevant Context Extraction:');
    const relevantContext = contextManager.getRelevantContext('local-first ai');
    console.log('   Query: "local-first ai"');
    console.log('   Relevant context:');
    console.log('   ' + relevantContext.split('\n').slice(0, 5).join('\n   '));
    console.log('   ...\n');

  } catch (error) {
    console.error('Error:', error);
  }
}

async function demoIntegration() {
  console.log('=== Pack 11 Phase 1 Demo: Integration ===\n');

  console.log('How Letta + Personal Context work together:\n');
  
  console.log('1. User sends a prompt');
  console.log('   ↓');
  console.log('2. ContextInjector adds personal context');
  console.log('   ↓');
  console.log('3. LettaProvider sends to agent with unlimited memory');
  console.log('   ↓');
  console.log('4. Agent uses memory blocks + injected context');
  console.log('   ↓');
  console.log('5. Agent generates personalized response');
  console.log('   ↓');
  console.log('6. Agent updates its own memory blocks\n');

  console.log('Benefits:');
  console.log('✓ Unlimited context (Letta memory)');
  console.log('✓ Personalized responses (user context)');
  console.log('✓ Self-improving (agent learns over time)');
  console.log('✓ 100% local (no cloud dependency)\n');
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  Pack 11 Phase 1: Foundation Demo                     ║');
  console.log('║  Letta Memory + Personal Context Repository           ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  await demoLettaMemory();
  console.log('\n' + '─'.repeat(60) + '\n');
  
  await demoPersonalContext();
  console.log('\n' + '─'.repeat(60) + '\n');
  
  await demoIntegration();

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  Phase 1 Complete!                                     ║');
  console.log('║  Next: Phase 2 - Self-Improvement + Qwen Optimization ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
}

main().catch(console.error);

