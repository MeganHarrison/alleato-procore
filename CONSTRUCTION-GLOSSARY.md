# Construction & Procore Glossary

A quick reference for construction project management terminology. **This is the domain knowledge that helps you understand what you're building.**

---

## Core Project Roles

| Role | Description |
|------|-------------|
| **Owner** | The entity paying for the project (client). Makes final decisions. |
| **General Contractor (GC)** | Main contractor managing the entire project. Hires subcontractors. |
| **Subcontractor (Sub)** | Specialized contractor hired by GC for specific work (plumbing, electrical, etc.) |
| **Architect** | Designs the building, creates drawings, answers design questions |
| **Engineer** | Structural, mechanical, or electrical specialist who designs systems |
| **Project Manager (PM)** | Oversees day-to-day project execution |
| **Superintendent** | On-site manager responsible for field operations |

---

## Financial Terms

### Commitments & Contracts

| Term | Definition |
|------|------------|
| **Commitment** | A contract or purchase order with a vendor/subcontractor |
| **Prime Contract** | The main contract between owner and general contractor |
| **Subcontract** | Contract between GC and a subcontractor |
| **Purchase Order (PO)** | Order for materials or equipment |
| **Schedule of Values (SOV)** | Breakdown of contract amount by line item |

### Change Management

| Term | Definition |
|------|------------|
| **Change Order (CO)** | Formal modification to a contract (adds/removes scope, adjusts price) |
| **Change Event** | Something that might lead to a change order (discovered condition, owner request) |
| **Potential Change Order (PCO)** | A change order that's being evaluated but not yet approved |
| **Request for Change (RFC)** | Formal request to modify the contract |
| **Contingency** | Budget set aside for unexpected costs |

### Cost Tracking

| Term | Definition |
|------|------------|
| **Budget** | Planned spending for the project |
| **Actual Cost** | What's actually been spent |
| **Committed Cost** | What's been contracted (may not be spent yet) |
| **Forecast** | Predicted final cost |
| **Variance** | Difference between budget and actual/forecast |
| **Direct Cost** | Cost not tied to a commitment (materials bought directly, labor) |

### Billing & Payment

| Term | Definition |
|------|------------|
| **Invoice** | Bill from subcontractor requesting payment |
| **Pay Application** | Subcontractor's formal request for payment based on work completed |
| **Retainage** | Percentage withheld from payments until project completion (typically 5-10%) |
| **Lien Waiver** | Document releasing the right to place a lien on the property |

---

## Document Types

### RFI (Request for Information)

A formal question requiring a documented answer. Used when:
- Drawings are unclear or conflicting
- More detail is needed to proceed
- Field conditions don't match plans

**Key concepts:**
- **Ball-in-Court**: Who needs to respond
- **Due Date**: When response is needed
- **Cost Impact**: If the answer will affect budget
- **Schedule Impact**: If the answer will affect timeline

### Submittal

Documentation submitted for approval before work/materials are used:
- Shop drawings
- Product data sheets
- Material samples
- Equipment cut sheets

**Workflow:** Submitted → Under Review → Approved/Rejected/Revise & Resubmit

### Drawing

Project plans and specifications:
- **As-Built**: Drawings updated to show what was actually constructed
- **Shop Drawing**: Detailed drawings from a fabricator/manufacturer
- **Revision**: Updated version of a drawing
- **Markup**: Annotations on a drawing (usually in PDF)

### Daily Report (Daily Log)

Daily record of job site activity:
- Weather conditions
- Manpower (number of workers by trade)
- Equipment on site
- Work performed
- Visitors
- Issues/delays

---

## Project Phases

| Phase | What Happens |
|-------|--------------|
| **Preconstruction** | Planning, estimating, budgeting before work starts |
| **Bidding** | Soliciting and evaluating contractor proposals |
| **Procurement** | Ordering long-lead materials and equipment |
| **Construction** | Actual building work |
| **Closeout** | Final inspections, punch lists, handover |

---

## Common Statuses

Most items in Procore follow status workflows:

### RFI Statuses
```
Draft → Open → Answered → Closed
```

### Submittal Statuses
```
Draft → Submitted → Under Review → Approved/Rejected/Revise & Resubmit
```

### Change Order Statuses
```
Draft → Pending → Approved → Executed (or Void)
```

### Invoice Statuses
```
Draft → Under Review → Approved → Paid
```

---

## Procore-Specific Concepts

### Ball-in-Court
Indicates who currently needs to take action. When you create an RFI asking the architect a question, the ball is in their court. When they respond, it returns to you.

### Distribution Lists
Pre-defined groups of people who should receive notifications about certain items. Example: "Electrical Team" gets all electrical submittals.

### Correspondence
General communications that need to be logged and tracked (letters, emails, notices).

### Punch List
A list of items that need to be fixed or completed before a space is considered done. Created during final walkthrough.

### Directory
The list of all people/companies involved in a project with their contact info and roles.

---

## Schedule Terms

| Term | Definition |
|------|------------|
| **Critical Path** | The sequence of tasks that determines minimum project duration |
| **Float/Slack** | Extra time available before a task becomes critical |
| **Milestone** | Significant project event or deadline |
| **Look-Ahead** | Short-term schedule (typically 2-4 weeks out) |
| **Gantt Chart** | Bar chart showing task timeline |

---

## Safety & Compliance

| Term | Definition |
|------|------------|
| **Incident** | Safety event (injury, near miss, property damage) |
| **Observation** | Noted safety concern that hasn't caused an incident |
| **Action Item** | Task to address a safety issue |
| **Inspection** | Formal review of work or conditions |

---

## Quick Acronym Reference

| Acronym | Meaning |
|---------|---------|
| **RFI** | Request for Information |
| **CO** | Change Order |
| **PCO** | Potential Change Order |
| **SOV** | Schedule of Values |
| **PO** | Purchase Order |
| **GC** | General Contractor |
| **PM** | Project Manager |
| **A/E** | Architect/Engineer |
| **MEP** | Mechanical, Electrical, Plumbing |
| **FF&E** | Furniture, Fixtures & Equipment |
| **NTP** | Notice to Proceed |
| **TCO** | Temporary Certificate of Occupancy |
| **CO** | Certificate of Occupancy |

---

## How This Maps to Our Database

| Concept | Table(s) in Supabase |
|---------|---------------------|
| Projects | `projects` |
| Companies/Vendors | `companies` |
| People | `contacts`, `app_users` |
| Clients | `clients` |
| Commitments | `commitments` |
| Change Orders | `change_orders` |
| Budget | `budget_lines`, `budget_modifications` |
| Direct Costs | `direct_costs` |
| RFIs | `rfis` |
| Submittals | `submittals` |
| Daily Reports | `daily_reports` |
| Risks | `risks` |
| Meetings | `meetings`, `meeting_segments` |
| Documents | `documents`, `document_metadata` |

---

## Tips for Understanding Requirements

1. **When someone says "commitment"** - they mean a contract with a sub/vendor, not "being committed to something"

2. **"Ball-in-court"** - think of it as "whose turn is it?" in tennis

3. **Change orders vs change events** - Events are "something happened," orders are "the contract is officially changing"

4. **Retainage** - money held back as insurance until everything is finished correctly

5. **SOV (Schedule of Values)** - the itemized price list for a contract that determines how much to pay for each portion of work

When in doubt about a term, ask! Construction has a lot of specialized vocabulary.
