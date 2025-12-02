# Multi-Model Ollama Setup

## Overview

The Coding AI Platform v2 supports **intelligent multi-model routing** using Ollama. The system automatically selects the best model based on task complexity, speed requirements, and quality needs.

## Available Models

### Qwen 2.5 Coder 7B
- **Size**: 4.7 GB
- **Speed**: Medium (~10 tokens/sec)
- **Quality**: Excellent
- **Specialization**: Code generation
- **Best for**:
  - Complex code generation
  - Multi-file refactoring
  - Architecture design
  - Advanced debugging
  - Code review
  - Algorithm implementation
  - API design
  - Test generation

### Gemma 3 1B
- **Size**: 815 MB
- **Speed**: Fast (~40 tokens/sec)
- **Quality**: Basic
- **Specialization**: General purpose
- **Best for**:
  - Simple code snippets
  - Quick questions
  - Code formatting
  - Basic refactoring
  - Documentation generation
  - Simple debugging

## Usage

### 1. Manual Model Selection

```typescript
import { OllamaProvider } from './providers/OllamaProvider.js';

// Use Qwen for complex tasks
const qwenProvider = new OllamaProvider('qwen2.5-coder:7b');
const response = await qwenProvider.generateText(
  'Implement a complex sorting algorithm',
  { maxTokens: 500 }
);

// Use Gemma for fast tasks
const gemmaProvider = new OllamaProvider('gemma3:1b');
const quickResponse = await gemmaProvider.generateText(
  'Quick: format this code',
  { maxTokens: 100 }
);
```

### 2. Automatic Model Selection

```typescript
// Enable auto-selection (3rd parameter = true)
const autoProvider = new OllamaProvider(
  'qwen2.5-coder:7b',  // Default model
  'http://localhost:11434',
  true  // Enable auto-selection
);

// The provider will automatically choose the best model
const response = await autoProvider.generateText(
  'Quick: what is 2+2?'  // Will use Gemma 3 1B (fast)
);

const complexResponse = await autoProvider.generateText(
  'Implement a TypeScript API with authentication'  // Will use Qwen (complex)
);
```

### 3. Manual Selection by Requirements

```typescript
import { selectOllamaModel } from './config/ollama-models.js';

const model = selectOllamaModel({
  complexity: 'complex',
  priority: 'quality',
  requiresCodeSpecialization: true
});
// Returns: 'qwen2.5-coder:7b'

const fastModel = selectOllamaModel({
  complexity: 'simple',
  priority: 'speed'
});
// Returns: 'gemma3:1b'
```

## Selection Logic

The system analyzes prompts to determine:

### Complexity Detection
- **Simple**: Keywords like "quick", "simple", "basic", "format"
- **Complex**: Keywords like "refactor", "architecture", "implement", "algorithm"
- **Moderate**: Everything else

### Priority Detection
- **Speed**: Keywords like "quick", "fast"
- **Quality**: Keywords like "best", "high quality"
- **Balanced**: Default

### Code Specialization
- Detected by keywords: "function", "class", "typescript", "code", "api", "test"
- Only triggers for non-simple tasks

### Selection Rules
1. Simple + Speed → Gemma 3 1B
2. Complex OR Code Specialization → Qwen 2.5 Coder 7B
3. Quality Priority → Qwen 2.5 Coder 7B
4. Speed Priority → Gemma 3 1B
5. Default → Qwen 2.5 Coder 7B

## Testing

### Run Multi-Model Tests
```bash
npm run test:multi-model
```

### Run Interactive Demo
```bash
npm run demo:multi-model
```

## Performance Comparison

| Model | Speed | Quality | Size | Use Case |
|-------|-------|---------|------|----------|
| Qwen 2.5 Coder 7B | 10 tok/sec | Excellent | 4.7 GB | Complex coding tasks |
| Gemma 3 1B | 40 tok/sec | Basic | 815 MB | Quick, simple tasks |

**Speed Advantage**: Gemma is ~4x faster for simple tasks

## Adding New Models

1. Download the model:
```bash
ollama pull <model-name>
```

2. Add configuration to `src/config/ollama-models.ts`:
```typescript
export const OLLAMA_MODELS: Record<string, OllamaModelConfig> = {
  'new-model:tag': {
    name: 'new-model:tag',
    displayName: 'New Model',
    size: '2 GB',
    contextWindow: 8192,
    speedTier: 'fast',
    qualityTier: 'good',
    specialization: 'code',
    recommendedFor: ['...'],
    estimatedTokensPerSec: 20
  }
};
```

3. Update selection logic in `selectOllamaModel()` function

