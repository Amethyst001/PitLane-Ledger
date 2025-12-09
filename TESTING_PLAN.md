# PitLane Ledger - Exhaustive Testing Plan

**Document Version:** 1.0  
**Created:** 2025-12-09  
**Last Updated:** 2025-12-09  

---

## Table of Contents
1. [Overview](#overview)
2. [Test Environment Setup](#test-environment-setup)
3. [View/Screen Testing](#viewscreen-testing)
4. [Button & Interaction Testing](#button--interaction-testing)
5. [Mode Testing (DEMO vs PROD)](#mode-testing-demo-vs-prod)
6. [Mobile View Testing](#mobile-view-testing)
7. [Camera/QR Scanner Testing](#cameraqr-scanner-testing)
8. [Navigation Flow Testing](#navigation-flow-testing)
9. [Data Persistence Testing](#data-persistence-testing)
10. [Edge Case Testing](#edge-case-testing)
11. [Cross-Browser Testing](#cross-browser-testing)
12. [Performance Testing](#performance-testing)
13. [Security Testing](#security-testing)

---

## 1. Overview

This document provides an exhaustive testing plan for the PitLane Ledger application, covering all views, buttons, interactions, and scenarios across desktop and mobile experiences.

### Components Under Test

| Component | File | Purpose |
|-----------|------|---------|
| App | `App.jsx` | Main entry, routing, mode management |
| WelcomeGate | `WelcomeGate.jsx` | First-time welcome screen |
| ModeSelection | `ModeSelection.jsx` | DEMO/PROD mode picker |
| OnboardingGuide | `OnboardingGuide.jsx` | PROD setup wizard |
| Dashboard | `Dashboard.jsx` | Main inventory dashboard |
| PartDetails | `PartDetails.jsx` | Individual part view |
| MobileControls | `MobileControls.jsx` | Pit crew mobile interface |
| SettingsPanel | `SettingsPanel.jsx` | App settings |
| LogEventModal | `LogEventModal.jsx` | Event logging dialog |
| QRCodePanel | `QRCodePanel.jsx` | QR code generator display |
| CarConfigurator | `CarConfigurator.jsx` | Visual car part selector |
| TelemetryTimeline | `TelemetryTimeline.jsx` | Part history timeline |
| PredictiveTimeline | `PredictiveTimeline.jsx` | Predictive maintenance |
| RaceCalendarSettings | `RaceCalendarSettings.jsx` | Race calendar config |

---

## 2. Test Environment Setup

### Prerequisites
- [ ] Node.js v18+ installed
- [ ] `pnpm` or `npm` available
- [ ] Forge CLI installed and authenticated
- [ ] Access to development Jira instance
- [ ] Multiple browsers: Chrome, Firefox, Safari, Edge
- [ ] Mobile devices or emulators (iOS, Android)

### Test Instances
- **Local Dev:** `forge tunnel` + `npm run dev`
- **Development:** Deploy via `forge deploy`
- **Production:** Future deployment

### Test Data States
- [ ] Fresh install (no prior data)
- [ ] DEMO mode with mock data
- [ ] PROD mode with imported CSV data
- [ ] PROD mode with cleared data

---

## 3. View/Screen Testing

### 3.1 WelcomeGate.jsx

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| WG-001 | Welcome screen displays on first load | Fresh install → Open app | Welcome screen with "Enter PitLane" button visible | ⬜ |
| WG-002 | Background carousel rotates | Watch for 30 seconds | Background images rotate smoothly | ⬜ |
| WG-003 | "Enter PitLane" button works | Click "Enter PitLane" | Transition to Mode Selection | ⬜ |
| WG-004 | Feature badges visible | Inspect screen | 3 feature badges (Traceability, Real-time, Predictive) shown | ⬜ |
| WG-005 | Logo displays correctly | Inspect header | PitLane logo renders | ⬜ |
| WG-006 | Animation plays on enter | Click button | Fade out animation smooth | ⬜ |

### 3.2 ModeSelection.jsx

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| MS-001 | Mode selection screen displays | Complete WelcomeGate | Two cards: "Explore Demo" and "Launch Product" | ⬜ |
| MS-002 | DEMO mode selection | Click "Explore Demo" | Loads Dashboard with mock data | ⬜ |
| MS-003 | PROD mode selection | Click "Launch Product" | Loads OnboardingGuide | ⬜ |
| MS-004 | Loading state shows | Click either mode | "Loading..." text appears | ⬜ |
| MS-005 | Mode persists to storage | Select PROD → Check storage | Mode saved via `setAppMode` resolver | ⬜ |
| MS-006 | Background carousel visible | Inspect | Background images visible behind cards | ⬜ |
| MS-007 | Buttons disabled during load | Click one mode → Click other | Second click blocked | ⬜ |

### 3.3 OnboardingGuide.jsx (PROD Mode Only)

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| OG-001 | Onboarding wizard displays | Select PROD mode | Multi-step wizard appears | ⬜ |
| OG-002 | Step navigation works | Click Next/Back buttons | Steps advance/retreat correctly | ⬜ |
| OG-003 | CSV upload works | Step 1 → Upload valid CSV | Parts parsed and displayed | ⬜ |
| OG-004 | CSV validation | Upload invalid CSV | Error message shown | ⬜ |
| OG-005 | File size limit enforced | Upload >5MB file | Rejection message | ⬜ |
| OG-006 | Driver configuration | Enter driver names | Names saved to fleet config | ⬜ |
| OG-007 | Download CSV template | Click download button | Sample CSV downloads | ⬜ |
| OG-008 | Skip to Dashboard | Complete all steps | Onboarding completes, Dashboard loads | ⬜ |
| OG-009 | Progress indicator | View stepper | Current step highlighted | ⬜ |
| OG-010 | Back to Mode Selection | Click back on step 1 | Returns to Mode Selection | ⬜ |

### 3.4 Dashboard.jsx

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| DB-001 | Dashboard loads with data | Complete mode selection | Parts inventory table visible | ⬜ |
| DB-002 | Header displays correctly | Inspect header | Logo + "PitLane Dashboard" title + tabs | ⬜ |
| DB-003 | Tab: Race Operations | Click tab | Race Operations view loads | ⬜ |
| DB-004 | Tab: Pit Manager | Click tab | Parts inventory table loads | ⬜ |
| DB-005 | Tab: Predictive Hub | Click tab | Predictive Timeline loads | ⬜ |
| DB-006 | Stat cards display | Inspect stat row | 4 stat cards: Total, Trackside, Critical, Readiness | ⬜ |
| DB-007 | Readiness sparkline | Inspect chart | Sparkline chart renders | ⬜ |
| DB-008 | Critical count badge | If parts damaged | Red badge shows count | ⬜ |
| DB-009 | Search filter works | Type in search box | Parts filtered by name/key | ⬜ |
| DB-010 | Sort dropdown works | Change sort option | Parts reordered | ⬜ |
| DB-011 | View toggle: List/Grid | Toggle view mode | Layout changes | ⬜ |
| DB-012 | Part row click | Click any part row | PartDetails opens | ⬜ |
| DB-013 | Status badges colored | Inspect status column | Colors match status (green/yellow/red) | ⬜ |
| DB-014 | Assignment column | Check assignment | Driver 1/2 or Spare shown | ⬜ |
| DB-015 | Settings button | Click settings icon | SettingsPanel opens | ⬜ |
| DB-016 | Refresh button | Click refresh | Data reloads with spinner | ⬜ |
| DB-017 | Empty state (no parts) | Clear all parts | Empty state message shown | ⬜ |
| DB-018 | Shimmer loading state | On initial load | Loading shimmer displays | ⬜ |
| DB-019 | Car Configurator | Click car section | Car visualizer interactive | ⬜ |
| DB-020 | Race Calendar | Check calendar | Race calendar events shown | ⬜ |

### 3.5 PartDetails.jsx

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| PD-001 | Part details load | Click part from Dashboard | Part info + timeline loads | ⬜ |
| PD-002 | Header shows part info | Inspect header | Part key, name, status visible | ⬜ |
| PD-003 | Stats bar displays | Inspect | Events count, days since, usage | ⬜ |
| PD-004 | Timeline shows history | Scroll timeline | Chronological events listed | ⬜ |
| PD-005 | "Log Event" button | Click button | LogEventModal opens | ⬜ |
| PD-006 | Part selector dropdown | Click dropdown | All parts listed | ⬜ |
| PD-007 | Switch part via dropdown | Select different part | New part details load | ⬜ |
| PD-008 | Mobile phone icon (desktop) | Click icon | Switches to MobileControls | ⬜ |
| PD-009 | Scan QR icon (desktop) | Click icon | Opens scanner | ⬜ |
| PD-010 | "Scan Another" button (mobile) | In mobile view, click | Returns to scanner | ⬜ |
| PD-011 | Return to Dashboard | Click back/close | Returns to Dashboard | ⬜ |
| PD-012 | Loading shimmer | On load | Shimmer placeholders visible | ⬜ |
| PD-013 | Empty history state | Part with no events | "No events" message | ⬜ |

### 3.6 MobileControls.jsx (Pit Crew View)

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| MC-001 | Mobile view loads | Access via mobile/icon | Mobile interface displays | ⬜ |
| MC-002 | "Clear for Race" button | Click button | Status logged, success toast | ⬜ |
| MC-003 | "Log Damage" button | Click button | Damage logged, success toast | ⬜ |
| MC-004 | "Add New Part" button | Click button | Add Part modal opens | ⬜ |
| MC-005 | "Print QR" button | Click button | Print QR modal opens | ⬜ |
| MC-006 | "Browse Inventory" button | Click button | Navigates to PartDetails | ⬜ |
| MC-007 | "Scan QR Code" button | Click button | Scanner modal opens | ⬜ |
| MC-008 | Success toast appears | Complete any action | Animated toast shows | ⬜ |
| MC-009 | Toast auto-dismisses | Wait 2.5 seconds | Toast disappears | ⬜ |
| MC-010 | Add Part modal form | Fill form → Submit | Part created | ⬜ |
| MC-011 | Auto-generate part key | Click "Auto" button | Key generated | ⬜ |
| MC-012 | Print QR part selector | Select parts | QR codes generate | ⬜ |
| MC-013 | Button disabled while logging | Click log button | Button shows loading state | ⬜ |
| MC-014 | Demo mode uses mock data | In Demo mode | Mock parts available | ⬜ |
| MC-015 | Prod mode uses real data | In Prod mode | Real Jira parts available | ⬜ |

### 3.7 SettingsPanel.jsx

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| SP-001 | Settings panel opens | Click settings icon | Panel slides in | ⬜ |
| SP-002 | Close button works | Click X | Panel closes | ⬜ |
| SP-003 | Driver names editable | Edit driver input | Text changes | ⬜ |
| SP-004 | Save drivers | Edit → Click Save | Names persisted | ⬜ |
| SP-005 | Clear Production Data | Click button | Confirm modal appears | ⬜ |
| SP-006 | Confirm clear data | Confirm in modal | Data cleared | ⬜ |
| SP-007 | Reset Onboarding | Click button | Confirm modal appears | ⬜ |
| SP-008 | Confirm reset onboarding | Confirm in modal | Back to WelcomeGate | ⬜ |
| SP-009 | Version info displays | Inspect footer | Version number shown | ⬜ |
| SP-010 | Demo mode indicator | In Demo mode | Mode badge visible | ⬜ |

### 3.8 LogEventModal.jsx

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| LM-001 | Modal opens | Click "Log Event" | Modal visible with form | ⬜ |
| LM-002 | Status presets work | Click preset buttons | Status field populated | ⬜ |
| LM-003 | Custom status entry | Type custom status | Text accepted | ⬜ |
| LM-004 | Notes field works | Enter notes | Text saved | ⬜ |
| LM-005 | Submit creates event | Fill form → Submit | Event logged, modal closes | ⬜ |
| LM-006 | Cancel closes modal | Click Cancel | Modal closes, no event | ⬜ |
| LM-007 | Smart default status | Open modal | Next logical status pre-selected | ⬜ |

### 3.9 QRCodePanel.jsx

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| QP-001 | QR panel opens | Click QR icon | Modal with QR code | ⬜ |
| QP-002 | QR code renders | Inspect | Valid QR code image | ⬜ |
| QP-003 | URL displayed | Check URL box | Correct part URL | ⬜ |
| QP-004 | Close button works | Click X | Panel closes | ⬜ |
| QP-005 | Backdrop click closes | Click outside | Panel closes | ⬜ |

### 3.10 CarConfigurator.jsx

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| CC-001 | Car diagram renders | View Race Operations | Car SVG visible | ⬜ |
| CC-002 | Zones clickable | Click car zone | Zone highlighted, parts filtered | ⬜ |
| CC-003 | Zone colors by status | Inspect zones | Red for critical, green for OK | ⬜ |
| CC-004 | Clear filter button | Click "Clear Selection" | Filter removed | ⬜ |
| CC-005 | Zone tooltip | Hover zone | Tooltip with zone name | ⬜ |
| CC-006 | Part count per zone | Inspect | Counts shown in zones | ⬜ |

---

## 4. Button & Interaction Testing

### 4.1 All Clickable Elements Checklist

#### WelcomeGate Buttons
- [ ] "Enter PitLane" primary button

#### ModeSelection Buttons
- [ ] "Explore Demo" card/button
- [ ] "Launch Product" card/button

#### OnboardingGuide Buttons
- [ ] "Back" button (each step)
- [ ] "Next" button (each step)
- [ ] "Skip" button (if available)
- [ ] "Download Template" button
- [ ] File upload input
- [ ] "Finish" button (final step)

#### Dashboard Buttons
- [ ] Tab: "Race Operations"
- [ ] Tab: "Pit Manager"
- [ ] Tab: "Predictive Hub"
- [ ] Search input
- [ ] Sort dropdown
- [ ] View toggle (List/Grid)
- [ ] Refresh button
- [ ] Settings (gear) button
- [ ] Each part row (clickable)
- [ ] Status filter dropdown
- [ ] Assignment filter dropdown

#### PartDetails Buttons
- [ ] Part selector dropdown
- [ ] "Log Event" button
- [ ] "Scan Another" button (mobile)
- [ ] "Scan QR" icon button (desktop)
- [ ] "Mobile" icon button (desktop)
- [ ] Close/Back button

#### MobileControls Buttons
- [ ] "CLEAR FOR RACE" big button
- [ ] "LOG DAMAGE" big button
- [ ] "Add New Part" secondary button
- [ ] "Print QR" secondary button
- [ ] "Browse Inventory" secondary button
- [ ] "Scan QR Code" button (if present)
- [ ] Scanner modal close (X) button
- [ ] Camera flip button
- [ ] Torch toggle button
- [ ] Upload QR (dev only)
- [ ] Paste from Clipboard (dev only)

#### SettingsPanel Buttons
- [ ] Close (X) button
- [ ] Driver 1 name input
- [ ] Driver 2 name input
- [ ] "Save Driver Names" button
- [ ] "Clear Production Data" button
- [ ] "Reset Onboarding" button

#### Modal Buttons (All Modals)
- [ ] Close (X) button
- [ ] Cancel button
- [ ] Submit/Confirm button
- [ ] Backdrop click to close

---

## 5. Mode Testing (DEMO vs PROD)

### 5.1 DEMO Mode Tests

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| DM-001 | Demo data loaded | Select DEMO | Mock parts display | ⬜ |
| DM-002 | No storage writes | Perform actions | No Jira API calls | ⬜ |
| DM-003 | Demo actions work | Log event in Demo | Mock response | ⬜ |
| DM-004 | Clear data disabled | Try clear data | Button disabled or warning | ⬜ |
| DM-005 | Onboarding skipped | Select DEMO | Goes directly to Dashboard | ⬜ |

### 5.2 PROD Mode Tests

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| PM-001 | Onboarding required | Select PROD | OnboardingGuide loads | ⬜ |
| PM-002 | Real Jira data | Complete onboarding | Live issues/parts | ⬜ |
| PM-003 | Events persist | Log event | Saved to Jira storage | ⬜ |
| PM-004 | CSV import works | Upload valid CSV | Parts created | ⬜ |
| PM-005 | Clear data works | Clear data | All parts removed | ⬜ |

### 5.3 Mode Persistence Tests

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| MP-001 | Mode persists refresh | Select mode → Refresh | Same mode loaded | ⬜ |
| MP-002 | Mode persists tab close | Close tab → Reopen | Same mode loaded | ⬜ |
| MP-003 | Mode switch works | Start DEMO → Reset → PROD | Mode changes | ⬜ |
| MP-004 | Mobile inherits mode | Desktop DEMO → Mobile | Mobile shows DEMO | ⬜ |

---

## 6. Mobile View Testing

### 6.1 Mobile Detection

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| MD-001 | Auto-detect narrow screen | Resize to <900px | MobileControls loads | ⬜ |
| MD-002 | Auto-detect mobile UA | Chrome DevTools mobile | MobileControls loads | ⬜ |
| MD-003 | Desktop with touch | Large touch laptop | Stays on Dashboard | ⬜ |
| MD-004 | Manual mobile via icon | Click mobile icon | MobileControls loads | ⬜ |
| MD-005 | URL param ?mobile=1 | Add param → Load | MobileControls loads | ⬜ |
| MD-006 | Pit-crew role | User in pit-crew group | Auto mobile mode | ⬜ |

### 6.2 Mobile Navigation

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| MN-001 | Scan → PartDetails | Scan QR → Valid part | PartDetails loads | ⬜ |
| MN-002 | PartDetails → Scanner | Click "Scan Another" | Scanner opens | ⬜ |
| MN-003 | Browse → PartDetails | Click "Browse Inventory" | PartDetails loads | ⬜ |
| MN-004 | Exit mobile (wide) | Widen screen | Dashboard loads | ⬜ |
| MN-005 | Exit mobile (narrow) | Try exit | Alert: "Widen screen" | ⬜ |

### 6.3 Mobile-Specific UI

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| MU-001 | Big buttons visible | Check main controls | Clear for Race/Log Damage large | ⬜ |
| MU-002 | Touch-friendly | Tap buttons | Easy to tap accurately | ⬜ |
| MU-003 | No horizontal scroll | Scroll | Content fits viewport | ⬜ |
| MU-004 | Portrait orientation | Portrait mode | Layout works | ⬜ |
| MU-005 | Landscape orientation | Landscape mode | Layout works | ⬜ |

---

## 7. Camera/QR Scanner Testing

### 7.1 Scanner Initialization

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| SC-001 | Scanner opens | Click "Scan QR Code" | Camera feed visible | ⬜ |
| SC-002 | Camera permission prompt | First open | Browser prompts for camera | ⬜ |
| SC-003 | Permission denied | Deny permission | Error message displayed | ⬜ |
| SC-004 | Nimiq primary | Check console | "[Scanner] Nimiq started" | ⬜ |
| SC-005 | Html5-qrcode fallback | Block Nimiq | "[Scanner] Using html5-qrcode" | ⬜ |
| SC-006 | HTTPS warning | On HTTP | Warning in console | ⬜ |

### 7.2 Scanner Functionality

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| SF-001 | Scan valid QR | Point at part QR | Part detected, vibration | ⬜ |
| SF-002 | Scan result displays | Successful scan | Result card shows | ⬜ |
| SF-003 | Go to Part | Click "Go to Part" | PartDetails loads | ⬜ |
| SF-004 | Dismiss result | Click "Dismiss" | Result cleared | ⬜ |
| SF-005 | Flip camera | Click flip button | Front/back swap | ⬜ |
| SF-006 | Toggle torch | Click torch button | Light on/off | ⬜ |
| SF-007 | Upload QR image | Upload image file | QR decoded | ⬜ |
| SF-008 | Paste from clipboard | Paste QR image | QR decoded | ⬜ |
| SF-009 | External QR handling | Scan non-part QR | "External" type shown | ⬜ |

### 7.3 Camera Cleanup (CRITICAL)

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| CC-001 | Close modal stops camera | Open scanner → Close | Camera LED off | ⬜ |
| CC-002 | Tab switch stops camera | Open scanner → Switch tab | Camera LED off | ⬜ |
| CC-003 | Return to browser | Leave browser → Return | Camera LED off | ⬜ |
| CC-004 | Navigate away stops camera | Scanner → Dashboard | Camera LED off | ⬜ |
| CC-005 | Page refresh stops camera | Open scanner → Refresh | Camera LED off | ⬜ |
| CC-006 | Multiple open/close cycles | Open → Close → Open × 5 | No camera leak | ⬜ |
| CC-007 | Console confirms cleanup | Check console | "[Scanner] Stopped track: video" | ⬜ |

---

## 8. Navigation Flow Testing

### 8.1 First-Time User Flow

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Open app fresh | WelcomeGate displays | ⬜ |
| 2 | Click "Enter PitLane" | ModeSelection displays | ⬜ |
| 3a | Click "Explore Demo" | Dashboard with mock data | ⬜ |
| 3b | Click "Launch Product" | OnboardingGuide displays | ⬜ |
| 4 | Complete onboarding | Dashboard with real data | ⬜ |

### 8.2 Return User Flow

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Open app (not first time) | Skips WelcomeGate | ⬜ |
| 2 | Previous mode = DEMO | Dashboard with DEMO data | ⬜ |
| 3 | Previous mode = PROD | Dashboard with PROD data | ⬜ |

### 8.3 Mobile User Flow

| Step | Action | Expected Result | Status |
|------|--------|-----------------|--------|
| 1 | Open on mobile browser | MobileControls loads | ⬜ |
| 2 | No prior mode | Defaults to DEMO | ⬜ |
| 3 | Prior mode saved | Correct mode loaded | ⬜ |
| 4 | Scan QR | PartDetails for scanned part | ⬜ |
| 5 | Click "Scan Another" | Return to scanner | ⬜ |

---

## 9. Data Persistence Testing

### 9.1 Storage Tests

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| ST-001 | App mode persists | Set mode → Refresh | Mode retained | ⬜ |
| ST-002 | Driver names persist | Save names → Refresh | Names retained | ⬜ |
| ST-003 | Onboarding state persists | Complete → Refresh | Skips onboarding | ⬜ |
| ST-004 | DEMO events ephemeral | Log event → Refresh | Event gone | ⬜ |
| ST-005 | PROD events persist | Log event → Refresh | Event retained | ⬜ |

### 9.2 Reset Tests

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| RS-001 | Reset onboarding | Settings → Reset | WelcomeGate shows | ⬜ |
| RS-002 | Clear production data | Settings → Clear | Parts deleted | ⬜ |
| RS-003 | Confirmation required | Click dangerous action | Modal confirms | ⬜ |

---

## 10. Edge Case Testing

### 10.1 Empty States

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| ES-001 | No parts in inventory | Clear all parts | Empty state message | ⬜ |
| ES-002 | No events on part | View fresh part | "No history" shown | ⬜ |
| ES-003 | No search results | Search "xyz123" | "No results" message | ⬜ |

### 10.2 Error States

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| ER-001 | API failure | Simulate network error | Error message, retry option | ⬜ |
| ER-002 | Invalid part key | Navigate to fake key | Error handling | ⬜ |
| ER-003 | Camera not available | Block camera | In-app error message | ⬜ |
| ER-004 | Invalid CSV upload | Upload broken file | Error message | ⬜ |

### 10.3 Screen Size Edge Cases

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| SS-001 | Very small screen | Resize to 320px | No content cut off | ⬜ |
| SS-002 | Very large screen | 4K monitor | Content centered/scaled | ⬜ |
| SS-003 | Resize during use | Resize mid-action | No crash, adapts | ⬜ |
| SS-004 | Orientation change | Rotate device | Layout adapts | ⬜ |

### 10.4 Rapid Actions

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| RA-001 | Double-click buttons | Double-click "Log Event" | Single action only | ⬜ |
| RA-002 | Rapid mode switching | Toggle mobile rapidly | No state corruption | ⬜ |
| RA-003 | Spam refresh | Click refresh × 10 | No race conditions | ⬜ |
| RA-004 | Quick scanner toggle | Open/close × 5 fast | No camera leak | ⬜ |

---

## 11. Cross-Browser Testing

### 11.1 Desktop Browsers

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | ⬜ |
| Firefox | Latest | ⬜ |
| Safari | Latest | ⬜ |
| Edge | Latest | ⬜ |

### 11.2 Mobile Browsers

| Browser | Platform | Status |
|---------|----------|--------|
| Chrome | Android | ⬜ |
| Safari | iOS | ⬜ |
| Samsung Internet | Android | ⬜ |
| Firefox | Android | ⬜ |

### 11.3 Browser-Specific Features

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Camera access | ⬜ | ⬜ | ⬜ | ⬜ |
| QR scanning | ⬜ | ⬜ | ⬜ | ⬜ |
| Vibration API | ⬜ | ⬜ | ⬜ | ⬜ |
| Clipboard paste | ⬜ | ⬜ | ⬜ | ⬜ |
| Touch events | ⬜ | ⬜ | ⬜ | ⬜ |

---

## 12. Performance Testing

### 12.1 Load Time Tests

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Initial load (cold) | <3s | | ⬜ |
| Initial load (cached) | <1s | | ⬜ |
| Tab switch time | <0.5s | | ⬜ |
| Modal open time | <0.3s | | ⬜ |
| Scanner init time | <2s | | ⬜ |

### 12.2 Memory Tests

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| MM-001 | Memory leak check | Use app 30 minutes | Memory stable | ⬜ |
| MM-002 | Camera memory | Open/close scanner × 10 | No growth | ⬜ |
| MM-003 | Large inventory | 1000+ parts | No sluggishness | ⬜ |

---

## 13. Security Testing

### 13.1 Input Validation

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| IV-001 | XSS in part name | Input `<script>` | Sanitized/escaped | ⬜ |
| IV-002 | XSS in notes | Input script tag | Sanitized/escaped | ⬜ |
| IV-003 | SQL injection | Input SQL syntax | No effect | ⬜ |
| IV-004 | Path traversal | Input `../` | No effect | ⬜ |

### 13.2 Authorization

| Test ID | Test Case | Steps | Expected Result | Status |
|---------|-----------|-------|-----------------|--------|
| AZ-001 | Forge permissions | Check manifest | Correct scopes | ⬜ |
| AZ-002 | API key exposure | Check network tab | No secrets exposed | ⬜ |
| AZ-003 | CORS handling | Cross-origin request | Properly blocked | ⬜ |

---

## Test Execution Log

| Date | Tester | Test Range | Pass | Fail | Notes |
|------|--------|------------|------|------|-------|
| | | | | | |

---

## Known Issues Tracker

| ID | Description | Severity | Status | Notes |
|----|-------------|----------|--------|-------|
| | | | | |

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA Tester | | | |
| Product Owner | | | |

---

**End of Testing Plan**
