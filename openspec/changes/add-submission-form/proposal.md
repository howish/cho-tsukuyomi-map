## Why

yachi8000.app is a non-official fan guide. Today howish + Yachiyo curate every booth body manually — pulling X/Plurk/Threads timelines, parsing 新刊 / お品書き / 通販, writing markdown. This scales linearly with circle count (633 today, growing per event) and crowds out higher-leverage work. Circles themselves are best-positioned to know "my new book is X" or "my booth is now S-12 not S-10" — give them a way to submit corrections + updates that flows through a lightweight moderation queue before landing in data.js.

## What Changes

- Add a public `/submit/<booth_id>` page where any visitor (ideally the circle author) can submit corrections / additions
- Submitted entries land in a moderation queue (`pending_submissions.json` or GitHub Issue per submission), not directly in data.js
- howish (or any moderator) reviews from `/circles/?mode=moderation` — accept / edit / reject; accepted submissions flow into the existing apply pipeline (`apply_review_decisions.py`)
- Submitter optionally provides X handle or email for "is this you" follow-up (best-effort, no formal auth — fan guide trust model)
- Submission types: SNS link add / remove, body addition, cover image URL, alias add, "this booth ID changed", new arbitrary note

## Capabilities

### New Capabilities

- `public-submission-form`: lightweight HTML form per booth that captures structured field updates without requiring login
- `submission-queue`: persistence + UI for moderator review (accept / edit / reject), reusing the existing `apply_review_decisions.py` schema
- `submission-attribution`: optional `submitted_by` annotation on accepted decisions for provenance trail

### Modified Capabilities

- `circles-edit-mode`: extend the existing `?mode=edit` UI with a `?mode=moderation` variant (or new tab) that shows pending submissions alongside curator-initiated decisions

## Impact

- **New code**: `submit/{index.html,submit.js,submit.css}` (form), `scripts/moderation_inbox.py` (queue persistence), moderation tab integration in `circles/circles-edit.js`
- **Modified**: `apply_review_decisions.py` learns to read submissions queue + apply with `submitted_by` provenance; circles.json schema gets optional `socials[].submitted_by` field
- **Considerations**: spam / abuse — initial v1 uses a simple challenge (e.g. circle name + booth ID must both match), no captcha; moderator reviews everything anyway. Future: optional `submission_token` issued by the circle author themselves
- **No breaking changes**: existing edit-mode workflow unchanged; new submission queue is additive

## Dependencies

- **`add-backend-platform` (F) — strict prerequisite**: the submission form needs a server-side endpoint to POST to. Without backend, the only alternative is "fire-and-forget" Discord webhook (no acknowledgement, no queue, easier abuse) which loses the moderation flow value. Land backend first.

## Alternatives

- **No-backend fallback** — Discord webhook receives form submissions directly, howish reads them and manually translates into edit-mode decisions. Skips moderation queue UI but operational from day one. Suitable as MVP before backend lands.
