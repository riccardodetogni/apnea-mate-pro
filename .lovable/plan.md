
# Make links clickable in chat bubbles

## Problem
Message content is rendered as plain text (`{message.content}`), so URLs are not clickable.

## Solution
Add a helper function `linkify` that detects URLs in message text and wraps them in `<a>` tags with `target="_blank"` and `rel="noopener noreferrer"`.

### Changes: `src/components/chat/ChatBubble.tsx`

1. Add a `linkify(text: string)` function that splits the text by URL regex, returning an array of strings and `<a>` elements
2. Replace `{message.content}` on lines 16 and 32 with `{linkify(message.content)}`
3. Style links with underline and appropriate colors (e.g. `underline break-all` for both sent/received bubbles)

The URL regex: `/https?:\/\/[^\s]+/g`

Single file change, straightforward.
