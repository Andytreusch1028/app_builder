# Application Scaffold Workflow

## Overview
Creates a new application with standardized structure, dependencies, and configuration following best practices.

## Parameters
- **app_name** (required): Application name (kebab-case)
- **app_type** (required): "web-app" | "api" | "cli" | "library"
- **tech_stack** (optional, default: "node-typescript"): Technology stack
- **features** (optional): Array of features ["auth", "database", "api"]

## Steps

### 1. Validate Input
**You MUST:**
- Check app_name follows kebab-case convention
- Verify app_type is supported
- Validate tech_stack compatibility

**You SHOULD:**
- Suggest common features for the selected app_type
- Warn if app_name conflicts with existing projects

**You MAY:**
- Propose alternative naming if conflicts exist

### 2. Create Directory Structure
**You MUST:**
- Create base directories: `src/`, `tests/`, `docs/`
- Follow the standard folder structure:
  ```
  src/
    api/          → routes + controllers
    services/     → business logic
    models/       → data models
    utils/        → helpers
    config/       → configuration
  ```
- Create `.gitignore`, `README.md`, `package.json`

**You SHOULD:**
- Add `workflows/` directory if app_type includes multi-step processes
- Add `public/` or `static/` for web applications

**You MAY:**
- Customize structure based on tech_stack preferences

### 3. Install Dependencies
**You MUST:**
- Use package manager (npm/yarn/pnpm) - NEVER manually edit package.json
- Install core dependencies for the tech_stack
- Install dev dependencies (TypeScript, ESLint, Prettier if applicable)

**You SHOULD:**
- Install testing framework (Jest, Vitest, or Mocha)
- Install linting and formatting tools

**You MAY:**
- Suggest additional dependencies based on selected features

### 4. Generate Configuration Files
**You MUST:**
- Create `tsconfig.json` for TypeScript projects
- Create `.env.example` with required environment variables
- Create basic configuration files (ESLint, Prettier)

**You SHOULD:**
- Add scripts to package.json (dev, build, test, lint)
- Configure module resolution and paths

### 5. Create Initial Files
**You MUST:**
- Create entry point file (`src/index.ts` or equivalent)
- Create basic README.md with project description
- Create initial test file

**You SHOULD:**
- Add example code demonstrating the structure
- Add health check endpoint for API projects

### 6. Initialize Version Control
**You MUST:**
- Initialize git repository
- Create initial commit with message "Initial commit: Application scaffold"

**You SHOULD:**
- Add .gitignore with common patterns
- Create .gitattributes if needed

### 7. Verify Setup
**You MUST:**
- Run `npm install` (or equivalent) to verify dependencies
- Run build command to verify configuration
- Run tests to verify test setup

**You SHOULD:**
- Display summary of created structure
- Provide next steps for the developer

### 8. Generate Documentation
**You MUST:**
- Update README.md with:
  - Project description
  - Installation instructions
  - Development commands
  - Project structure overview

**You SHOULD:**
- Add inline code comments explaining key patterns
- Create CONTRIBUTING.md for team projects

**You MAY:**
- Generate API documentation if applicable

## Output Format
```json
{
  "success": true,
  "data": {
    "projectPath": "./my-app",
    "structure": {
      "directories": 12,
      "files": 18
    },
    "dependencies": {
      "production": 8,
      "development": 12
    },
    "nextSteps": [
      "cd my-app",
      "npm run dev",
      "Open http://localhost:3000"
    ]
  }
}
```

## Constraints
- **MUST NOT** create files outside the project directory
- **MUST NOT** install dependencies without user confirmation for paid services
- **MUST NOT** commit sensitive information (API keys, passwords)
- **SHOULD NOT** use deprecated packages or patterns
- **MAY** suggest modern alternatives to legacy approaches

