# Real-World Agent Testing Guide

This guide covers the real-world testing suite for the agent system, which tests the complete system with actual Ollama models (not mocks).

---

## 🎯 Overview

The testing suite includes three types of real-world tests:

1. **Automated Tests** (`test:real-agent`) - Runs predefined test cases and validates results
2. **Interactive Demo** (`demo:agent`) - Interactive CLI for testing custom tasks
3. **Stress Tests** (`stress:agent`) - Tests edge cases, error handling, and performance

---

## 📋 Prerequisites

Before running real-world tests, ensure:

1. **Ollama is running**:
   ```bash
   # Check if Ollama is running
   curl http://localhost:11434/api/tags
   ```

2. **Qwen 2.5 Coder 7B is installed**:
   ```bash
   ollama list
   # Should show: qwen2.5-coder:7b
   ```

3. **Project is built**:
   ```bash
   npm run build
   ```

---

## 🧪 Test Suite 1: Automated Tests

**Command**: `npm run test:real-agent`

### What It Tests

- ✅ Simple file creation
- ✅ TypeScript code generation
- ✅ Multi-file workflows
- ✅ File validation
- ✅ Plan execution
- ✅ Error handling

### Example Output

```
🤖 REAL-WORLD AGENT TESTING
Model: qwen2.5-coder:7b
Ollama URL: http://localhost:11434

[1/3] Simple File Creation
📋 Task: Create a file called hello.txt with the text "Hello, World!"
⏳ Generating plan...
✓ Plan executed (1/1 steps)
🔍 Validating output...
✓ Validation passed (2341ms)
✓ PASSED

📊 Test Summary
Total: 3
Passed: 3
Failed: 0
Total Duration: 8234ms
Average Duration: 2745ms

✅ All tests passed!
```

### When to Use

- Before committing code changes
- After modifying agent/planner/executor logic
- To verify Ollama integration works
- To benchmark performance

---

## 🎮 Test Suite 2: Interactive Demo

**Command**: `npm run demo:agent`

### What It Does

Provides an interactive CLI where you can:
- Enter custom tasks in natural language
- See the agent plan and execute in real-time
- View execution statistics
- Test your own use cases

### Example Session

```
╔════════════════════════════════════════════════════════════╗
║         🤖 INTERACTIVE AGENT DEMO                         ║
╚════════════════════════════════════════════════════════════╝

Model: qwen2.5-coder:7b
Workspace: C:\Users\...\agent-workspace

📝 Example tasks you can try:
  • Create a file called hello.txt with "Hello World"
  • Write a TypeScript function to calculate fibonacci and save it to math.ts
  • List all files in the current directory

💡 Type "exit" or "quit" to stop

Task > Create a package.json with name "my-app"

⏳ Generating execution plan...

✅ Task completed successfully!
   Steps: 1/1
   Duration: 1823ms
   Tools used: write_file

Task > tools

🔧 Available tools:
  • write_file: Write content to a file
  • read_file: Read content from a file
  • list_files: List files in a directory
  • delete_file: Delete a file

Task > exit
👋 Goodbye!
```

### Available Commands

- **Any natural language task** - Execute a task
- `help` - Show available commands
- `tools` - List available tools
- `stats` - Show tool execution statistics
- `clear` - Clear the screen
- `exit` or `quit` - Exit the demo

### When to Use

- Exploring agent capabilities
- Testing custom tasks
- Debugging specific scenarios
- Demonstrating the system to others

---

## 🔥 Test Suite 3: Stress Tests

**Command**: `npm run stress:agent`

### What It Tests

- ⚠️ Ambiguous/vague tasks
- 🔢 Complex multi-step tasks (5+ steps)
- 🔒 Security (invalid file paths)
- 📦 Large content generation
- ⚡ Concurrent execution
- 💥 Error recovery

### Example Output

```
🔥 AGENT STRESS TESTING
Model: qwen2.5-coder:7b
Tests: 5

[1/5] Ambiguous Task
   Test how the agent handles vague instructions
   ✓ PASSED: Agent handled ambiguous task (3421ms)

[2/5] Complex Multi-Step Task
   Test a task requiring many steps
   ✓ PASSED: Created 5/5 files (8932ms)

[3/5] Invalid File Path
   Test error handling for invalid paths
   ✓ PASSED: Correctly rejected invalid path (1234ms)

📊 Stress Test Summary
Total: 5
Passed: 5
Failed: 0
Total Duration: 18234ms
Average Duration: 3647ms

✅ All stress tests passed!
```

### When to Use

- Before production deployment
- After major refactoring
- To identify edge cases
- To test error handling
- To benchmark performance under load

---

## 📊 Comparison: Unit Tests vs Real-World Tests

| Aspect | Unit Tests | Real-World Tests |
|--------|-----------|------------------|
| **Speed** | Fast (< 10s) | Slow (30s - 2min) |
| **Dependencies** | Mocked | Real Ollama |
| **AI Responses** | Predictable | Variable |
| **Coverage** | Individual components | End-to-end |
| **When to Run** | Every commit | Before merge/deploy |
| **CI/CD** | Always | Optional |

---

## 🎯 Recommended Testing Workflow

### During Development
```bash
# Quick feedback loop
npm test                    # Unit tests (fast)
npm run test:real-agent     # Real tests (slow but thorough)
```

### Before Committing
```bash
npm test                    # All unit tests
npm run test:real-agent     # Automated real-world tests
```

### Before Merging/Deploying
```bash
npm test                    # All unit tests
npm run test:real-agent     # Automated tests
npm run stress:agent        # Stress tests
```

### For Exploration/Debugging
```bash
npm run demo:agent          # Interactive testing
```

---

## 🐛 Troubleshooting

### "Ollama is not available"
```bash
# Start Ollama
ollama serve

# Verify it's running
curl http://localhost:11434/api/tags
```

### "Model not found"
```bash
# Pull the model
ollama pull qwen2.5-coder:7b

# Verify it's installed
ollama list
```

### Tests are slow
- This is expected! Real AI inference takes time
- Qwen 2.5 Coder 7B: ~2-5 seconds per task
- Complex tasks: 10-30 seconds
- Consider using Gemma 3 1B for faster (but lower quality) testing

### Tests fail intermittently
- AI responses are non-deterministic
- The model might generate slightly different plans each time
- This is normal and expected
- Focus on overall success rate, not 100% consistency

---

## 📝 Adding New Test Cases

### To `test-real-agent.ts`:

```typescript
{
  name: 'Your Test Name',
  task: 'Natural language task description',
  validate: async (tempDir, result) => {
    // Validation logic
    const filePath = path.join(tempDir, 'expected-file.txt');
    const exists = await fs.access(filePath).then(() => true).catch(() => false);
    return exists;
  },
}
```

### To `stress-test-agent.ts`:

```typescript
{
  name: 'Your Stress Test',
  description: 'What this test validates',
  run: async (env) => {
    const start = Date.now();
    try {
      // Test logic
      const result = await env.executor.execute('task');
      return {
        success: result.success,
        message: 'Test result message',
        duration: Date.now() - start,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        duration: Date.now() - start,
      };
    }
  },
}
```

---

## 🎓 Next Steps

After running real-world tests:

1. **If tests pass**: Proceed to Pack 4 (Two-Brain Hybrid System)
2. **If tests fail**: Debug and fix issues before continuing
3. **If performance is poor**: Consider model optimization or hybrid approach

---

**Happy Testing! 🚀**

