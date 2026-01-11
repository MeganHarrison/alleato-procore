# Sub-Agents Index

**Last Updated:** 2026-01-10

This document catalogs all available sub-agents (both user-level and project-specific) for the Alleato-Procore system.

---

## 🚀 Quick Start: Feature Implementation

**Start implementing a feature with a single command:**
```bash
/implement-feature <feature-name>
```

**Examples:**
```bash
/implement-feature direct-costs
/implement-feature commitments --phase implement
/implement-feature rfis
```

**What it does:**
1. Validates prerequisites (feature directory, crawl data)
2. Reads shared workflow from `.agents/workflows/feature-implementation.md`
3. Auto-detects current phase from `STATUS.md`
4. Executes appropriate sub-agents for current phase
5. Coordinates parallel sessions via lock files

**Related Files:**
- Shared workflow: `.agents/workflows/feature-implementation.md`
- Feature context template: `.agents/templates/feature-context.md`
- Feature status template: `.agents/templates/feature-status.md`

---

## 📋 How to Use This Index

**Spawning a Sub-Agent:**
```typescript
Task({
  subagent_type: "agent-name",
  prompt: "Specific task description with context",
  description: "Short 3-5 word summary"
})
```

**When to Use Sub-Agents:**
- Complex tasks requiring 3+ steps
- Tasks modifying 5+ files
- When context is getting long/degraded
- When different expertise is needed
- For independent verification

---

## 🧪 Testing & Verification

| Sub-Agent | Description | When to Use | Additional Notes |
|-----------|-------------|-------------|------------------|
| **test-automator** | Create comprehensive test suites (unit, integration, e2e) | **🚨 MANDATORY** after feature implementation. **ALL testing** - unit, integration, Playwright/browser tests | **For Playwright:** Use with `.agents/agents/playwright-tester.md` prompt template (Supabase auth, context-7 MCP). **🚨 CRITICAL:** If reference screenshots exist in `scripts/screenshot-capture/`, MUST compare implementation and create COMPARISON-REPORT.md. Sets up CI pipelines, mocking, test data. **Required before claiming "complete"** |
| **debugger** | Debug errors, test failures, unexpected behavior | When tests fail, bugs occur, or unexpected behavior appears | Use proactively when encountering issues |
| **design-review** | UI/UX review with Playwright for interaction testing | PR reviews for UI changes; responsive design verification; accessibility checks | Requires live preview environment |
| **code-reviewer** | Expert code review for quality, security, maintainability | **🚨 MANDATORY** after ANY implementation, non-trivial fixes, or 3+ file changes | Reviews for SOLID principles, security vulnerabilities. **Required before claiming "complete"**. Skip only for docs/typos. |
| **architect-reviewer** | Reviews code for architectural consistency and patterns | After structural changes, new services, or API modifications | Ensures proper layering and maintainability |
| **security-auditor** | Review code for vulnerabilities, implement secure auth | Security reviews, auth flows, vulnerability fixes | Handles OWASP compliance, JWT, OAuth2 |

---

## 💻 Development & Implementation

| Sub-Agent | Description | When to Use | Additional Notes |
|-----------|-------------|-------------|------------------|
| **frontend-developer** | Build React components, responsive layouts, client-side state | Creating UI components, fixing frontend issues | Optimizes performance, ensures a11y |
| **backend-architect** | Design RESTful APIs, microservices, database schemas | Creating new backend services or APIs | Reviews for scalability and performance |
| **typescript-pro** | Advanced TypeScript types, generics, strict type safety | Complex type systems, decorators, enterprise patterns | For TypeScript architecture optimization |
| **python-pro** | Idiomatic Python with decorators, generators, async/await | Python refactoring, optimization, complex features | Implements design patterns, testing |
| **php-pro** | Modern PHP with generators, iterators, SPL structures | High-performance PHP applications | Uses OOP features, idiomatic patterns |
| **elixir-pro** | Elixir with OTP patterns, supervision trees, Phoenix LiveView | Elixir refactoring, OTP design, BEAM optimizations | Masters concurrency and fault tolerance |
| **mobile-developer** | React Native or Flutter apps with native integrations | Mobile features, cross-platform code, app optimization | Handles offline sync, push notifications |
| **ios-developer** | Native iOS with Swift/SwiftUI | iOS-specific features, App Store optimization | Masters UIKit/SwiftUI, Core Data |
| **unity-developer** | Unity games with optimized C# scripts | Unity performance issues, game mechanics, cross-platform | Handles rendering, asset management |

---

## 🗄️ Database & Backend

| Sub-Agent | Description | When to Use | Additional Notes |
|-----------|-------------|-------------|------------------|
| **supabase-architect** | Supabase expert: DB architecture, RLS policies, migrations, type generation | **🚨 MANDATORY** for RLS policies, migrations, 3+ table changes, complex queries, realtime setup | Has Alleato-Procore schema knowledge. Skip only for single-table reads. See DATABASE gate in CLAUDE.md. |
| **database-admin** | Manage DB operations, backups, replication, monitoring | Database setup, operational issues, recovery procedures | Handles permissions, maintenance, disaster recovery |
| **database-optimizer** | Optimize SQL queries, design indexes, handle migrations | Database performance issues, schema optimization | Solves N+1 problems, implements caching |
| **sql-pro** | Complex SQL queries, optimize execution plans, schema design | Query optimization, complex joins, database design | Masters CTEs, window functions, stored procedures |
| **graphql-architect** | Design GraphQL schemas, resolvers, federation | GraphQL API design or performance issues | Optimizes queries, solves N+1, implements subscriptions |

---

## 🎨 Design & UI/UX

| Sub-Agent | Description | When to Use | Additional Notes |
|-----------|-------------|-------------|------------------|
| **ui-ux-designer** | Create interface designs, wireframes, design systems | Design systems, user flows, interface optimization | Masters user research, prototyping, a11y |
| **design-system-auditor** | **PROJECT-SPECIFIC** Enforce Alleato design system rules | **🚨 MANDATORY** before committing ANY UI changes; during PR reviews | Blocks code violating design system. **Required before claiming UI work "complete"**. See `.agents/agents/design-system-auditor.md` |
| **component-system-consistency-subagent** | **PROJECT-SPECIFIC** Ensure consistent component usage across modules | Refactoring pages; eliminating inline styles; table standardization | Audits for `style={{}}`, raw `<table>`, arbitrary Tailwind values. See `.agents/agents/component-system-consistency-subagent.md` |
| **page-title-compliance-subagent** | **PROJECT-SPECIFIC** Ensure all pages use `useProjectTitle` hook | Rolling out page title updates; verifying browser tab titles | Targets routes under `[projectId]/**`. See `.agents/agents/page-title-compliance-subagent.md` |
| **breadcrumb-experience-subagent** | **PROJECT-SPECIFIC** Deliver consistent breadcrumb navigation | Implementing/fixing breadcrumbs; mobile breadcrumb UX | Ensures clickable breadcrumbs, truncation, mobile sheets. See `.agents/agents/breadcrumb-experience-subagent.md` |

---

## 📚 Documentation & Content

| Sub-Agent | Description | When to Use | Additional Notes |
|-----------|-------------|-------------|------------------|
| **docs-architect** | Create comprehensive technical documentation from codebases | System documentation, architecture guides, technical deep-dives | Analyzes architecture and design patterns |
| **api-documenter** | Create OpenAPI/Swagger specs, generate SDKs, write dev docs | API documentation, client library generation | Handles versioning, examples, interactive docs |
| **reference-builder** | Create exhaustive technical references and API docs | API docs, configuration references, technical specifications | Generates comprehensive parameter listings |
| **tutorial-engineer** | Create step-by-step tutorials from code | Onboarding guides, feature tutorials, concept explanations | Transforms complex concepts into learning experiences |
| **content-marketer** | Write blog posts, social media, email newsletters | Marketing content, social media posts | Optimizes for SEO, creates content calendars |
| **mermaid-expert** | Create Mermaid diagrams (flowcharts, ERDs, sequences) | Visual documentation, system diagrams, process flows | Masters all diagram types and styling |

---

## 🚀 DevOps & Infrastructure

| Sub-Agent | Description | When to Use | Additional Notes |
|-----------|-------------|-------------|------------------|
| **deployment-engineer** | Configure CI/CD, Docker containers, cloud deployments | Setting up deployments, containers, CI/CD workflows | Handles GitHub Actions, Kubernetes, IaC automation |
| **devops-troubleshooter** | Debug production issues, analyze logs, fix deployment failures | Production debugging, system outages | Masters monitoring, incident response, root cause analysis |
| **incident-responder** | Handle production incidents with urgency and precision | **IMMEDIATELY** when production issues occur | Coordinates debugging, implements fixes, documents post-mortems |
| **cloud-architect** | Design AWS/Azure/GCP infrastructure, Terraform IaC | Cloud infrastructure, cost optimization, migration planning | Handles auto-scaling, multi-region, serverless |
| **network-engineer** | Debug network connectivity, configure load balancers | Connectivity issues, network optimization, protocol debugging | Handles DNS, SSL/TLS, CDN setup |
| **cost-optimize** | Cloud cost optimization | Reducing cloud spend, analyzing billing | Identifies waste, right-sizing resources |

---

## 🤖 AI & Machine Learning

| Sub-Agent | Description | When to Use | Additional Notes |
|-----------|-------------|-------------|------------------|
| **ai-engineer** | Build LLM applications, RAG systems, prompt pipelines | LLM features, chatbots, AI-powered applications | Implements vector search, agent orchestration |
| **ai-sdk-expert** | Expert AI SDK architect (Vercel AI SDK) | **ANY** AI SDK-related task, question, implementation | Masters streaming, RSC, tool calling, providers, agents |
| **ml-engineer** | Implement ML pipelines, model serving, feature engineering | ML model integration, production deployment | Handles TensorFlow/PyTorch, A/B testing, monitoring |
| **prompt-engineer** | Optimize prompts for LLMs and AI systems | Building AI features, improving agent performance | Expert in prompt patterns and techniques |

---

## 🔍 Analysis & Exploration

| Sub-Agent | Description | When to Use | Additional Notes |
|-----------|-------------|-------------|------------------|
| **Explore** | Fast codebase exploration specialist | **🚨 MANDATORY** before making ANY statement about codebase structure without evidence. Finding files by patterns, searching code, answering codebase questions | Specify thoroughness: "quick", "medium", "very thorough". **Required before "I'll create X at path..."** See CODEBASE ASSUMPTIONS gate. |
| **Plan** | Software architect for designing implementation plans | Planning implementation strategy for tasks | Returns step-by-step plans, identifies critical files |
| **general-purpose** | Multi-step tasks, searching for code, complex questions | When not confident you'll find match in first tries | Has access to all tools |
| **codebase-pattern-finder** | Find similar implementations, usage examples, existing patterns | Need concrete code examples based on search criteria | Gives code details, not just file locations |
| **search-specialist** | Expert web researcher using advanced search techniques | Deep research, information gathering, trend analysis | Masters search operators, multi-source verification |
| **error-detective** | Search logs/codebases for error patterns and anomalies | Debugging issues, analyzing logs, investigating production errors | Correlates errors across systems |
| **business-analyst** | Analyze metrics, create reports, track KPIs | Business metrics, investor updates | Builds dashboards, revenue models, growth projections |

---

## 🏗️ Specialized Domains

| Sub-Agent | Description | When to Use | Additional Notes |
|-----------|-------------|-------------|------------------|
| **data-scientist** | SQL queries, BigQuery operations, data insights | Data analysis tasks and queries | Use proactively for data analysis |
| **data-engineer** | Build ETL pipelines, data warehouses, streaming architectures | Data pipeline design, analytics infrastructure | Implements Spark jobs, Airflow DAGs, Kafka streams |
| **payment-integration** | Integrate Stripe, PayPal, payment processors | Implementing payments, billing, subscription features | Handles checkout flows, webhooks, PCI compliance |
| **quant-analyst** | Financial models, backtest trading strategies, analyze market data | Quantitative finance, trading algorithms, risk analysis | Implements risk metrics, portfolio optimization |
| **risk-manager** | Monitor portfolio risk, R-multiples, position limits | Risk assessment, trade tracking, portfolio protection | Creates hedging strategies, calculates expectancy |
| **customer-support** | Handle support tickets, FAQ responses, customer emails | Customer inquiries, support documentation | Creates help docs, troubleshooting guides |
| **sales-automator** | Draft cold emails, follow-ups, proposal templates | Sales outreach, lead nurturing | Creates pricing pages, case studies, sales scripts |
| **legal-advisor** | Draft privacy policies, terms of service, disclaimers | Legal documentation, compliance texts, regulatory requirements | Creates GDPR-compliant texts, cookie policies |

---

## 🔧 Maintenance & Optimization

| Sub-Agent | Description | When to Use | Additional Notes |
|-----------|-------------|-------------|------------------|
| **legacy-modernizer** | Refactor legacy code, migrate frameworks | Legacy system updates, framework migrations, technical debt | Handles backward compatibility |
| **performance-engineer** | Profile apps, optimize bottlenecks, implement caching | Performance issues, optimization tasks | Handles load testing, CDN setup, query optimization |
| **dx-optimizer** | Improve developer experience, tooling, workflows | Setting up new projects, after team feedback, workflow friction | Use proactively to improve DX |

---

## 🎯 Project-Specific Agents (Alleato-Procore)

**Note:** For Playwright testing, use `test-automator` with the `.agents/agents/playwright-tester.md` prompt template (see Testing & Verification section above).

| Sub-Agent | Description | When to Use | Additional Notes |
|-----------|-------------|-------------|------------------|
| **design-system-auditor** | Enforce Alleato design system rules strictly | Before committing UI changes; during PR reviews | Blocks code violating design system. See `.agents/agents/design-system-auditor.md` |
| **component-system-consistency-subagent** | Ensure consistent component usage across modules | Refactoring pages; eliminating inline styles; standardizing tables | Audits for inline styles, raw tables, arbitrary Tailwind. See `.agents/agents/component-system-consistency-subagent.md` |
| **page-title-compliance-subagent** | Ensure all pages use `useProjectTitle` hook correctly | Rolling out page title updates; verifying browser tab titles | Targets `[projectId]/**` routes. See `.agents/agents/page-title-compliance-subagent.md` |
| **breadcrumb-experience-subagent** | Deliver consistent breadcrumb navigation experience | Implementing/fixing breadcrumbs; mobile breadcrumb UX | Ensures clickable breadcrumbs, truncation, mobile responsive. See `.agents/agents/breadcrumb-experience-subagent.md` |
| **project-context-resilience-subagent** | Guarantee correct `projectId` context (URL or query param) | Hardening context provider; fixing project context bugs | Centralizes project resolution logic. See `.agents/agents/project-context-resilience-subagent.md` |
| **feature-crawler** | Automated Procore feature crawling with screenshots, DOM analysis | Researching Procore features for implementation planning | Produces implementation-ready blueprints. See `.agents/agents/feature-crawler.md` |
| **PROJECT-MANAGER-AGENT** | Planning-only agent that converts brain dumps into structured plans | Complex multi-agent workflows requiring coordination | Creates PLANS_DOC.md from initiate_project.md. See `.agents/agents/PROJECT-MANAGER-AGENT.md` |

---

## 🛠️ Utility Agents

| Sub-Agent | Description | When to Use | Additional Notes |
|-----------|-------------|-------------|------------------|
| **Bash** | Command execution specialist for running bash commands | Git operations, command execution, terminal tasks | Not for file operations - use specialized tools |
| **statusline-setup** | Configure Claude Code status line setting | Configuring status line | Has Read and Edit tools |
| **claude-code-guide** | Answer questions about Claude Code CLI, Agent SDK, API | Questions about Claude features, capabilities, usage | Check for running instance before spawning new one |
| **context-manager** | Manage context across agents and long-running tasks | Coordinating complex multi-agent workflows; projects >10k tokens | **MUST BE USED** for large projects |

---

## 📊 Usage Statistics

| Category | Count |
|----------|-------|
| User-Level Sub-Agents | 60+ |
| Project-Specific Sub-Agents | 7 |
| Specialized Prompt Templates | 1 (playwright-tester.md) |
| Total Sub-Agents | 67+ |

---

## 🔗 Related Documentation

- **CLAUDE.md** - Main project instructions
- **`.agents/docs/playwright/PLAYWRIGHT-PATTERNS.md`** - Playwright testing patterns
- **`.agents/rules/PLAYWRIGHT-GATE.md`** - Playwright execution gate
- **`.agents/rules/SUPABASE-GATE.md`** - Supabase database gate
- **`.agents/PLANS.md`** - PlansDoc structure and guidance

---

## 📝 Notes

### Key Project-Specific Patterns

1. **Always use `supabase-architect`** for ANY database work
2. **Always use `test-automator`** for ALL testing
   - For Playwright: Use with `.agents/agents/playwright-tester.md` prompt template
   - For unit/integration: Use with generic prompt
3. **Use design system agents** before committing UI changes
4. **Spawn verification agents** for independent testing after implementation

### Common Mistakes to Avoid

❌ Running ANY tests directly (use `test-automator` sub-agent - **MANDATORY**)
❌ Thinking `playwright-tester` is a separate agent (it's a prompt template)
❌ Making database changes without `supabase-architect` (**MANDATORY** for complex work)
❌ Committing UI without `design-system-auditor` review (**MANDATORY**)
❌ Writing code without spawning `code-reviewer` afterward (**MANDATORY**)
❌ Making assumptions about codebase without `Explore` (**MANDATORY**)
❌ Claiming "complete" without verification evidence

### Best Practices

✅ **Check MANDATORY requirements** before claiming complete (see CLAUDE.md)
✅ Spawn verification agents for complex tasks
✅ Use specialized agents for their domain expertise
✅ Run agents in parallel when tasks are independent
✅ Provide detailed context in prompts
✅ Trust agent outputs (they have specialized knowledge)
✅ Always run quality checks (`npm run quality --prefix frontend`)
✅ Document verification evidence in task logs

---

**Last Updated:** 2026-01-10
**Maintained By:** Project team
**Version:** 1.0.0
