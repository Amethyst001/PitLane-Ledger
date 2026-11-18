// Williams Racing FW47 2025 Season - Realistic Demo Data
// Based on real Williams Racing 2025 data: Total damage $2.7M (Albon $1.23M, Sainz $1.53M)
// Incidents: Spanish GP front wings, Australia crash, Austria fire, British GP collision

export function getWilliams2025Parts() {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    return [
        // === CHASSIS / MONOCOQUE (FW47) ===
        { id: 'ch-1', key: 'PIT-0001', name: 'Chassis Monocoque FW47 #1', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 85, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
        { id: 'ch-2', key: 'PIT-0002', name: 'Chassis Monocoque FW47 #2', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 78, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
        { id: 'ch-3', key: 'PIT-0003', name: 'Chassis Monocoque FW47 #3', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 30 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
        // SCRAPPED: Australia GP Sainz crash (Lap 1) - $675K
        { id: 'ch-4', key: 'PIT-0004', name: 'Chassis Monocoque FW47 #4', pitlaneStatus: '📦 SCRAPPED', location: 'Recycling', assignment: 'Unassigned', life: 0, lastUpdated: new Date(now - 180 * day).toISOString(), lifeRemaining: 0, predictiveStatus: 'RETIRED', notes: 'Australia GP - Sainz Lap 1 crash' },

        // === GEARBOX (Mercedes-AMG Supply - Notional Value) ===
        { id: 'gb-1', key: 'PIT-0101', name: 'Gearbox Casing Titanium #1', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 82, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
        { id: 'gb-2', key: 'PIT-0102', name: 'Gearbox Casing Titanium #2', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 75, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
        { id: 'gb-3', key: 'PIT-0103', name: 'Gearbox Sequential Actuator #1', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 88, lastUpdated: new Date(now - 1 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
        { id: 'gb-4', key: 'PIT-0104', name: 'Gearbox Sequential Actuator #2', pitlaneStatus: '🏁 Trackside', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 85, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
        { id: 'gb-5', key: 'PIT-0105', name: 'Gearbox Differential Unit', pitlaneStatus: '🚚 In Transit', location: 'DHL - Abu Dhabi', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 5 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
        { id: 'gb-6', key: 'PIT-0106', name: 'Gearbox Hydraulic System', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 15 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },

        // === FRONT WING FW47 (Most damaged category - Spanish GP) ===
        { id: 'fw-1', key: 'PIT-0201', name: 'Front Wing Assembly FW47 Spec-B #1', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 75, lastUpdated: new Date(now - 1 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
        { id: 'fw-2', key: 'PIT-0202', name: 'Front Wing Assembly FW47 Spec-B #2', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 82, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
        { id: 'fw-3', key: 'PIT-0203', name: 'Front Wing Assembly FW47 Spec-A', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 20 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
        { id: 'fw-4', key: 'PIT-0204', name: 'Front Wing Endplate Left', pitlaneStatus: '🏁 Trackside', location: 'Pit Wall', assignment: 'Spares', life: 90, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 5, predictiveStatus: 'HEALTHY' },
        { id: 'fw-5', key: 'PIT-0205', name: 'Front Wing Endplate Right', pitlaneStatus: '🏁 Trackside', location: 'Pit Wall', assignment: 'Spares', life: 88, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
        { id: 'fw-6', key: 'PIT-0206', name: 'Front Wing Nose Cone FW47 #1', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 80, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
        { id: 'fw-7', key: 'PIT-0207', name: 'Front Wing Nose Cone FW47 #2', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 78, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
        // SCRAPPED: Spanish GP - Albon contact with Kick Sauber - $200K
        { id: 'fw-8', key: 'PIT-0208', name: 'Front Wing Assembly FW47 #8', pitlaneStatus: '📦 SCRAPPED', location: 'Recycling', assignment: 'Unassigned', life: 0, lastUpdated: new Date(now - 120 * day).toISOString(), lifeRemaining: 0, predictiveStatus: 'RETIRED', notes: 'Spanish GP - Albon contact Kick Sauber' },
        // SCRAPPED: Spanish GP - Albon contact with Lawson - $200K
        { id: 'fw-9', key: 'PIT-0209', name: 'Front Wing Assembly FW47 #9', pitlaneStatus: '📦 SCRAPPED', location: 'Recycling', assignment: 'Unassigned', life: 0, lastUpdated: new Date(now - 120 * day).toISOString(), lifeRemaining: 0, predictiveStatus: 'RETIRED', notes: 'Spanish GP - Albon contact Lawson (2nd)' },
        // SCRAPPED: Spanish GP - Sainz Turn 1 squeeze damage - $200K
        { id: 'fw-10', key: 'PIT-0210', name: 'Front Wing Assembly FW47 #10', pitlaneStatus: '📦 SCRAPPED', location: 'Recycling', assignment: 'Unassigned', life: 0, lastUpdated: new Date(now - 120 * day).toISOString(), lifeRemaining: 0, predictiveStatus: 'RETIRED', notes: 'Spanish GP - Sainz T1 start damage' },

        // === REAR WING FW47 ===
        { id: 'rw-1', key: 'PIT-0301', name: 'Rear Wing DRS Mainplane High DF', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 68, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
        { id: 'rw-2', key: 'PIT-0302', name: 'Rear Wing DRS Mainplane Low DF', pitlaneStatus: '🚚 In Transit', location: 'DHL Cargo', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 5 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
        { id: 'rw-3', key: 'PIT-0303', name: 'Rear Wing DRS Actuator #1', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 85, lastUpdated: new Date(now - 1 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
        { id: 'rw-4', key: 'PIT-0304', name: 'Rear Wing Beam Wing Carbon', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 72, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
        { id: 'rw-5', key: 'PIT-0305', name: 'Rear Wing Endplate Left', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 12 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
        { id: 'rw-6', key: 'PIT-0306', name: 'Rear Wing Endplate Right', pitlaneStatus: '🏁 Trackside', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 80, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },

        // === FLOOR / UNDERBODY ===
        { id: 'fl-1', key: 'PIT-0401', name: 'Floor Underbody FW47 Spec-C #1', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 55, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 2, predictiveStatus: 'WARNING' },
        { id: 'fl-2', key: 'PIT-0402', name: 'Floor Underbody FW47 Spec-C #2', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 60, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 2, predictiveStatus: 'WARNING' },
        { id: 'fl-3', key: 'PIT-0403', name: 'Floor Diffuser Carbon', pitlaneStatus: '🏁 Trackside', location: 'Pit Wall', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 8 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
        { id: 'fl-4', key: 'PIT-0404', name: 'Floor Edge Wing', pitlaneStatus: '🚚 In Transit', location: 'DHL Cargo', assignment: 'Spares', life: 95, lastUpdated: new Date(now - 4 * day).toISOString(), lifeRemaining: 5, predictiveStatus: 'HEALTHY' },
        { id: 'fl-5', key: 'PIT-0405', name: 'Floor Skid Block Titanium', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 40, lastUpdated: new Date(now - 1 * day).toISOString(), lifeRemaining: 1, predictiveStatus: 'WARNING' },
        // DAMAGED: Italian GP - Sainz collision with Bearman - $275K
        { id: 'fl-6', key: 'PIT-0406', name: 'Floor Underbody FW47 Spec-B', pitlaneStatus: '⚠️ DAMAGED', location: 'Grove Factory - Repair', assignment: 'Unassigned', life: 25, lastUpdated: new Date(now - 60 * day).toISOString(), lifeRemaining: 0, predictiveStatus: 'CRITICAL', notes: 'Italian GP - Sainz/Bearman collision' },

        // === SIDEPODS ===
        { id: 'sp-1', key: 'PIT-0501', name: 'Sidepod Left FW47 #1', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 78, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
        { id: 'sp-2', key: 'PIT-0502', name: 'Sidepod Right FW47 #1', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 80, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
        { id: 'sp-3', key: 'PIT-0503', name: 'Sidepod Left FW47 #2', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 72, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
        { id: 'sp-4', key: 'PIT-0504', name: 'Sidepod Right FW47 #2', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 75, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
        { id: 'sp-5', key: 'PIT-0505', name: 'Engine Cover FW47', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 10 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },

        // === SUSPENSION ===
        { id: 'sus-1', key: 'PIT-0601', name: 'Front Wishbone Upper FL', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 82, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
        { id: 'sus-2', key: 'PIT-0602', name: 'Front Wishbone Lower FL', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 80, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
        { id: 'sus-3', key: 'PIT-0603', name: 'Front Wishbone Upper FR', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 78, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
        { id: 'sus-4', key: 'PIT-0604', name: 'Front Wishbone Lower FR', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 75, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
        { id: 'sus-5', key: 'PIT-0605', name: 'Rear Wishbone Upper RL', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 85, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
        { id: 'sus-6', key: 'PIT-0606', name: 'Rear Wishbone Upper RR', pitlaneStatus: '🏁 Trackside', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 82, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
        { id: 'sus-7', key: 'PIT-0607', name: 'Front Upright Assembly FL', pitlaneStatus: '🏁 Trackside', location: 'Pit Wall', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 6 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
        { id: 'sus-8', key: 'PIT-0608', name: 'Damper Front Multimatic', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 15 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
        // DAMAGED: British GP - Sainz collision with Leclerc - $150K
        { id: 'sus-9', key: 'PIT-0609', name: 'Rear Wishbone Lower RR #3', pitlaneStatus: '⚠️ DAMAGED', location: 'Grove Factory - Repair', assignment: 'Unassigned', life: 15, lastUpdated: new Date(now - 90 * day).toISOString(), lifeRemaining: 0, predictiveStatus: 'CRITICAL', notes: 'British GP - Sainz/Leclerc contact' },

        // === BRAKES ===
        { id: 'br-1', key: 'PIT-0701', name: 'Brake Disc Front Carbon FL', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 45, lastUpdated: new Date(now - 1 * day).toISOString(), lifeRemaining: 2, predictiveStatus: 'WARNING' },
        { id: 'br-2', key: 'PIT-0702', name: 'Brake Disc Front Carbon FR', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 48, lastUpdated: new Date(now - 1 * day).toISOString(), lifeRemaining: 2, predictiveStatus: 'WARNING' },
        { id: 'br-3', key: 'PIT-0703', name: 'Brake Disc Rear Carbon RL', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 52, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 2, predictiveStatus: 'WARNING' },
        { id: 'br-4', key: 'PIT-0704', name: 'Brake Disc Rear Carbon RR', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 55, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 2, predictiveStatus: 'WARNING' },
        { id: 'br-5', key: 'PIT-0705', name: 'Brake Caliper Brembo FL', pitlaneStatus: '🚚 In Transit', location: 'DHL Cargo', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 7 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
        { id: 'br-6', key: 'PIT-0706', name: 'Brake Duct Carbon FL', pitlaneStatus: '🏁 Trackside', location: 'Pit Wall', assignment: 'Spares', life: 90, lastUpdated: new Date(now - 5 * day).toISOString(), lifeRemaining: 5, predictiveStatus: 'HEALTHY' },
        // SCRAPPED: Austria GP - Sainz brake fire (DNS) - $40K
        { id: 'br-7', key: 'PIT-0707', name: 'Brake System Complete FR', pitlaneStatus: '📦 SCRAPPED', location: 'Recycling', assignment: 'Unassigned', life: 0, lastUpdated: new Date(now - 100 * day).toISOString(), lifeRemaining: 0, predictiveStatus: 'RETIRED', notes: 'Austria GP - Sainz brake fire DNS' },

        // === STEERING ===
        { id: 'st-1', key: 'PIT-0801', name: 'Steering Wheel FW47 #1', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 92, lastUpdated: new Date(now - 1 * day).toISOString(), lifeRemaining: 5, predictiveStatus: 'HEALTHY' },
        { id: 'st-2', key: 'PIT-0802', name: 'Steering Wheel FW47 #2', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 90, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 5, predictiveStatus: 'HEALTHY' },
        { id: 'st-3', key: 'PIT-0803', name: 'Steering Rack Hydraulic', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 85, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
        { id: 'st-4', key: 'PIT-0804', name: 'Steering Column Assembly', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 20 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },

        // === WHEELS ===
        { id: 'wh-1', key: 'PIT-0901', name: 'Wheel Rim BBS 13" FL', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 88, lastUpdated: new Date(now - 1 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
        { id: 'wh-2', key: 'PIT-0902', name: 'Wheel Rim BBS 13" FR', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 86, lastUpdated: new Date(now - 1 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
        { id: 'wh-3', key: 'PIT-0903', name: 'Wheel Rim BBS 13" RL', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 85, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
        { id: 'wh-4', key: 'PIT-0904', name: 'Wheel Rim BBS 13" RR', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 84, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },

        // === COOLING SYSTEM (Albon's recurring cooling issues) ===
        { id: 'cl-1', key: 'PIT-1001', name: 'Radiator Water Main #1', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 70, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
        // DAMAGED: Canada GP - Albon cooling failure DNF - $50K
        { id: 'cl-2', key: 'PIT-1002', name: 'Radiator Oil Cooler #1', pitlaneStatus: '⚠️ DAMAGED', location: 'Quarantine', assignment: 'Unassigned', life: 20, lastUpdated: new Date(now - 110 * day).toISOString(), lifeRemaining: 0, predictiveStatus: 'CRITICAL', notes: 'Canada GP - Albon cooling failure DNF' },
        { id: 'cl-3', key: 'PIT-1003', name: 'Radiator Water Main #2', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 75, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
        { id: 'cl-4', key: 'PIT-1004', name: 'Cooling Duct Carbon Left', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 12 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },

        // === ELECTRONICS ===
        { id: 'el-1', key: 'PIT-1101', name: 'ECU Standard FIA #1', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 95, lastUpdated: new Date(now - 1 * day).toISOString(), lifeRemaining: 5, predictiveStatus: 'HEALTHY' },
        { id: 'el-2', key: 'PIT-1102', name: 'ECU Standard FIA #2', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 94, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 5, predictiveStatus: 'HEALTHY' },
        { id: 'el-3', key: 'PIT-1103', name: 'Wiring Loom Main', pitlaneStatus: '🏁 Trackside', location: 'Pit Wall', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 8 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
        { id: 'el-4', key: 'PIT-1104', name: 'Telemetry Antenna Array', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 25 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },

        // === POWER UNIT (Mercedes-AMG - Lease, costs excluded from cap but parts tracked) ===
        { id: 'pu-1', key: 'PIT-1201', name: 'Power Unit ICE M15 #1', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 68, lastUpdated: new Date(now - 1 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
        { id: 'pu-2', key: 'PIT-1202', name: 'Power Unit ICE M15 #2', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 72, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
        { id: 'pu-3', key: 'PIT-1203', name: 'Power Unit MGU-K', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 80, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
        { id: 'pu-4', key: 'PIT-1204', name: 'Power Unit MGU-H', pitlaneStatus: '🏁 Trackside', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 78, lastUpdated: new Date(now - 4 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
        { id: 'pu-5', key: 'PIT-1205', name: 'Power Unit Turbocharger IHI', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 65, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
        { id: 'pu-6', key: 'PIT-1206', name: 'Power Unit Energy Store', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 82, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
        { id: 'pu-7', key: 'PIT-1207', name: 'Power Unit Control Electronics', pitlaneStatus: '🚚 In Transit', location: 'DHL Cargo', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 10 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },

        // === HALO & SAFETY ===
        { id: 'hl-1', key: 'PIT-1301', name: 'Halo Titanium #1', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 95, lastUpdated: new Date(now - 5 * day).toISOString(), lifeRemaining: 5, predictiveStatus: 'HEALTHY' },
        { id: 'hl-2', key: 'PIT-1302', name: 'Halo Titanium #2', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 92, lastUpdated: new Date(now - 6 * day).toISOString(), lifeRemaining: 5, predictiveStatus: 'HEALTHY' },
        { id: 'hl-3', key: 'PIT-1303', name: 'Crash Structure Rear FIA', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 30 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
        // SCRAPPED: Bahrain GP - Sainz accident damage - $100K
        { id: 'hl-4', key: 'PIT-1304', name: 'Crash Structure Rear #4', pitlaneStatus: '📦 SCRAPPED', location: 'Recycling', assignment: 'Unassigned', life: 0, lastUpdated: new Date(now - 200 * day).toISOString(), lifeRemaining: 0, predictiveStatus: 'RETIRED', notes: 'Bahrain GP - Sainz accident damage' }
    ];
}
