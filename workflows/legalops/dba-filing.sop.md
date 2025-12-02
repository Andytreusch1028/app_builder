# DBA / Fictitious Name Filing Workflow

## Overview
Guides users through the process of filing a DBA (Doing Business As) or Fictitious Name registration. This workflow collects business information, validates data, selects county and newspaper, and generates filing documents.

**IMPORTANT:** This workflow provides informational guidance only. It does NOT provide legal advice, legal interpretations, or legal conclusions. Users should consult with a licensed attorney for legal matters.

## Parameters
- **business_name** (required): The fictitious business name to register
- **owner_info** (required): Owner/entity information
- **county** (required): Florida county for filing
- **newspaper** (optional): Newspaper for publication (if required)

## Steps

### 1. Collect Business Information
**You MUST:**
- Collect the proposed fictitious business name
- Verify the name is 2-120 characters with limited punctuation
- Collect business address (street, city, state, ZIP)
- Validate ZIP code is 5-digit or ZIP+4 format

**You SHOULD:**
- Suggest checking name availability with the state
- Warn if the name is too similar to existing businesses
- Provide examples of acceptable name formats

**You MAY:**
- Suggest alternative names if conflicts exist

**Output Format:**
```json
{
  "business_name": "string",
  "business_address": {
    "street": "string",
    "city": "string",
    "state": "FL",
    "zip": "string"
  }
}
```

### 2. Validate Business Name
**You MUST:**
- Check name length (2-120 characters)
- Validate allowed punctuation only (periods, hyphens, apostrophes, ampersands)
- Reject null, undefined, or empty names
- Return validation result: `{ valid: boolean, error?: string }`

**You SHOULD:**
- Trim whitespace before validation
- Provide clear error messages for invalid names

**You MUST NOT:**
- Interpret whether the name complies with state law
- Provide legal advice on name selection
- Guarantee name availability

### 3. Collect Owner Information
**You MUST:**
- Collect owner type: "individual" | "entity"
- For individuals: name, SSN (NNN-NN-NNNN), address, email, phone
- For entities: entity name, EIN (NN-NNNNNNN), address, email, phone
- Validate all required fields are present
- Validate email format (RFC-basic)
- Validate phone format (10-digit US)

**You SHOULD:**
- Mask SSN/EIN in logs and displays
- Validate address components

**You MUST NOT:**
- Store SSN/EIN in plain text without encryption
- Log full SSN/EIN values

**Output Format:**
```json
{
  "owner_type": "individual" | "entity",
  "name": "string",
  "ssn_ein": "string",
  "address": { ... },
  "email": "string",
  "phone": "string"
}
```

### 4. Select County
**You MUST:**
- Present list of Florida counties from `domain/floridaCounties`
- Validate selected county exists in the list
- Reject invalid county selections

**You SHOULD:**
- Sort counties alphabetically
- Provide search/filter functionality

**You MAY:**
- Suggest county based on business address

### 5. Select Newspaper (if required)
**You MUST:**
- Present list of approved newspapers from `domain/newspapers`
- Filter newspapers by selected county
- Validate selected newspaper exists and serves the county

**You SHOULD:**
- Display newspaper pricing information
- Show publication requirements

**You MUST NOT:**
- Recommend specific newspapers
- Interpret publication requirements

### 6. Review and Confirm
**You MUST:**
- Display all collected information for review
- Allow user to edit any section
- Require explicit confirmation before proceeding

**You SHOULD:**
- Highlight any warnings or potential issues
- Provide summary of next steps

### 7. Generate Filing Documents
**You MUST:**
- Use template from `documents/templates/dba-filing.template.txt`
- Inject all collected parameters
- Generate document in required format
- Save to `documents/generated/`
- Create DocumentRecord with metadata

**You SHOULD:**
- Include UPL-safe disclaimer in footer
- Add document version number
- Include generation timestamp

**You MUST NOT:**
- Include legal advice in generated documents
- Guarantee document acceptance by authorities

**Output Format:**
```json
{
  "success": true,
  "document": {
    "path": "documents/generated/dba-filing-{timestamp}.pdf",
    "type": "dba-filing",
    "version": "1.0",
    "generatedAt": "ISO-8601-timestamp"
  }
}
```

### 8. Provide Next Steps
**You MUST:**
- Inform user of filing requirements
- Provide contact information for county clerk
- List required fees (informational only)

**You SHOULD:**
- Provide checklist of required documents
- Suggest timeline for filing

**You MUST NOT:**
- Provide legal advice on filing process
- Guarantee filing success
- Interpret filing requirements

## Constraints
- **MUST NOT** provide legal advice, interpretations, or conclusions
- **MUST NOT** guarantee name availability or filing success
- **MUST NOT** store sensitive data (SSN/EIN) without encryption
- **MUST NOT** skip validation on any field
- **SHOULD NOT** recommend specific service providers
- **MAY** provide informational guidance and procedural steps

