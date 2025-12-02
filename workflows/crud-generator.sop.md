# CRUD Entity Generator Workflow

## Overview
Generates complete CRUD functionality for a database entity including model, validation, routes, service, and tests.

## Parameters
- **entity_name** (required): Entity name (PascalCase singular, e.g., "User")
- **fields** (required): Array of field definitions
  ```typescript
  {
    name: string,
    type: 'string' | 'number' | 'boolean' | 'date' | 'json',
    required: boolean,
    unique?: boolean,
    validation?: string
  }
  ```
- **relationships** (optional): Array of relationships
  ```typescript
  {
    type: 'hasMany' | 'belongsTo' | 'manyToMany',
    target: string,
    foreignKey?: string
  }
  ```

## Steps

### 1. Validate Entity Definition
**You MUST:**
- Verify entity_name is PascalCase singular
- Validate all field types are supported
- Check for naming conflicts with existing entities

**You SHOULD:**
- Suggest standard fields (id, created_at, updated_at)
- Warn about potential performance issues (e.g., too many indexes)

**You MAY:**
- Recommend additional fields based on entity type

### 2. Generate Database Model
**You MUST:**
- Use PascalCase for model class name (e.g., `User`)
- Use snake_case for table name (e.g., `users` - plural)
- Use snake_case for column names
- Include base fields: `id` (UUID), `created_at`, `updated_at`

**You SHOULD:**
- Add soft delete support with `deleted_at` field
- Add indexes for frequently queried fields
- Add foreign key constraints for relationships

**You MAY:**
- Add database-specific optimizations

**Example:**
```typescript
// src/models/User.ts
export class User {
  id: string;
  email: string;
  name: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}
```

### 3. Create Validation Schema
**You MUST:**
- Validate all required fields
- Apply field-specific validation rules
- Return standardized error format: `{ valid: boolean, error?: string }`

**You SHOULD:**
- Trim whitespace from string fields
- Provide clear, user-friendly error messages
- Validate data types and formats

**You MAY:**
- Add custom validation rules based on business logic

**Example:**
```typescript
// src/validation/UserValidator.ts
export class UserValidator {
  validate(data: any): { valid: boolean; error?: string } {
    if (!data.email || !data.email.trim()) {
      return { valid: false, error: 'Email is required' };
    }
    // ... more validation
    return { valid: true };
  }
}
```

### 4. Generate Service Layer
**You MUST:**
- Create service class with CRUD methods
- Use PascalCaseService naming (e.g., `UserService`)
- Implement: `create()`, `findById()`, `findAll()`, `update()`, `delete()`
- Handle errors gracefully

**You SHOULD:**
- Add pagination support to `findAll()`
- Add filtering and sorting options
- Use transactions for multi-step operations

**You MAY:**
- Add caching for frequently accessed data

### 5. Generate API Routes
**You MUST:**
- Follow REST conventions:
  - `GET /entity` - List all
  - `GET /entity/:id` - Get one
  - `POST /entity` - Create
  - `PATCH /entity/:id` - Update
  - `DELETE /entity/:id` - Delete
- Use kebab-case for route files (e.g., `user.routes.ts`)
- Return standardized response format
- Handle errors with appropriate status codes

**You SHOULD:**
- Add request validation middleware
- Add authentication/authorization checks
- Add rate limiting for public endpoints

**Response Format:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Format:**
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "field": "email"
  }
}
```

### 6. Generate Tests
**You MUST:**
- Test all CRUD operations
- Test validation rules
- Test error handling

**You SHOULD:**
- Test edge cases (empty data, invalid IDs, etc.)
- Test relationships if applicable
- Use test database or mocks

**You MAY:**
- Add integration tests for API endpoints

### 7. Update Documentation
**You MUST:**
- Document API endpoints in README or API docs
- Include request/response examples
- Document validation rules

**You SHOULD:**
- Add inline code comments
- Update architecture diagrams if applicable

### 8. Verify Implementation
**You MUST:**
- Run all tests and ensure they pass
- Verify database migrations work
- Test API endpoints manually or with Postman

**You SHOULD:**
- Check for TypeScript errors
- Run linter and fix issues
- Verify code follows project conventions

## Output Format
```json
{
  "success": true,
  "data": {
    "entity": "User",
    "filesCreated": [
      "src/models/User.ts",
      "src/validation/UserValidator.ts",
      "src/services/UserService.ts",
      "src/api/user.routes.ts",
      "tests/user.test.ts"
    ],
    "endpoints": [
      "GET /api/user",
      "GET /api/user/:id",
      "POST /api/user",
      "PATCH /api/user/:id",
      "DELETE /api/user/:id"
    ]
  }
}
```

## Constraints
- **MUST NOT** expose sensitive data in API responses
- **MUST NOT** allow SQL injection or NoSQL injection
- **MUST NOT** skip validation on any endpoint
- **SHOULD NOT** use synchronous database operations
- **MAY** add additional endpoints for specific use cases

