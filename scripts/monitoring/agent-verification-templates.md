# AGENT VERIFICATION TEMPLATES
## Standardized Checklists for All Agent Types

**Purpose:** Provide verification agents with specific, actionable checklists to ensure thorough and consistent verification across all types of work.

---

## 🧪 TEST VALIDATOR EXPERT

### Verification Checklist: Test-Related Work
```markdown
## VERIFICATION: [Test Implementation/Fix]
**Agent:** test-validator-expert | **Date:** [Timestamp]
**Original Claim:** [Description] | **Todo ID:** [ID]

### Test Execution ✓/✗
- [ ] All existing tests still pass (`npm test`)
- [ ] New tests execute successfully
- [ ] No test flakiness or intermittent failures
- [ ] Test output is clear and informative
- [ ] Performance tests within acceptable limits

### Test Coverage ✓/✗
- [ ] Code coverage meets minimum threshold (>80%)
- [ ] Critical paths are tested
- [ ] Edge cases and error conditions covered
- [ ] Integration points tested
- [ ] No untested code branches in changed areas

### Test Quality ✓/✗
- [ ] Tests are deterministic and reliable
- [ ] Test data is realistic and comprehensive
- [ ] Mocks and fixtures are appropriate
- [ ] Test descriptions are clear and specific
- [ ] Tests follow project conventions

### E2E Testing ✓/✗
- [ ] Browser tests pass (`npm run test:e2e`)
- [ ] User flows complete successfully
- [ ] Cross-browser compatibility verified
- [ ] Mobile responsiveness tested (if applicable)
- [ ] Performance within acceptable limits

### Final Verification: ✅ VERIFIED / ❌ FAILED
**Issues Found:** [List specific problems]
**Required Actions:** [What needs to be fixed]
**Risk Level:** Low/Medium/High
```

---

## 🔍 QA TESTER COMPREHENSIVE  

### Verification Checklist: UI/UX Features
```markdown
## VERIFICATION: [UI/Feature Implementation]
**Agent:** qa-tester-comprehensive | **Date:** [Timestamp]
**Original Claim:** [Description] | **Todo ID:** [ID]

### Browser Testing ✓/✗
- [ ] Feature works correctly in Chrome
- [ ] Feature works correctly in Firefox
- [ ] Feature works correctly in Safari
- [ ] No console errors or warnings
- [ ] Network requests complete successfully

### User Experience ✓/✗
- [ ] User flows are intuitive and complete
- [ ] Error messages are helpful and clear
- [ ] Loading states provide appropriate feedback
- [ ] Forms validate correctly
- [ ] Navigation works as expected

### Responsive Design ✓/✗
- [ ] Desktop layout (1920x1080) ✓
- [ ] Tablet layout (768x1024) ✓
- [ ] Mobile layout (375x667) ✓
- [ ] Text is readable at all sizes
- [ ] Interactive elements are accessible

### Accessibility ✓/✗
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility tested
- [ ] Color contrast meets WCAG standards
- [ ] ARIA labels are appropriate
- [ ] Focus indicators are visible

### Performance ✓/✗
- [ ] Page load time < 3 seconds
- [ ] No memory leaks detected
- [ ] Smooth animations and transitions
- [ ] Large datasets render efficiently
- [ ] Images optimized for web

### Final Verification: ✅ VERIFIED / ❌ FAILED
**Issues Found:** [List specific problems]
**Required Actions:** [What needs to be fixed]
**Risk Level:** Low/Medium/High
```

---

## 📚 DOCS AUDITOR THOROUGH

### Verification Checklist: Documentation
```markdown
## VERIFICATION: [Documentation Work]
**Agent:** docs-auditor-thorough | **Date:** [Timestamp]
**Original Claim:** [Description] | **Todo ID:** [ID]

### Content Accuracy ✓/✗
- [ ] Technical information is correct
- [ ] Code examples execute successfully
- [ ] Screenshots are current and accurate
- [ ] Links work and point to correct resources
- [ ] Version information is up-to-date

### Completeness ✓/✗
- [ ] All required sections are present
- [ ] Examples cover common use cases
- [ ] Edge cases and gotchas documented
- [ ] Prerequisites clearly stated
- [ ] Troubleshooting information included

### Writing Quality ✓/✗
- [ ] Grammar and spelling are correct
- [ ] Technical jargon is explained
- [ ] Tone is appropriate for audience
- [ ] Structure is logical and flows well
- [ ] Formatting is consistent

### Usability ✓/✗
- [ ] Documentation is easy to navigate
- [ ] Search functionality works
- [ ] Table of contents is accurate
- [ ] Cross-references are helpful
- [ ] Mobile viewing experience is good

### Code Examples ✓/✗
- [ ] All code examples are tested
- [ ] Syntax highlighting works correctly
- [ ] Examples follow best practices
- [ ] Copy-paste functionality works
- [ ] Examples are realistic scenarios

### Final Verification: ✅ VERIFIED / ❌ FAILED
**Issues Found:** [List specific problems]  
**Required Actions:** [What needs to be fixed]
**Risk Level:** Low/Medium/High
```

---

## 🔧 CODE REVIEWER STRICT

### Verification Checklist: Code Changes
```markdown
## VERIFICATION: [Code Implementation]
**Agent:** code-reviewer-strict | **Date:** [Timestamp]
**Original Claim:** [Description] | **Todo ID:** [ID]

### Code Quality ✓/✗
- [ ] TypeScript compiles without errors
- [ ] ESLint passes with no warnings
- [ ] Code follows project style guidelines
- [ ] Functions are properly typed
- [ ] Error handling is appropriate

### Security ✓/✗
- [ ] No hardcoded secrets or passwords
- [ ] Input validation is present
- [ ] SQL injection prevention implemented
- [ ] XSS protection in place
- [ ] Authentication/authorization correct

### Performance ✓/✗
- [ ] No obvious performance bottlenecks
- [ ] Database queries optimized
- [ ] Appropriate caching implemented
- [ ] Memory usage is reasonable
- [ ] Bundle size impact acceptable

### Architecture ✓/✗
- [ ] Code follows established patterns
- [ ] Dependencies are appropriate
- [ ] Separation of concerns maintained
- [ ] API design is consistent
- [ ] Reusability considerations addressed

### Testing ✓/✗
- [ ] Unit tests exist for new code
- [ ] Integration tests cover main flows
- [ ] Test coverage is adequate
- [ ] Tests are meaningful and focused
- [ ] Mock objects are realistic

### Final Verification: ✅ VERIFIED / ❌ FAILED
**Issues Found:** [List specific problems]
**Required Actions:** [What needs to be fixed]
**Risk Level:** Low/Medium/High
```

---

## 🌐 API VALIDATOR STRICT

### Verification Checklist: API Implementation
```markdown
## VERIFICATION: [API/Backend Work]
**Agent:** api-validator-strict | **Date:** [Timestamp]
**Original Claim:** [Description] | **Todo ID:** [ID]

### Endpoint Testing ✓/✗
- [ ] All HTTP methods work correctly
- [ ] Request/response formats match schema
- [ ] Status codes are appropriate
- [ ] Error responses are informative
- [ ] Rate limiting functions correctly

### Data Validation ✓/✗
- [ ] Input validation prevents bad data
- [ ] Required fields are enforced
- [ ] Data types are validated
- [ ] Business rules are enforced
- [ ] Sanitization prevents injection attacks

### Database Operations ✓/✗
- [ ] CRUD operations work correctly
- [ ] Transactions maintain data integrity
- [ ] Indexes are optimized
- [ ] Relationships are properly maintained
- [ ] Data migration scripts work

### Authentication & Authorization ✓/✗
- [ ] Authentication mechanisms work
- [ ] User permissions enforced correctly
- [ ] Session management is secure
- [ ] Token expiration handled properly
- [ ] Role-based access control works

### Performance & Scalability ✓/✗
- [ ] Response times are acceptable
- [ ] Concurrent requests handled properly
- [ ] Database connection pooling works
- [ ] Caching strategies implemented
- [ ] Error recovery mechanisms present

### Final Verification: ✅ VERIFIED / ❌ FAILED
**Issues Found:** [List specific problems]
**Required Actions:** [What needs to be fixed]
**Risk Level:** Low/Medium/High
```

---

## 🛡️ SECURITY AUDITOR

### Verification Checklist: Security-Related Work
```markdown
## VERIFICATION: [Security Implementation]
**Agent:** security-auditor | **Date:** [Timestamp]
**Original Claim:** [Description] | **Todo ID:** [ID]

### Authentication Security ✓/✗
- [ ] Password policies enforced
- [ ] Multi-factor authentication works
- [ ] Session management is secure
- [ ] Account lockout mechanisms present
- [ ] Password recovery is secure

### Data Protection ✓/✗
- [ ] Sensitive data is encrypted
- [ ] PII handling follows regulations
- [ ] Database access is restricted
- [ ] Data transmission is encrypted
- [ ] Backup data is protected

### Input Validation ✓/✗
- [ ] SQL injection prevention works
- [ ] XSS protection implemented
- [ ] CSRF tokens validated
- [ ] File upload restrictions enforced
- [ ] API input sanitization present

### Infrastructure Security ✓/✗
- [ ] HTTPS/TLS configured correctly
- [ ] Security headers implemented
- [ ] Access controls properly configured
- [ ] Logging captures security events
- [ ] Error messages don't leak info

### Compliance ✓/✗
- [ ] GDPR requirements met (if applicable)
- [ ] Industry standards followed
- [ ] Audit trails maintained
- [ ] Data retention policies enforced
- [ ] Third-party integrations secure

### Final Verification: ✅ VERIFIED / ❌ FAILED
**Issues Found:** [List specific problems]
**Required Actions:** [What needs to be fixed]
**Risk Level:** Low/Medium/High
```

---

## 🎨 DESIGN SYSTEM AUDITOR

### Verification Checklist: UI/Design System Work
```markdown
## VERIFICATION: [Design System Work]
**Agent:** design-system-auditor | **Date:** [Timestamp]
**Original Claim:** [Description] | **Todo ID:** [ID]

### Design Consistency ✓/✗
- [ ] Components follow design system
- [ ] Colors match brand guidelines
- [ ] Typography is consistent
- [ ] Spacing follows grid system
- [ ] Icons are consistent style

### Component Quality ✓/✗
- [ ] Component is reusable
- [ ] Props API is well-designed
- [ ] Component handles edge cases
- [ ] Error states are designed
- [ ] Loading states are present

### Accessibility ✓/✗
- [ ] Color contrast meets standards
- [ ] Keyboard navigation works
- [ ] Screen reader support present
- [ ] Focus management appropriate
- [ ] ARIA labels correct

### Responsive Behavior ✓/✗
- [ ] Works on mobile devices
- [ ] Tablet layout is appropriate
- [ ] Desktop experience optimized
- [ ] Breakpoints handled correctly
- [ ] Touch targets adequate size

### Documentation ✓/✗
- [ ] Component usage documented
- [ ] Props API documented
- [ ] Examples provided
- [ ] Storybook stories present
- [ ] Design rationale explained

### Final Verification: ✅ VERIFIED / ❌ FAILED
**Issues Found:** [List specific problems]
**Required Actions:** [What needs to be fixed]
**Risk Level:** Low/Medium/High
```

---

## 📊 USAGE INSTRUCTIONS

### For Verification Agents
1. **Select appropriate template** based on work type
2. **Copy template** to PROJECT_MONITORING.md under verification section
3. **Work through checklist** systematically
4. **Document findings** with specific details
5. **Update todo status** if verification fails
6. **Log completion** in activity log

### For Monitoring System
- Templates automatically loaded based on agent type
- Verification results tracked in PROJECT_MONITORING.md
- Failed verifications trigger remediation workflow
- Completed verifications update system statistics

### Customization
- Add project-specific checks as needed
- Adjust risk levels based on project requirements
- Include domain-specific validation steps
- Update templates based on lessons learned

---

*These templates ensure consistent, thorough verification across all agent types and work categories.*