---
name: update-requirements
description: This skill should be used by default whenever the user asks to add, change, or remove any feature, requirement, or behaviour in the world-clock-weather project. Triggers on phrases like "add a feature", "I want X to do Y", "let's add", "change this to", "remove X", or any new capability being introduced.
---

# Auto-Update Requirements

Whenever a new feature or change is agreed on, update the requirements docs **before or immediately after writing the design doc**. This is a default step — the user should not have to ask for it.

## Files to update

All three live in `docs/requirements/`:

| File | Update when |
|------|-------------|
| `FUNCTIONAL-REQUIREMENTS.md` | New user-facing behaviour, UI change, new feature |
| `TECHNICAL-REQUIREMENTS.md` | New dependency, new file/component, new API contract, new pattern |
| `NON-FUNCTIONAL-REQUIREMENTS.md` | Performance, security, reliability, or maintainability impact |

## What to update

1. **Bump the version** (1.0 → 1.1 → 1.2) and **date** at the top of each touched file
2. **Add new requirement sections** (`FR-XX`, `TR-XX`, `NFR-XX`) with the next sequential ID
3. **Update existing entries** if the feature changes something already documented (e.g. city count, file list, API contracts)
4. **Update TR-01 stack table** if any new dependency, library, API, or runtime is added
5. **Update TR-02 project structure** if new files or folders are added
6. **Update TR-03 API contracts** if the backend gains new routes or response shapes
7. **Update TR-06 city reference table** if cities are added/removed (lat/lon, timezone, query)

## TR-01: Full Tech Stack (always keep current)

`TECHNICAL-REQUIREMENTS.md` → `TR-01: Stack` is the single source of truth for all technologies powering the app. It must always reflect the real installed stack. When adding a new library (`npm install X`), update TR-01 immediately — same session, same commit.

Format:
| Layer | Technology | Version | Notes |

## ID numbering

- Functional: `FR-01` through `FR-NN` — group by feature area, use sub-IDs (`FR-07.1`, `FR-07.2`)
- Technical: `TR-01` through `TR-NN`
- Non-functional: `NFR-01` through `NFR-NN`
- Always check the highest existing ID before adding a new section

## Requirement writing style

- Each row in the table is one testable, atomic requirement
- Use present tense: "The app shows X" not "The app should show X"
- Be specific: include field names, formats, update cadences, limits

## Example (adding a new feature)

Feature agreed: "Add a humidity display to each city card"

Changes needed:
- `FUNCTIONAL-REQUIREMENTS.md`: add `FR-09` section with rows for humidity display, units, format
- `TECHNICAL-REQUIREMENTS.md`: update TR-03 (add `humidity` to OpenWeatherMap response fields used), update TR-06 if needed
- `NON-FUNCTIONAL-REQUIREMENTS.md`: usually no change for small UI additions — only update if performance or API limits are affected

## When NOT to update

- Pure refactors with no behaviour change
- Bug fixes that restore already-documented behaviour
- Wording/style changes to existing requirements

## After updating

Note in your response which requirement IDs were added or changed so the user can review them.
