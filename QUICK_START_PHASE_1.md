# 🚀 Quick Start: Phase 1 - Enhanced Planning Interface

**Goal:** Add AI-assisted planning to your Application Builder in 2 weeks  
**Effort:** 10-15 hours total  
**Difficulty:** Moderate

---

## 📋 What You'll Build

By the end of Phase 1, users will be able to:
1. Select from planning templates (Web App, API, Mobile, etc.)
2. Generate a Product Requirements Document (PRD) with AI
3. Break PRDs into actionable tasks automatically
4. Estimate project complexity
5. Save plans as Markdown files in their project

---

## 🎯 Week 1: Planning Tab UI (5-7 hours)

### Step 1: Add Planning Tab (1 hour)

**File:** `src/public/builder.html`

Find the tabs section (around line 453) and add:

```html
<div class="tabs" style="border-bottom: 1px solid var(--border);">
    <button class="tab active" data-tab="build-log" onclick="switchMiddleTab('build-log')">📋 Build Log</button>
    <button class="tab" data-tab="preview" onclick="switchMiddleTab('preview')">👁️ Preview</button>
    <button class="tab" data-tab="code" onclick="switchMiddleTab('code')">💻 Code</button>
    <button class="tab" data-tab="planning" onclick="switchMiddleTab('planning')">📝 Planning</button> <!-- NEW -->
</div>
```

### Step 2: Create Planning Panel (2 hours)

Add this after the code panel (around line 510):

```html
<!-- Planning Panel (NEW) -->
<div id="planning-panel" class="tab-content hidden" style="display: flex; flex-direction: column; height: 100%; padding: 20px; overflow-y: auto;">
    <!-- Template Selector -->
    <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Project Template</label>
        <select id="template-selector" class="input" style="width: 100%;">
            <option value="web-app">Web Application</option>
            <option value="rest-api">REST API</option>
            <option value="mobile-app">Mobile App</option>
            <option value="chrome-extension">Chrome Extension</option>
            <option value="cli-tool">CLI Tool</option>
            <option value="library">Library/Package</option>
        </select>
    </div>

    <!-- Project Description -->
    <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">Project Description</label>
        <textarea id="project-description" class="input" placeholder="Describe what you want to build..." 
                  style="height: 100px; resize: vertical;"></textarea>
    </div>

    <!-- Action Buttons -->
    <div style="display: flex; gap: 12px; margin-bottom: 20px;">
        <button class="btn btn-primary" onclick="generatePRD()" style="flex: 1;">
            ✨ Generate PRD
        </button>
        <button class="btn btn-secondary" onclick="loadExamplePRD()">
            📄 Load Example
        </button>
    </div>

    <!-- PRD Editor -->
    <div style="flex: 1; display: flex; flex-direction: column; min-height: 400px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <label style="font-weight: 500;">Product Requirements Document</label>
            <div style="display: flex; gap: 8px;">
                <button class="btn btn-inline btn-secondary" onclick="breakdownTasks()">
                    🔨 Break Into Tasks
                </button>
                <button class="btn btn-inline btn-secondary" onclick="estimateComplexity()">
                    📊 Estimate Complexity
                </button>
                <button class="btn btn-inline btn-success" onclick="savePRD()">
                    💾 Save PRD
                </button>
            </div>
        </div>
        <div id="prd-editor-container" style="flex: 1; border: 1px solid var(--border); border-radius: 8px; overflow: hidden;">
            <textarea id="prd-editor" class="input" placeholder="Your PRD will appear here..." 
                      style="width: 100%; height: 100%; border: none; font-family: 'Monaco', 'Courier New', monospace; font-size: 13px; resize: none;"></textarea>
        </div>
    </div>

    <!-- Results Area -->
    <div id="planning-results" style="margin-top: 20px; display: none;">
        <h3 style="margin-bottom: 12px;">Analysis Results</h3>
        <div id="planning-results-content" style="background: var(--bg-neutral-50); padding: 16px; border-radius: 8px;">
            <!-- Results will be inserted here -->
        </div>
    </div>
</div>
```

### Step 3: Add JavaScript Functions (2 hours)

Add these functions to the `<script>` section:

```javascript
// Switch middle panel tabs (update existing function)
function switchMiddleTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
    
    // Show selected tab content
    const panels = {
        'build-log': 'build-log-panel',
        'preview': 'preview-panel',
        'code': 'code-panel',
        'planning': 'planning-panel' // NEW
    };
    
    const panelId = panels[tabName];
    if (panelId) {
        document.getElementById(panelId).classList.remove('hidden');
    }
    
    // Add active class to clicked tab
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

// Generate PRD with AI
async function generatePRD() {
    const description = document.getElementById('project-description').value.trim();
    const template = document.getElementById('template-selector').value;
    
    if (!description) {
        alert('Please enter a project description');
        return;
    }
    
    if (!currentProject) {
        alert('Please create or open a project first');
        return;
    }
    
    try {
        // Show loading state
        const prdEditor = document.getElementById('prd-editor');
        prdEditor.value = 'Generating PRD...';
        prdEditor.disabled = true;
        
        const response = await fetch('/api/builder/plan/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectId: currentProject.id,
                description,
                template
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            prdEditor.value = result.prd;
            addBuildLog('success', `PRD generated and saved to ${result.path}`);
        } else {
            throw new Error(result.error || 'Failed to generate PRD');
        }
    } catch (error) {
        console.error('PRD generation error:', error);
        alert(`Error: ${error.message}`);
        document.getElementById('prd-editor').value = '';
    } finally {
        document.getElementById('prd-editor').disabled = false;
    }
}

// Break PRD into tasks
async function breakdownTasks() {
    const prd = document.getElementById('prd-editor').value.trim();
    
    if (!prd) {
        alert('Please generate or write a PRD first');
        return;
    }
    
    try {
        const response = await fetch('/api/builder/plan/breakdown', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectId: currentProject.id,
                prd
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Show results
            const resultsDiv = document.getElementById('planning-results');
            const resultsContent = document.getElementById('planning-results-content');
            
            resultsContent.innerHTML = `
                <h4>Task Breakdown</h4>
                <pre style="white-space: pre-wrap; font-family: inherit;">${result.tasks}</pre>
                <button class="btn btn-primary" onclick="applyTasks()" style="margin-top: 12px;">
                    ✅ Apply These Tasks
                </button>
            `;
            
            resultsDiv.style.display = 'block';
            
            // Store tasks for later
            window.generatedTasks = result.tasks;
            
            addBuildLog('success', 'Tasks generated successfully');
        } else {
            throw new Error(result.error || 'Failed to break down tasks');
        }
    } catch (error) {
        console.error('Task breakdown error:', error);
        alert(`Error: ${error.message}`);
    }
}

// Estimate complexity
async function estimateComplexity() {
    const prd = document.getElementById('prd-editor').value.trim();
    
    if (!prd) {
        alert('Please generate or write a PRD first');
        return;
    }
    
    try {
        const response = await fetch('/api/builder/plan/estimate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectId: currentProject.id,
                prd
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            const resultsDiv = document.getElementById('planning-results');
            const resultsContent = document.getElementById('planning-results-content');
            
            resultsContent.innerHTML = `
                <h4>Complexity Estimate</h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 12px;">
                    <div class="insight-card">
                        <div class="insight-label">Complexity</div>
                        <div class="insight-value">${result.complexity}</div>
                    </div>
                    <div class="insight-card">
                        <div class="insight-label">Estimated Time</div>
                        <div class="insight-value">${result.estimatedHours} hours</div>
                    </div>
                    <div class="insight-card">
                        <div class="insight-label">Recommended Team Size</div>
                        <div class="insight-value">${result.teamSize} developer(s)</div>
                    </div>
                    <div class="insight-card">
                        <div class="insight-label">Risk Level</div>
                        <div class="insight-value">${result.riskLevel}</div>
                    </div>
                </div>
                <div style="margin-top: 16px;">
                    <strong>Recommendations:</strong>
                    <ul style="margin-top: 8px;">
                        ${result.recommendations.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                </div>
            `;
            
            resultsDiv.style.display = 'block';
            
            addBuildLog('success', `Complexity: ${result.complexity}, Est. ${result.estimatedHours}h`);
        } else {
            throw new Error(result.error || 'Failed to estimate complexity');
        }
    } catch (error) {
        console.error('Complexity estimation error:', error);
        alert(`Error: ${error.message}`);
    }
}

// Save PRD to file
async function savePRD() {
    const prd = document.getElementById('prd-editor').value.trim();
    
    if (!prd) {
        alert('Nothing to save');
        return;
    }
    
    if (!currentProject) {
        alert('Please create or open a project first');
        return;
    }
    
    try {
        const response = await fetch('/api/builder/plan/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectId: currentProject.id,
                content: prd
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            addBuildLog('success', `PRD saved to ${result.path}`);
            alert('PRD saved successfully!');
        } else {
            throw new Error(result.error || 'Failed to save PRD');
        }
    } catch (error) {
        console.error('Save PRD error:', error);
        alert(`Error: ${error.message}`);
    }
}

// Load example PRD
function loadExamplePRD() {
    const template = document.getElementById('template-selector').value;
    
    const examples = {
        'web-app': `# Project: Task Management Web App

## Goal
Build a simple, beautiful task management application for individuals and small teams.

## Core Features
1. Create, edit, and delete tasks
2. Organize tasks into projects
3. Mark tasks as complete
4. Filter and search tasks
5. User authentication

## Technical Requirements
- Frontend: React with TypeScript
- Backend: Node.js + Express
- Database: PostgreSQL
- Authentication: JWT
- Styling: Tailwind CSS

## Success Criteria
- Users can manage tasks efficiently
- App loads in under 2 seconds
- Mobile responsive
- 90%+ test coverage

## Tasks
- [ ] Set up project structure
- [ ] Create database schema
- [ ] Build authentication system
- [ ] Create task CRUD API
- [ ] Build React components
- [ ] Add styling
- [ ] Write tests
- [ ] Deploy to production`,
        
        'rest-api': `# Project: User Management REST API

## Goal
Create a secure, scalable REST API for user management.

## Endpoints
- POST /api/users - Create user
- GET /api/users/:id - Get user
- PUT /api/users/:id - Update user
- DELETE /api/users/:id - Delete user
- POST /api/auth/login - Login
- POST /api/auth/logout - Logout

## Technical Requirements
- Node.js + Express
- PostgreSQL database
- JWT authentication
- Input validation
- Rate limiting
- API documentation (Swagger)

## Success Criteria
- All endpoints return proper status codes
- 100% test coverage
- Response time under 100ms
- Proper error handling

## Tasks
- [ ] Set up Express server
- [ ] Create database models
- [ ] Implement authentication
- [ ] Build CRUD endpoints
- [ ] Add validation
- [ ] Write tests
- [ ] Generate API docs`
    };
    
    const example = examples[template] || examples['web-app'];
    document.getElementById('prd-editor').value = example;
    addBuildLog('info', 'Example PRD loaded');
}

// Apply generated tasks (placeholder for Phase 2)
function applyTasks() {
    alert('Task management will be implemented in Phase 2!');
    addBuildLog('info', 'Tasks ready to apply (Phase 2 feature)');
}
```

---

## 🎯 Week 2: Backend Implementation (5-7 hours)

### Step 1: Create Planning Templates (30 minutes)

**File:** `src/data/planning-templates.json` (create new file)

```json
{
  "web-app": {
    "name": "Web Application",
    "sections": ["Goal", "Core Features", "Technical Requirements", "Success Criteria", "Tasks"],
    "techStack": ["React", "Node.js", "PostgreSQL"],
    "complexity": "moderate"
  },
  "rest-api": {
    "name": "REST API",
    "sections": ["Goal", "Endpoints", "Data Models", "Authentication", "Tasks"],
    "techStack": ["Node.js", "Express", "PostgreSQL"],
    "complexity": "simple"
  },
  "mobile-app": {
    "name": "Mobile App",
    "sections": ["Goal", "Features", "Screens", "Technical Requirements", "Tasks"],
    "techStack": ["React Native", "Firebase"],
    "complexity": "complex"
  },
  "chrome-extension": {
    "name": "Chrome Extension",
    "sections": ["Goal", "Features", "Permissions", "Technical Requirements", "Tasks"],
    "techStack": ["JavaScript", "Chrome APIs"],
    "complexity": "simple"
  },
  "cli-tool": {
    "name": "CLI Tool",
    "sections": ["Goal", "Commands", "Options", "Technical Requirements", "Tasks"],
    "techStack": ["Node.js", "Commander.js"],
    "complexity": "simple"
  },
  "library": {
    "name": "Library/Package",
    "sections": ["Goal", "API", "Features", "Technical Requirements", "Tasks"],
    "techStack": ["TypeScript", "Jest"],
    "complexity": "moderate"
  }
}
```

### Step 2: Add Planning Routes (3-4 hours)

**File:** `src/api/builder.routes.ts`

Add these routes after the existing routes (around line 490):

```typescript
/**
 * POST /api/builder/plan/generate
 * Generate PRD from description
 */
router.post('/plan/generate', async (req: Request, res: Response) => {
  try {
    const { projectId, description, template } = req.body;

    if (!projectId || !description) {
      return res.status(400).json({
        success: false,
        error: 'projectId and description are required'
      });
    }

    const project = projects.get(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Load template
    const templatesPath = path.join(__dirname, '../data/planning-templates.json');
    const templates = JSON.parse(await fs.readFile(templatesPath, 'utf-8'));
    const templateData = templates[template] || templates['web-app'];

    // Generate PRD with AI
    const prompt = `Generate a detailed Product Requirements Document for this project:

Description: ${description}
Template: ${templateData.name}
Suggested Tech Stack: ${templateData.techStack.join(', ')}

Create a PRD with these sections:
${templateData.sections.map((s: string) => `- ${s}`).join('\n')}

Format as Markdown. Be specific and actionable. Include 5-10 tasks at the end.`;

    console.log('🤖 Generating PRD with AI...');
    
    const prd = await config.llmProvider.generate(prompt, {
      temperature: 0.7,
      maxTokens: 2000
    });

    // Save PRD to project
    const prdPath = path.join(project.path, 'PRD.md');
    await fs.writeFile(prdPath, prd);

    console.log(`✅ PRD saved to ${prdPath}`);

    return res.status(200).json({
      success: true,
      prd,
      path: 'PRD.md'
    });

  } catch (error: any) {
    console.error('PRD generation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * POST /api/builder/plan/breakdown
 * Break PRD into tasks
 */
router.post('/plan/breakdown', async (req: Request, res: Response) => {
  try {
    const { projectId, prd } = req.body;

    if (!projectId || !prd) {
      return res.status(400).json({
        success: false,
        error: 'projectId and prd are required'
      });
    }

    const prompt = `Break this PRD into specific, actionable tasks:

${prd}

Create a task list that:
- Has 8-15 tasks total
- Each task is under 2 hours of work
- Tasks are ordered by dependency
- Tasks are specific and measurable
- Format as Markdown checklist (- [ ] Task name)

Only output the task list, nothing else.`;

    console.log('🤖 Breaking down tasks with AI...');
    
    const tasks = await config.llmProvider.generate(prompt, {
      temperature: 0.5,
      maxTokens: 1000
    });

    return res.status(200).json({
      success: true,
      tasks: tasks.trim()
    });

  } catch (error: any) {
    console.error('Task breakdown error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * POST /api/builder/plan/estimate
 * Estimate project complexity
 */
router.post('/plan/estimate', async (req: Request, res: Response) => {
  try {
    const { projectId, prd } = req.body;

    if (!projectId || !prd) {
      return res.status(400).json({
        success: false,
        error: 'projectId and prd are required'
      });
    }

    const prompt = `Analyze this PRD and estimate project complexity:

${prd}

Provide estimates in this exact JSON format:
{
  "complexity": "simple|moderate|complex",
  "estimatedHours": <number>,
  "teamSize": <number>,
  "riskLevel": "low|medium|high",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}

Only output valid JSON, nothing else.`;

    console.log('🤖 Estimating complexity with AI...');
    
    const response = await config.llmProvider.generate(prompt, {
      temperature: 0.3,
      maxTokens: 500
    });

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const estimate = JSON.parse(jsonMatch[0]);

    return res.status(200).json({
      success: true,
      ...estimate
    });

  } catch (error: any) {
    console.error('Complexity estimation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * POST /api/builder/plan/save
 * Save PRD to file
 */
router.post('/plan/save', async (req: Request, res: Response) => {
  try {
    const { projectId, content } = req.body;

    if (!projectId || !content) {
      return res.status(400).json({
        success: false,
        error: 'projectId and content are required'
      });
    }

    const project = projects.get(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const prdPath = path.join(project.path, 'PRD.md');
    await fs.writeFile(prdPath, content);

    console.log(`✅ PRD saved to ${prdPath}`);

    return res.status(200).json({
      success: true,
      path: 'PRD.md'
    });

  } catch (error: any) {
    console.error('Save PRD error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});
```

### Step 3: Test Everything (1-2 hours)

1. Start your server: `npm run dev`
2. Open Application Builder: `http://localhost:3000/builder.html`
3. Create a new project
4. Click the "Planning" tab
5. Enter a project description
6. Click "Generate PRD"
7. Click "Break Into Tasks"
8. Click "Estimate Complexity"
9. Click "Save PRD"
10. Check that PRD.md was created in your project folder

---

## ✅ Success Checklist

- [ ] Planning tab appears in center panel
- [ ] Template selector works
- [ ] PRD generation works with AI
- [ ] Task breakdown generates tasks
- [ ] Complexity estimation provides analysis
- [ ] PRD saves to project folder
- [ ] Example PRD loads correctly
- [ ] All buttons have proper styling
- [ ] Error messages display correctly
- [ ] Build log shows planning activities

---

## 🐛 Troubleshooting

**Problem:** "llmProvider is not defined"  
**Solution:** Make sure your Ollama server is running and configured in `src/index.ts`

**Problem:** PRD generation is slow  
**Solution:** This is normal with local AI. Consider using a faster model or cloud fallback.

**Problem:** Planning tab doesn't show  
**Solution:** Check browser console for errors. Make sure `switchMiddleTab` function is updated.

**Problem:** PRD.md not created  
**Solution:** Check file permissions on project folder. Check server logs for errors.

---

## 🎉 What's Next?

Once Phase 1 is complete, you'll have:
- ✅ AI-powered PRD generation
- ✅ Automatic task breakdown
- ✅ Complexity estimation
- ✅ Planning templates
- ✅ Markdown file persistence

**Next:** Move to Phase 2 to add visual task management!

---

*Need help? Check the full roadmap in `AI_INTEGRATION_IMPLEMENTATION_ROADMAP.md`*
