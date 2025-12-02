# Application Builder - Comprehensive Test Plan

**Date:** 2025-11-26  
**Goal:** Verify the Application Builder can design and build sophisticated web apps using local LLM

---

## 🎯 Test Objectives

1. **Project Management** - Create, open, and manage projects
2. **Natural Language Building** - Use chat interface to build applications
3. **File Operations** - Browse, view, edit, and save files
4. **Live Preview** - Preview built applications in real-time
5. **Code Quality** - Verify generated code is clean and functional
6. **Local LLM Performance** - Test with Ollama (Qwen 2.5 Coder 7B)

---

## 📋 Test Scenarios

### **Test 1: Create Simple HTML/CSS/JS Website**

**Objective:** Build a simple interactive website with local LLM

**Steps:**
1. Open Application Builder at http://localhost:3000/builder.html
2. Create new project: "simple-website"
3. Send build request: "Create a simple website with a header, hero section, and contact form. Use modern CSS with gradients and animations."
4. Wait for build to complete
5. Browse generated files in file browser
6. Click on index.html to view in editor
7. Click "Refresh" in Live Preview panel
8. Verify website displays correctly
9. Edit CSS in Monaco Editor (change colors)
10. Save changes
11. Refresh preview and verify changes

**Expected Results:**
- ✅ Project created successfully
- ✅ Build completes in <30 seconds
- ✅ Files generated: index.html, styles.css, script.js
- ✅ Code is clean and well-structured
- ✅ Preview shows working website
- ✅ Edits save and reflect in preview

---

### **Test 2: Build React Component Library**

**Objective:** Test complex application generation

**Steps:**
1. Create new project: "react-components"
2. Send build request: "Create a React component library with 5 reusable components: Button, Card, Modal, Input, and Navbar. Include TypeScript types and a demo page showing all components."
3. Wait for build to complete
4. Browse file structure
5. Open component files in editor
6. Verify TypeScript types
7. Check demo page in preview

**Expected Results:**
- ✅ Complex file structure created
- ✅ TypeScript files with proper types
- ✅ Components are reusable and well-documented
- ✅ Demo page works in preview

---

### **Test 3: Build Full-Stack Todo App**

**Objective:** Test sophisticated application with multiple features

**Steps:**
1. Create new project: "todo-app"
2. Send build request: "Create a full-stack todo application with:
   - Modern UI with dark mode toggle
   - Add, edit, delete, and mark complete functionality
   - Filter by status (all, active, completed)
   - Local storage persistence
   - Responsive design
   - Smooth animations"
3. Wait for build to complete
4. Browse generated files
5. Test application in preview:
   - Add todos
   - Mark as complete
   - Delete todos
   - Toggle dark mode
   - Refresh page (verify persistence)
6. Edit code to customize styling
7. Save and verify changes

**Expected Results:**
- ✅ Full-featured application generated
- ✅ All functionality works correctly
- ✅ Clean, maintainable code
- ✅ Responsive design
- ✅ Local storage works
- ✅ Edits can be made and saved

---

### **Test 4: Iterative Development**

**Objective:** Test multi-step building and refinement

**Steps:**
1. Create new project: "portfolio"
2. Send build request: "Create a personal portfolio website with home, about, and projects sections"
3. Wait for build to complete
4. Review in preview
5. Send refinement request: "Add a contact form with email validation"
6. Wait for build to complete
7. Verify contact form added
8. Send another request: "Add smooth scroll navigation and a dark mode toggle"
9. Verify all features work together

**Expected Results:**
- ✅ Initial build successful
- ✅ Refinements add features without breaking existing code
- ✅ All features integrate smoothly
- ✅ Code remains clean and organized

---

### **Test 5: File Operations**

**Objective:** Test file browsing, editing, and saving

**Steps:**
1. Open existing project from Test 1
2. Browse file tree
3. Expand folders
4. Click on different files
5. Verify Monaco Editor loads correct content
6. Verify syntax highlighting for different file types
7. Make edits to multiple files
8. Save each file
9. Verify changes persist

**Expected Results:**
- ✅ File tree displays correctly
- ✅ Folders expand/collapse
- ✅ Files open in editor
- ✅ Syntax highlighting works for JS, HTML, CSS, etc.
- ✅ Edits save successfully
- ✅ Changes persist after refresh

---

### **Test 6: Error Handling**

**Objective:** Test system handles errors gracefully

**Steps:**
1. Send invalid build request: "asdfghjkl"
2. Verify error message displayed
3. Try to open non-existent file
4. Verify error handling
5. Try to save without opening file
6. Verify error message

**Expected Results:**
- ✅ Errors displayed clearly
- ✅ System doesn't crash
- ✅ User can recover from errors

---

### **Test 7: Performance Test**

**Objective:** Verify local LLM performance

**Steps:**
1. Create new project: "performance-test"
2. Send complex build request
3. Monitor build time
4. Check build log for details
5. Verify quality of generated code

**Expected Results:**
- ✅ Build completes in reasonable time (<60s for complex apps)
- ✅ Code quality is high
- ✅ No timeouts or crashes

---

## 🎨 Quality Checklist

For each generated application, verify:

- [ ] **Code Quality**
  - Clean, readable code
  - Proper indentation
  - Meaningful variable names
  - No unused code
  - No syntax errors

- [ ] **Functionality**
  - All features work as requested
  - No console errors
  - Responsive design
  - Cross-browser compatible

- [ ] **File Structure**
  - Logical organization
  - Proper file naming
  - Appropriate separation of concerns

- [ ] **Documentation**
  - README.md included
  - Code comments where needed
  - Clear instructions

---

## 📊 Success Criteria

**The Application Builder passes if:**

1. ✅ Can create projects successfully
2. ✅ Can build simple websites (<30s)
3. ✅ Can build complex applications (<60s)
4. ✅ Generated code is clean and functional
5. ✅ File browser works correctly
6. ✅ Monaco Editor works for all file types
7. ✅ Live preview displays applications
8. ✅ File editing and saving works
9. ✅ Iterative development works
10. ✅ Error handling is graceful

---

## 🚀 Next Steps After Testing

If all tests pass:
1. Document any issues found
2. Create user guide
3. Add project templates
4. Add WebSocket for real-time updates
5. Add more file operations (create, delete, rename)

---

**Ready to start testing!**

