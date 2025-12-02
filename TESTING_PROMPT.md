# 🎯 TESTING PROMPT - Use This When Adding New Features

Copy and paste this prompt when you want to add a new feature to the Coding AI Platform:

---

## THE PROMPT:

```
I want to add [FEATURE NAME] to the Coding AI Platform.

MANDATORY TESTING PROTOCOL:

You MUST follow the comprehensive testing protocol defined in TESTING_PROTOCOL.md.

PHASE 1 - PRE-IMPLEMENTATION ANALYSIS (REQUIRED BEFORE ANY CODE):

1. Perform complete impact analysis:
   - List ALL files to be created
   - List ALL files to be modified
   - Identify ALL dependencies affected
   - Identify ALL APIs/endpoints affected
   - Assess risk level (Low/Medium/High)
   - Assess complexity (Low/Medium/High)

2. Run baseline tests:
   - Run ALL existing tests
   - Document current test coverage
   - Verify ALL existing features work
   - Create performance baseline metrics

3. Design review:
   - Explain how this fits the architecture
   - Verify naming conventions
   - Confirm follows existing patterns
   - Identify potential conflicts

4. Present findings and WAIT FOR MY APPROVAL before proceeding.

PHASE 2 - IMPLEMENTATION WITH INCREMENTAL TESTING:

For EACH new file or feature:

1. Write the code with full documentation

2. Write and run unit tests:
   - Test each function in isolation
   - Test ALL edge cases (null, undefined, empty, max, min)
   - Test error handling
   - Test input validation
   - Achieve 80%+ code coverage
   - EXPLAIN what each test does
   - SHOW test results

3. Write and run integration tests:
   - Test interaction with existing code
   - Test API endpoints
   - Test database operations
   - Test file system operations
   - EXPLAIN what each test does
   - SHOW test results

4. Run regression tests:
   - Re-run ALL existing tests
   - Verify NO existing features broke
   - Check for performance degradation
   - SHOW test results

5. WAIT FOR MY APPROVAL before proceeding to next feature.

PHASE 3 - SYSTEM INTEGRATION TESTING:

After all features implemented:

1. Run end-to-end tests:
   - Test complete user workflows
   - Test all UI interactions
   - Test all API endpoints
   - Test error scenarios
   - EXPLAIN each test
   - SHOW results

2. Run performance tests:
   - Measure response times
   - Check memory usage
   - Monitor CPU usage
   - Test under load
   - SHOW metrics

3. Run security tests:
   - Check authentication
   - Test authorization
   - Verify input sanitization
   - Check for vulnerabilities
   - SHOW results

4. Run compatibility tests:
   - Test on Windows
   - Test different scenarios
   - SHOW results

5. WAIT FOR MY APPROVAL before proceeding.

PHASE 4 - USER ACCEPTANCE:

1. Guide me through manual testing
2. Show me updated documentation
3. Wait for my final approval

FAILURE HANDLING:

If ANY test fails:
- STOP IMMEDIATELY
- Do NOT proceed to next feature
- EXPLAIN what failed
- EXPLAIN why it failed
- EXPLAIN the impact
- FIX the issue
- RE-RUN the failed test
- RE-RUN all related tests
- VERIFY the fix
- DOCUMENT the issue
- Only proceed after ALL tests pass

TESTING REQUIREMENTS:

- Unit test coverage: 80% minimum
- Integration tests: ALL API endpoints
- Regression tests: ALL existing features
- E2E tests: ALL critical workflows
- Test types: Happy path, edge cases, error handling, security

EXPLANATION REQUIREMENTS:

For EVERY test:
- Explain what it tests
- Explain why it's important
- Explain what success looks like
- Explain what failure would mean
- Show the actual test results

BE SLOW AND DELIBERATE:
- Take your time
- Explain everything
- Don't rush
- Don't skip tests
- Don't assume things work
- Verify everything

SUCCESS CRITERIA:

Feature is complete ONLY when:
✅ All tests pass (100%)
✅ Code coverage ≥ 80%
✅ No existing features broken
✅ Performance acceptable
✅ Security verified
✅ Documentation complete
✅ I have approved

Now, begin Phase 1 - Pre-Implementation Analysis for [FEATURE NAME].
```

---

## EXAMPLE USAGE:

### Example 1: Adding a New Feature

```
I want to add "Real-time collaboration" to the Coding AI Platform.

[Paste the full TESTING PROMPT above, replacing [FEATURE NAME] with "Real-time collaboration"]
```

### Example 2: Adding a New Service

```
I want to add "Code Review Service" to the Coding AI Platform.

[Paste the full TESTING PROMPT above, replacing [FEATURE NAME] with "Code Review Service"]
```

### Example 3: Adding a New UI Component

```
I want to add "Diff Viewer Component" to the Coding AI Platform.

[Paste the full TESTING PROMPT above, replacing [FEATURE NAME] with "Diff Viewer Component"]
```

---

## TIPS FOR BEST RESULTS:

1. **Be Specific:** Clearly describe what you want to add
2. **Be Patient:** Let the AI complete each phase fully
3. **Review Carefully:** Check all test results before approving
4. **Ask Questions:** If anything is unclear, ask for clarification
5. **Don't Skip Steps:** Follow the protocol completely
6. **Document Issues:** Keep track of any problems found

---

## WHAT TO EXPECT:

### Phase 1 Response:
The AI will provide:
- Detailed impact analysis
- List of files to create/modify
- Risk assessment
- Design review
- Request for your approval

### Phase 2 Response:
For each feature, the AI will:
- Show the code
- Show unit tests with explanations
- Show test results
- Show integration tests with explanations
- Show test results
- Show regression test results
- Request for your approval

### Phase 3 Response:
The AI will:
- Run comprehensive system tests
- Show performance metrics
- Show security test results
- Show compatibility results
- Request for your approval

### Phase 4 Response:
The AI will:
- Guide you through manual testing
- Show updated documentation
- Request final approval

---

## SAMPLE INTERACTION:

**You:**
```
I want to add "Export to PDF" feature to the Coding AI Platform.

[Full testing prompt]
```

**AI:**
```
PHASE 1 - PRE-IMPLEMENTATION ANALYSIS

1. IMPACT ANALYSIS:

Files to be created:
- src/services/PdfExportService.ts
- src/api/export.routes.ts
- tests/services/PdfExportService.test.ts
- tests/api/export.routes.test.ts

Files to be modified:
- src/index.ts (add export routes)
- ui/components/CodeEditor.tsx (add export button)
- package.json (add pdf library dependency)

Dependencies affected:
- Will add: pdfkit, @types/pdfkit
- Affects: CodeEditor component
- Affects: API routing

APIs/Endpoints affected:
- New: POST /api/export/pdf
- New: GET /api/export/formats

Risk Level: MEDIUM
- Reason: Adds new dependency, modifies existing UI component

Complexity: MEDIUM
- Reason: Requires PDF generation library, file handling, UI integration

2. BASELINE TESTS:

Running existing tests...
[Shows test results]

Current test coverage: 78%
All existing features verified working
Performance baseline: 20s average response time

3. DESIGN REVIEW:

Architecture fit:
- Follows service pattern (PdfExportService)
- Follows API pattern (export.routes.ts)
- Integrates with existing FileOperationsService

Naming conventions:
✅ PdfExportService (PascalCase for services)
✅ export.routes.ts (kebab-case for routes)
✅ Follows existing patterns

Potential conflicts:
- None identified
- Export button placement in UI needs consideration

Do you approve proceeding to Phase 2?
```

**You:**
```
Yes, approved. Proceed to Phase 2.
```

**AI:**
```
PHASE 2 - IMPLEMENTATION

Creating: src/services/PdfExportService.ts

[Shows code]

Now writing unit tests...

TEST 1: Should export code to PDF
Purpose: Verify basic PDF generation works
Importance: Core functionality
Success: PDF file created with correct content
Failure: Would mean feature doesn't work at all

[Shows test code]
[Shows test result: PASS]

TEST 2: Should handle empty code
Purpose: Test edge case with no content
Importance: Prevents crashes on empty input
Success: Creates valid PDF with empty content
Failure: Would crash the service

[Shows test code]
[Shows test result: PASS]

[Continues with all tests...]

Unit test coverage: 85% ✅
All unit tests passed: 12/12 ✅

Now running integration tests...

[Shows integration tests and results]

Now running regression tests...

[Shows that all existing tests still pass]

Do you approve proceeding to the next feature?
```

---

**This prompt ensures thorough, deliberate testing at every step!**

