# Testing Protocol - Coding AI Platform v2

**Mandatory testing protocol for all packs from Pack 3 onwards.**

---

## 📋 **Overview**

Every pack must pass **THREE levels of testing**:
1. ✅ **Unit Tests** (mocked dependencies)
2. ✅ **Integration Tests** (real components, mocked AI)
3. ✅ **Real-World Tests** (real AI, real execution)

**A pack is NOT complete until all three levels pass.**

---

## 🔄 **Testing Workflow**

```
┌─────────────────────────────────────────────────────────┐
│  PHASE 1: PRE-BUILD VALIDATION                          │
│  - Review requirements                                  │
│  - Check dependencies exist                             │
│  - Verify interfaces are defined                        │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  PHASE 2: BUILD                                         │
│  - Write code                                           │
│  - Write unit tests                                     │
│  - Write integration tests                              │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  PHASE 3: POST-BUILD UNIT TESTING                       │
│  - Run: npm test                                        │
│  - All tests must pass                                  │
│  - Code coverage > 80%                                  │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  PHASE 4: REAL-WORLD INTEGRATION TESTING                │
│  - Run diagnostic tests                                 │
│  - Run interactive testing (MANDATORY)                  │
│  - Run automated real-world tests                       │
│  - Run stress tests                                     │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  PHASE 5: BUG FIXES & ITERATION                         │
│  - Fix any issues found                                 │
│  - Re-run all tests                                     │
│  - Document known limitations                           │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  ✅ PACK COMPLETE                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 **Phase 1: Pre-Build Validation**

**Before writing any code, verify:**

### **Checklist:**
- [ ] Requirements are clear and documented
- [ ] All dependencies are available
- [ ] Interfaces/types are defined
- [ ] Previous packs are complete and tested
- [ ] Test strategy is defined

### **Questions to Answer:**
1. What are we building?
2. What are the inputs and outputs?
3. What dependencies does it have?
4. How will we test it?
5. What could go wrong?

---

## 🧪 **Phase 2: Build**

**While building, create tests alongside code:**

### **For Each Component:**
1. Write the interface/type first
2. Write unit tests (with mocks)
3. Write the implementation
4. Write integration tests (real components)
5. Verify tests pass

### **Test Coverage Requirements:**
- **Unit tests**: Every public method
- **Integration tests**: Every major workflow
- **Edge cases**: Error handling, invalid inputs, boundary conditions

---

## ✅ **Phase 3: Post-Build Unit Testing**

**After code is complete, run full test suite:**

### **Command:**
```bash
npm test
```

### **Success Criteria:**
- ✅ All tests pass (100%)
- ✅ No TypeScript errors
- ✅ No linting errors
- ✅ Code coverage > 80%

### **If Tests Fail:**
1. Fix the code
2. Re-run tests
3. Repeat until all pass

**DO NOT proceed to Phase 4 until all unit tests pass.**

---

## 🌍 **Phase 4: Real-World Integration Testing**

**Test with real AI models and real execution:**

### **Step 1: Diagnostic Tests**
```bash
npm run diagnose:ollama
```

**Success Criteria:**
- ✅ Ollama is available
- ✅ Model returns valid responses
- ✅ JSON parsing works

### **Step 2: Interactive Testing (MANDATORY)**
```bash
npm run interactive:agent
```

**Required Test Cases:**
1. **Simple Tasks** - Verify basic functionality
   - Example: "Create a file called test.txt with Hello World"
   - Expected: File created with correct content

2. **Complex Tasks** - Verify multi-step workflows
   - Example: "Create 3 files with different content"
   - Expected: All files created correctly

3. **Edge Cases** - Try to break the system
   - Invalid paths: `../../etc/passwd`
   - Non-existent files: "Read file that doesn't exist"
   - Malformed requests: Empty input, gibberish
   - Boundary conditions: Very long content, special characters

4. **Error Handling** - Verify graceful failures
   - Request impossible tasks
   - Provide invalid parameters
   - Test retry logic

**Success Criteria:**
- ✅ Simple tasks complete successfully
- ✅ Complex tasks decompose and execute correctly
- ✅ Edge cases handled gracefully (no crashes)
- ✅ Error messages are clear and helpful
- ✅ System recovers from failures
- ✅ Performance is acceptable (< 30s per task)

**Documentation Required:**
- Document any tasks that break the system
- Note any unexpected behaviors
- Record performance observations
- Add findings to TEST_RESULTS.md

### **Step 3: Automated Real-World Tests**
```bash
npm run test:real-agent
```

**Success Criteria:**
- ✅ All predefined test cases pass
- ✅ Output validation succeeds
- ✅ No unexpected errors

### **Step 4: Stress Tests**
```bash
npm run stress:agent
```

**Success Criteria:**
- ✅ Handles ambiguous tasks gracefully
- ✅ Handles complex multi-step tasks
- ✅ Security checks work (path validation)
- ✅ Error recovery works

---

## 🐛 **Phase 5: Bug Fixes & Iteration**

**If any real-world tests fail:**

### **Process:**
1. **Document the issue**
   - What failed?
   - What was expected?
   - What actually happened?
   - How to reproduce?

2. **Categorize the issue**
   - 🔴 **Critical**: System doesn't work at all
   - 🟡 **Major**: Feature broken, workaround exists
   - 🟢 **Minor**: Edge case, cosmetic issue

3. **Fix the issue**
   - Write a failing test first
   - Fix the code
   - Verify test passes
   - Re-run all tests

4. **Re-test**
   - Run unit tests: `npm test`
   - Run real-world tests again
   - Verify fix works

5. **Document**
   - Update TROUBLESHOOTING.md
   - Add to known limitations if needed

---

## 📊 **Test Results Documentation**

**After each pack, document results:**

### **Template:**
```markdown
## Pack X.Y - [Name]

### Unit Tests
- Total: X tests
- Passed: X
- Failed: 0
- Coverage: X%

### Integration Tests
- Total: X tests
- Passed: X
- Failed: 0

### Real-World Tests
- Diagnostic: ✅ PASS
- Interactive Testing: ✅ PASS (4 categories tested: simple, complex, edge cases, error handling)
- Automated Tests: ✅ PASS (X/X cases)
- Stress Tests: ✅ PASS (X/X cases)

### Known Issues
- None

### Performance
- Average task time: Xms
- Max task time: Xms

### Status
✅ COMPLETE - All tests passing
```

---

## 🎯 **Success Criteria Summary**

**A pack is complete when:**
- ✅ All unit tests pass (npm test)
- ✅ All integration tests pass
- ✅ Diagnostic tests pass
- ✅ Interactive testing complete (all 4 categories: simple, complex, edge cases, error handling)
- ✅ Automated real-world tests pass
- ✅ Stress tests pass
- ✅ All bugs are fixed or documented
- ✅ Test results are documented

**If ANY of these fail, the pack is NOT complete.**

---

## 🚫 **Common Mistakes to Avoid**

1. ❌ Skipping real-world tests ("unit tests are enough")
2. ❌ Not testing with real AI models
3. ❌ Not testing error cases
4. ❌ Not documenting test results
5. ❌ Moving to next pack with failing tests
6. ❌ Only testing happy path
7. ❌ Not testing performance

---

## 📚 **Test Scripts Reference**

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `npm test` | Unit + integration tests | After every code change |
| `npm run diagnose:ollama` | Check Ollama health | Before real-world tests |
| `npm run interactive:agent` | Interactive testing (MANDATORY) | Phase 4 - Manual testing, try to break it |
| `npm run test:real-agent` | Automated real-world tests | Phase 4 - Before marking pack complete |
| `npm run stress:agent` | Edge cases + stress tests | Phase 4 - Final validation |

---

**This protocol is MANDATORY for all future packs.**

