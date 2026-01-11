# Form Test Migration Log

**Date:** 2026-01-08
**Purpose:** Consolidate form tests to single source of truth
**Status:** Ready for migration

## Overview

This document tracks the migration of existing form tests to the new standardized form testing infrastructure. The goal is to eliminate duplicate test code and establish a single source of truth for all form testing.

## Migration Strategy

### Phase 1: Analysis (Complete ✅)

Identified existing form tests:
1. `tests/e2e/commitment-forms.spec.ts`
2. `tests/e2e/purchase-order-form-comprehensive.spec.ts`
3. `tests/e2e/subcontract-form-comprehensive.spec.ts`
4. `tests/e2e/form-commitments-company-dropdown.spec.ts`
5. `tests/e2e/contract-form-visual.spec.ts` (visual-specific, may keep separate)

### Phase 2: Extract & Configure (Pending)

For each test file:
1. Extract test data and field configurations
2. Add configuration to `tests/config/form-test-configs.ts`
3. Verify configuration matches existing test behavior
4. Document any special cases or edge cases

### Phase 3: Validate (Pending)

1. Run new comprehensive test for each migrated form
2. Compare results with old test
3. Ensure no loss of coverage
4. Verify database cleanup works correctly

### Phase 4: Archive (Pending)

1. Create `tests/archive/` directory
2. Move old test files to archive
3. Create README in archive explaining migration
4. Keep files for reference (don't delete)

### Phase 5: Documentation (Pending)

1. Update test documentation
2. Add migration notes to README
3. Document any behavior changes
4. Update CI/CD to use new tests

## Files to Migrate

### 1. commitment-forms.spec.ts

**Status:** Pending
**Lines of Code:** ~150
**Test Coverage:**
- Commitment form loading
- Field validation
- Form submission
- Company dropdown interaction

**Migration Plan:**
- Extract to `formConfigs` array
- Add commitment-specific field configurations
- Use helper utilities for dropdown testing
- Add database cleanup hooks

**Special Considerations:**
- Dynamic commitment types
- Company selection workflow
- SOV (Schedule of Values) line items

### 2. purchase-order-form-comprehensive.spec.ts

**Status:** Pending
**Lines of Code:** ~100+
**Test Coverage:**
- PO form loading
- Comprehensive field validation
- Line item management
- Submission workflow

**Migration Plan:**
- Add PO configuration to `formConfigs`
- Use `testFormComprehensively()` helper
- Leverage existing line item testing patterns
- Add cleanup for created PO records

**Special Considerations:**
- Multiple line items
- Auto-calculations
- Vendor selection

### 3. subcontract-form-comprehensive.spec.ts

**Status:** Pending
**Lines of Code:** ~150
**Test Coverage:**
- Subcontract form loading
- Field validation
- Subcontractor selection
- Scope of work entry
- Amount calculations

**Migration Plan:**
- Add subcontract configuration
- Use standard form testing helpers
- Maintain calculation verification
- Add database cleanup

**Special Considerations:**
- Subcontractor lookup
- Multi-field calculations
- Payment terms

### 4. form-commitments-company-dropdown.spec.ts

**Status:** Pending
**Lines of Code:** ~100
**Test Coverage:**
- Company dropdown functionality
- Search and filter
- Selection behavior
- Form integration

**Migration Plan:**
- Integrate into commitment form config
- Use `combobox` field type
- Test via `fillForm()` helper
- Verify dropdown behavior in comprehensive test

**Special Considerations:**
- Async dropdown loading
- Search/filter functionality
- Empty state handling

### 5. contract-form-visual.spec.ts

**Status:** Review Required
**Lines of Code:** ~80
**Test Coverage:**
- Visual regression testing
- Screenshot comparisons
- Layout verification

**Migration Plan:**
- **Decision:** Keep separate as visual-specific test
- Visual tests have different purpose (screenshot comparison)
- Not appropriate for functional test migration
- Add note in README about visual test separation

**Special Considerations:**
- Uses different Playwright config (visual)
- Screenshot baseline comparisons
- Different assertion patterns

## Migration Template

For each test being migrated:

```markdown
### [Form Name] - Migration

**Date:** [migration date]
**Original File:** [path to old test]
**Status:** [Pending | In Progress | Complete | Archived]

#### Configuration Added

```typescript
{
  name: '[Form Name]',
  route: '[route]',
  isModal: false,
  priority: 'high',
  authRequired: true,
  submitButtonText: /[pattern]/i,
  successIndicator: /[pattern]/i,
  screenshotPrefix: '[prefix]',
  requiredFields: [
    // ... field configs
  ]
}
```

#### Test Coverage Comparison

| Test Type | Old Test | New Test | Status |
|-----------|----------|----------|--------|
| Load | ✅ | ✅ | ✅ Equivalent |
| Validation | ✅ | ✅ | ✅ Equivalent |
| Submission | ✅ | ✅ | ✅ Equivalent |
| Accessibility | ❌ | ✅ | ✅ Improved |
| Cleanup | ❌ | ✅ | ✅ Added |

#### Notes
- [Any special notes about migration]
- [Behavior changes]
- [Improvements made]

#### Validation Results
- [ ] New test passes
- [ ] Coverage equivalent or better
- [ ] No regressions
- [ ] Cleanup verified

#### Archive Location
`tests/archive/[original-filename]`
```

## Benefits of Migration

### Before (Duplicate Tests)
- ❌ 4-5 separate test files with similar patterns
- ❌ ~500 lines of duplicate test code
- ❌ Manual field filling in each test
- ❌ No database cleanup
- ❌ Inconsistent test patterns
- ❌ Hard to maintain as forms change

### After (Single Source of Truth)
- ✅ Single comprehensive test file
- ✅ Reusable helper utilities
- ✅ Centralized form configurations
- ✅ Automatic database cleanup
- ✅ Consistent test patterns
- ✅ Easy to add new forms
- ✅ Better accessibility testing
- ✅ Evidence-based (screenshots)

## Code Reduction

| File | Before (LOC) | After (LOC) | Reduction |
|------|--------------|-------------|-----------|
| commitment-forms.spec.ts | 150 | 0 (config: 20) | -87% |
| purchase-order-form-comprehensive.spec.ts | 100 | 0 (config: 15) | -85% |
| subcontract-form-comprehensive.spec.ts | 150 | 0 (config: 20) | -87% |
| form-commitments-company-dropdown.spec.ts | 100 | 0 (merged) | -100% |
| **Total** | **500** | **~55** | **-89%** |

## Timeline

- **Phase 1 (Analysis):** Complete ✅
- **Phase 2 (Extract & Configure):** Not started
- **Phase 3 (Validate):** Not started
- **Phase 4 (Archive):** Not started
- **Phase 5 (Documentation):** Not started

**Estimated Time:** 2-3 hours for complete migration

## Testing Checklist

Before archiving each old test:

- [ ] Configuration added to `form-test-configs.ts`
- [ ] New test passes all scenarios
- [ ] Coverage verified (no regressions)
- [ ] Database cleanup works
- [ ] Screenshots captured
- [ ] Special cases documented
- [ ] Old test archived with README

## Post-Migration Verification

After all migrations complete:

1. Run full test suite: `npm run test:forms`
2. Verify all forms pass
3. Check database cleanup (no orphaned data)
4. Review test duration (should be faster)
5. Confirm CI/CD integration works
6. Update team documentation

## Rollback Plan

If migration causes issues:

1. Tests are in `tests/archive/` (not deleted)
2. Can restore by moving back to `tests/e2e/`
3. Remove new configurations from `form-test-configs.ts`
4. Document reason for rollback
5. Address issues before retry

## Questions & Decisions

### Q: Should we delete old tests after migration?
**A:** No. Archive them for reference. Delete only after 30+ days of stable new tests.

### Q: What if old test has special logic not in new system?
**A:** Document in migration notes. Either:
1. Add special handling to form config
2. Keep old test for that specific case
3. Create new helper utility if pattern is reusable

### Q: How to handle visual regression tests?
**A:** Keep visual tests separate. They have different purpose and use different config.

## Contact

For questions about migration:
- Review FORM_INVENTORY.md for form catalog
- Review test helpers in `tests/helpers/`
- Check form configs in `tests/config/form-test-configs.ts`

---

**Last Updated:** 2026-01-08
**Next Review:** After first form migration complete
