# PitLane Ledger

**Enterprise Asset Management for Williams Racing**  
Advanced parts tracking, telemetry, and compliance system built for Formula 1 operations.

## Features

- **Parts Passport System** - Complete lifecycle tracking for F1 components
- **QR Code Scanning** - Mobile-first pit crew workflow
- **Predictive Timeline** - End-of-life forecasting per component
- **Fleet Readiness Score** - Real-time operational health metrics
- **Multi-Mode Operation** - DEMO mode for evaluation, PROD mode for live data
- **Role-Based Access** - Manager and Pit Crew views optimized for each role

## Role-Based Access

| Role | Primary Use | Features |
|------|-------------|----------|
| **Manager** | Full operations oversight | Dashboard, Settings, Analytics, Part Management |
| **Pit Crew** | Mobile trackside operations | QR Scanner, Quick Log, Status Updates |

## Requirements

See [Set up Forge](https://developer.atlassian.com/platform/forge/set-up-forge/) for instructions.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
cd static/pitlane-ledger
npm install
npm run dev

# Deploy
forge deploy
forge install
```

## Future Integrations

The following features are planned for future releases:

### Logistics Role
Dedicated view for shipping, receiving, and transport operations:
- Batch receiving checklists for incoming parts
- Shipping manifest generation
- Location tracking across facilities (factory ↔ trackside)
- Transport event logging with chain of custody
- Bulk status updates for shipments

### Role-Based Access System (Planned)

**Implementation Approach:**
- URL parameter-based role assignment (`?role=pit-crew`) - bypasses Atlassian admin
- Role selection screen shown after WelcomeGate for new users
- Settings panel option to switch roles anytime

**Storage Strategy:**
- Store role in both `localStorage` (device) and Forge `storage` (accountId)
- On load: check localStorage → fallback to Forge storage → show role selection if neither exists
- Enables same role on same device (instant) + new device with same account (inherits)

**Proposed Roles:**
| Role | Access Level | Primary View |
|------|--------------|--------------|
| Manager | Full access + settings | Dashboard, Analytics, Settings |
| Pit Crew | Operational access | QR Scanner, Quick Log, Read-only Dashboard |
| Logistics | Transport operations | Receiving, Shipping, Location Tracking |

**Role vs Device Logic:**
- Role takes precedence over device detection
- Device type only affects layout (responsive CSS)
- Manager on mobile still sees full dashboard
- Pit Crew on desktop sees Pit Crew view (desktop layout)

### Other Planned Features
- **Advanced Analytics** - Historical trend analysis and reporting
- **External Sensor Integration** - Real-time telemetry from track sensors
- **FIA Compliance Module** - Automated regulatory documentation

## Support

Built for Codegeist 2025: Williams Racing Edition

See [Atlassian Developer Support](https://developer.atlassian.com/platform/forge/get-help/) for platform help.
