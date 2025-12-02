# Entity Creation Workflow

## Overview
Guides users through creating a new business entity (LLC, Corporation, etc.). This workflow collects entity information, owner/manager details, registered agent information, and generates formation documents.

**IMPORTANT:** This workflow provides informational guidance only. It does NOT provide legal advice, legal interpretations, or legal conclusions. Users should consult with a licensed attorney for legal matters.

## Parameters
- **entity_type** (required): Type of entity from `domain/entityTypes`
- **entity_name** (required): Legal name of the entity
- **owners_managers** (required): Array of owners/managers
- **registered_agent** (required): Registered agent information
- **business_address** (required): Principal business address

## Steps

### 1. Select Entity Type
**You MUST:**
- Present list of entity types from `domain/entityTypes`
- Validate selected type exists in the list
- Collect entity type selection

**You SHOULD:**
- Provide brief description of each entity type (informational only)
- Display common use cases for each type

**You MUST NOT:**
- Recommend specific entity types
- Provide legal advice on entity selection
- Interpret tax implications

**Entity Types:**
- LLC (Limited Liability Company)
- Corporation (C-Corp or S-Corp)
- Partnership
- Sole Proprietorship
- Nonprofit Corporation

### 2. Collect Entity Name
**You MUST:**
- Collect proposed legal entity name
- Validate name is 2-120 characters
- Validate limited punctuation only
- Check for required suffixes (LLC, Inc., Corp., etc.)
- Return validation result: `{ valid: boolean, error?: string }`

**You SHOULD:**
- Suggest checking name availability with state
- Warn if name is too similar to existing entities
- Provide examples of acceptable formats

**You MUST NOT:**
- Guarantee name availability
- Interpret naming requirements
- Provide legal advice on name selection

### 3. Collect Owners/Managers Information
**You MUST:**
- Collect array of owners/managers (minimum 1)
- For each owner/manager:
  - Name (required)
  - Type: "individual" | "entity"
  - Ownership percentage (if applicable)
  - Address (required)
  - Email (required, RFC-basic validation)
  - Phone (required, 10-digit US format)
- Validate all required fields
- Validate ownership percentages sum to 100% (if applicable)

**You SHOULD:**
- Allow adding multiple owners/managers
- Validate address components
- Provide clear error messages

**You MUST NOT:**
- Provide legal advice on ownership structure
- Interpret ownership requirements

**Output Format:**
```json
{
  "owners_managers": [
    {
      "name": "string",
      "type": "individual" | "entity",
      "ownership_percentage": number,
      "address": { ... },
      "email": "string",
      "phone": "string"
    }
  ]
}
```

### 4. Collect Business Address
**You MUST:**
- Collect principal business address
- Validate street address (required)
- Validate city (required)
- Validate state (required, must be valid US state)
- Validate ZIP code (5-digit or ZIP+4 format)

**You SHOULD:**
- Provide address autocomplete if available
- Validate address format

**You MAY:**
- Suggest using registered agent address if same

### 5. Collect Registered Agent Information
**You MUST:**
- Collect registered agent name (required)
- Collect registered agent address (required, must be Florida street address)
- Validate address is not a P.O. Box
- Collect registered agent email (required)
- Collect registered agent phone (required)

**You SHOULD:**
- Explain registered agent requirements (informational only)
- Validate all contact information

**You MUST NOT:**
- Recommend specific registered agent services
- Interpret registered agent requirements
- Provide legal advice on registered agent selection

### 6. Review Entity Information
**You MUST:**
- Display all collected information for review
- Allow user to edit any section
- Require explicit confirmation before proceeding
- Validate all data one final time

**You SHOULD:**
- Highlight any warnings or potential issues
- Provide summary of entity structure

### 7. Generate Formation Documents
**You MUST:**
- Use template from `documents/templates/entity-formation.template.txt`
- Inject all collected parameters
- Generate Articles of Organization/Incorporation
- Generate Operating Agreement (if LLC)
- Save all documents to `documents/generated/`
- Create DocumentRecord for each document

**You SHOULD:**
- Include UPL-safe disclaimer in all documents
- Add document version numbers
- Include generation timestamps

**You MUST NOT:**
- Include legal advice in generated documents
- Guarantee document acceptance by state
- Interpret formation requirements

**Output Format:**
```json
{
  "success": true,
  "documents": [
    {
      "path": "documents/generated/articles-of-organization-{timestamp}.pdf",
      "type": "articles-of-organization",
      "version": "1.0",
      "generatedAt": "ISO-8601-timestamp"
    },
    {
      "path": "documents/generated/operating-agreement-{timestamp}.pdf",
      "type": "operating-agreement",
      "version": "1.0",
      "generatedAt": "ISO-8601-timestamp"
    }
  ]
}
```

### 8. Provide Filing Instructions
**You MUST:**
- Inform user of state filing requirements (informational only)
- Provide contact information for state filing office
- List required fees (informational only)
- Provide checklist of required documents

**You SHOULD:**
- Suggest timeline for filing
- Provide links to state resources

**You MUST NOT:**
- Provide legal advice on filing process
- Guarantee filing success
- Interpret filing requirements

## Constraints
- **MUST NOT** provide legal advice, interpretations, or conclusions
- **MUST NOT** recommend specific entity types or structures
- **MUST NOT** guarantee name availability or filing success
- **MUST NOT** skip validation on any field
- **SHOULD NOT** recommend specific service providers
- **MAY** provide informational guidance and procedural steps

