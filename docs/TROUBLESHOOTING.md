# Troubleshooting Guide

Common issues and solutions for the Coding AI Platform v2.

---

## ❌ "Task failed - Steps completed: undefined/undefined"

### **Cause**
The AI model (Ollama) failed to generate a valid execution plan. This usually means:
- Ollama returned invalid JSON
- Ollama returned JSON wrapped in markdown
- Ollama is not responding correctly

### **Solution**

#### **Step 1: Run Diagnostics**
```bash
npm run diagnose:ollama
```

This will test:
- ✅ Ollama availability
- ✅ Simple JSON generation
- ✅ Planning-style JSON generation
- ✅ Real task planning

#### **Step 2: Check the Output**

**If you see "Valid JSON returned":**
- ✅ Ollama is working correctly
- The issue might be with the specific task
- Try a simpler task

**If you see "Invalid JSON returned" or "Found JSON inside markdown":**
- ⚠️ Ollama is wrapping JSON in markdown code blocks
- This should be handled automatically by PlannerService
- If it's not working, there might be a parsing issue

**If you see "No valid JSON found":**
- ❌ Ollama is not following instructions
- Try solutions below

---

## 🔧 Solutions

### **Solution 1: Try a Simpler Task**

Instead of:
```
Create a TypeScript function to calculate fibonacci and save it to math.ts
```

Try:
```
Create a file called test.txt with "Hello World"
```

### **Solution 2: Use Gemma 2 (Faster, Simpler)**

Gemma 2 is better at following JSON instructions:

```bash
# Pull Gemma 2
ollama pull gemma2:2b

# Update the model in demo script
# Edit src/scripts/demo-real-agent.ts
# Change: const TEST_MODEL = 'qwen2.5-coder:7b';
# To:     const TEST_MODEL = 'gemma2:2b';

npm run build
npm run demo:agent
```

### **Solution 3: Lower Temperature**

Edit `src/services/PlannerService.ts` line 30:

```typescript
// Change from:
temperature: 0.3

// To:
temperature: 0.1  // More deterministic
```

### **Solution 4: Restart Ollama**

```bash
# Stop Ollama (Ctrl+C if running in terminal)
# Or kill the process

# Start Ollama again
ollama serve

# In another terminal, test
curl http://localhost:11434/api/tags
```

### **Solution 5: Use Cloud AI for Planning (Recommended)**

For production use, use cloud AI for planning and local AI for execution:

```typescript
// In your code:
import { AnthropicProvider } from './providers/AnthropicProvider.js';
import { OllamaProvider } from './providers/OllamaProvider.js';

// Use Anthropic for planning (reliable JSON)
const planningProvider = new AnthropicProvider(process.env.ANTHROPIC_API_KEY);
const planner = new PlannerService(planningProvider, toolRegistry);

// Use Ollama for code generation (fast, local)
const codeProvider = new OllamaProvider('http://localhost:11434', 'qwen2.5-coder:7b');
```

This is what **Pack 4 (Two-Brain Hybrid System)** will implement!

---

## ❌ "Ollama is not available"

### **Cause**
Ollama is not running or not accessible.

### **Solution**

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not running, start it
ollama serve

# Verify the model is installed
ollama list

# If model not found, pull it
ollama pull qwen2.5-coder:7b
```

---

## ❌ "Model not found"

### **Cause**
The specified model is not installed.

### **Solution**

```bash
# List installed models
ollama list

# Pull the model
ollama pull qwen2.5-coder:7b

# Or use a different model
ollama pull gemma2:2b
```

---

## ❌ Tests are very slow

### **Cause**
Local AI inference is computationally expensive.

### **Expected Performance**
- **Qwen 2.5 Coder 7B**: 2-5 seconds per task
- **Gemma 2 2B**: 1-2 seconds per task
- **Complex tasks**: 10-30 seconds

### **Solutions**

1. **Use smaller model**: `gemma2:2b` instead of `qwen2.5-coder:7b`
2. **Use GPU acceleration**: If you have a compatible GPU
3. **Use cloud AI**: For faster responses (but costs money)

---

## ❌ "Plan generation failed: Unexpected token"

### **Cause**
The AI returned text that's not valid JSON.

### **Solution**

Run diagnostics to see what the model is returning:

```bash
npm run diagnose:ollama
```

Look at the "Raw response" section to see what Ollama is actually returning.

Common issues:
- Model adds explanations before/after JSON
- Model wraps JSON in markdown code blocks
- Model returns incomplete JSON

**Fix**: The PlannerService should handle markdown code blocks automatically. If it's not working, check the `parsePlan` method in `src/services/PlannerService.ts`.

---

## ❌ "Security error: path outside workspace"

### **Cause**
The agent tried to access a file outside the workspace directory.

### **Solution**

This is **expected behavior** for security. The FileSystemService prevents:
- Absolute paths (`/etc/passwd`, `C:\Windows\System32`)
- Parent directory traversal (`../../../sensitive-file`)
- Symlink attacks

**This is a feature, not a bug!**

If you need to access files outside the workspace, you must:
1. Change the workspace root when creating FileSystemService
2. Or copy files into the workspace first

---

## ❌ "Tool execution failed"

### **Cause**
A tool failed during execution.

### **Solution**

Check the error message for details. Common issues:

**File not found:**
- The agent tried to read a file that doesn't exist
- Solution: Make sure the file exists or the agent creates it first

**Invalid parameters:**
- The agent passed wrong parameter types
- Solution: Check tool parameter validation in ToolRegistry

**Permission denied:**
- File system permissions issue
- Solution: Check workspace directory permissions

---

## 🐛 Debugging Tips

### **Enable Verbose Logging**

Add console.log statements to see what's happening:

```typescript
// In src/services/PlannerService.ts
async generatePlan(userTask: string): Promise<ExecutionPlan> {
  const response = await this.provider.generateText(prompt, options);
  
  console.log('=== RAW AI RESPONSE ===');
  console.log(response.text);
  console.log('======================');
  
  const plan = this.parsePlan(response.text);
  // ...
}
```

### **Test Individual Components**

```bash
# Test just Ollama
npm run test:ollama

# Test just the planner
npm run diagnose:ollama

# Test the full agent
npm run demo:agent
```

### **Check Ollama Logs**

If Ollama is running in a terminal, check its output for errors.

---

## 📞 Still Having Issues?

If none of these solutions work:

1. **Run full diagnostics**: `npm run diagnose:ollama`
2. **Check Ollama version**: `ollama --version`
3. **Try a different model**: `ollama pull gemma2:2b`
4. **Check system resources**: Ollama needs RAM (8GB+ recommended)
5. **Wait for Pack 4**: The Two-Brain Hybrid System will use cloud AI for planning (more reliable)

---

## ✅ Quick Checklist

Before reporting an issue, verify:

- [ ] Ollama is running (`curl http://localhost:11434/api/tags`)
- [ ] Model is installed (`ollama list`)
- [ ] Diagnostics pass (`npm run diagnose:ollama`)
- [ ] Unit tests pass (`npm test`)
- [ ] You tried a simple task first
- [ ] You checked the troubleshooting guide

---

**Most issues are caused by Ollama returning invalid JSON. The diagnostic script will help identify this!**

