

# Add language toggle to Auth page

Add a small IT/EN toggle button to the login/registration page so users can switch language before signing up.

## Changes

### `src/pages/Auth.tsx`
- Import `useLanguage` from `@/contexts/LanguageContext`
- Add a small `IT | EN` toggle button in the top-right corner of the page (absolute positioned)
- Toggle calls `setLanguage("it")` or `setLanguage("en")`
- Style: subtle, pill-shaped, matching existing theme

This is a single-file change. All `t()` calls in Auth.tsx already exist, so switching language will immediately update all visible strings.

