# Agent Index (Consolidated)

## Overview
This document catalogs all agents available in Claude Code. Agents have been consolidated to eliminate overlaps - each agent has a distinct, non-overlapping purpose.

**Last Updated:** 2026-01-10
**Consolidation:** Reduced from 53+ to 35 agents by merging overlapping use cases

---

## 🚨🚨🚨 MANDATORY RULES (NO EXCEPTIONS) 🚨🚨🚨

### 1. test-automator - MANDATORY for ALL Testing

**The main Claude agent MUST NOT run Playwright tests directly.**

```
❌ BANNED:
- Main agent runs: npx playwright test ...
- Main agent asks: "Should I debug why tests are failing?"
- Main agent says: "Browser tests are timing out, what should I do?"
- Main agent reports test failures without fixing them

✅ REQUIRED:
Task({
  subagent_type: "test-automator",
  prompt: `Run and fix tests for [feature].
    If tests fail, FIX THE ISSUES.
    Continue until PASS or genuine blocker.
    DO NOT ASK QUESTIONS. FIX PROBLEMS.`,
  description: "Test [feature]"
})
```

**Why:** Main agent context gets polluted with test debugging, wastes 20x time fumbling, asks "Should I..." instead of fixing.

**Triggers (Use test-automator IMMEDIATELY):**
- ANY Playwright test execution
- ANY browser test debugging
- ANY "tests are failing" situation
- ANY test timeout issues
- ANY need to verify UI in browser

### 2. Other Mandatory Agents

| Situation | Agent | Rule |
|-----------|-------|------|
| Production is broken | `incident-responder` | Use IMMEDIATELY |
| Database work (any) | `supabase-architect` | ALL Supabase work |
| Code review needed | `code-reviewer` | Use proactively after writing code |

---

## Consolidated Agent List

| Agent | When to Use | Notes | Category |
|-------|-------------|-------|-------|
| **test-automator** | **MANDATORY for ALL Playwright/browser testing.** Never run tests directly. | Fresh context, fixes issues autonomously | Mandatory |
| **debugger** | Any errors, test failures, unexpected behavior, log analysis | Combines error-detective capabilities | Mandatory|
| **incident-responder** | Production emergencies ONLY | Combines devops-troubleshooter | Mandatory|
| **Explore** | Find files, search code, answer codebase questions. Specify: "quick", "medium", "very thorough" | Replaces general-purpose | Research |
| **codebase-pattern-finder** | Find similar implementations, usage examples, patterns to copy | Returns code details with file:line | Research |
| **search-specialist** | Web research, competitive analysis, external information | External research only | Research |
| **Plan** | Design implementation strategy before coding | Step-by-step plans, trade-offs | Architecture/Planning |
| **backend-architect** | REST APIs, microservices, system design (non-database) | Architecture decisions | Architecture/Planning |
| **cloud-architect** | AWS/Azure/GCP, Terraform, serverless, infrastructure | Cloud-specific | Architecture/Planning |
| **graphql-architect** | GraphQL schemas, resolvers, federation, N+1 | GraphQL-specific | Architecture/Planning |
| **context-manager** | Long-running tasks, multi-agent coordination, >10k tokens | Context preservation | Architecture/Planning |
| **typescript-pro** | Advanced TS: complex types, generics, enterprise patterns | Primary for this project | Development |
| **python-pro** | Advanced Python: decorators, generators, async | When needed | Development |
| **elixir-pro** | Elixir/OTP, Phoenix LiveView | When needed | Development |
| **php-pro** | Modern PHP | When needed | Development |
| **frontend-developer** | React components, layouts, state, accessibility | Implementation | Frontend Dev |
| **ui-ux-designer** | Design systems, wireframes, visual design, design review | Absorbs design-review | Frontend Dev |
| **mobile-developer** | React Native, Flutter, mobile-specific | Mobile apps | Frontend Dev |
| **ios-developer** | Native iOS, Swift/SwiftUI | iOS-specific | Frontend Dev |
| **unity-developer** | Unity games, C#, game systems | Games only | Dev |
| **supabase-architect** | **ALL database work**: schema, RLS, migrations, queries, optimization | Absorbs database-admin, database-optimizer, sql-pro | Database |

### 🤖 AI & ML

| Agent | When to Use | Notes |
|-------|-------------|-------|
| **ai-engineer** | LLM apps, RAG, prompts, vector search, agents, SDK usage | Absorbs ai-sdk-expert, prompt-engineer |
| **ml-engineer** | ML pipelines, TensorFlow/PyTorch, model serving | Traditional ML |

### 📊 Data

| Agent | When to Use | Notes |
|-------|-------------|-------|
| **data-scientist** | Analysis, insights, BigQuery, ad-hoc queries | Analysis focus |
| **data-engineer** | ETL pipelines, Spark, Airflow, Kafka, warehouses | Pipeline focus |

### 🔒 Security & DevOps

| Agent | When to Use | Notes |
|-------|-------------|-------|
| **security-auditor** | Vulnerabilities, OWASP, auth, encryption | Security review |
| **deployment-engineer** | CI/CD, Docker, K8s, GitHub Actions | Deployment setup |
| **network-engineer** | DNS, SSL, CDN, load balancers, connectivity | Network issues |
| **performance-engineer** | Profiling, bottlenecks, caching, load testing | Performance |

### 📝 Documentation

| Agent | When to Use | Notes |
|-------|-------------|-------|
| **docs-architect** | ALL documentation: technical docs, API specs, tutorials, references | Absorbs api-documenter, reference-builder, tutorial-engineer |
| **mermaid-expert** | Diagrams: flowcharts, sequences, ERDs | Diagrams only |

### 💼 Business & Finance

| Agent | When to Use | Notes |
|-------|-------------|-------|
| **business-analyst** | Metrics, KPIs, dashboards, reports | Business metrics |
| **quant-analyst** | Financial models, trading, market data | Quantitative finance |
| **risk-manager** | Portfolio risk, hedging, position limits | Risk management |

### 📣 Marketing & Content

| Agent | When to Use | Notes |
|-------|-------------|-------|
| **content-marketer** | Blog, social media, newsletters, SEO | Content creation |
| **sales-automator** | Cold emails, proposals, sales scripts | Sales outreach |
| **customer-support** | Support tickets, FAQs, help docs | Support |

### ⚖️ Legal & Other

| Agent | When to Use | Notes |
|-------|-------------|-------|
| **legal-advisor** | Privacy policies, ToS, GDPR, compliance | Legal docs |
| **payment-integration** | Stripe, PayPal, subscriptions, PCI | Payments |

### 🔧 Maintenance

| Agent | When to Use | Notes |
|-------|-------------|-------|
| **code-reviewer** | Code quality, security, maintainability, architecture review | Absorbs architect-reviewer |
| **legacy-modernizer** | Refactoring, framework migrations, tech debt | Modernization |
| **dx-optimizer** | Developer tooling, setup, workflows | Dev experience |

### 🛠️ Utility

| Agent | When to Use | Notes |
|-------|-------------|-------|
| **claude-code-guide** | Questions about Claude Code itself | Meta help |
| **statusline-setup** | Configure status line | Config only |

---

## Project-Specific Agents

These remain project-specific because they contain domain knowledge unique to this codebase.

| Agent | Location | Purpose | Keep? |
|-------|----------|---------|-------|
| **Project Manager Agent** | `.agents/agents/PROJECT-MANAGER-AGENT.md` | Orchestrates PlansDoc workflow | ✅ Unique |
| **Design System Auditor** | `.claude/agents/design-system-auditor.md` | Enforces THIS project's design system | ✅ Project-specific rules |
| **Component System Consistency** | `.agents/agents/component-system-consistency-subagent.md` | Enforces THIS project's component patterns | ✅ Project-specific |
| **Breadcrumb Experience** | `.agents/agents/breadcrumb-experience-subagent.md` | THIS project's breadcrumb patterns | ✅ Project-specific |
| **Project Context Resilience** | `.agents/agents/project-context-resilience-subagent.md` | THIS project's routing logic | ✅ Project-specific |
| **Page Title Compliance** | `.agents/agents/page-title-compliance-subagent.md` | THIS project's title patterns | ✅ Project-specific |

---

## Quick Reference

### Testing (MANDATORY)
```typescript
Task({ subagent_type: "test-automator", prompt: "...", description: "Test X" })
```

### Codebase Research
```typescript
// Quick search
Task({ subagent_type: "Explore", prompt: "quick: find auth files", description: "Find auth" })

// Find patterns to copy
Task({ subagent_type: "codebase-pattern-finder", prompt: "Show form patterns", description: "Find forms" })
```

### Database (ALL Supabase work)
```typescript
Task({ subagent_type: "supabase-architect", prompt: "...", description: "DB work" })
```

### Documentation (ALL docs)
```typescript
Task({ subagent_type: "docs-architect", prompt: "...", description: "Write docs" })
```

### AI Work (ALL LLM/AI)
```typescript
Task({ subagent_type: "ai-engineer", prompt: "...", description: "AI feature" })
```

---

## Decision Tree: Which Agent?

```
Need to run tests?
  → test-automator (MANDATORY)

Production is broken?
  → incident-responder

Something not working?
  → debugger

Need to find code?
  → Explore (codebase) or search-specialist (web)

Need to copy a pattern?
  → codebase-pattern-finder

Database work?
  → supabase-architect (ALL of it)

Write documentation?
  → docs-architect (ALL of it)

AI/LLM feature?
  → ai-engineer (ALL of it)

Design/UI work?
  → ui-ux-designer (design) or frontend-developer (code)

Review code?
  → code-reviewer (includes architecture)

Plan implementation?
  → Plan
```

---

## Summary

**Total Agents:** 35 (down from 53+)
**Agents Removed:** 18 (merged into others)

**Key Consolidations:**
1. **Database** → All in `supabase-architect`
2. **Documentation** → All in `docs-architect`
3. **AI/LLM** → All in `ai-engineer`
4. **Debugging** → All in `debugger`
5. **Production issues** → All in `incident-responder`
6. **Code review** → All in `code-reviewer` (includes architecture)

## Consolidation Summary

### Agents Merged/Removed

| Removed Agent | Merged Into | Reason |
|---------------|-------------|--------|
| `general-purpose` | `Explore` | Explore handles all codebase research with thoroughness levels |
| `error-detective` | `debugger` | debugger handles all error investigation |
| `devops-troubleshooter` | `incident-responder` | incident-responder handles all production issues |
| `database-admin` | `supabase-architect` | For this project, all DB work is Supabase |
| `database-optimizer` | `supabase-architect` | Query optimization is part of DB architecture |
| `sql-pro` | `supabase-architect` | SQL expertise included in DB architect |
| `api-documenter` | `docs-architect` | All documentation consolidated |
| `reference-builder` | `docs-architect` | All documentation consolidated |
| `tutorial-engineer` | `docs-architect` | All documentation consolidated |
| `design-review` | `ui-ux-designer` | Design review is part of UX design |
| `ai-sdk-expert` | `ai-engineer` | SDK expertise is part of AI engineering |
| `prompt-engineer` | `ai-engineer` | Prompt engineering is part of AI work |
| `architect-reviewer` | `code-reviewer` | Architecture review is part of code review |
| Project `codebase-pattern-finder` | Global `codebase-pattern-finder` | Duplicate - use global |
| Project `Frontend Designer` | `ui-ux-designer` | Use global for design work |

---
