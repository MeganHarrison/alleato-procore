# Layout Component Verification Checklist

## Purpose
This checklist ensures all layout components follow best practices and provide consistent spacing, padding, and responsive behavior.

## Layout Requirements Checklist

### 1. Spacing System Integration ✓
- [ ] Layout uses AppLayout base component
- [ ] Correct spacing profile is selected (dashboard, table, form, docs, executive)
- [ ] CSS variables are properly injected
- [ ] Children can access spacing variables

### 2. Padding & Margins ✓
- [ ] Account for parent container padding (main has px-4 sm:px-6 lg:px-8)
- [ ] Layout doesn't double-pad (avoid padding on top of parent padding)
- [ ] Executive/full-width layouts use negative margins if needed
- [ ] Responsive padding scales appropriately

### 3. Max Width Behavior ✓
- [ ] Default maxWidth is appropriate for the layout type
- [ ] maxWidth prop can be overridden when needed
- [ ] Content doesn't stretch too wide on large screens
- [ ] Centered layouts use mx-auto

### 4. Content Structure ✓
- [ ] Main content wrapper uses proper spacing classes
- [ ] Section gaps use CSS variables (space-y-[var(--section-gap)])
- [ ] Card/widget spacing is consistent
- [ ] No hardcoded spacing values

### 5. Responsive Design ✓
- [ ] Layout works on mobile (test at 375px)
- [ ] Layout works on tablet (test at 768px)
- [ ] Layout works on desktop (test at 1440px)
- [ ] Layout works on large screens (test at 1920px)

### 6. Edge Cases ✓
- [ ] Empty state rendering
- [ ] Loading state rendering
- [ ] Overflow behavior
- [ ] Sidebar interaction (collapsed/expanded)

## Verification Process

1. **Visual Check**
   - Open page in browser
   - Check spacing from all edges
   - Toggle sidebar open/closed
   - Resize window to test responsive behavior

2. **Code Review**
   - Verify no hardcoded spacing values
   - Check CSS variable usage
   - Ensure proper className merging with cn()

3. **Cross-Browser Testing**
   - Test in Chrome
   - Test in Firefox
   - Test in Safari (if available)

## Known Issues to Avoid

1. **Double Padding**: Parent containers already have padding, don't add more unless intentional
2. **Missing Variables**: Always use CSS variables for spacing, not hardcoded values
3. **Sidebar Overlap**: Ensure content adjusts when sidebar expands/collapses
4. **Max Width**: Most layouts should have reasonable max-width constraints

## Layout-Specific Notes

### TableLayout
- Should be compact with minimal page padding
- Dense information display
- Focuses on data visibility

### DashboardLayout  
- Balanced spacing for widgets
- Good visual hierarchy
- Supports card-based layouts

### FormLayout
- Generous spacing for form fields
- Clear visual groups
- Accessibility-friendly spacing

### ExecutiveLayout
- Minimal side padding for full-width display
- Maintains section/card spacing
- Uses negative margins to counter parent padding

## Testing Commands

```bash
# Run type checking
npm run typecheck

# Check for console errors
# Open browser console and look for errors

# Test responsive
# Use browser dev tools responsive mode
```