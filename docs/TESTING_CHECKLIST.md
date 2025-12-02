# Testing Checklist - Pack Completion

**Use this checklist for every pack to ensure complete testing.**

---

## 📋 **Pre-Build Phase**

### Before Writing Code:
- [ ] Requirements are documented
- [ ] Dependencies are identified
- [ ] Interfaces/types are defined
- [ ] Test strategy is planned
- [ ] Previous packs are complete

### Run Pre-Flight Check:
```bash
npm run pre-flight
```

**Expected Output:**
- ✅ Node.js Version
- ✅ Ollama Running
- ✅ Required Models
- ✅ Build Status

---

## 🔨 **Build Phase**

### While Building:
- [ ] Write interfaces/types first
- [ ] Write unit tests alongside code
- [ ] Write integration tests
- [ ] Test as you go
- [ ] Handle error cases

---

## ✅ **Post-Build Phase**

### Run Post-Pack Validation:
```bash
npm run post-pack
```

**Expected Output:**
- ✅ Build successful
- ✅ All unit tests pass
- ✅ Ollama available

### If Validation Fails:
- [ ] Fix build errors
- [ ] Fix failing tests
- [ ] Re-run validation
- [ ] Repeat until all pass

---

## 🌍 **Real-World Testing Phase**

### Step 1: Diagnostic Tests
```bash
npm run diagnose:ollama
```

**Checklist:**
- [ ] Ollama is available
- [ ] Model returns valid responses
- [ ] JSON parsing works
- [ ] No errors

### Step 2: Interactive Testing (MANDATORY)
```bash
npm run interactive:agent
```

**Category 1: Simple Tasks**
- [ ] Test: "Create a file called test.txt with Hello World"
  - Expected: File created with correct content
  - Duration: < 30s
- [ ] Verify file exists and contains correct content (use "files" command)

**Category 2: Complex Tasks**
- [ ] Test: "Create 3 files named file1.txt, file2.txt, file3.txt with different content"
  - Expected: All files created correctly
  - Duration: < 30s
- [ ] Verify multi-step decomposition works
- [ ] Verify all files created (use "files" command)

**Category 3: Edge Cases (Try to Break It)**
- [ ] Test invalid path: "Create a file at ../../etc/passwd"
  - Expected: Graceful error, no crash
- [ ] Test non-existent file: "Read a file that doesn't exist"
  - Expected: Clear error message
- [ ] Test empty input: Just press Enter
  - Expected: Prompt again, no crash
- [ ] Test gibberish: "asdfghjkl qwerty"
  - Expected: Graceful handling or attempt to parse
- [ ] Test very long content: "Create a file with 10000 characters of text"
  - Expected: Handles or fails gracefully
- [ ] Test special characters: "Create file with emoji 🚀 and unicode"
  - Expected: Handles or fails gracefully

**Category 4: Error Handling**
- [ ] Test impossible task: "Delete the internet"
  - Expected: Clear error message
- [ ] Test invalid parameters: "Create file with no name"
  - Expected: Clear error message
- [ ] Verify error messages are clear and helpful
- [ ] Verify system recovers gracefully (can continue after error)

**Documentation:**
- [ ] Document any tasks that broke the system in TEST_RESULTS.md
- [ ] Note any unexpected behaviors in TEST_RESULTS.md
- [ ] Record performance observations in TEST_RESULTS.md

### Step 3: Automated Tests
```bash
npm run test:real-agent
```

**Checklist:**
- [ ] All test cases pass
- [ ] Output validation succeeds
- [ ] No unexpected errors
- [ ] Performance is acceptable

### Step 4: Stress Tests
```bash
npm run stress:agent
```

**Checklist:**
- [ ] Handles ambiguous tasks gracefully
- [ ] Handles complex multi-step tasks
- [ ] Security checks work (path validation)
- [ ] Error recovery works
- [ ] No crashes or hangs

---

## 🐛 **Bug Fix Phase**

### If Any Tests Fail:

1. **Document the Issue:**
   - [ ] What failed?
   - [ ] What was expected?
   - [ ] What actually happened?
   - [ ] How to reproduce?

2. **Categorize:**
   - [ ] 🔴 Critical (system broken)
   - [ ] 🟡 Major (feature broken)
   - [ ] 🟢 Minor (edge case)

3. **Fix:**
   - [ ] Write failing test
   - [ ] Fix the code
   - [ ] Verify test passes
   - [ ] Re-run all tests

4. **Document:**
   - [ ] Update TROUBLESHOOTING.md
   - [ ] Add to known limitations if needed
   - [ ] Update TEST_RESULTS.md

---

## 📊 **Documentation Phase**

### Update Test Results:
Edit `docs/TEST_RESULTS.md` with:

- [ ] Unit test count and results
- [ ] Real-world test results
- [ ] Performance metrics
- [ ] Bugs found and fixed
- [ ] Known issues
- [ ] Status (✅ COMPLETE or 🟡 IN PROGRESS)

### Template:
```markdown
## Pack X.Y - [Name]

### Unit Tests
- Total: X tests
- Passed: X
- Failed: 0
- Coverage: X%

### Real-World Tests
- Diagnostic: ✅ PASS
- Interactive Testing: ✅ PASS (4 categories: simple, complex, edge cases, error handling)
- Automated Tests: ✅ PASS (X/X cases)
- Stress Tests: ✅ PASS (X/X cases)

### Bugs Found & Fixed
1. ✅ [Description]

### Known Issues
- None

### Performance
- Average: Xms
- Max: Xms

### Status
✅ COMPLETE
```

---

## ✅ **Final Checklist**

### Before Marking Pack Complete:

- [ ] All unit tests pass (npm test)
- [ ] Build succeeds (npm run build)
- [ ] Diagnostic tests pass (npm run diagnose:ollama)
- [ ] Interactive testing complete (npm run interactive:agent - all 4 categories)
- [ ] Automated tests pass (npm run test:real-agent)
- [ ] Stress tests pass (npm run stress:agent)
- [ ] All bugs are fixed or documented
- [ ] Test results are documented
- [ ] Known issues are documented
- [ ] Performance is acceptable

### If ALL Checked:
✅ **PACK IS COMPLETE** - Ready to move to next pack

### If ANY Unchecked:
🟡 **PACK IS NOT COMPLETE** - Continue testing and fixing

---

## 🚀 **Quick Commands Reference**

| Command | Purpose |
|---------|---------|
| `npm run pre-flight` | Pre-build validation |
| `npm run build` | Build the project |
| `npm test` | Run unit tests |
| `npm run post-pack` | Post-build validation |
| `npm run diagnose:ollama` | Diagnostic tests |
| `npm run demo:agent` | Interactive demo |
| `npm run test:real-agent` | Automated real-world tests |
| `npm run stress:agent` | Stress tests |

---

**Use this checklist for EVERY pack from now on!**

