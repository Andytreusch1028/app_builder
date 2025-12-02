# Application Builder Scripts

This directory contains startup, testing, and utility scripts for the Application Builder platform.

---

## Technology Management Scripts

### `start-all.js` - Complete Startup Orchestration

**Purpose:** One-command startup for the entire platform

**Usage:**
```bash
npm run start:all
```

**What it does:**
1. Runs platform-specific technology checker
2. Builds TypeScript
3. Starts the Application Builder server

**Platform Support:** Windows, Linux, Mac

---

### `start-technologies.ps1` - Windows Technology Checker

**Purpose:** Check and start helper technologies on Windows

**Usage:**
```powershell
.\scripts\start-technologies.ps1
```

**What it checks:**
- ✅ Ollama (port 11434)
- ✅ Letta (port 8283)
- ✅ Qwen 2.5 Coder model availability

**Auto-starts:**
- Ollama (if installed but not running)

**Platform:** Windows (PowerShell)

---

### `start-technologies.sh` - Linux/Mac Technology Checker

**Purpose:** Check and start helper technologies on Linux/Mac

**Usage:**
```bash
chmod +x scripts/start-technologies.sh
./scripts/start-technologies.sh
```

**What it checks:**
- ✅ Ollama (port 11434)
- ✅ Letta (port 8283)
- ✅ Qwen 2.5 Coder model availability

**Auto-starts:**
- Ollama (if installed but not running)

**Platform:** Linux, Mac (Bash)

---

### `check-technologies.js` - Quick Status Check

**Purpose:** Check technology status without starting anything

**Usage:**
```bash
npm run check:tech
```

**Output:**
```
🔍 Checking Application Builder Technologies

📦 Ollama (port 11434): ✅ Running
🧠 Letta (port 8283): ℹ️  Not Running (optional)
🏗️  Application Server (port 3000): ✅ Running

✅ All required technologies are running!
🌐 Open: http://localhost:3000/builder.html
```

**Platform:** Cross-platform (Node.js)

---

## Testing Scripts

### Provider Testing

**`test-providers.js`** - Test all AI providers
```bash
npm run test:providers
```

**`test-local-model.js`** - Test local model integration
```bash
npm run test:local
```

**`test-ollama.js`** - Test Ollama integration
```bash
npm run test:ollama
```

**`test-integration.js`** - Integration tests
```bash
npm run test:integration
```

**`test-multi-model.js`** - Multi-model orchestration tests
```bash
npm run test:multi-model
```

**`test-real-agent.js`** - Real agent workflow tests
```bash
npm run test:real-agent
```

---

## Demo Scripts

**`demo-multi-model.js`** - Multi-model demonstration
```bash
npm run demo:multi-model
```

**`demo-real-agent.js`** - Agent demonstration
```bash
npm run demo:agent
```

---

## Interactive Scripts

**`interactive-agent-test.js`** - Interactive agent testing
```bash
npm run interactive:agent
```

---

## Diagnostic Scripts

**`diagnose-ollama.js`** - Diagnose Ollama issues
```bash
npm run diagnose:ollama
```

**`pre-flight-check.js`** - Pre-flight system check
```bash
npm run pre-flight
```

**`post-pack-validation.js`** - Post-pack validation
```bash
npm run post-pack
```

---

## Stress Testing

**`stress-test-agent.js`** - Agent stress testing
```bash
npm run stress:agent
```

---

## Quick Reference

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npm run start:all` | Start everything | First time setup, daily startup |
| `npm run check:tech` | Check status | Verify technologies are running |
| `npm run build` | Build TypeScript | After code changes |
| `npm start` | Start server only | When technologies already running |
| `npm run pre-flight` | System check | Before major operations |
| `npm run diagnose:ollama` | Debug Ollama | When Ollama has issues |

---

## Troubleshooting

### Script won't run on Windows

**Error:** "Execution of scripts is disabled on this system"

**Solution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Script won't run on Linux/Mac

**Error:** "Permission denied"

**Solution:**
```bash
chmod +x scripts/*.sh
```

### Technologies not starting

**Check:**
1. Is the technology installed?
2. Is the port already in use?
3. Are there any error messages?

**Solution:** Run the technology manually to see detailed errors.

---

## Adding New Scripts

When adding new scripts:

1. **Place in `scripts/` directory**
2. **Add to `package.json` scripts section**
3. **Document in this README**
4. **Make executable (if shell script):**
   ```bash
   chmod +x scripts/your-script.sh
   ```
5. **Add shebang line:**
   - Node.js: `#!/usr/bin/env node`
   - Bash: `#!/bin/bash`
   - PowerShell: Not needed

---

## Related Documentation

- `TECHNOLOGY_MANAGEMENT_SYSTEM.md` - Technology management overview
- `PACK_11_FINAL_STATUS.md` - Pack 11 features
- `LETTA_FUTURE_IMPLEMENTATION.md` - Letta setup guide

---

**Last Updated:** 2025-11-30

