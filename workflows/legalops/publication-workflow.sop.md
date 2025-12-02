# Publication Workflow

## Overview
Manages the legal publication process for business filings. This workflow links to existing filings, validates county requirements, selects newspapers, generates publication notices, and tracks publication dates.

**IMPORTANT:** This workflow provides informational guidance only. It does NOT provide legal advice, legal interpretations, or legal conclusions. Users should consult with a licensed attorney for legal matters.

## Parameters
- **filing_id** (required): Reference to existing filing (DBA or Entity)
- **county** (required): Florida county for publication
- **newspaper** (required): Selected newspaper from approved list
- **publication_dates** (optional): Requested publication dates

## Steps

### 1. Link to Existing Filing
**You MUST:**
- Validate filing_id exists in system
- Retrieve filing details (business name, owner info, etc.)
- Verify filing requires publication
- Display filing summary for confirmation

**You SHOULD:**
- Show filing status and date
- Highlight publication requirements

**You MUST NOT:**
- Interpret whether publication is required
- Provide legal advice on publication requirements

**Output Format:**
```json
{
  "filing_id": "string",
  "filing_type": "dba" | "entity",
  "business_name": "string",
  "requires_publication": boolean
}
```

### 2. Validate County Requirements
**You MUST:**
- Verify county from filing matches publication county
- Validate county exists in `domain/floridaCounties`
- Retrieve county-specific publication requirements (informational only)

**You SHOULD:**
- Display county publication rules (informational only)
- Show required publication frequency

**You MUST NOT:**
- Interpret county requirements
- Guarantee compliance with county rules

### 3. Select Newspaper
**You MUST:**
- Present list of approved newspapers from `domain/newspapers`
- Filter newspapers by selected county
- Validate selected newspaper exists and serves the county
- Display newspaper contact information
- Display publication rates (informational only)

**You SHOULD:**
- Sort newspapers alphabetically
- Show newspaper circulation information
- Provide newspaper contact details

**You MUST NOT:**
- Recommend specific newspapers
- Interpret publication requirements
- Guarantee newspaper acceptance

**Output Format:**
```json
{
  "newspaper": {
    "name": "string",
    "county": "string",
    "contact": {
      "phone": "string",
      "email": "string",
      "address": { ... }
    },
    "rates": {
      "per_line": number,
      "minimum_charge": number
    }
  }
}
```

### 4. Generate Publication Notice
**You MUST:**
- Use template from `documents/templates/publication-notice.template.txt`
- Inject filing information (business name, owner, address)
- Include all required legal language
- Format according to newspaper requirements
- Calculate estimated publication cost
- Save notice to `documents/generated/`

**You SHOULD:**
- Include UPL-safe disclaimer
- Add document version number
- Include generation timestamp
- Provide character/line count

**You MUST NOT:**
- Include legal advice in notice
- Guarantee notice acceptance by newspaper
- Interpret publication requirements

**Output Format:**
```json
{
  "success": true,
  "notice": {
    "path": "documents/generated/publication-notice-{timestamp}.txt",
    "type": "publication-notice",
    "version": "1.0",
    "generatedAt": "ISO-8601-timestamp",
    "lineCount": number,
    "estimatedCost": number
  }
}
```

### 5. Request Publication Dates
**You MUST:**
- Collect requested publication dates (if applicable)
- Validate dates are in the future
- Validate dates meet frequency requirements (informational only)
- Allow user to specify preferred dates

**You SHOULD:**
- Suggest dates based on requirements
- Show newspaper publication schedule

**You MUST NOT:**
- Guarantee publication on specific dates
- Interpret date requirements

### 6. Create Publication Record
**You MUST:**
- Create PublicationRecord in database
- Link to filing_id
- Store newspaper information
- Store publication notice path
- Store requested dates
- Set status to "pending"

**You SHOULD:**
- Generate unique publication ID
- Add creation timestamp
- Store all metadata

**Database Schema:**
```typescript
{
  id: string (UUID),
  filing_id: string,
  newspaper_name: string,
  county: string,
  notice_path: string,
  requested_dates: Date[],
  actual_dates: Date[],
  status: "pending" | "scheduled" | "published" | "confirmed",
  created_at: Date,
  updated_at: Date
}
```

### 7. Provide Submission Instructions
**You MUST:**
- Display newspaper contact information
- Provide submission instructions (informational only)
- List required documents
- Show estimated costs

**You SHOULD:**
- Provide submission checklist
- Suggest timeline for submission
- Include newspaper deadlines (if known)

**You MUST NOT:**
- Provide legal advice on submission process
- Guarantee newspaper acceptance
- Interpret submission requirements

### 8. Track Publication Status
**You MUST:**
- Allow user to update publication status
- Record actual publication dates
- Update PublicationRecord status
- Store confirmation information

**You SHOULD:**
- Send reminders for pending publications
- Track publication history

**You MAY:**
- Integrate with newspaper systems (if available)

## Constraints
- **MUST NOT** provide legal advice, interpretations, or conclusions
- **MUST NOT** recommend specific newspapers
- **MUST NOT** guarantee publication acceptance or compliance
- **MUST NOT** interpret publication requirements
- **SHOULD NOT** skip validation on any field
- **MAY** provide informational guidance and procedural steps

