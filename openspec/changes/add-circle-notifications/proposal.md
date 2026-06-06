## Why

A visitor finds a circle they love (e.g. ほっぺ食堂 at IF7), goes home, and never hears about that circle again unless they manually re-check yachi8000.app. The site KNOWS — through `pull_timelines.py` diffs — when a circle posts a 新刊 announcement, 場後通販 update, or 次回参加 plan. That signal is asymmetrically valuable to fans: turn it into a push.

## What Changes

- Add a "⭐ お気に入り追加" button to each circle card (read mode); favorites persist to localStorage
- Add `/notifications` page where a user can register a delivery channel (Discord webhook URL or email) tied to their favorite list
- Add a backend (probably cron-driven on the same host as the recon pipeline) that diffs `pull_timelines` output, classifies events (新刊 / 通販 / 次回参加 / マシュマロ募集 / 寄稿予定), and pushes a digest per user
- Initial v1: Discord webhook only (zero-cost, no email infra); v2 could add SendGrid/Resend for email
- "User" is just an opaque ID + their saved favorite_circle_ids + delivery channel; no account, no login — yachi8000.app stays anonymous

## Capabilities

### New Capabilities

- `favorite-circles`: per-visitor persisted set of favorite circle IDs (localStorage + optional sync via opaque token)
- `notification-channel-registration`: form that takes (favorite list snapshot, delivery channel URL or email) and stores server-side under an opaque user token
- `notification-dispatcher`: cron-driven differ over timeline data, classifier for change types, push to registered channels
- `notification-preferences`: per-channel filter (which event types to receive, digest frequency: per-change / daily / weekly)

### Modified Capabilities

- `circle-card`: gets an "⭐" toggle button (read mode), inactive unless visitor has localStorage favorites enabled

## Impact

- **New code**: `notifications/{index.html,notifications.js}`, server-side `scripts/notification_dispatcher.py` + persistence (`notifications.json` or SQLite), Discord webhook integration
- **Modified**: `circles/circles.js` learns favorite-toggle UI; `recon-pipeline-automate` (the other proposal) feeds into the dispatcher
- **Hosting**: requires a server-side cron — yachi8000.app is currently static (GitHub Pages); this proposal introduces a small backend dependency (could be GitHub Actions cron + a single JSON file, or a tiny VPS)
- **Privacy**: opaque user tokens only, no email/handle stored unless the user opts in; visitor must explicitly create the link to receive pushes

## Dependencies

- **`add-backend-platform` (F) — strict prerequisite for push delivery**: registering a notification channel, persisting favorites/channel mappings, and firing webhooks from a cron all require server-side state. There is no way to do push notifications from a pure static site.
- **`automate-recon-pipeline` (E) — strong prerequisite for content**: the dispatcher needs a stream of "new signal at booth X" events to notify on. Without E in place, dispatcher would have nothing to push. C without E is technically possible (favorites are useful as a personal bookmarks layer) but the push half is meaningless.

## Alternatives

- **RSS feed (pull) instead of push**: GitHub Actions generates a per-user RSS feed (`/notifications/<token>.xml`) that the user subscribes to in their own reader. Zero backend, zero infra. Loses real-time and "user can change subscriptions on the site" UX but covers the core value (don't miss updates). Suitable as static-first MVP.
