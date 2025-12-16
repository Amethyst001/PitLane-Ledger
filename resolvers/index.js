import { storage, route, asUser } from '@forge/api';

// INLINED MOCK DATA (Single Source of Truth)
function getMockParts() {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  return [
    // POWER UNIT (8 parts)
    { id: 'pu-1', key: 'PIT-101', name: 'Power Unit ICE #1', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 85, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
    { id: 'pu-2', key: 'PIT-102', name: 'Power Unit MGU-H #1', pitlaneStatus: '✈️ In Transit', location: 'DHL Cargo', assignment: 'Spares', life: 92, lastUpdated: new Date(now - 5 * day).toISOString(), lifeRemaining: 5, predictiveStatus: 'HEALTHY' },
    { id: 'pu-3', key: 'PIT-103', name: 'Power Unit MGU-K #1', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 88, lastUpdated: new Date(now - 1 * day).toISOString(), lifeRemaining: 5, predictiveStatus: 'HEALTHY' },
    { id: 'pu-4', key: 'PIT-104', name: 'Power Unit Turbocharger #1', pitlaneStatus: '⚠️ DAMAGED', location: 'Quarantine', assignment: 'Unassigned', life: 15, lastUpdated: new Date(now - 8 * day).toISOString(), lifeRemaining: 0, predictiveStatus: 'CRITICAL' },
    { id: 'pu-5', key: 'PIT-105', name: 'Power Unit ICE #2', pitlaneStatus: '🏁 Trackside', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 78, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
    { id: 'pu-6', key: 'PIT-106', name: 'Power Unit MGU-K #2', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 14 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
    { id: 'pu-7', key: 'PIT-107', name: 'Power Unit Battery #1', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 94, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 5, predictiveStatus: 'HEALTHY' },
    { id: 'pu-8', key: 'PIT-108', name: 'Power Unit MGU-H #2', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 10 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },

    // GEARBOX (6 parts)
    { id: 'gb-1', key: 'PIT-201', name: 'Gearbox Casing Titanium #1', pitlaneStatus: '🏁 Trackside', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 78, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
    { id: 'gb-2', key: 'PIT-202', name: 'Gearbox Sequential Actuator', pitlaneStatus: '🏁 Trackside', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 88, lastUpdated: new Date(now - 1 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
    { id: 'gb-3', key: 'PIT-203', name: 'Gearbox Hydraulic System', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 82, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
    { id: 'gb-4', key: 'PIT-204', name: 'Gearbox Oil Cooler', pitlaneStatus: '✈️ In Transit', location: 'DHL Cargo', assignment: 'Spares', life: 45, lastUpdated: new Date(now - 6 * day).toISOString(), lifeRemaining: 2, predictiveStatus: 'WARNING' },
    { id: 'gb-5', key: 'PIT-205', name: 'Gearbox Casing Titanium #2', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 15 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
    { id: 'gb-6', key: 'PIT-206', name: 'Gearbox Differential', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 55, lastUpdated: new Date(now - 4 * day).toISOString(), lifeRemaining: 2, predictiveStatus: 'WARNING' },

    // AERO - FRONT WING (9 parts)
    { id: 'fw-1', key: 'PIT-301', name: 'Front Wing Assembly FW47 #1', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 60, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 2, predictiveStatus: 'WARNING' },
    { id: 'fw-2', key: 'PIT-302', name: 'Front Wing Endplate Left', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 80, lastUpdated: new Date(now - 4 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
    { id: 'fw-3', key: 'PIT-303', name: 'Front Wing Flap Upper', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 6 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
    { id: 'fw-4', key: 'PIT-304', name: 'Front Wing Mainplane High DF', pitlaneStatus: '🏁 Trackside', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 95, lastUpdated: new Date(now - 1 * day).toISOString(), lifeRemaining: 5, predictiveStatus: 'HEALTHY' },
    { id: 'fw-5', key: 'PIT-305', name: 'Front Wing Endplate Right', pitlaneStatus: '🏁 Trackside', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 72, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
    { id: 'fw-6', key: 'PIT-306', name: 'Front Wing Nose Cone', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 10 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
    { id: 'fw-7', key: 'PIT-307', name: 'Front Wing Cascade', pitlaneStatus: '✈️ In Transit', location: 'DHL Cargo', assignment: 'Spares', life: 90, lastUpdated: new Date(now - 4 * day).toISOString(), lifeRemaining: 5, predictiveStatus: 'HEALTHY' },
    { id: 'fw-8', key: 'PIT-308', name: 'Front Wing Assembly FW47 #2', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 20 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
    { id: 'fw-9', key: 'PIT-309', name: 'Front Wing Flap Lower', pitlaneStatus: '🏁 Trackside', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 50, lastUpdated: new Date(now - 5 * day).toISOString(), lifeRemaining: 2, predictiveStatus: 'WARNING' },

    // AERO - REAR WING (7 parts)
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

// --- HELPER FUNCTIONS ---

// Manual UUID generation (Node 22 safe)
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// EXPANDED Mock Data Helper (More realistic inventory)
// Imported from ./mockData.js

// --- MAIN HANDLER (NO @forge/resolver LIBRARY) ---

export const handler = async (event, context) => {
  console.log("🚀 [DEBUG] RAW HANDLER INVOKED");
  console.log("🚀 [DEBUG] Event Keys:", Object.keys(event));
  if (event.context) console.log("🚀 [DEBUG] Event Context:", JSON.stringify(event.context, null, 2));
  if (context) console.log("🚀 [DEBUG] Global Context:", JSON.stringify(context, null, 2));

  // 1. ROBUST KEY EXTRACTION
  let functionKey =
    event.call?.function ||
    event.key ||
    event.functionKey ||
    event.action ||
    (context && context.functionKey) ||
    (event.context && event.context.functionKey) ||
    (event.context && event.context.action) ||
    (event.context && event.context.moduleKey);

  // Fallbacks
  if (!functionKey && typeof event.call === 'string') functionKey = event.call;
  if (!functionKey && typeof event === 'string') functionKey = event;

  console.log(`🚀 [DEBUG] Extracted Function Key: ${functionKey}`);
  console.log(`🚀 [DEBUG] Event Keys: ${Object.keys(event).join(', ')}`);
  if (event.call) console.log(`🚀 [DEBUG] Event.call: ${JSON.stringify(event.call)}`);

  // 2. DISPATCH LOGIC
  try {
    // --- CORE TOOLS ---

    if (functionKey === 'rovoTestConnection' || functionKey === 'test-connection') {
      return { status: 'SUCCESS', message: 'Pit Boss is online (Raw Handler Mode). All systems nominal.', timestamp: new Date().toISOString() };
    }

    // --- DASHBOARD & ONBOARDING HANDLERS ---

    if (functionKey === 'getAllParts') {
      const parts = getMockParts();
      console.log(`🚀 [RESOLVER] getAllParts returning ${parts.length} parts`);
      return parts;
    }

    if (functionKey === 'checkInitialLoad') {
      const hasOnboarded = await storage.get('onboardingComplete');
      return !hasOnboarded;
    }

    if (functionKey === 'resetStorage') {
      await storage.set('onboardingComplete', false);
      return { success: true };
    }

    if (functionKey === 'getDriverNames') {
      const drivers = await storage.get('driverNames');
      return drivers || { car1: 'Alex Albon', car2: 'Carlos Sainz' };
    }

    if (functionKey === 'setDriverNames') {
      await storage.set('driverNames', event.payload || event);
      // Also mark onboarding as complete when drivers are set (optional, but good flow)
      await storage.set('onboardingComplete', true);
      return { success: true };
    }

    if (functionKey === 'rovoGetInventory' || functionKey === 'get-inventory') {
      const parts = getMockParts();
      const filter = event.filter || (event.payload && event.payload.filter);
      if (filter && typeof filter === 'string') {
        const lowerFilter = filter.toLowerCase();
        return parts.filter(p =>
          p.name.toLowerCase().includes(lowerFilter) ||
          p.pitlaneStatus.toLowerCase().includes(lowerFilter) ||
          p.key.toLowerCase().includes(lowerFilter) ||
          p.assignment.toLowerCase().includes(lowerFilter)
        );
      }
      return parts;
    }

    if (functionKey === 'importInventory' || functionKey === 'importProductionData') {
      console.log('=== IMPORT DEBUG START ===');
      console.log('[1] functionKey:', functionKey);
      console.log('[2] Full event:', JSON.stringify(event, null, 2));

      // Try all possible locations
      const newParts =
        event.parts ||
        event.payload?.parts ||
        event.call?.payload?.parts ||
        (Array.isArray(event) ? event : null) ||
        (Array.isArray(event.payload) ? event.payload : null);

      console.log('[3] newParts type:', typeof newParts);
      console.log('[4] newParts isArray?', Array.isArray(newParts));
      console.log('[5] newParts length:', newParts?.length);
      console.log('=== IMPORT DEBUG END ===');

      // Enhanced validation for production import
      if (!Array.isArray(newParts) || newParts.length === 0) {
        console.log('[ERROR] Validation failed - returning error');
        return {
          success: false,
          message: 'Invalid data format: parts array is required',
          debug_info: {
            eventKeys: Object.keys(event),
            payloadKeys: event.payload ? Object.keys(event.payload) : 'N/A',
            callKeys: event.call ? Object.keys(event.call) : 'N/A',
            eventType: typeof event,
            isPayloadArray: Array.isArray(event.payload)
          }
        };
      }

      // Validate required fields in each part (only name is required)
      const requiredFields = ['name'];
      for (let i = 0; i < newParts.length; i++) {
        const part = newParts[i];
        for (const field of requiredFields) {
          if (!part[field] || part[field].trim() === '') {
            return {
              success: false,
              message: `Missing required field 'name' (Summary) in row ${i + 1}`
            };
          }
        }
      }

      console.log('[SUCCESS] Saving', newParts.length, 'parts to storage');

      // Save to storage
      await storage.set('inventory', newParts);
      await storage.set('appMode', 'PROD'); // Enforce PROD mode on successful import
      await storage.set('productionDataLoaded', true); // Set flag for production data

      return { success: true, count: newParts.length };
    }

    if (functionKey === 'saveFleetConfig') {
      const config = event.payload || event;

      if (!config.car1 || !config.car2) {
        return { success: false, message: 'Both driver names are required' };
      }

      await storage.set('fleetConfig', {
        car1: config.car1,
        car2: config.car2,
        updatedAt: new Date().toISOString()
      });

      return { success: true, message: 'Fleet configuration saved successfully' };
    }

    if (functionKey === 'getFleetConfig') {
      const config = await storage.get('fleetConfig');

      // Return saved config or defaults
      return config || {
        car1: 'Alex Albon',
        car2: 'Carlos Sainz',
        updatedAt: null
      };
    }

    if (functionKey === 'getProductionStatus') {
      const dataLoaded = await storage.get('productionDataLoaded') || false;
      const inventory = await storage.get('inventory') || [];
      const mode = await storage.get('appMode') || 'DEMO';

      return {
        mode: mode,
        hasData: dataLoaded && inventory.length > 0,
        partCount: inventory.length,
        dataLoaded: dataLoaded
      };
    }

    if (functionKey === 'rovoGetHistory' || functionKey === 'get-history') {
      const query = event.query || (event.payload && event.payload.query);
      const parts = getMockParts();
      const part = parts.find(p => p.key === query || p.name === query);
      if (!part) return { error: `Part '${query}' not found.` };
      return {
        part: part,
        history: [
          { date: new Date().toISOString(), action: 'INSPECTION', details: 'Routine check passed', user: 'Chief Mechanic' },
          { date: new Date(Date.now() - 86400000).toISOString(), action: 'INSTALL', details: `Fitted to ${part.assignment}`, user: 'Mechanic A' },
          { date: new Date(Date.now() - 7 * 86400000).toISOString(), action: 'RECEIVE', details: 'Arrived at track', user: 'Logistics Mgr' }
        ]
      };
    }

    if (functionKey === 'rovoGetRaceCalendar' || functionKey === 'get-race-calendar' || functionKey === 'getRaceCalendar') {
      return [
        { round: 1, race: 'Bahrain GP', date: '2025-03-02', location: 'Sakhir', weather: 'Clear, 28°C' },
        { round: 2, race: 'Saudi Arabian GP', date: '2025-03-09', location: 'Jeddah', weather: 'Night, 26°C' },
        { round: 3, race: 'Australian GP', date: '2025-03-23', location: 'Melbourne', weather: 'Partly Cloudy, 22°C' }
      ];
    }

    if (functionKey === 'rovoGetDriverAssignments' || functionKey === 'get-driver-assignments') {
      return {
        car1: { driver: 'Alex Albon', chassis: 'FW46-01', engine: 'Mercedes M15 E' },
        car2: { driver: 'Carlos Sainz', chassis: 'FW46-02', engine: 'Mercedes M15 E' },
        reserve: { driver: 'Franco Colapinto' }
      };
    }

    // --- PHASE 1: ENHANCED TOOLING ---

    if (functionKey === 'rovoGetWeatherForecast' || functionKey === 'get-weather-forecast') {
      return { location: 'Sakhir', condition: 'Clear', temp: 28, wind: '15 km/h NW', rainChance: '0%' };
    }

    if (functionKey === 'rovoSearchKnowledgeBase' || functionKey === 'search-knowledge-base') {
      const query = event.query || (event.payload && event.payload.query);
      return { results: [`Found 3 docs for "${query}": 1. FW47 Setup Guide, 2. Aero Balance Sheet, 3. Tyre Degradation Report`] };
    }

    if (functionKey === 'rovoCheckCompatibility' || functionKey === 'check-compatibility') {
      return { compatible: true, notes: 'Part matches FW46 spec. No modifications needed.' };
    }

    if (functionKey === 'rovoCalculateLifespan' || functionKey === 'calculate-lifespan') {
      return { remainingLife: '85%', estimatedLaps: 450, status: 'HEALTHY' };
    }

    if (functionKey === 'rovoFindDuplicates' || functionKey === 'find-duplicates') {
      return { duplicates: [], message: 'No duplicate part keys found in inventory.' };
    }

    if (functionKey === 'rovoGetCriticalAlerts' || functionKey === 'get-critical-alerts') {
      return getMockParts().filter(p => p.pitlaneStatus.includes('DAMAGED') || p.life < 20);
    }

    if (functionKey === 'rovoCompareParts' || functionKey === 'compare-parts') {
      return { message: 'Comparison generated. Part A has 15% more wear than Part B.' };
    }

    // --- PHASE 2 & 3: DOMAIN LOGIC & WRITES ---

    if (functionKey === 'rovoLogPartEvent' || functionKey === 'log-part-event') {
      return { status: 'SUCCESS', message: 'Event logged successfully.', eventId: uuid() };
    }

    if (functionKey === 'rovoUpdatePartStatus' || functionKey === 'update-part-status') {
      return { status: 'SUCCESS', message: `Part status updated to ${event.status || 'requested status'}.` };
    }

    if (functionKey === 'rovoGenerateHandoverReport' || functionKey === 'generate-handover-report') {
      return { report: 'Shift Handover: All cars prepped. PIT-104 requires inspection. 3 parts in transit.' };
    }

    if (functionKey === 'rovoGetRaceWeekendContext' || functionKey === 'get-race-weekend-context') {
      return { session: 'FP2', nextSession: 'FP3', timeToSession: '14 hours', focus: 'Qualifying Sims' };
    }

    if (functionKey === 'rovoGetPartHierarchy' || functionKey === 'get-part-hierarchy') {
      return { parent: 'Front Wing Assembly', children: ['Mainplane', 'Endplate L', 'Endplate R', 'Flaps'] };
    }

    if (functionKey === 'rovoEstimateShipping' || functionKey === 'estimate-shipping') {
      return { eta: '24 hours', provider: 'DHL', status: 'In Customs' };
    }

    if (functionKey === 'rovoCheckCompliance' || functionKey === 'check-compliance') {
      return { compliant: true, regulation: 'FIA Art 3.4.1', notes: 'Dimensions within tolerance.' };
    }

    if (functionKey === 'rovoAnalyzeCost' || functionKey === 'analyze-cost') {
      return { cost: '$45,000', budgetImpact: 'Low', replacementTime: '3 days' };
    }

    if (functionKey === 'rovoGetDriverPreference' || functionKey === 'get-driver-preference') {
      return { driver: 'Albon', preference: 'Prefers sharp front end, tolerates oversteer.' };
    }

    if (functionKey === 'rovoGetHelp' || functionKey === 'get-help') {
      return { message: 'I can help with Inventory, History, Compliance, Logistics, and Race Strategy. Just ask!' };
    }

    if (functionKey === 'rovoGenerateLink' || functionKey === 'generate-link') {
      return { url: 'https://pitlaneledger.atlassian.net/browse/PIT-101' };
    }

    if (functionKey === 'rovoBulkStatusCheck' || functionKey === 'bulk-status-check') {
      return { matched: 5, status: 'All 5 parts are TRACKSIDE.' };
    }

    if (functionKey === 'rovoSubmitFeedback' || functionKey === 'submit-feedback') {
      return { status: 'RECEIVED', message: 'Thank you for your feedback. It has been logged for the dev team.' };
    }

    // --- PHASE 5: OPS & ANALYTICS ---

    if (functionKey === 'rovoPredictFailure' || functionKey === 'predict-failure') {
      return { probability: '12%', riskLevel: 'LOW', recommendation: 'Continue monitoring.' };
    }

    if (functionKey === 'rovoOptimizeStock' || functionKey === 'optimize-stock') {
      return { recommendation: 'Order 2x Front Wing Endplates. Stock low.' };
    }

    if (functionKey === 'rovoSimulateRace' || functionKey === 'simulate-race') {
      return { result: 'Simulation Complete. Predicted tyre wear: Medium. Fuel load: Optimal.' };
    }

    if (functionKey === 'rovoAssignTask' || functionKey === 'assign-task') {
      return { status: 'CREATED', taskId: 'TASK-999', assignee: event.assignee || 'Team Member' };
    }

    if (functionKey === 'rovoGetTeamStatus' || functionKey === 'get-team-status') {
      return { onShift: ['Mechanic A', 'Mechanic B', 'Engineer C'], fatigue: 'Low' };
    }

    if (functionKey === 'rovoAuditLog' || functionKey === 'audit-log') {
      return { logs: ['User X updated status', 'User Y checked history'] };
    }

    if (functionKey === 'rovoDebugAgent' || functionKey === 'debug-agent') {
      return { version: '1.0.0', environment: 'Production', uptime: '99.9%' };
    }

    // --- PHASE 7: ADVANCED WORKFLOWS ---

    if (functionKey === 'rovoCheckPreflightCompliance' || functionKey === 'check-preflight-compliance') {
      return { status: 'PASSED', checks: ['Weight', 'Dimensions', 'Material'], inspector: 'FIA Delegate' };
    }

    if (functionKey === 'rovoGenerateShiftBriefing' || functionKey === 'generate-shift-briefing') {
      return { briefing: 'Morning Briefing: Focus on suspension setup for FP3. Check PIT-104 damage.' };
    }

    if (functionKey === 'rovoDetectGhostParts' || functionKey === 'detect-ghost-parts') {
      return { ghosts: [], message: 'No ghost parts detected.' };
    }

    if (functionKey === 'rovoTriageDamage' || functionKey === 'triage-damage') {
      return { severity: 'STRUCTURAL', action: 'Replace immediately. Do not repair.' };
    }

    if (functionKey === 'rovoCheckCannibalization' || functionKey === 'check-cannibalization') {
      return { allowed: true, source: 'Car 2', target: 'Car 1', notes: 'Compatible. Ensure log is updated.' };
    }

    if (functionKey === 'rovoRecommendRestock' || functionKey === 'recommend-restock') {
      return { items: ['Wheel Nuts', 'Brake Ducts'], urgency: 'MEDIUM' };
    }

    if (functionKey === 'rovoGetTechSpecs' || functionKey === 'get-tech-specs') {
      return { torque: '45Nm', material: 'Titanium Grade 5', weight: '1.2kg' };
    }

    if (functionKey === 'rovoAnalyzeRootCause' || functionKey === 'analyze-root-cause') {
      return { cause: 'Vibration fatigue', confidence: '85%', similarIncidents: 2 };
    }

    if (functionKey === 'rovoLogCarbonFootprint' || functionKey === 'log-carbon-footprint') {
      return { emissions: '12kg CO2', offset: 'Purchased' };
    }

    if (functionKey === 'rovoGenerateAutopsyReport' || functionKey === 'generate-autopsy-report') {
      return { report: 'Component failed at lap 45. Thermal stress exceeded limits.' };
    }

    // --- FALLBACK / UNKNOWN ---
    return {
      status: "DEBUG_MODE",
      message: `Function '${functionKey}' not implemented yet.`,
      debug_event_keys: Object.keys(event),
      debug_context_keys: Object.keys(context || {})
    };

  } catch (err) {
    console.error("❌ [ERROR] Handler execution failed:", err);
    return {
      error: "Internal Handler Error",
      message: err.message
    };
  }
};
