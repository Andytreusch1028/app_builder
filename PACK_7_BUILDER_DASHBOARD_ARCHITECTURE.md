# Pack 7: Application Builder Dashboard - Architecture

## 🎯 Goal
Transform the Agent Testing Dashboard into a professional Application Builder Dashboard that serves as the PRIMARY user interface for building applications.

---

## 📐 UI Layout (3-Column Design)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Application Builder Dashboard                     │
├──────────────┬────────────────────────────────┬─────────────────────┤
│              │                                │                     │
│   PROJECT    │      CHAT BUILDER              │   LIVE PREVIEW      │
│   MANAGER    │      (Main Panel)              │   + CODE EDITOR     │
│              │                                │                     │
│  - New       │  ┌──────────────────────────┐  │  ┌───────────────┐ │
│  - Open      │  │  Chat Messages           │  │  │  Preview      │ │
│  - Settings  │  │  (Build conversation)    │  │  │  (iframe)     │ │
│              │  │                          │  │  └───────────────┘ │
│  FILE TREE   │  │  User: Build a login...  │  │                     │
│  ├─ src/     │  │  AI: Creating files...   │  │  ┌───────────────┐ │
│  │  ├─ api/ │  │  AI: ✅ Login created    │  │  │  Code Editor  │ │
│  │  ├─ ui/  │  │                          │  │  │  (Monaco)     │ │
│  ├─ tests/   │  └──────────────────────────┘  │  │               │ │
│  └─ ...      │                                │  │  [File tabs]  │ │
│              │  ┌──────────────────────────┐  │  └───────────────┘ │
│  QUALITY     │  │  Input: "Add tests..."   │  │                     │
│  INSIGHTS    │  └──────────────────────────┘  │  BUILD LOG          │
│  - Complex   │                                │  ✅ Login created   │
│  - 3 iter    │  BUILD PROGRESS                │  🔄 Running tests   │
│  - 87% qual  │  ████████░░ 80%                │  ⏳ Waiting...      │
└──────────────┴────────────────────────────────┴─────────────────────┘
```

---

## 🏗️ Component Breakdown

### **Left Column: Project Management (380px)**

#### **1. Project Panel**
- **New Project** button
- **Open Project** dropdown
- **Project Settings** (name, description, tech stack)
- **Current Project** indicator

#### **2. File Browser**
- Tree view of project files
- Click to open in code editor
- Real-time updates as files are created
- File icons by type
- Expand/collapse folders

#### **3. Quality Insights Panel**
- **Task Complexity** (Simple/Moderate/Complex)
- **Iterations Used** (e.g., "3 iterations")
- **Quality Score** (e.g., "87%")
- **Technologies Used** (categorized: Core, Enhancement, Future)
- **Build Time** (e.g., "12.3s")

---

### **Center Column: Chat Builder (Main Panel)**

#### **1. Chat Messages Area**
- Scrollable conversation history
- **User messages** (right-aligned, blue)
- **AI messages** (left-aligned, gray)
- **System messages** (centered, small, gray)
- **Status indicators** (✅ ⏳ ❌ 🔄)
- **Code snippets** in messages (syntax highlighted)

#### **2. Build Progress Bar**
- Shows overall build progress (0-100%)
- Updates in real-time
- Color-coded (blue → green when complete)

#### **3. Input Area**
- Large text input for build requests
- **Send** button
- **Clear** button
- **Example prompts** dropdown
- Placeholder: "Describe what you want to build..."

---

### **Right Column: Preview + Editor (Flexible)**

#### **1. Live Preview Panel** (Top, resizable)
- iframe showing the built application
- **Refresh** button
- **Open in new tab** button
- **Responsive preview** (desktop/tablet/mobile toggle)
- Shows "No preview available" when nothing to preview

#### **2. Code Editor Panel** (Bottom, resizable)
- Monaco Editor (VS Code editor)
- **File tabs** (open multiple files)
- **Syntax highlighting**
- **Line numbers**
- **Save** button (saves changes back to project)
- **Read-only mode** toggle

#### **3. Build Log** (Collapsible)
- Real-time log of build steps
- Timestamped entries
- Color-coded by type (info, success, warning, error)
- Auto-scroll to bottom
- **Clear log** button

---

## 🔌 Backend API Endpoints

### **Project Management**
```
POST   /api/builder/projects/new          - Create new project
GET    /api/builder/projects              - List all projects
GET    /api/builder/projects/:id          - Get project details
PATCH  /api/builder/projects/:id          - Update project settings
DELETE /api/builder/projects/:id          - Delete project
GET    /api/builder/projects/:id/files    - Get file tree
```

### **Build Requests**
```
POST   /api/builder/build                 - Start build (returns buildId)
GET    /api/builder/build/:buildId/status - Get build status
GET    /api/builder/build/:buildId/log    - Get build log
POST   /api/builder/build/:buildId/cancel - Cancel build
```

### **File Operations**
```
GET    /api/builder/files/:projectId/:path     - Read file
PUT    /api/builder/files/:projectId/:path     - Update file
DELETE /api/builder/files/:projectId/:path     - Delete file
POST   /api/builder/files/:projectId/search    - Search files
```

### **Real-Time Updates (WebSocket or SSE)**
```
WS     /api/builder/ws/:buildId           - WebSocket for real-time updates
```

---

## 📊 Data Flow

### **Build Request Flow**
1. User types build request in chat input
2. Frontend sends `POST /api/builder/build` with request text
3. Backend returns `buildId` immediately (202 Accepted)
4. Backend starts async build process
5. Frontend polls `GET /api/builder/build/:buildId/status` every 2s
6. Frontend updates chat, progress bar, file tree, build log in real-time
7. When complete, frontend shows success message and updates preview

### **File Tree Updates**
1. Backend creates/modifies files during build
2. Frontend polls `GET /api/builder/projects/:id/files` every 3s during build
3. File tree updates automatically
4. New files appear with animation

### **Quality Insights Updates**
1. Backend tracks complexity, iterations, quality score during build
2. Included in build status response
3. Frontend updates Quality Insights panel in real-time

---

## 🎨 Design System (Jony Ive Style)

### **Colors**
- Primary: `#007AFF` (Blue)
- Success: `#34C759` (Green)
- Warning: `#FF9500` (Orange)
- Error: `#FF3B30` (Red)
- Background: `#F5F5F7` (Light Gray)
- Surface: `#FFFFFF` (White)
- Text Primary: `#1D1D1F` (Almost Black)
- Text Secondary: `#86868B` (Gray)

### **Typography**
- Font: SF Pro Display, -apple-system, BlinkMacSystemFont
- Headings: 600 weight, -0.5px letter-spacing
- Body: 400 weight, 1.5 line-height

### **Shadows**
- Small: `0 2px 8px rgba(0,0,0,0.04)`
- Medium: `0 4px 16px rgba(0,0,0,0.08)`
- Large: `0 8px 32px rgba(0,0,0,0.12)`

### **Border Radius**
- Panels: 16px
- Buttons: 8px
- Inputs: 8px

---

## 🔄 Transformation Plan

### **Repurpose Existing Elements**
| Old (Test Dashboard) | New (Builder Dashboard) |
|---------------------|------------------------|
| Test input field | Build request input |
| Test output panel | Chat messages area |
| Technology tracking | Quality insights panel |
| Test categories | Example prompts |
| Run button | Send button |
| Stats panel | Build progress + log |

### **New Elements to Add**
- Project management panel
- File browser tree
- Live preview iframe
- Monaco code editor
- Build progress bar
- Real-time chat interface

---

## 📦 Dependencies

### **Frontend**
- **Monaco Editor** - Code editor (`monaco-editor` CDN)
- **Marked.js** - Markdown rendering for chat messages
- **Highlight.js** - Syntax highlighting in chat
- **WebSocket** or **EventSource** - Real-time updates (optional, can use polling)

### **Backend**
- **Express** - Already have
- **ws** - WebSocket library (optional)
- **chokidar** - File watching (optional)

---

**Next Step:** Start transforming `test-agent.html` into `builder.html`!

