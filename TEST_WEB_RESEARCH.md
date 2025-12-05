# 🧪 Testing Web Research Feature

## Quick Test Examples

### Test 1: Explicit Research Request
**Build Request:**
```
Research React hooks best practices, then build a counter app with useState and useEffect
```

**Expected AI Planning:**
```json
{
  "steps": [
    {
      "id": "step_1",
      "description": "Research React hooks best practices",
      "tool": "web_search",
      "parameters": {
        "query": "React hooks useState useEffect best practices",
        "maxResults": 3
      }
    },
    {
      "id": "step_2",
      "description": "Fetch React hooks documentation",
      "tool": "web_fetch",
      "parameters": {
        "url": "https://react.dev/reference/react/hooks"
      }
    },
    {
      "id": "step_3",
      "description": "Create HTML with React CDN",
      "tool": "create_file",
      "parameters": {
        "path": "index.html",
        "content": "<!DOCTYPE html>..."
      }
    },
    {
      "id": "step_4",
      "description": "Create counter component using hooks",
      "tool": "create_file",
      "parameters": {
        "path": "app.js",
        "content": "// React component with useState and useEffect..."
      }
    }
  ]
}
```

---

### Test 2: Implicit Research (AI Decides)
**Build Request:**
```
Build a modern CSS Grid photo gallery with responsive layout
```

**Expected AI Behavior:**
- AI may choose to research CSS Grid if it wants to use latest patterns
- OR AI may skip research if it already knows CSS Grid well
- Either way, it should create a working photo gallery

---

### Test 3: Documentation Fetch
**Build Request:**
```
Fetch MDN documentation for the Fetch API, then build an API client that fetches user data from JSONPlaceholder
```

**Expected AI Planning:**
```json
{
  "steps": [
    {
      "id": "step_1",
      "description": "Fetch MDN Fetch API documentation",
      "tool": "web_fetch",
      "parameters": {
        "url": "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API"
      }
    },
    {
      "id": "step_2",
      "description": "Create HTML with UI for API client",
      "tool": "create_file",
      "parameters": {
        "path": "index.html",
        "content": "<!DOCTYPE html>..."
      }
    },
    {
      "id": "step_3",
      "description": "Create JavaScript API client using Fetch API",
      "tool": "create_file",
      "parameters": {
        "path": "api-client.js",
        "content": "// Fetch API implementation..."
      }
    }
  ]
}
```

---

### Test 4: Learning New Framework
**Build Request:**
```
Research Vue.js basics, then build a simple Vue.js todo app
```

**Expected AI Planning:**
- Search for "Vue.js tutorial basics"
- Fetch Vue.js documentation
- Create HTML with Vue.js CDN
- Create Vue.js component with reactive data
- Create CSS for styling

---

### Test 5: Best Practices Research
**Build Request:**
```
Research HTML5 form validation best practices, then build a contact form with validation
```

**Expected AI Planning:**
- Search for "HTML5 form validation best practices"
- Fetch HTML5 form validation documentation
- Create HTML form with validation attributes
- Create JavaScript for custom validation
- Create CSS for validation feedback

---

## How to Test

1. **Open the Application Builder:**
   ```
   http://localhost:3000/builder.html
   ```

2. **Create a New Project:**
   - Click "New Project"
   - Enter project name (e.g., "ResearchTest")

3. **Enter a Build Request:**
   - Use one of the test examples above
   - Click "Generate Plan" or "Build"

4. **Watch the Build Log:**
   - Look for "🔍 Searching web for: ..."
   - Look for "📥 Fetching content from: ..."
   - Look for "✅ Found X search results"
   - Look for "✅ Fetched X characters from ..."

5. **Check the Code Tab:**
   - Verify files were created
   - Check if code uses patterns from research
   - Look for modern/best-practice implementations

6. **Check the Preview Tab:**
   - Verify the app works
   - Test functionality

---

## Expected Build Log Output

```
📝 Generating execution plan...
✅ Plan generated successfully

📋 Execution Plan:
   Step 1: Research React hooks best practices
   Step 2: Fetch React hooks documentation
   Step 3: Create HTML with React CDN
   Step 4: Create counter component using hooks

🚀 Executing plan...

▶️  Step 1: Research React hooks best practices
    Tool: web_search
    🔍 Searching web for: "React hooks useState useEffect best practices"
    ✅ Found 3 search results
    ✅ Step 1 completed

▶️  Step 2: Fetch React hooks documentation
    Tool: web_fetch
    📥 Fetching content from: https://react.dev/reference/react/hooks
    ✅ Fetched 15234 characters from https://react.dev/reference/react/hooks
    ✅ Step 2 completed

▶️  Step 3: Create HTML with React CDN
    Tool: create_file
    ✅ File created: index.html
    ✅ Step 3 completed

▶️  Step 4: Create counter component using hooks
    Tool: create_file
    ✅ File created: app.js
    ✅ Step 4 completed

✅ Build completed successfully!
   Files created: 2
   Total size: 3.2 KB
   Duration: 12.5s
```

---

## Troubleshooting

**Issue: No research steps in plan**
- AI may skip research if it already knows the technology
- Try explicit research request: "Research X, then build Y"

**Issue: Web search returns no results**
- DuckDuckGo may be blocked or slow
- Check internet connection
- Try a different search query

**Issue: Web fetch fails**
- URL may be invalid or blocked
- Check URL is accessible in browser
- Some sites block automated requests

**Issue: Research doesn't affect code**
- AI may not apply research findings
- This is a limitation of the current implementation
- Future enhancement: Better research integration

---

## Success Criteria

✅ AI can search the web  
✅ AI can fetch documentation  
✅ Research steps appear in build log  
✅ Files are created after research  
✅ Code quality is improved (subjective)  
✅ No errors during research  
✅ Graceful fallback if research fails  

---

**Ready to test!** Try the examples above and see the AI research and learn before building. 🚀

