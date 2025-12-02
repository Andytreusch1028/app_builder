/**
 * Simple test to verify fetch works with Ollama
 */

async function testFetch() {
  console.log('Testing fetch to Ollama...\n');
  
  try {
    console.log('1. Testing /api/tags endpoint...');
    const tagsResponse = await fetch('http://localhost:11434/api/tags');
    console.log(`   Status: ${tagsResponse.status}`);
    const tagsData = await tagsResponse.json();
    console.log(`   Models: ${tagsData.models?.map((m: any) => m.name).join(', ')}`);
    console.log('   ✓ Success!\n');
    
    console.log('2. Testing /api/generate endpoint...');
    const generateResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5-coder:7b',
        prompt: 'Say hello',
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 50,
        }
      })
    });
    
    console.log(`   Status: ${generateResponse.status}`);
    
    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      console.log(`   Error: ${errorText}`);
      return;
    }
    
    const generateData = await generateResponse.json();
    console.log(`   Response: ${generateData.response}`);
    console.log('   ✓ Success!\n');
    
    console.log('✅ All tests passed! Ollama is working correctly.');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  }
}

testFetch();

