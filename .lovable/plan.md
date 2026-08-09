# Fix: chat send button off-screen on some Android phones

## What's happening
The chat screen sizes itself to `100dvh`. On some Android browsers/WebViews the dynamic viewport unit isn't reliable (older Chrome/WebView, or the on-screen keyboard resizing the page instead of the viewport). Result: the composer row — and with it the round send button — is pushed below the visible area, so the button appears cut off or off-screen. iPhone and desktop don't hit this because they handle `dvh`/keyboard resize differently.

## Fix
1. Make the chat page height resilient instead of relying only on `dvh`:
   - Fallback chain `100vh` → `100dvh`, plus a JS-driven height synced to `window.visualViewport` height when available, so the layout shrinks exactly to the space left by the keyboard.
   - Small reusable hook (`useViewportHeight`) so other full-height screens can use it later.
2. Keep the composer visibly anchored:
   - Ensure the messages list is the only scrollable area and the composer never scrolls out of view.
   - Scroll the thread to the bottom when the keyboard opens/closes (viewport resize).
3. Harden the composer row itself:
   - Guarantee the send button always keeps its 40x40 footprint (`shrink-0`, `flex-none`) and the textarea can shrink (`min-w-0`), so a long word or wide placeholder can never push the button past the right edge.
   - Cap textarea growth so a long message can't grow the row taller than the available space.

## Technical notes
- Files: `src/pages/ChatThread.tsx`, `src/components/chat/ChatInput.tsx`, new `src/hooks/useViewportHeight.ts`.
- No backend changes, no behavioural change to sending messages.
- Verification: Playwright run at small Android-like viewports (360x640, 320x568) plus a simulated reduced visual viewport, checking the send button's bounding box stays inside the screen.
