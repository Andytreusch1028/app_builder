# Coding AI Platform v2

Hybrid AI Coding Platform with Local and Cloud Models

## 🎯 Project Status

**Phase 0: Preparation - ✅ COMPLETE**

### Completed Setup
- ✅ Project initialized with npm
- ✅ TypeScript configured (ES2022 modules)
- ✅ Jest testing framework configured
- ✅ Directory structure created
- ✅ Base dependencies installed
- ✅ Basic Express server running
- ✅ Health check endpoint working

## 📁 Project Structure

```
coding-ai-platform-v2/
├── src/
│   ├── api/          # API routes and controllers
│   ├── services/     # Business logic services
│   ├── providers/    # Cloud AI provider integrations
│   ├── middleware/   # Express middleware
│   ├── types/        # TypeScript type definitions
│   ├── config/       # Configuration files
│   ├── utils/        # Utility functions
│   └── index.ts      # Application entry point
├── tests/
│   ├── unit/         # Unit tests
│   ├── integration/  # Integration tests
│   ├── api/          # API endpoint tests
│   ├── e2e/          # End-to-end tests
│   ├── performance/  # Performance tests
│   └── security/     # Security tests
├── data/
│   └── memory/       # Vector memory storage
├── models/           # Local AI models (GGUF files)
├── logs/             # Application logs
└── dist/             # Compiled JavaScript output
```

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Build
```bash
npm run build
```

### Run Development Server
```bash
npm run dev
```

### Run Production Server
```bash
npm start
```

### Run Tests
```bash
npm test
npm run test:coverage
```

## 🔧 Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Build and run with auto-reload
- `npm start` - Run production server
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run clean` - Remove build artifacts

## 📋 Next Steps

**Phase 1: Pack 1-2 - Hybrid Compute System (Week 1)**

Build the multi-provider AI system with:
- Cloud provider integrations (Anthropic, OpenAI, Google)
- Local model service (Gemma 2 9B)
- Compute router for intelligent model selection
- Multi-provider service orchestration

See `MASTER_REBUILD_PLAN.md` for complete rebuild sequence.

## 🧪 Testing Framework

This project uses a comprehensive 4-phase testing methodology:
1. **Impact Analysis** - Review changes before implementation
2. **Component Testing** - Unit tests for each component
3. **Integration Testing** - System-level integration tests
4. **Manual Testing** - Real-world verification

Target: **80%+ code coverage** with **zero regressions**

## 📚 Documentation

- `MASTER_REBUILD_PLAN.md` - Complete rebuild guide
- `TESTING_SYSTEM_OVERVIEW.md` - Testing framework overview
- `TESTING_PROMPT.md` - Testing prompt template
- `BUILD_PROMPTS_EXTRACTED.md` - All build prompts
- `QUICK_START_TESTING.md` - Quick reference

## 🔑 Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:
- `PORT` - Server port (default: 3000)
- `ANTHROPIC_API_KEY` - Claude API key
- `OPENAI_API_KEY` - GPT API key
- `GOOGLE_API_KEY` - Gemini API key
- `LOCAL_MODEL_PATH` - Path to local GGUF model

## 📊 Technology Stack

- **Runtime:** Node.js with ES2022 modules
- **Language:** TypeScript 5.9+
- **Framework:** Express 5
- **Testing:** Jest with ts-jest
- **AI Models:** Local (Gemma 2) + Cloud (Claude, GPT-4, Gemini)

## 📝 License

ISC

---

**Built with the comprehensive testing framework for bug-free development**

