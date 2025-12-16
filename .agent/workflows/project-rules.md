---
description: Project rules
---

# PitLane Ledger - Development Rules & Context

## Project Overview
- **Project**: PitLane Ledger - F1 parts tracking app for Williams Racing (Codegeist hackathon)
- **Stack**: Atlassian Forge, React frontend, Custom Resolvers backend
- **Location**: `C:\Users\USER\Documents\Codegeist\pitlane-ledger`

---

## Critical Development Rules

### 1. Build & Deploy Commands
- **NEVER build automatically** - only build when user explicitly asks
- **NEVER deploy** unless explicitly asked with "deploy" command
- Build location: `src\frontend` directory
- Build command: `npm run build`
- Deploy command (only when asked): `forge deploy`

### 2. Code Editing Rules
- **Be precise with edits** - small, targeted changes only
- **Don't move huge chunks** that can corrupt files
- **Don't scatter anything already working** - minimal changes to working code
- **Study the codebase first** - understand callbacks, function calls, patterns before editing
- Always verify edits don't break existing functionality

### 3. Rovo Code (IMPORTANT)
- **Never touch Rovo-related code without asking first**
- Rovo resolvers have special naming conventions (`rovoGetHistory`, etc.)
- Always confirm before modifying Rovo agent integrations

### 4. Git & Version Control
- **Do NOT use git to correct errors** - repo may not be updated
- Don't rely on git history for reverting changes
- Make careful edits instead of depending on git revert

### 3. Dual-Mode Architecture (DEMO/PROD)
- **DEMO mode**: 
  - Ephemeral - no storage writes
  - Uses mock data (`getMockParts()`)
  - Frontend state only (session-based)
  
- **PROD mode**: 
  - Persists to Forge storage
  - Uses CSV-imported data from inventory
  - History persists to `partHistory_{partKey}` storage

- **Frontend decides which resolver to call**:
  - `getDemoParts` vs `getProductionParts`
  - `getHistory` vs `getProductionHistory`
  
- **Resolvers accept `appMode` parameter** from frontend (takes precedence over storage)

### 4. Timeline & History Logic
- **Timeline merge**: Saved events PREPENDED to CSV baseline
  - User-logged events appear at TOP
  - Original CSV history appears BELOW
- **No duplicate events** - don't regenerate existing statuses
- History stored per-part: `partHistory_{partKey}`

### 5. Status Display & Icons
- **Strip emojis** from status text displays (timeline circles have icons already)
- **No redundant icons** - only timeline circle icons, not in text
- Icons should be uniform in color (not some green, some red)
- Keep UI clean and uncluttered

### 6. System-Wide Updates (CRITICAL)
- **Everything updates when event logged**:
  - Active Inventory
  - End of Life section
  - Predictive Timeline
  - Fleet Readiness Score
  - Part selector dropdown
- **Update flow**: PartDetails → `onEventLogged` → App → `refreshTrigger` → Dashboard → `fetchData`
- Updates should be **fast and sharp** - no delays

### 7. Driver Names & Display
- PROD defaults: "Alex Albon" (Car 1), "Carlos Sainz" (Car 2)
- **No hardcoded racing numbers** (remove 23/55 from inventory display)
- Just show: `🔵 Albon` or `🟡 Sainz` or `⚪ Spares`

### 8. Workflow Validations
- Block clearing damaged/non-trackside parts for race
- Show in-app error messages (not browser alerts)
- Prevent redundant status changes
- Warn on skipping QC/packaging steps

---

## Key Files Reference

### Frontend Components
- `App.jsx` - Main app, mode selection, routing, refreshTrigger state
- `Dashboard.jsx` - Main dashboard, inventory, stats, fleet readiness
- `PartDetails.jsx` - Part details view, timeline, event logging
- `MobileControls.jsx` - Mobile scanning, quick actions
- `TelemetryTimeline.jsx` - Timeline display with icons
- `LogEventModal.jsx` - Event logging modal with smart defaults
- `OnboardingGuide.jsx` - PROD setup wizard

### Backend
- `src/resolvers/index.js` - All resolver functions (handler-based, no @forge/resolver library)

---

## Smart Defaults (LogEventModal)
Uses fuzzy keyword matching for status prediction:
- "Trackside" → "Cleared for Race"
- "Manufactured" → "Quality Checked"
- "Quality/Checked" → "Packaged"
- "Damaged" → "Maintenance"

---

## Working Style Preferences
- **Be honest** - Don't bend to user preferences if something is technically wrong
- **Skip planning docs** - User doesn't need task.md, implementation_plan.md, or walkthrough.md files; work directly on code
- **Be direct** - Get to implementation quickly, minimal ceremony

---

## Current Session Summary

**What's Been Fixed:**
1. ✅ Dual-mode resolver routing with `appMode` parameter
2. ✅ Timeline merge (saved events + CSV baseline combined)
3. ✅ System-wide refresh via `refreshTrigger` callback chain
4. ✅ Emoji stripping from status displays
5. ✅ Smart defaults with fuzzy matching
6. ✅ Racing numbers removed from inventory
7. ✅ getHistory resolver mode check removed (works for DEMO now)
8. ✅ Fleet Readiness - smart calculation with spare coverage
9. ✅ Clickable stat panels filter Active Inventory
10. ✅ Part selector reactivity fix with dynamic key
11. ✅ End of Life section updates properly with useMemo
12. ✅ Faster event logging (parallel storage, optimistic UI, skip refetch)

**Still Pending:**
- Session-based DEMO event persistence in frontend state

