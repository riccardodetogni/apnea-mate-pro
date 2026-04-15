

# Fix bottom navigation overflow on small screens

## Problem
The bottom nav uses `gap-10` (40px) between 5 items with `px-5` padding. On iPhone 13 (390px wide), this totals more than the screen width, cutting off the Training tab.

## Solution
Replace the fixed `gap-10` with responsive spacing that adapts to screen width.

### `src/index.css` — `.bottom-nav-inner`
- Change `gap-10` to `gap-5` (20px) — sufficient spacing for 5 items on 375px+ screens
- Alternatively use `justify-between` with a `min-w` or `w-full max-w-md` approach

The simplest fix: reduce gap from `gap-10` to `gap-6` and add `max-w-[calc(100vw-32px)]` to prevent overflow.

