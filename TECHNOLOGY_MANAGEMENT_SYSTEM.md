# Technology Management System

**Status:** ✅ Complete and Operational

---

## Overview

The Technology Management System provides automatic detection, startup, monitoring, and manual control of all helper technologies used by the Application Builder platform.

---

## Features

### 1. **Automatic Technology Detection**
- Detects if technologies are running on their designated ports
- Checks process availability
- Caches status for performance (5-second cache)

### 2. **Technology Status Dashboard**
- Visual status indicators (✅ operational / ❌ not running)
- Technology metadata (description, problem solved, research papers)
- Required vs. Optional badges
- Port information display

### 3. **Manual Start/Stop Controls**
- One-click start for technologies that support it
- Real-time status updates after actions
- Error handling and user feedback

### 4. **Cross-Platform Startup Scripts**
- PowerShell script for Windows (`start-technologies.ps1`)
- Bash script for Linux/Mac (`start-technologies.sh`)
- Node.js orchestration script (`start-all.js`)

### 5. **Research Paper Links**
- Direct links to original research papers
- Paper titles for easy reference
- Educational context for each technology

---

## Supported Technologies

| Technology | Required | Port | Auto-Start | Research Paper |
|------------|----------|------|------------|----------------|
| **Ollama** | ✅ Yes | 11434 | ❌ No | https://ollama.ai |
| **Letta Memory System** | ❌ No | 8283 | ✅ Yes | [MemGPT Paper](https://arxiv.org/abs/2310.08560) |
| **Qwen 2.5 Coder** | ❌ No | 11434 | ❌ No | [Qwen2.5-Coder Report](https://arxiv.org/abs/2409.12186) |
| **Context Compression** | ❌ No | N/A | N/A (Built-in) | [Long-Context Models](https://arxiv.org/abs/2403.12968) |
| **Self-Improvement (ITSI)** | ❌ No | N/A | N/A (Built-in) | [Self-Taught Evaluators](https://arxiv.org/abs/2406.01252) |

---

## How to Use

### Access Technology Dashboard

1. **Open Application Builder:**
   ```
   http://localhost:3000/builder.html
   ```

2. **Click "🔧 Technologies" button** in the header

3. **View status of all technologies:**
   - ✅ Green checkmark = Operational
   - ❌ Red X = Not running

4. **Start a technology manually:**
   - Click the "▶️ Start" button next to any non-running technology
   - Wait for status to update

5. **Refresh status:**
   - Click "🔄 Refresh Status" to clear cache and re-check

---

## Startup Scripts

### Quick Start (Recommended)

```bash
npm run start:all
```

This will:
1. Check and start all required technologies
2. Build TypeScript
3. Start the Application Builder server

### Manual Technology Check

```bash
npm run check:tech
```

This will display the status of all technologies without starting anything.

### Platform-Specific Scripts

**Windows (PowerShell):**
```powershell
.\scripts\start-technologies.ps1
```

**Linux/Mac (Bash):**
```bash
chmod +x scripts/start-technologies.sh
./scripts/start-technologies.sh
```

---

## API Endpoints

### Get All Technologies
```http
GET /api/technologies
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ollama",
      "name": "Ollama",
      "description": "Local LLM runtime...",
      "problem": "Enables running powerful AI models locally...",
      "paperUrl": "https://ollama.ai",
      "required": true,
      "defaultPort": 11434,
      "healthEndpoint": "http://localhost:11434/api/tags",
      "processName": "ollama"
    }
  ]
}
```

### Get All Technology Status
```http
GET /api/technologies/status
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ollama",
      "name": "Ollama",
      "operational": true,
      "available": true,
      "port": 11434,
      "lastChecked": "2025-11-30T01:59:20.719Z"
    }
  ]
}
```

### Get Specific Technology Status
```http
GET /api/technologies/:id/status
```

### Start a Technology
```http
POST /api/technologies/:id/start
```

### Stop a Technology
```http
POST /api/technologies/:id/stop
```

### Clear Status Cache
```http
POST /api/technologies/cache/clear
```

---

## Architecture

### Backend Components

**`src/services/TechnologyManager.ts`**
- Core service for technology detection and management
- Health check implementation
- Process management
- Status caching

**`src/api/technology.routes.ts`**
- REST API endpoints
- Request/response handling
- Error handling

### Frontend Components

**`src/public/builder.html`**
- Technology Settings Modal
- Technology cards with status indicators
- Start/stop buttons
- Research paper links

### Startup Scripts

**`scripts/start-technologies.ps1`** (Windows)
- PowerShell-based technology checker
- Port listening detection
- Ollama model verification

**`scripts/start-technologies.sh`** (Linux/Mac)
- Bash-based technology checker
- Cross-platform port detection
- Graceful fallbacks

**`scripts/start-all.js`** (Cross-platform)
- Node.js orchestration
- Platform detection
- Build and start automation

**`scripts/check-technologies.js`**
- Quick status check
- No startup actions
- Informational output

---

## Technology Metadata

Each technology includes:

- **ID:** Unique identifier
- **Name:** Display name
- **Description:** What it does
- **Problem:** What problem it solves
- **Paper URL:** Link to research paper
- **Paper Title:** Title of the research paper
- **Required:** Whether it's required for basic functionality
- **Default Port:** Port number (if applicable)
- **Health Endpoint:** URL to check if running
- **Start Command:** Command to start it (if supported)
- **Process Name:** Process name for detection

---

## Future Enhancements

- [ ] Auto-start technologies on server startup
- [ ] Technology dependency graph
- [ ] Installation guides for missing technologies
- [ ] Technology performance metrics
- [ ] Automatic restart on failure
- [ ] Technology version management
- [ ] Docker container support

---

## Troubleshooting

### Technology shows as "Not Running" but it is running

**Solution:** Click "🔄 Refresh Status" to clear the cache.

### Start button doesn't work

**Possible causes:**
1. Technology not installed
2. Technology requires manual configuration
3. Port already in use

**Solution:** Check the error message and start manually if needed.

### Ollama not detected

**Solution:**
1. Install Ollama from https://ollama.ai
2. Run: `ollama serve`
3. Refresh the technology status

### Letta won't start

**Known Issue:** Letta requires Python 3.12 or 3.11 (incompatible with Python 3.13)

**Solution:** See `LETTA_FUTURE_IMPLEMENTATION.md` for details.

---

## Related Files

- `src/services/TechnologyManager.ts` - Core service
- `src/api/technology.routes.ts` - API routes
- `src/public/builder.html` - UI implementation
- `scripts/start-technologies.ps1` - Windows startup
- `scripts/start-technologies.sh` - Linux/Mac startup
- `scripts/start-all.js` - Cross-platform orchestration
- `scripts/check-technologies.js` - Status checker

---

**Last Updated:** 2025-11-30  
**Status:** ✅ Complete and Operational

