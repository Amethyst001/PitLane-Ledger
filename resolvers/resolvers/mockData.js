// SHARED Mock Data - Single Source of Truth
// Both dashboard.js and index.js import from here to stay in sync
// 50 PARTS TOTAL: Mostly green/cyan (healthy), some yellow (warning), ONLY 1 red (critical)

export function getMockParts() {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    return [
        // POWER UNIT (8 parts) - All healthy green except 1 RED critical
        { id: 'pu-1', key: 'PIT-101', name: 'Power Unit ICE #1', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 85, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
        { id: 'pu-2', key: 'PIT-102', name: 'Power Unit MGU-H #1', pitlaneStatus: '✈️ In Transit', location: 'DHL Cargo', assignment: 'Spares', life: 92, lastUpdated: new Date(now - 5 * day).toISOString(), lifeRemaining: 5, predictiveStatus: 'HEALTHY' },
        { id: 'pu-3', key: 'PIT-103', name: 'Power Unit MGU-K #1', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 88, lastUpdated: new Date(now - 1 * day).toISOString(), lifeRemaining: 5, predictiveStatus: 'HEALTHY' },
        { id: 'pu-4', key: 'PIT-104', name: 'Power Unit Turbocharger #1', pitlaneStatus: '⚠️ DAMAGED', location: 'Quarantine', assignment: 'Unassigned', life: 15, lastUpdated: new Date(now - 8 * day).toISOString(), lifeRemaining: 0, predictiveStatus: 'CRITICAL' }, // THE ONLY RED ONE
        { id: 'pu-5', key: 'PIT-105', name: 'Power Unit ICE #2', pitlaneStatus: '🏁 Trackside', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 78, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
        { id: 'pu-6', key: 'PIT-106', name: 'Power Unit MGU-K #2', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 14 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
        { id: 'pu-7', key: 'PIT-107', name: 'Power Unit Battery #1', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 94, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 5, predictiveStatus: 'HEALTHY' },
        { id: 'pu-8', key: 'PIT-108', name: 'Power Unit MGU-H #2', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 10 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },

        // GEARBOX (6 parts) - 3 green, 3 yellow warnings
        { id: 'gb-1', key: 'PIT-201', name: 'Gearbox Casing Titanium #1', pitlaneStatus: '🏁 Trackside', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 78, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
        { id: 'gb-2', key: 'PIT-202', name: 'Gearbox Sequential Actuator', pitlaneStatus: '🏁 Trackside', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 88, lastUpdated: new Date(now - 1 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
        { id: 'gb-3', key: 'PIT-203', name: 'Gearbox Hydraulic System', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 82, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
        { id: 'gb-4', key: 'PIT-204', name: 'Gearbox Oil Cooler', pitlaneStatus: '✈️ In Transit', location: 'DHL Cargo', assignment: 'Spares', life: 45, lastUpdated: new Date(now - 6 * day).toISOString(), lifeRemaining: 2, predictiveStatus: 'WARNING' },
        { id: 'gb-5', key: 'PIT-205', name: 'Gearbox Casing Titanium #2', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 15 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
        { id: 'gb-6', key: 'PIT-206', name: 'Gearbox Differential', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 55, lastUpdated: new Date(now - 4 * day).toISOString(), lifeRemaining: 2, predictiveStatus: 'WARNING' },

        // AERO - FRONT WING (9 parts) - Mix of green and yellow
        { id: 'fw-1', key: 'PIT-301', name: 'Front Wing Assembly FW47 #1', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 60, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 2, predictiveStatus: 'WARNING' },
        { id: 'fw-2', key: 'PIT-302', name: 'Front Wing Endplate Left', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 80, lastUpdated: new Date(now - 4 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
        { id: 'fw-3', key: 'PIT-303', name: 'Front Wing Flap Upper', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 6 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
        { id: 'fw-4', key: 'PIT-304', name: 'Front Wing Mainplane High DF', pitlaneStatus: '🏁 Trackside', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 95, lastUpdated: new Date(now - 1 * day).toISOString(), lifeRemaining: 5, predictiveStatus: 'HEALTHY' },
        { id: 'fw-5', key: 'PIT-305', name: 'Front Wing Endplate Right', pitlaneStatus: '🏁 Trackside', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 72, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
        { id: 'fw-6', key: 'PIT-306', name: 'Front Wing Nose Cone', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 10 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
        { id: 'fw-7', key: 'PIT-307', name: 'Front Wing Cascade', pitlaneStatus: '✈️ In Transit', location: 'DHL Cargo', assignment: 'Spares', life: 90, lastUpdated: new Date(now - 4 * day).toISOString(), lifeRemaining: 5, predictiveStatus: 'HEALTHY' },
        { id: 'fw-8', key: 'PIT-308', name: 'Front Wing Assembly FW47 #2', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 20 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
        { id: 'fw-9', key: 'PIT-309', name: 'Front Wing Flap Lower', pitlaneStatus: '🏁 Trackside', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 50, lastUpdated: new Date(now - 5 * day).toISOString(), lifeRemaining: 2, predictiveStatus: 'WARNING' },

        // AERO - REAR WING (7 parts) - Mostly green with yellow warnings
        { id: 'rw-1', key: 'PIT-401', name: 'Rear Wing DRS Mainplane', pitlaneStatus: '🏁 Trackside', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 40, lastUpdated: new Date(now - 1 * day).toISOString(), lifeRemaining: 1, predictiveStatus: 'WARNING' },
        { id: 'rw-2', key: 'PIT-402', name: 'Rear Wing DRS Actuator', pitlaneStatus: '✈️ In Transit', location: 'DHL Cargo', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 7 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
        { id: 'rw-3', key: 'PIT-403', name: 'Beam Wing Carbon', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 70, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
        { id: 'rw-4', key: 'PIT-404', name: 'Rear Wing Assembly FW47', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 68, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
        { id: 'rw-5', key: 'PIT-405', name: 'Rear Wing Endplate Left', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 12 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
        { id: 'rw-6', key: 'PIT-406', name: 'Rear Wing Endplate Right', pitlaneStatus: '🏁 Trackside', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 85, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
        { id: 'rw-7', key: 'PIT-407', name: 'Rear Wing Gurney Flap', pitlaneStatus: '✈️ In Transit', location: 'DHL Cargo', assignment: 'Spares', life: 95, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 5, predictiveStatus: 'HEALTHY' },

        // FLOOR (5 parts)
        { id: 'fl-1', key: 'PIT-501', name: 'Floor Diffuser Carbon', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 50, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 2, predictiveStatus: 'WARNING' },
        { id: 'fl-2', key: 'PIT-502', name: 'Floor Plank Wooden', pitlaneStatus: '🏁 Trackside', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 35, lastUpdated: new Date(now - 10 * day).toISOString(), lifeRemaining: 1, predictiveStatus: 'WARNING' },
        { id: 'fl-3', key: 'PIT-503', name: 'Floor Edge Wing', pitlaneStatus: '✈️ In Transit', location: 'DHL Cargo', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 5 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
        { id: 'fl-4', key: 'PIT-504', name: 'Floor Diffuser Carbon #2', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 8 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
        { id: 'fl-5', key: 'PIT-505', name: 'Floor Skid Block', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 75, lastUpdated: new Date(now - 4 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },

        // SUSPENSION (4 parts)
        { id: 'sus-1', key: 'PIT-601', name: 'Front Wishbone Upper', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 80, lastUpdated: new Date(now - 5 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
        { id: 'sus-2', key: 'PIT-602', name: 'Front Wishbone Lower', pitlaneStatus: '🏁 Trackside', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 75, lastUpdated: new Date(now - 4 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
        { id: 'sus-3', key: 'PIT-603', name: 'Rear Wishbone Upper', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 82, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
        { id: 'sus-4', key: 'PIT-604', name: 'Damper Front Left', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 15 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },

        // WHEELS & TYRES (4 parts)
        { id: 'wh-1', key: 'PIT-701', name: 'Wheel Rim Front Left 13"', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 92, lastUpdated: new Date(now - 1 * day).toISOString(), lifeRemaining: 5, predictiveStatus: 'HEALTHY' },
        { id: 'wh-2', key: 'PIT-702', name: 'Wheel Rim Front Right 13"', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 90, lastUpdated: new Date(now - 1 * day).toISOString(), lifeRemaining: 5, predictiveStatus: 'HEALTHY' },
        { id: 'wh-3', key: 'PIT-703', name: 'Wheel Rim Rear Left 13"', pitlaneStatus: '🏁 Trackside', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 88, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
        { id: 'wh-4', key: 'PIT-704', name: 'Wheel Rim Rear Right 13"', pitlaneStatus: '🏁 Trackside', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 87, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },

        // BRAKES (3 parts)
        { id: 'br-1', key: 'PIT-801', name: 'Brake Disc Front Carbon', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 65, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
        { id: 'br-2', key: 'PIT-802', name: 'Brake Disc Rear Carbon', pitlaneStatus: '🏁 Trackside', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 58, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 2, predictiveStatus: 'WARNING' },
        { id: 'br-3', key: 'PIT-803', name: 'Brake Caliper AP Racing', pitlaneStatus: '✈️ In Transit', location: 'DHL Cargo', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 9 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },

        // ELECTRONICS (3 parts)
        { id: 'el-1', key: 'PIT-901', name: 'Steering Wheel Electronics', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 96, lastUpdated: new Date(now - 1 * day).toISOString(), lifeRemaining: 5, predictiveStatus: 'HEALTHY' },
        { id: 'el-2', key: 'PIT-902', name: 'ECU Standard FIA', pitlaneStatus: '🏁 Trackside', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 98, lastUpdated: new Date(now - 1 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
        { id: 'el-3', key: 'PIT-903', name: 'Wiring Loom Main', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 25 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },

        // CHASSIS (1 part to reach exactly 50)
        { id: 'ch-1', key: 'PIT-1', name: 'Chassis Monocoque FW46', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 90, lastUpdated: new Date(now - 10 * day).toISOString(), lifeRemaining: 5, predictiveStatus: 'HEALTHY' }
    ];
}
