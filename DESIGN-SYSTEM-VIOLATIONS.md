# Design System Violation Log

## Purpose

This file tracks all design system violations detected by the Design System Auditor subagent.

**Rules:**
- Never delete entries
- Always append new audits with timestamps
- Violations are categorized as: 🚨 BLOCKER, ⚠️ MAJOR, ℹ️ MINOR
- Each violation must include: File, Description, Rule Violated, Required Action

---

## Violation Severity Definitions

### 🚨 BLOCKER
Violations that must be fixed before merge. These break fundamental design system rules and will cause inconsistency, maintenance issues, or visual degradation.

**Examples:**
- Inline styles in pages/components
- Hardcoded colors (hex values, arbitrary Tailwind)
- Raw HTML elements where components exist
- Missing required layout primitives

### ⚠️ MAJOR
Violations that should be fixed within the current sprint. These indicate incorrect patterns or misuse of the design system.

**Examples:**
- Inconsistent spacing patterns
- Wrong component usage
- Token misuse
- Manual margins instead of Stack/Inline

### ℹ️ MINOR
Violations that can be addressed in tech debt backlog. These are polish issues or documentation gaps.

**Examples:**
- Naming inconsistencies
- Missing TypeScript types
- Documentation gaps
- Console.log usage

---

## Audit History

_Audits will be appended below in reverse chronological order (newest first)._

---
