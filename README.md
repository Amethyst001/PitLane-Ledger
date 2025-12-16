# PitLane Ledger
**Codegeist 2025: Williams Racing Edition**  
*Enterprise Asset Management & AI Operations for Formula 1*

![PitLane Ledger Dashboard](https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjEx.../giphy.gif)

## 🏁 The Problem
In modern F1 operations, every second and every gram counts. Teams struggle with:
- **Fragmented Data**: Inventory in spreadsheets, telemetry in databases, logistics in emails.
- **Opacity**: "Where is the new front wing?" is a question that requires 3 phone calls.
- **Reactive Maintenance**: Replacing parts too early (waste) or too late (failure).

## 🚀 The Solution
**PitLane Ledger** is a centralized operational OS built on Atlassian Forge. It combines rigorous asset tracking with the intelligence of the **"Pit Boss" AI Agent** to optimize the journey from factory to checkered flag.

---

## 🏎️ Key Features

### 1. 🔍 Interactive Parts Passport
Complete lifecycle tracking for every nut, bolt, and wing.
- **QR Code Workflow**: Pit crew can scan parts trackside for instant status and history.
- **Digital Twin**: Visual car configurator to filter inventory by zone (Aero, Chassis, Power Unit).
- **Life Cycle**: Tracks mileage, sessions, and wear % against FIA regulations.

### 2. 🤖 "Pit Boss" AI Agent (Rovo Integration)
A specialized Rovo Agent with deep context of the Williams Racing rulebook and inventory.
- **Context-Aware**: "Are we ready for FP1?" triggers a full audit of Car 1 and Car 2.
- **Predictive**: "Check the front wing wear" analyzes telemetry to predict failures.
- **Operational**: "Log damage on PIT-101" creates Jira tickets and order requests automatically.

### 3. 📊 Fleet Readiness Dashboard
Real-time "Go/No-Go" metrics for race engineers.
- **Critical Parts Score**: 0-100% readiness rating based on required spares.
- **Visual Status**: Red/Amber/Green indicators for all critical systems.
- **Smart Alerts**: "No spare Front Wing available for Car 2" (before it becomes a problem).

### 4. 🛠️ Logistics & Compliance
- **CSV Import**: Bulk onboard parts from factory manifests.
- **Cost Cap**: Real-time budget tracking against the $135M cost cap.
- **Parc Fermé Mode**: Locks configuration to prevent illegal changes post-qualifying.

---

## 🛠️ Tech Stack
- **Platform**: Atlassian Forge (Custom UI)
- **Runtime**: Node.js 22.x
- **Frontend**: React 18, Vite, Recharts, Lucide Icons
- **AI**: Atlassian Rovo (Agentic AI)
- **Storage**: Forge Storage API (Key-Value)

---

## 📦 Installation & Setup

### Prerequisites
- Atlassian Site (Jira Cloud) with Admin access
- [Forge CLI](https://developer.atlassian.com/platform/forge/set-up-forge/) installed
- Docker (optional, for local testing)

### Quick Start
```bash
# 1. Clone the repository
git clone https://github.com/your-repo/pitlane-ledger.git
cd pitlane-ledger

# 2. Install dependencies
npm install

# 3. Deploy to Development environment
forge deploy

# 4. Install on your Jira Cloud site
forge install
```

### 🌍 Application Modes
The app runs in two distinct modes for testing/demo purposes:
- **DEMO Mode**: Loads mock data (F1 2024 Inventory) for instant evaluation. Great for judges!
- **PROD Mode**: Connects to live Jira data and persistent storage for real operations.

---

## 📂 CSV Import Format
For **PROD Mode**, upload your inventory using this CSV format:

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| `Part Name` | ✅ Yes | Component name | `Front Wing Assembly` |
| `Status` | ✅ Yes | Current state | `Trackside`, `In Transit` |
| `Key` | No | Unique ID | `PIT-101` (Auto-generated if empty) |
| `Assignment` | No | Allocation | `Car 1`, `Car 2`, `Spares` |
| `Life` | No | Health % (0-100) | `95` |
| `Life Remaining` | No | Est. Races | `5` (Auto-calculated if empty) |

*(Downloadable template available in the app)*

---

## 🏆 Use Case: The "Monaco Miracle"
*Scenario: FP3 Practice Session. Car 1 crashes.*

1. **Detection**: Telemetry alerts Pit Boss of high G-force impact.
2. **Analysis**: Pit Boss advises: "Front Wing damage critical. 1 Spare available (85% life)."
3. **Action**: Pit Crew scans the damaged part to mark `RETIRED`.
4. **Logistics**: Manager approves the swap in dashboard. Inventory updates instantly.
5. **Result**: Car 1 back on track for Qualifying in 12 minutes.

---

## 🔮 Future Roadmap

### Near-Term (Post-Hackathon)
- **Atlassian Marketplace Listing**: Package for public distribution
- **Multi-Team Support**: Extend beyond Williams to any F1 constructor
- **Jira Automation Rules**: Auto-create tasks when parts approach FIA limits
- **Bulk Operations**: Update multiple parts simultaneously

### Mid-Term (2025 Season)
- **Live Telemetry Correlation**: AWS F1 data feeds for real session data
- **Confluence Race Briefings**: Auto-generate pre-race documentation
- **Slack/Teams Notifications**: Push critical alerts to team channels
- **Historical Analytics**: Season-over-season comparison

### Long-Term (Vision)
- **IoT Integration**: BLE beacons on trackside crates
- **AR Mechanic Assistant**: Apple Vision Pro overlay for torque specs
- **Predictive ML Models**: Train on historical failure data
- **Sustainability Dashboard**: Carbon footprint for logistics decisions

---

*Built with ❤️ for Williams Racing | Atlassian Codegeist 2025*

