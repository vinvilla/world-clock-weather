---
name: claude-features-api
description: This skill should be used when the user asks to "add a new AI feature", "add a button to the AI panel", "add a compare feature", "extend Claude", "add a new feature to the weather assistant", or modify how the AI panel works in the world-clock-weather project.
---

# Extending the Claude AI Features

## Architecture: Two Files Always

Every new AI feature requires changes in **both**:

| File | What to add |
|------|-------------|
| `backend/server.js` | New `if (feature === '...')` block before line 101 |
| `frontend/src/AiPanel.jsx` | New button calling `callClaude('...')` |

## Backend Contract (`backend/server.js`)

### Feature routing

Routing is a flat `if` chain starting at line 25. Add new features **before** the catch-all 400 at line 101:

```js
if (feature === 'my-feature') {
  // ... call Claude ...
  return res.json({ type: 'my-feature', text: result.content[0].text });
}
```

### Request body shape

```js
{ feature: string, query: string, weatherData: object }
```

- `weatherData` — object keyed by city name: `{ "London": { temp, condition, iconCode, error }, ... }`. Only contains the 5 pre-loaded cities. No on-demand fetching.
- `query` — whatever the user typed in the input box (or the `queryOverride` passed from frontend)

### Response shape — CRITICAL

The frontend has exactly two response branches:

```js
if (feature === 'search') {
  // expects: { matching_cities: string[], explanation: string }
} else {
  // expects: { text: string }  ← ALL other features use this
}
```

**For any non-search feature, the backend MUST return `{ text: string }`.**

If you return a rich object (`{ cityA, cityB, summary }`), `data.text` will be `undefined` and the panel renders blank — no error thrown.

To add structured rendering for a new feature, also add a branch in `AiPanel.jsx` (see below).

### Model

Always use `claude-haiku-4-5` to match the existing features:

```js
const result = await client.messages.create({
  model: 'claude-haiku-4-5',
  max_tokens: 400,
  // ...
});
```

Wrong: `'claude-3-haiku-20240307'`, `'claude-3-5-sonnet-20241022'` — SDK will throw a 500.

## Frontend Contract (`frontend/src/AiPanel.jsx`)

### How to trigger a feature

All features go through `callClaude(feature, queryOverride)`:

```js
// Uses the text input value as query:
callClaude('my-feature')

// Hardcodes the query (for features that don't need user input):
callClaude('my-feature', 'my-feature')
```

The function POSTs `{ feature, query: queryOverride ?? query, weatherData }` to `/api/claude`.

### Adding a button

```jsx
<button
  className="ai-btn secondary"
  onClick={() => callClaude('my-feature')}
  disabled={loading}
>
  My Feature Label
</button>
```

Add to the `<div className="ai-actions">` block (line 73) for action buttons, or the `<div className="ai-input-row">` block (line 49) for query-based buttons.

### If your feature needs custom rendering

Add a branch in the `callClaude` response handler (around line 28):

```js
if (feature === 'my-feature') {
  // handle structured response
  setResponse(data.someField);
} else {
  setResponse(data.text);  // default
}
```

## Passing Multiple Values (e.g., Two Cities)

The body only has `{ feature, query, weatherData }`. There is no way to send extra fields without modifying `callClaude`.

**Simplest approach**: encode multiple values in `query` and parse on the backend.

```js
// Frontend — user types "London vs Singapore"
callClaude('compare')  // sends query: "London vs Singapore"

// Backend
const [cityA, cityB] = query.split(' vs ').map(s => s.trim());
```

**Alternative**: modify `callClaude` to accept an `extras` param and merge into the body.

## weatherData Shape

```js
{
  "New York":    { temp: 72, condition: "clear sky", iconCode: "01d", error: false },
  "Los Angeles": { temp: 68, condition: "few clouds", iconCode: "02d", error: false },
  "London":      { error: true },  // when fetch failed
  // ...
}
```

Access as `weatherData["City Name"]`. Always guard for `weatherData[city]?.error`.

## Quick Checklist for New Features

- [ ] Backend: `if (feature === 'my-feature')` block added before line 101
- [ ] Backend: returns `{ text: string }` (or `{ matching_cities, explanation }` for search-type)
- [ ] Backend: uses `model: 'claude-haiku-4-5'`
- [ ] Frontend: button added calling `callClaude('my-feature')`
- [ ] Frontend: response branch added if response shape differs from `{ text }`
- [ ] If multi-value input needed: encoded in `query` string or `callClaude` extended

## Common Mistakes

| Mistake | Effect |
|---------|--------|
| Backend returns `{ cityA, cityB }` instead of `{ text }` | Panel renders blank, no error |
| Uses wrong model string | SDK throws, panel shows `"Error: ..."` |
| Adds extra body fields to fetch without updating `callClaude` | Backend never receives them |
| Backend missing `if` block | Returns 400 `{ error: 'Unknown feature' }`, panel shows `"Error: undefined"` |
| Assumes `weatherData` has arbitrary cities | Only 5 pre-loaded cities exist — missing cities are `undefined` |
