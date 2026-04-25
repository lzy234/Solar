# Mobile App Bottom Floating Metrics Removal

## Basic Info

- Date: 2026-04-25
- Category: bugfix
- Module: mobile-app
- Related Files: `mobile-app/src/app/App.tsx`

## Issue

- The mobile app had a fixed metrics card floating above the bottom edge.
- The card displayed power, efficiency, load, and alert counts.
- On the AI chat page, this fixed card overlapped the bottom input area and reduced usable space.

## Root Cause

- The metrics card was rendered with `fixed bottom-4 left-4 right-4 z-40`.
- It stayed mounted across the whole app instead of only appearing in a page-specific context.
- The AI chat input is also positioned near the bottom, so the extra fixed layer caused visual and interaction obstruction.

## Fix

- Removed the bottom floating metrics card from the app shell.
- Cleaned up the icon imports that were only used by that card.

## Impact

- Frees the AI chat input area from overlap on mobile layouts.
- Removes a redundant global summary panel without affecting alert detail actions or the main dashboard metrics blocks.

## Verification

- Confirmed the fixed bottom metrics block is no longer rendered in `App.tsx`.
- Confirmed the AI chat input no longer has a competing global floating panel above it in the page structure.
- Ran `npx vite build` in `mobile-app` successfully after the change.

## Notes

- If a bottom summary is needed again later, it should be scoped to a specific page and avoid sharing the same fixed bottom region as the chat composer.
