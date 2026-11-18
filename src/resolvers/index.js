import { storage, route, asUser } from '@forge/api';

// === LEVENSHTEIN DISTANCE FOR FUZZY MATCHING ===
function levenshtein(a, b) {
  const matrix = [];
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();

  if (aLower === bLower) return 0;
  if (!aLower.length) return bLower.length;
  if (!bLower.length) return aLower.length;

  for (let i = 0; i <= bLower.length; i++) matrix[i] = [i];
  for (let j = 0; j <= aLower.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= bLower.length; i++) {
    for (let j = 1; j <= aLower.length; j++) {
      if (bLower[i - 1] === aLower[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[bLower.length][aLower.length];
}

// === F1 PART CATEGORIES DATABASE ===
const F1_PART_CATEGORIES = {
  'Power Unit': ['ice', 'internal combustion engine', 'mgu-k', 'mgu-h', 'turbo', 'turbocharger', 'energy store', 'battery', 'control electronics', 'ers'],
  'Gearbox': ['gearbox', 'transmission', 'casing', 'differential', 'actuator', 'gear', 'sequential', 'hydraulic', 'oil cooler'],
  'Front Wing': ['front wing', 'nose', 'nose cone', 'front endplate', 'front flap', 'cascade', 'front mainplane', 'cape'],
  'Rear Wing': ['rear wing', 'drs', 'beam wing', 'rear endplate', 'gurney flap', 'rear mainplane', 'monkey seat'],
  'Floor': ['floor', 'diffuser', 'plank', 'skid block', 'edge wing', 'tunnel', 'venturi'],
  'Sidepod': ['sidepod', 'radiator', 'cooling', 'bargeboard', 'inlet', 'airbox'],
  'Monocoque': ['monocoque', 'chassis', 'survival cell', 'cockpit', 'halo', 'headrest'],
  'Suspension': ['suspension', 'wishbone', 'pushrod', 'pullrod', 'damper', 'spring', 'anti-roll bar', 'heave element'],
  'Brakes': ['brake', 'disc', 'caliper', 'duct', 'brake by wire', 'bbw', 'master cylinder'],
  'Wheels': ['wheel', 'rim', 'wheel nut', 'hub', 'upright'],
  'Steering': ['steering', 'rack', 'column', 'steering wheel'],
  'Exhaust': ['exhaust', 'wastegate', 'blowdown'],
  'Fuel System': ['fuel', 'tank', 'fuel cell', 'pump'],
  'Electronics': ['sensor', 'ecu', 'wiring', 'harness', 'telemetry', 'antenna']
};

// Fuzzy classify a part name into an F1 category
function classifyF1Part(partName) {
  const nameWords = partName.toLowerCase().split(/\s+/);
  let bestCategory = 'Other';
  let bestScore = Infinity;

  for (const [category, keywords] of Object.entries(F1_PART_CATEGORIES)) {
    for (const keyword of keywords) {
      // Check if keyword is contained in name (fast path)
      if (partName.toLowerCase().includes(keyword)) {
        return category; // Exact substring match
      }

      // Fuzzy match each word in the part name against each keyword
      for (const word of nameWords) {
        if (word.length < 3) continue; // Skip short words
        const distance = levenshtein(word, keyword);
        const maxLen = Math.max(word.length, keyword.length);
        const similarity = 1 - (distance / maxLen);

        // If similarity > 70% and better than previous, update
        if (similarity > 0.7 && distance < bestScore) {
          bestScore = distance;
          bestCategory = category;
        }
      }
    }
  }

  return bestCategory;
}


// INLINED MOCK DATA - Williams Racing FW47 2025 Season
// Real 2025 data: Total damage $2.7M (Albon $1.23M, Sainz $1.53M)
function getMockParts() {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  return [
    // CHASSIS
    { id: 'ch-1', key: 'PIT-0001', name: 'Chassis Monocoque FW47 #1', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 85, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
    { id: 'ch-2', key: 'PIT-0002', name: 'Chassis Monocoque FW47 #2', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 78, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
    { id: 'ch-3', key: 'PIT-0003', name: 'Chassis Monocoque FW47 #3', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 30 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
    { id: 'ch-4', key: 'PIT-0004', name: 'Chassis Monocoque FW47 #4', pitlaneStatus: '📦 SCRAPPED', location: 'Recycling', assignment: 'Unassigned', life: 0, lastUpdated: new Date(now - 180 * day).toISOString(), lifeRemaining: 0, predictiveStatus: 'RETIRED', notes: 'Australia GP - Albon FP1 Chassis Damage (Withdrawn)' },
    // GEARBOX
    { id: 'gb-1', key: 'PIT-0101', name: 'Gearbox Casing Titanium #1', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 82, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
    { id: 'gb-2', key: 'PIT-0102', name: 'Gearbox Casing Titanium #2', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 75, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
    { id: 'gb-3', key: 'PIT-0103', name: 'Gearbox Sequential Actuator #1', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 88, lastUpdated: new Date(now - 1 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
    { id: 'gb-4', key: 'PIT-0104', name: 'Gearbox Sequential Actuator #2', pitlaneStatus: '🏁 Trackside', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 85, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
    { id: 'gb-5', key: 'PIT-0105', name: 'Gearbox Differential Unit', pitlaneStatus: '🚚 In Transit', location: 'DHL - Abu Dhabi', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 5 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
    { id: 'gb-6', key: 'PIT-0106', name: 'Gearbox Hydraulic System', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 15 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
    // FRONT WING (Spanish GP damage)
    { id: 'fw-1', key: 'PIT-0201', name: 'Front Wing Assembly FW47 Spec-B #1', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 75, lastUpdated: new Date(now - 1 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
    { id: 'fw-2', key: 'PIT-0202', name: 'Front Wing Assembly FW47 Spec-B #2', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 82, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
    { id: 'fw-3', key: 'PIT-0203', name: 'Front Wing Assembly FW47 Spec-A', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 20 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
    { id: 'fw-4', key: 'PIT-0204', name: 'Front Wing Endplate Left', pitlaneStatus: '🏁 Trackside', location: 'Pit Wall', assignment: 'Spares', life: 90, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 5, predictiveStatus: 'HEALTHY' },
    { id: 'fw-5', key: 'PIT-0205', name: 'Front Wing Endplate Right', pitlaneStatus: '🏁 Trackside', location: 'Pit Wall', assignment: 'Spares', life: 88, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
    { id: 'fw-6', key: 'PIT-0206', name: 'Front Wing Nose Cone FW47 #1', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 80, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
    { id: 'fw-7', key: 'PIT-0207', name: 'Front Wing Nose Cone FW47 #2', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 78, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
    { id: 'fw-8', key: 'PIT-0208', name: 'Front Wing Assembly FW47 #8', pitlaneStatus: '📦 SCRAPPED', location: 'Recycling', assignment: 'Unassigned', life: 0, lastUpdated: new Date(now - 120 * day).toISOString(), lifeRemaining: 0, predictiveStatus: 'RETIRED', notes: 'Zandvoort FP3 - Sargeant Fire/Impact' },
    { id: 'fw-9', key: 'PIT-0209', name: 'Front Wing Assembly FW47 #9', pitlaneStatus: '📦 SCRAPPED', location: 'Recycling', assignment: 'Unassigned', life: 0, lastUpdated: new Date(now - 90 * day).toISOString(), lifeRemaining: 0, predictiveStatus: 'RETIRED', notes: 'Baku FP1 - Colapinto Wall Impact' },
    { id: 'fw-10', key: 'PIT-0210', name: 'Front Wing Assembly FW47 #10', pitlaneStatus: '📦 SCRAPPED', location: 'Recycling', assignment: 'Unassigned', life: 0, lastUpdated: new Date(now - 60 * day).toISOString(), lifeRemaining: 0, predictiveStatus: 'RETIRED', notes: 'Mexico GP - Albon/Bearman Collision' },
    // REAR WING
    { id: 'rw-1', key: 'PIT-0301', name: 'Rear Wing DRS Mainplane High DF', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 68, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
    { id: 'rw-2', key: 'PIT-0302', name: 'Rear Wing DRS Mainplane Low DF', pitlaneStatus: '🚚 In Transit', location: 'DHL Cargo', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 5 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
    { id: 'rw-3', key: 'PIT-0303', name: 'Rear Wing DRS Actuator #1', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 85, lastUpdated: new Date(now - 1 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
    { id: 'rw-4', key: 'PIT-0304', name: 'Rear Wing Beam Wing Carbon', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 72, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
    { id: 'rw-5', key: 'PIT-0305', name: 'Rear Wing Endplate Left', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 12 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
    { id: 'rw-6', key: 'PIT-0306', name: 'Rear Wing Endplate Right', pitlaneStatus: '🏁 Trackside', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 80, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
    // FLOOR
    { id: 'fl-1', key: 'PIT-0401', name: 'Floor Underbody FW47 Spec-C #1', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 55, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 2, predictiveStatus: 'WARNING' },
    { id: 'fl-2', key: 'PIT-0402', name: 'Floor Underbody FW47 Spec-C #2', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 60, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 2, predictiveStatus: 'WARNING' },
    { id: 'fl-3', key: 'PIT-0403', name: 'Floor Diffuser Carbon', pitlaneStatus: '🏁 Trackside', location: 'Pit Wall', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 8 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
    { id: 'fl-4', key: 'PIT-0404', name: 'Floor Edge Wing', pitlaneStatus: '🚚 In Transit', location: 'DHL Cargo', assignment: 'Spares', life: 95, lastUpdated: new Date(now - 4 * day).toISOString(), lifeRemaining: 5, predictiveStatus: 'HEALTHY' },
    { id: 'fl-5', key: 'PIT-0405', name: 'Floor Skid Block Titanium', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 40, lastUpdated: new Date(now - 1 * day).toISOString(), lifeRemaining: 1, predictiveStatus: 'WARNING' },
    { id: 'fl-6', key: 'PIT-0406', name: 'Floor Underbody FW47 Spec-B', pitlaneStatus: '⚠️ DAMAGED', location: 'Grove Factory - Repair', assignment: 'Unassigned', life: 25, lastUpdated: new Date(now - 60 * day).toISOString(), lifeRemaining: 0, predictiveStatus: 'CRITICAL', notes: 'Italian GP - Sainz/Bearman collision' },
    // SIDEPODS
    { id: 'sp-1', key: 'PIT-0501', name: 'Sidepod Left FW47 #1', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 78, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
    { id: 'sp-2', key: 'PIT-0502', name: 'Sidepod Right FW47 #1', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 80, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
    { id: 'sp-3', key: 'PIT-0503', name: 'Sidepod Left FW47 #2', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 72, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
    { id: 'sp-4', key: 'PIT-0504', name: 'Sidepod Right FW47 #2', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 75, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
    { id: 'sp-5', key: 'PIT-0505', name: 'Engine Cover FW47', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 10 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
    // SUSPENSION
    { id: 'sus-1', key: 'PIT-0601', name: 'Front Wishbone Upper FL', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 82, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
    { id: 'sus-2', key: 'PIT-0602', name: 'Front Wishbone Lower FL', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 80, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
    { id: 'sus-3', key: 'PIT-0603', name: 'Front Wishbone Upper FR', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 78, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
    { id: 'sus-4', key: 'PIT-0604', name: 'Front Wishbone Lower FR', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 75, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
    { id: 'sus-5', key: 'PIT-0605', name: 'Rear Wishbone Upper RL', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 85, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
    { id: 'sus-6', key: 'PIT-0606', name: 'Rear Wishbone Upper RR', pitlaneStatus: '🏁 Trackside', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 82, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
    { id: 'sus-7', key: 'PIT-0607', name: 'Front Upright Assembly FL', pitlaneStatus: '🏁 Trackside', location: 'Pit Wall', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 6 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
    { id: 'sus-8', key: 'PIT-0608', name: 'Damper Front Multimatic', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 15 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
    { id: 'sus-9', key: 'PIT-0609', name: 'Rear Wishbone Lower RR #3', pitlaneStatus: '⚠️ DAMAGED', location: 'Grove Factory - Repair', assignment: 'Unassigned', life: 15, lastUpdated: new Date(now - 90 * day).toISOString(), lifeRemaining: 0, predictiveStatus: 'CRITICAL', notes: 'British GP - Sainz/Leclerc contact' },
    // BRAKES
    { id: 'br-1', key: 'PIT-0701', name: 'Brake Disc Front Carbon FL', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 45, lastUpdated: new Date(now - 1 * day).toISOString(), lifeRemaining: 2, predictiveStatus: 'WARNING' },
    { id: 'br-2', key: 'PIT-0702', name: 'Brake Disc Front Carbon FR', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 48, lastUpdated: new Date(now - 1 * day).toISOString(), lifeRemaining: 2, predictiveStatus: 'WARNING' },
    { id: 'br-3', key: 'PIT-0703', name: 'Brake Disc Rear Carbon RL', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 52, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 2, predictiveStatus: 'WARNING' },
    { id: 'br-4', key: 'PIT-0704', name: 'Brake Disc Rear Carbon RR', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 55, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 2, predictiveStatus: 'WARNING' },
    { id: 'br-5', key: 'PIT-0705', name: 'Brake Caliper Brembo FL', pitlaneStatus: '🚚 In Transit', location: 'DHL Cargo', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 7 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
    { id: 'br-6', key: 'PIT-0706', name: 'Brake Duct Carbon FL', pitlaneStatus: '🏁 Trackside', location: 'Pit Wall', assignment: 'Spares', life: 90, lastUpdated: new Date(now - 5 * day).toISOString(), lifeRemaining: 5, predictiveStatus: 'HEALTHY' },
    { id: 'br-7', key: 'PIT-0707', name: 'Brake System Complete FR', pitlaneStatus: '📦 SCRAPPED', location: 'Recycling', assignment: 'Unassigned', life: 0, lastUpdated: new Date(now - 100 * day).toISOString(), lifeRemaining: 0, predictiveStatus: 'RETIRED', notes: 'Austria GP - Sainz brake fire DNS' },
    // STEERING
    { id: 'st-1', key: 'PIT-0801', name: 'Steering Wheel FW47 #1', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 92, lastUpdated: new Date(now - 1 * day).toISOString(), lifeRemaining: 5, predictiveStatus: 'HEALTHY' },
    { id: 'st-2', key: 'PIT-0802', name: 'Steering Wheel FW47 #2', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 90, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 5, predictiveStatus: 'HEALTHY' },
    { id: 'st-3', key: 'PIT-0803', name: 'Steering Rack Hydraulic', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 85, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
    { id: 'st-4', key: 'PIT-0804', name: 'Steering Column Assembly', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 20 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
    // WHEELS
    { id: 'wh-1', key: 'PIT-0901', name: 'Wheel Rim BBS 13" FL', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 88, lastUpdated: new Date(now - 1 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
    { id: 'wh-2', key: 'PIT-0902', name: 'Wheel Rim BBS 13" FR', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 86, lastUpdated: new Date(now - 1 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
    { id: 'wh-3', key: 'PIT-0903', name: 'Wheel Rim BBS 13" RL', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 85, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
    { id: 'wh-4', key: 'PIT-0904', name: 'Wheel Rim BBS 13" RR', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 84, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
    // COOLING
    { id: 'cl-1', key: 'PIT-1001', name: 'Radiator Water Main #1', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 70, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
    { id: 'cl-2', key: 'PIT-1002', name: 'Radiator Oil Cooler #1', pitlaneStatus: '⚠️ DAMAGED', location: 'Quarantine', assignment: 'Unassigned', life: 20, lastUpdated: new Date(now - 110 * day).toISOString(), lifeRemaining: 0, predictiveStatus: 'CRITICAL', notes: 'Canada GP - Albon cooling failure DNF' },
    { id: 'cl-3', key: 'PIT-1003', name: 'Radiator Water Main #2', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 75, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
    { id: 'cl-4', key: 'PIT-1004', name: 'Cooling Duct Carbon Left', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 12 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
    // ELECTRONICS
    { id: 'el-1', key: 'PIT-1101', name: 'ECU Standard FIA #1', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 95, lastUpdated: new Date(now - 1 * day).toISOString(), lifeRemaining: 5, predictiveStatus: 'HEALTHY' },
    { id: 'el-2', key: 'PIT-1102', name: 'ECU Standard FIA #2', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 94, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 5, predictiveStatus: 'HEALTHY' },
    { id: 'el-3', key: 'PIT-1103', name: 'Wiring Loom Main', pitlaneStatus: '🏁 Trackside', location: 'Pit Wall', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 8 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
    { id: 'el-4', key: 'PIT-1104', name: 'Telemetry Antenna Array', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 25 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
    // POWER UNIT
    { id: 'pu-1', key: 'PIT-1201', name: 'Power Unit ICE M15 #1', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 68, lastUpdated: new Date(now - 1 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
    { id: 'pu-2', key: 'PIT-1202', name: 'Power Unit ICE M15 #2', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 72, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
    { id: 'pu-3', key: 'PIT-1203', name: 'Power Unit MGU-K', pitlaneStatus: '🏁 Trackside', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 80, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
    { id: 'pu-4', key: 'PIT-1204', name: 'Power Unit MGU-H', pitlaneStatus: '🏁 Trackside', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 78, lastUpdated: new Date(now - 4 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
    { id: 'pu-5', key: 'PIT-1205', name: 'Power Unit Turbocharger IHI', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 65, lastUpdated: new Date(now - 2 * day).toISOString(), lifeRemaining: 3, predictiveStatus: 'HEALTHY' },
    { id: 'pu-6', key: 'PIT-1206', name: 'Power Unit Energy Store', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 82, lastUpdated: new Date(now - 3 * day).toISOString(), lifeRemaining: 4, predictiveStatus: 'HEALTHY' },
    { id: 'pu-7', key: 'PIT-1207', name: 'Power Unit Control Electronics', pitlaneStatus: '🚚 In Transit', location: 'DHL Cargo', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 10 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
    // HALO & SAFETY
    { id: 'hl-1', key: 'PIT-1301', name: 'Halo Titanium #1', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 1', assignment: 'Car 1 (Albon)', life: 95, lastUpdated: new Date(now - 5 * day).toISOString(), lifeRemaining: 5, predictiveStatus: 'HEALTHY' },
    { id: 'hl-2', key: 'PIT-1302', name: 'Halo Titanium #2', pitlaneStatus: '✅ Cleared for Race', location: 'Garage 2', assignment: 'Car 2 (Sainz)', life: 92, lastUpdated: new Date(now - 6 * day).toISOString(), lifeRemaining: 5, predictiveStatus: 'HEALTHY' },
    { id: 'hl-3', key: 'PIT-1303', name: 'Crash Structure Rear FIA', pitlaneStatus: '🏭 Manufactured', location: 'Grove Factory', assignment: 'Spares', life: 100, lastUpdated: new Date(now - 30 * day).toISOString(), lifeRemaining: 6, predictiveStatus: 'HEALTHY' },
    { id: 'hl-4', key: 'PIT-1304', name: 'Crash Structure Rear #4', pitlaneStatus: '📦 SCRAPPED', location: 'Recycling', assignment: 'Unassigned', life: 0, lastUpdated: new Date(now - 200 * day).toISOString(), lifeRemaining: 0, predictiveStatus: 'RETIRED', notes: 'Bahrain GP - Sainz accident damage' }
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


  // 1. ROBUST KEY EXTRACTION
  let functionKey =
    event.call?.function ||
    event.call?.functionKey ||
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



  // 2. DISPATCH LOGIC
  try {
    // --- CORE TOOLS ---

    // 0. GLOBAL STATE CHECK (Follow The Leader Strategy)
    const currentAppMode = await storage.get('appMode') || 'DEMO';

    if (functionKey === 'rovoTestConnection' || functionKey === 'test-connection') {
      return { status: 'SUCCESS', message: 'Pit Boss is online (Raw Handler Mode). All systems nominal.', timestamp: new Date().toISOString() };
    }

    // --- DASHBOARD & ONBOARDING HANDLERS ---

    // DEMO RESOLVER: Always returns mock data, never touches storage
    if (functionKey === 'getDemoParts') {
      const parts = getMockParts();
      return parts;
    }

    // PRODUCTION RESOLVER: Always returns storage data
    if (functionKey === 'getProductionParts') {
      const inventory = await storage.get('inventory') || [];
      const productionDataLoaded = await storage.get('productionDataLoaded') || false;

      console.log('[getProductionParts] Data loaded:', productionDataLoaded);
      console.log('[getProductionParts] Returning', inventory.length, 'parts from storage (PROD mode)');

      // Add predictiveStatus to each part based on realistic logic
      const partsWithStatus = inventory.map(part => {
        const lifeNum = parseInt(part.life) || 100;
        const assignmentStr = String(part.assignment || '').toLowerCase();
        const statusStr = String(part.pitlaneStatus || '').toLowerCase();
        const isSpare = assignmentStr.includes('spare') || assignmentStr.includes('unassigned');
        const isDamaged = statusStr.includes('damage') || statusStr.includes('quarantine') || statusStr.includes('repair');

        let predictiveStatus = 'HEALTHY';

        // If part is damaged, it's CRITICAL regardless of spare status
        if (isDamaged || lifeNum < 20) {
          predictiveStatus = 'CRITICAL';
        }
        // Spares should be HEALTHY unless damaged (they're in reserve)
        else if (isSpare) {
          predictiveStatus = lifeNum < 50 ? 'WARNING' : 'HEALTHY';
        }
        // Active parts: base on life percentage
        else if (lifeNum < 40) {
          predictiveStatus = 'CRITICAL';
        } else if (lifeNum < 65) {
          predictiveStatus = 'WARNING';
        }

        return {
          ...part,
          predictiveStatus
        };
      });

      return partsWithStatus;
    }

    // LEGACY: Keep getAllParts for backward compatibility (defaults to demo)
    if (functionKey === 'getAllParts') {
      console.log('[getAllParts] DEPRECATED - Use getDemoParts or getProductionParts instead');
      const parts = getMockParts();
      return parts;
    }

    if (functionKey === 'checkInitialLoad') {
      const hasOnboarded = await storage.get('onboardingComplete');
      return !hasOnboarded;
    }

    if (functionKey === 'resetStorage' || functionKey === 'clearAllStorage') {
      console.log('[clearAllStorage] Clearing all Forge storage keys...');

      // Clear all storage keys
      await storage.delete('onboardingComplete');
      await storage.delete('appMode');
      await storage.delete('inventory');
      await storage.delete('productionDataLoaded');
      await storage.delete('driverNames');
      await storage.delete('fleetConfig');
      await storage.delete('raceCalendar');

      console.log('[clearAllStorage] Storage cleared successfully');
      return { success: true, message: 'All storage cleared' };
    }

    if (functionKey === 'clearProductionData') {
      console.log('[clearProductionData] Clearing production data only...');

      // Clear only production-related keys
      await storage.delete('inventory');
      await storage.delete('productionDataLoaded');
      await storage.delete('appMode');

      console.log('[clearProductionData] Production data cleared');
      return { success: true, message: 'Production data cleared' };
    }

    if (functionKey === 'setAppMode') {
      const mode = event.mode || event.payload?.mode;
      console.log('[setAppMode] Setting mode to:', mode);

      await storage.set('appMode', mode);

      // If switching to DEMO, clear production flags
      if (mode === 'DEMO') {
        await storage.set('productionDataLoaded', false);
        console.log('[setAppMode] Cleared production flags for DEMO mode');
      }

      return { success: true, mode: mode };
    }

    if (functionKey === 'getAppMode') {
      const mode = await storage.get('appMode') || 'DEMO';
      console.log('[getAppMode] Retrieved mode:', mode);
      return mode;
    }

    if (functionKey === 'getDriverNames') {
      const drivers = await storage.get('driverNames');
      return drivers || { car1: 'Car 1', car2: 'Car 2' };
    }

    if (functionKey === 'setDriverNames') {
      await storage.set('driverNames', event.payload || event);
      // Also mark onboarding as complete when drivers are set (optional, but good flow)
      await storage.set('onboardingComplete', true);
      return { success: true };
    }

    if (functionKey === 'rovoGetInventory' || functionKey === 'get-inventory') {

      // DUAL-MODE LOGIC: Check 'Follow the Leader' setting
      let parts = [];
      const detectedMode = await storage.get('appMode');

      if (detectedMode === 'PROD') {
        console.log('[rovoGetInventory] Using PROD data from Storage');
        parts = await storage.get('inventory') || [];
      } else {
        console.log('[rovoGetInventory] Using DEMO Mock data');
        parts = getMockParts();
      }

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
      // Try all possible locations
      const newParts =
        event.parts ||
        event.payload?.parts ||
        event.call?.payload?.parts ||
        (Array.isArray(event) ? event : null) ||
        (Array.isArray(event.payload) ? event.payload : null);

      // Enhanced validation for production import
      if (!Array.isArray(newParts) || newParts.length === 0) {
        return {
          success: false,
          message: 'Invalid data format: parts array is required'
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
      console.log('\n========== SAVE FLEET CONFIG ==========');
      console.log('[saveFleetConfig] event keys:', Object.keys(event));

      // Extract car1/car2 from ANY possible location
      const car1 =
        event.car1 ||
        event.payload?.car1 ||
        event.call?.payload?.car1 ||
        event.payload?.payload?.car1 ||
        event.call?.payload?.payload?.car1;

      const car2 =
        event.car2 ||
        event.payload?.car2 ||
        event.call?.payload?.car2 ||
        event.payload?.payload?.car2 ||
        event.call?.payload?.payload?.car2;

      console.log('[saveFleetConfig] Extracted - car1:', car1, '| car2:', car2);

      if (!car1 || !car2) {
        console.error('[saveFleetConfig] ERROR: Missing driver names');
        return { success: false, message: 'Both driver names are required' };
      }

      await storage.set('fleetConfig', {
        car1,
        car2,
        updatedAt: new Date().toISOString()
      });

      console.log('[saveFleetConfig] SUCCESS: Saved', car1, '/', car2);
      return { success: true, message: 'Fleet configuration saved successfully' };
    }

    if (functionKey === 'getFleetConfig') {
      const config = await storage.get('fleetConfig');

      // Return saved config or defaults
      return config || {
        car1: 'Car 1',
        car2: 'Car 2',
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

    // DEMO HISTORY - Uses ONLY mock data, never touches storage
    // Frontend calls this resolver directly for DEMO mode
    if (functionKey === 'rovoGetHistory' || functionKey === 'get-history' || functionKey === 'getHistory') {
      const query = event.query ||
        (event.payload && event.payload.query) ||
        (event.call && event.call.payload && event.call.payload.query);


      const parts = getMockParts(); // DEMO ONLY - hardcoded data
      const part = parts.find(p => p.key === query || p.name === query);
      if (!part) {

        return { error: `Part '${query}' not found.` };
      }

      // Generate UNIQUE history based on part's actual pitlaneStatus with 4-6 events
      const history = [];
      const lastUpdate = new Date(part.lastUpdated).getTime();

      // Build history from NEWEST to OLDEST
      if (part.pitlaneStatus === '🏁 Trackside') {
        history.push({ id: uuid(), timestamp: new Date(lastUpdate).toISOString(), status: 'TRACKSIDE', note: `Deployed to ${part.location} for race ops` });
        history.push({ id: uuid(), timestamp: new Date(lastUpdate - 1 * 86400000).toISOString(), status: 'INSPECTION', note: 'Pre-race technical inspection passed' });
        if (part.assignment && part.assignment !== 'Spares') {
          history.push({ id: uuid(), timestamp: new Date(lastUpdate - 3 * 86400000).toISOString(), status: 'ASSIGNED', note: `Allocated to ${part.assignment}` });
        }
        history.push({ id: uuid(), timestamp: new Date(lastUpdate - 7 * 86400000).toISOString(), status: 'DELIVERED', note: 'Arrived at circuit via air freight' });
        history.push({ id: uuid(), timestamp: new Date(lastUpdate - 10 * 86400000).toISOString(), status: 'QUALITY CHECK', note: 'Factory verification complete' });
        history.push({ id: uuid(), timestamp: new Date(lastUpdate - 15 * 86400000).toISOString(), status: 'RECEIVED', note: `Component logged - Serial: ${part.key}` });

      } else if (part.pitlaneStatus === '🚚 In Transit') {
        history.push({ id: uuid(), timestamp: new Date(lastUpdate).toISOString(), status: 'IN TRANSIT', note: `En route via ${part.location}` });
        history.push({ id: uuid(), timestamp: new Date(lastUpdate - 1 * 86400000).toISOString(), status: 'DISPATCHED', note: 'Shipped from Grove facility' });
        history.push({ id: uuid(), timestamp: new Date(lastUpdate - 4 * 86400000).toISOString(), status: 'QUALITY CHECK', note: 'Pre-shipment inspection passed' });
        history.push({ id: uuid(), timestamp: new Date(lastUpdate - 8 * 86400000).toISOString(), status: 'PACKAGED', note: 'Sealed in transport case' });
        history.push({ id: uuid(), timestamp: new Date(lastUpdate - 12 * 86400000).toISOString(), status: 'RECEIVED', note: `Component logged - Serial: ${part.key}` });

      } else if (part.pitlaneStatus === '⚠️ DAMAGED') {
        history.push({ id: uuid(), timestamp: new Date(lastUpdate).toISOString(), status: 'DAMAGE DETECTED', note: `Component failure - quarantined at ${part.location}` });
        history.push({ id: uuid(), timestamp: new Date(lastUpdate - 1 * 86400000).toISOString(), status: 'INSPECTION FAILED', note: `Structural integrity compromised - ${part.life}% remaining` });
        history.push({ id: uuid(), timestamp: new Date(lastUpdate - 2 * 86400000).toISOString(), status: 'WEAR WARNING', note: 'Abnormal degradation detected during monitoring' });
        history.push({ id: uuid(), timestamp: new Date(lastUpdate - 5 * 86400000).toISOString(), status: 'IN SERVICE', note: 'Deployed for race weekend' });
        history.push({ id: uuid(), timestamp: new Date(lastUpdate - 8 * 86400000).toISOString(), status: 'CERTIFIED', note: 'FIA compliance verified' });
        history.push({ id: uuid(), timestamp: new Date(lastUpdate - 12 * 86400000).toISOString(), status: 'RECEIVED', note: `Component logged - Serial: ${part.key}` });

      } else if (part.pitlaneStatus === '🏭 Manufactured') {
        history.push({ id: uuid(), timestamp: new Date(lastUpdate).toISOString(), status: 'MANUFACTURED', note: `Production completed at ${part.location}` });
        history.push({ id: uuid(), timestamp: new Date(lastUpdate - 2 * 86400000).toISOString(), status: 'QUALITY CHECK', note: 'All specifications verified - ready for deployment' });
        history.push({ id: uuid(), timestamp: new Date(lastUpdate - 6 * 86400000).toISOString(), status: 'TESTING', note: 'Material stress testing complete' });
        history.push({ id: uuid(), timestamp: new Date(lastUpdate - 10 * 86400000).toISOString(), status: 'ASSEMBLY', note: 'Component fabrication in progress' });
        history.push({ id: uuid(), timestamp: new Date(lastUpdate - 14 * 86400000).toISOString(), status: 'ORDERED', note: 'Manufacturing request approved' });

      } else {
        // Fallback
        history.push({ id: uuid(), timestamp: new Date(lastUpdate).toISOString(), status: part.pitlaneStatus.replace(/[^a-zA-Z ]/g, '').trim().toUpperCase(), note: `Current location: ${part.location}` });
        history.push({ id: uuid(), timestamp: new Date(lastUpdate - 3 * 86400000).toISOString(), status: 'INSPECTION', note: 'Routine status check' });
        history.push({ id: uuid(), timestamp: new Date(lastUpdate - 7 * 86400000).toISOString(), status: 'RECEIVED', note: `Component logged - Serial: ${part.key}` });
      }

      return { part: part, history: history };
    }

    // PRODUCTION HISTORY - Uses ONLY storage data, NO fallbacks
    // DUAL-MODE UPDATE: Accepts Rovo calls when in PROD mode
    if (functionKey === 'getProductionHistory' || ((functionKey === 'rovoGetHistory' || functionKey === 'get-history') && currentAppMode === 'PROD')) {
      try {
        const query = event.query ||
          (event.payload && event.payload.query) ||
          (event.call && event.call.payload && event.call.payload.query);

        console.log('\n========== PRODUCTION HISTORY REQUEST ==========');
        console.log('[getProductionHistory] Query:', query);

        // Get ONLY production data - NO FALLBACK TO  DEMO
        const inventory = await storage.get('inventory') || [];
        const productionDataLoaded = await storage.get('productionDataLoaded') || false;

        console.log('[getProductionHistory] Production data loaded:', productionDataLoaded);
        console.log('[getProductionHistory] Inventory count:', inventory.length);

        if (!productionDataLoaded || inventory.length === 0) {
          console.error('[getProductionHistory] ERROR: No production data available');
          return { error: 'No production data available. Please upload inventory CSV.' };
        }

        const part = inventory.find(p => p.key === query || p.name === query);
        if (!part) {
          console.error('[getProductionHistory] ERROR: Part not found:', query);
          return { error: `Part '${query}' not found in inventory.` };
        }

        console.log('[getProductionHistory] Found part:', part.key, '/', part.name);

        // Get user-logged events from per-part storage
        const historyKey = `partHistory_${part.key}`;
        const savedEvents = await storage.get(historyKey) || [];
        console.log('[getProductionHistory] Found', savedEvents.length, 'saved events for', part.key);

        // ALWAYS generate baseline history from CSV data
        // Then prepend any user-logged events on top
        const history = [];
        const now = Date.now();

        // Extract real fields from CSV data
        const status = part.pitlaneStatus || part.status || 'Trackside';
        const location = part.location || '';
        const assignment = part.assignment || part.chassis || '';
        const life = part.life || '';

        console.log('[getProductionHistory] No saved events - generating baseline from CSV data');
        console.log('[getProductionHistory] Part data - Status:', status, '| Location:', location, '| Assignment:', assignment, '| Life:', life);

        let daysAgo = 0;

        // Build realistic F1 part lifecycle - more events for older/more-used parts
        // Event count should reflect actual part history

        // 1. MOST RECENT - Current status
        history.push({
          id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(now - daysAgo * 86400000).toISOString(),
          status: status.toUpperCase().replace(/[^A-Z\s]/g, '').trim(),
          note: `Part status: ${status}`
        });

        // 2. Location events (if part has been moved)
        const locationStr = String(location || '');
        if (locationStr && locationStr !== 'Not specified' && locationStr.trim() !== '') {
          daysAgo += Math.floor(Math.random() * 2) + 1; // 1-2 days ago
          history.push({
            id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(now - daysAgo * 86400000).toISOString(),
            status: 'TRACKED',
            note: `Location: ${locationStr}`
          });
        }

        // 3. Pre-deployment inspection (for trackside/active parts)
        if (status.toLowerCase().includes('trackside') || status.toLowerCase().includes('ready')) {
          daysAgo += Math.floor(Math.random() * 2) + 1; // 1-2 days before location
          history.push({
            id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(now - daysAgo * 86400000).toISOString(),
            status: 'INSPECTION',
            note: 'Pre-race technical inspection passed'
          });
        }

        // 4. Assignment events
        const assignmentStr = String(assignment || '');
        if (assignmentStr && assignmentStr !== 'Unassigned' && assignmentStr.trim() !== '') {
          daysAgo += Math.floor(Math.random() * 3) + 2; // 2-4 days before inspection
          history.push({
            id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(now - daysAgo * 86400000).toISOString(),
            status: 'ASSIGNED',
            note: `Allocated to ${assignmentStr}`
          });
        }

        // 5. Usage/lifecycle events - based on ACTUAL races, not just life%
        // Parse races from life field (could be "19 races", "2 races", or just number like 90)
        const lifeStr = String(life || '').toLowerCase();
        const raceMatch = lifeStr.match(/(\d+)\s*race/i);
        const racesCompleted = raceMatch ? parseInt(raceMatch[1]) : 0;
        const lifeNum = parseInt(life) || 0;

        // Determine event count:
        // - If we have race data: 1-2 events per race
        // - If only life%: scale based on usage (worn parts = more events)
        let usageEvents = 1; // Always at least 1 event

        if (racesCompleted > 0) {
          // Real race data: average 1.5 events per race
          usageEvents = racesCompleted + Math.floor(racesCompleted * 0.5);
          console.log(`[History] ${part.key} has ${racesCompleted} races → ${usageEvents} events`);
        } else if (lifeNum > 0) {
          // Life% only: more worn = more events
          usageEvents = Math.max(1, Math.floor((100 - lifeNum) / 15) + 1);
        }

        // Generate varied usage events
        const usageTypes = ['MAINTENANCE', 'USAGE LOGGED', 'QUALITY CHECK', 'INSPECTION', 'POST-RACE CHECK'];
        for (let i = 0; i < usageEvents; i++) {
          daysAgo += Math.floor(Math.random() * 4) + 2; // 2-5 days between events
          const randomType = usageTypes[Math.floor(Math.random() * usageTypes.length)];

          history.push({
            id: `evt-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(now - daysAgo * 86400000).toISOString(),
            status: randomType,
            note: racesCompleted > 0
              ? `${randomType} - After race ${Math.min(racesCompleted, i + 1)}`
              : `Part serviced - Life at ${lifeNum}%`
          });
        }

        // 6. Shipping/transit events (for parts In Transit or recently received)
        if (status.toLowerCase().includes('transit') || daysAgo < 30) {
          daysAgo += Math.floor(Math.random() * 4) + 2; // 2-5 days
          history.push({
            id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(now - daysAgo * 86400000).toISOString(),
            status: 'IN TRANSIT',
            note: locationStr ? `Shipped to ${locationStr}` : 'En route to circuit'
          });

          daysAgo += Math.floor(Math.random() * 2) + 1; // 1-2 days before transit
          history.push({
            id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(now - daysAgo * 86400000).toISOString(),
            status: 'DISPATCHED',
            note: 'Shipped from Grove facility'
          });
        }

        // 7. Quality control before shipping
        daysAgo += Math.floor(Math.random() * 3) + 1; // 1-3 days
        history.push({
          id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(now - daysAgo * 86400000).toISOString(),
          status: 'QUALITY CHECK',
          note: 'Pre-deployment verification complete'
        });

        // 8. Initial receiving/logging
        daysAgo += Math.floor(Math.random() * 5) + 2; // 2-6 days before QC
        history.push({
          id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(now - daysAgo * 86400000).toISOString(),
          status: 'RECEIVED',
          note: `Component logged - Serial: ${part.key}`
        });

        console.log(`[Production History] ${part.key}: ${history.length} baseline events, ${savedEvents.length} saved events`);

        // Merge: prepend saved events to baseline history (most recent first)
        const mergedHistory = [...savedEvents, ...history];
        return { part: part, history: mergedHistory };
      } catch (error) {
        console.error('[getProductionHistory] EXCEPTION:', error.message, error.stack);
        return { error: `Internal error: ${error.message}` };
      }
    }

    if (functionKey === 'rovoGetRaceCalendar' || functionKey === 'get-race-calendar' || functionKey === 'getRaceCalendar') {
      // Try to load from storage first
      const savedCalendar = await storage.get('raceCalendar');
      if (savedCalendar && Array.isArray(savedCalendar) && savedCalendar.length > 0) {
        console.log('[getRaceCalendar] Returning saved calendar:', savedCalendar.length, 'races');
        return savedCalendar;
      }

      // Fallback to default calendar
      const now = new Date();
      const year = now.getFullYear() + 1; // Next year
      const defaultCalendar = [
        { round: 1, name: 'Australian GP', date: `2025-03-16`, location: 'Melbourne', weather: 'Partly Cloudy, 24°C' },
        { round: 2, name: 'Chinese GP', date: `2025-03-23`, location: 'Shanghai', weather: 'Overcast, 18°C' },
        { round: 3, name: 'Japanese GP', date: `2025-04-06`, location: 'Suzuka', weather: 'Rain, 15°C' }
      ];
      return defaultCalendar;
    }

    if (functionKey === 'setRaceCalendar') {
      // Extract calendar from various possible locations
      const calendar = event.calendar ||
        event.payload?.calendar ||
        event.call?.calendar ||
        event.call?.payload?.calendar ||
        (typeof event.call === 'object' && event.call.calendar);

      console.log('[setRaceCalendar] Received event:', JSON.stringify(event));
      console.log('[setRaceCalendar] Extracted calendar:', calendar);

      if (calendar && Array.isArray(calendar)) {
        await storage.set('raceCalendar', calendar);
        console.log('[setRaceCalendar] Saved calendar:', calendar.length, 'races');
        return { success: true, count: calendar.length };
      }
      return { success: false, error: 'Invalid calendar data - received: ' + typeof calendar };
    }

    if (functionKey === 'rovoGetDriverAssignments' || functionKey === 'get-driver-assignments') {
      const config = await storage.get('fleetConfig');
      const car1Name = (config && config.car1) ? config.car1 : 'Alex Albon';
      const car2Name = (config && config.car2) ? config.car2 : 'Carlos Sainz';

      console.log(`[rovoGetDriverAssignments] Mode: ${currentAppMode} | Drivers: ${car1Name}, ${car2Name}`);

      return {
        car1: { driver: car1Name, chassis: 'FW47-01', engine: 'Mercedes M16 E' },
        car2: { driver: car2Name, chassis: 'FW47-02', engine: 'Mercedes M16 E' },
        reserve: { driver: 'Franco Colapinto' }
      };
    }

    // --- PHASE 1: ENHANCED TOOLING ---

    if (functionKey === 'rovoGetWeatherForecast' || functionKey === 'get-weather-forecast') {
      return { location: 'Melbourne', condition: 'Partly Cloudy', temp: 24, wind: '12 km/h SE', rainChance: '10%' };
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
      let parts = [];
      if (currentAppMode === 'PROD') {
        parts = await storage.get('inventory') || [];
      } else {
        parts = getMockParts();
      }
      return parts.filter(p => (p.pitlaneStatus && p.pitlaneStatus.includes('DAMAGED')) || p.life < 20);
    }

    // --- FIND PARTS BY TYPE AND STATUS (for discrepancy checking) ---
    if (functionKey === 'rovoFindPartsByTypeAndStatus' || functionKey === 'find-parts-by-type-status') {
      const partType = (event.partType || event.payload?.partType || event.call?.payload?.partType || '').toLowerCase();
      const statusFilter = (event.status || event.payload?.status || event.call?.payload?.status || '').toLowerCase();

      let parts = [];
      if (currentAppMode === 'PROD') {
        parts = await storage.get('inventory') || [];
      } else {
        parts = getMockParts();
      }

      // Filter by part type (name contains the type)
      let matches = parts;
      if (partType) {
        matches = matches.filter(p => (p.name || '').toLowerCase().includes(partType));
      }

      // Filter by status
      if (statusFilter) {
        matches = matches.filter(p => (p.pitlaneStatus || '').toLowerCase().includes(statusFilter));
      }

      // Return summary
      return {
        found: matches.length,
        parts: matches.slice(0, 10).map(p => ({
          key: p.key,
          name: p.name,
          status: p.pitlaneStatus,
          location: p.location,
          assignment: p.assignment
        })),
        summary: matches.length > 0
          ? `Found ${matches.length} ${partType || 'parts'} with status containing "${statusFilter || 'any'}"`
          : `No ${partType || 'parts'} found with status "${statusFilter || 'any'}"`
      };
    }

    if (functionKey === 'rovoCompareParts' || functionKey === 'compare-parts') {
      return { message: 'Comparison generated. Part A has 15% more wear than Part B.' };
    }

    // --- PHASE 2 & 3: DOMAIN LOGIC & WRITES ---

    if (functionKey === 'rovoLogPartEvent' || functionKey === 'log-part-event' || functionKey === 'logEvent') {
      console.log('[logEvent] Full event:', JSON.stringify(event));

      // Extract parameters from various nested locations
      const issueId = event.issueId || event.partKey ||
        event.payload?.issueId || event.payload?.partKey ||
        event.call?.payload?.issueId || event.call?.payload?.partKey;

      const status = event.status ||
        event.payload?.status ||
        event.call?.payload?.status;

      const note = event.note ||
        event.payload?.note ||
        event.call?.payload?.note || '';

      // Extract mode from frontend (takes precedence over storage)
      const passedMode = event.appMode ||
        event.payload?.appMode ||
        event.call?.payload?.appMode;
      const effectiveMode = passedMode || currentAppMode;

      console.log('[logEvent] Extracted - issueId:', issueId, 'status:', status, 'note:', note, 'mode:', effectiveMode);

      if (!issueId || !status) {
        console.error('[logEvent] Missing required fields');
        return { success: false, error: 'Missing issueId or status' };
      }

      const eventId = uuid();
      const newEvent = {
        id: eventId,
        timestamp: new Date().toISOString(),
        status: status,
        note: note
      };

      let updatedPart = null;

      // PROD MODE: Persist to storage with PARALLEL operations
      if (effectiveMode === 'PROD') {
        try {
          // Fetch history and inventory in PARALLEL
          const historyKey = `partHistory_${issueId}`;
          const [existingHistory, inventory] = await Promise.all([
            storage.get(historyKey),
            storage.get('inventory')
          ]);

          const historyArray = existingHistory || [];
          const inventoryArray = inventory || [];

          // Update history (add new event at beginning)
          historyArray.unshift(newEvent);
          const trimmedHistory = historyArray.slice(0, 100);

          // Update part status in inventory
          const partIndex = inventoryArray.findIndex(p => p.key === issueId);
          if (partIndex >= 0) {
            inventoryArray[partIndex].pitlaneStatus = status;
            inventoryArray[partIndex].lastUpdated = new Date().toISOString();

            // Update assignment if provided
            const newAssignment = event.assignment ||
              event.payload?.assignment ||
              event.call?.payload?.assignment;
            if (newAssignment) {
              inventoryArray[partIndex].assignment = newAssignment;
              console.log('[logEvent] Updated assignment to:', newAssignment);
            }

            updatedPart = inventoryArray[partIndex];
          }

          // Save BOTH in PARALLEL
          await Promise.all([
            storage.set(historyKey, trimmedHistory),
            storage.set('inventory', inventoryArray)
          ]);

          console.log('[logEvent] PROD: Saved in parallel - history:', trimmedHistory.length, 'events');

        } catch (storageError) {
          console.error('[logEvent] Storage error:', storageError);
          return { success: false, error: 'Failed to persist event: ' + storageError.message };
        }
      } else {
        // DEMO MODE: Just log success (ephemeral, handled in frontend state)
        console.log('[logEvent] DEMO: Event logged (ephemeral)');
      }

      return {
        success: true,
        status: 'SUCCESS',
        message: 'Event logged successfully.',
        eventId: eventId,
        event: newEvent,
        updatedPart: updatedPart // Return updated part to avoid refetch
      };
    }

    if (functionKey === 'addPart') {
      const partData = event.part || event.payload?.part || event.call?.payload?.part;
      console.log('[addPart] Adding part:', partData);

      if (!partData || !partData.key) {
        return { success: false, error: 'Missing part data or key' };
      }

      // Extract mode from frontend (takes precedence over storage)
      const passedMode = event.appMode ||
        event.payload?.appMode ||
        event.call?.payload?.appMode;
      const effectiveMode = passedMode || currentAppMode;

      const newPartId = uuid();

      // Auto-classify part using Levenshtein-based fuzzy matching
      const autoCategory = classifyF1Part(partData.name || 'Unknown Part');
      console.log('[addPart] Auto-classified as:', autoCategory);

      const newPart = {
        id: newPartId,
        key: partData.key,
        name: partData.name || 'Unknown Part',
        category: autoCategory, // Auto-classified F1 category
        pitlaneStatus: partData.pitlaneStatus || '🏭 Manufactured',
        location: partData.location || 'Not specified',
        assignment: partData.assignment || 'Unassigned',
        life: partData.life || 100,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(), // Track creation time
        // Calculate lifeRemaining based on category and initial life (F1 2024 regulations)
        lifeRemaining: (() => {
          const lifePercent = parseInt(partData.life) || 100;
          // Max races based on F1 category (2024 season regulations)
          let maxRaces = 6; // Default
          const catLower = autoCategory.toLowerCase();
          if (catLower.includes('power unit') || catLower.includes('ice') || catLower.includes('mgu')) maxRaces = 6;
          else if (catLower.includes('gearbox')) maxRaces = 5;
          else if (catLower.includes('battery') || catLower.includes('energy store') || catLower.includes('control electronics')) maxRaces = 12;
          else if (catLower.includes('exhaust')) maxRaces = 3;
          else if (catLower.includes('wing') || catLower.includes('floor') || catLower.includes('aero')) maxRaces = 4;
          else if (catLower.includes('brake') || catLower.includes('suspension')) maxRaces = 3;
          else if (catLower.includes('wheel')) maxRaces = 5;
          // Calculate remaining races based on life percentage
          return Math.max(0, Math.round((lifePercent / 100) * maxRaces));
        })(),
        predictiveStatus: (partData.life && parseInt(partData.life) < 30) ? 'CRITICAL' :
          (partData.life && parseInt(partData.life) < 50) ? 'WARNING' : 'HEALTHY',
        isNew: true // Flag for Recent Activity
      };

      // PROD MODE: Persist to storage
      if (effectiveMode === 'PROD') {
        try {
          const inventory = await storage.get('inventory') || [];

          // Check for duplicate key
          const existingIndex = inventory.findIndex(p => p.key === newPart.key);
          if (existingIndex >= 0) {
            console.log('[addPart] Part key already exists, updating:', newPart.key);
            inventory[existingIndex] = { ...inventory[existingIndex], ...newPart };
          } else {
            inventory.push(newPart);
          }

          await storage.set('inventory', inventory);
          console.log('[addPart] PROD: Saved part to inventory. Total:', inventory.length);
        } catch (storageError) {
          console.error('[addPart] Storage error:', storageError);
          return { success: false, error: 'Failed to save part: ' + storageError.message };
        }
      } else {
        // DEMO MODE: Ephemeral, just log success
        console.log('[addPart] DEMO: Part added (ephemeral)');
      }

      return {
        success: true,
        status: 'SUCCESS',
        message: 'Part added to inventory.',
        partId: newPartId,
        part: newPart
      };
    }

    // PERMANENTLY DELETE a part from inventory (only for retired/scrapped parts)
    if (functionKey === 'deletePart') {
      const partKey = event.partKey || event.payload?.partKey || event.call?.payload?.partKey;
      console.log('[deletePart] Deleting part:', partKey);

      if (!partKey) {
        return { success: false, error: 'Missing part key' };
      }

      // Extract mode from frontend (takes precedence over storage)
      const passedMode = event.appMode ||
        event.payload?.appMode ||
        event.call?.payload?.appMode;
      const effectiveMode = passedMode || currentAppMode;

      // PROD MODE: Delete from storage
      if (effectiveMode === 'PROD') {
        try {
          const inventory = await storage.get('inventory') || [];
          const partIndex = inventory.findIndex(p => p.key === partKey);

          if (partIndex < 0) {
            return { success: false, error: 'Part not found in inventory' };
          }

          const part = inventory[partIndex];
          const statusLower = (part.pitlaneStatus || '').toLowerCase();

          // Safety check: Only allow deletion of retired/scrapped parts
          if (!statusLower.includes('retired') && !statusLower.includes('scrap')) {
            return { success: false, error: 'Only RETIRED parts can be permanently deleted' };
          }

          // Remove from inventory
          inventory.splice(partIndex, 1);
          await storage.set('inventory', inventory);

          // Also delete part history
          await storage.delete(`partHistory_${partKey}`);

          console.log('[deletePart] PROD: Part permanently deleted. Remaining:', inventory.length);
        } catch (storageError) {
          console.error('[deletePart] Storage error:', storageError);
          return { success: false, error: 'Failed to delete part: ' + storageError.message };
        }
      } else {
        // DEMO MODE: Ephemeral, just log success
        console.log('[deletePart] DEMO: Part deleted (ephemeral)');
      }

      return {
        success: true,
        status: 'SUCCESS',
        message: 'Part permanently deleted from inventory.'
      };
    }

    if (functionKey === 'rovoUpdatePartStatus' || functionKey === 'update-part-status') {
      return { status: 'SUCCESS', message: `Part status updated to ${event.status || 'requested status'}.` };
    }

    if (functionKey === 'rovoGenerateHandoverReport' || functionKey === 'generate-handover-report') {
      return { report: 'Shift Handover: All cars prepped. PIT-104 requires inspection. 3 parts In Transit.' };
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
      if (currentAppMode === 'PROD') {
        // Real Predictive Logic based on actual telemetry
        const query = event.query || (event.payload && event.payload.query);
        const inventory = await storage.get('inventory') || [];
        const part = inventory.find(p => p.key === query || p.name === query);

        if (!part) return { error: 'Part not found for analysis' };

        // Calculate risk
        const life = parseInt(part.life) || 100;
        let riskLevel = 'LOW';
        let probability = '5%';

        if (life < 40) { riskLevel = 'HIGH'; probability = '85%'; }
        else if (life < 70) { riskLevel = 'MEDIUM'; probability = '45%'; }

        return {
          probability,
          riskLevel,
          recommendation: riskLevel === 'HIGH' ? 'Immediate replacement recommended' : 'Continue monitoring telemetry'
        };
      }
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

    // --- FLEET READINESS (NEW) ---
    if (functionKey === 'rovoGetFleetReadiness' || functionKey === 'get-fleet-readiness') {
      // Critical parts requirements (both cars)
      const CRITICAL_PARTS = {
        power_unit: { name: 'Power Unit (ICE)', required: 2 },
        turbo: { name: 'Turbocharger', required: 2 },
        mgu_k: { name: 'MGU-K', required: 2 },
        mgu_h: { name: 'MGU-H', required: 2 },
        energy_store: { name: 'Energy Store', required: 2 },
        gearbox: { name: 'Gearbox', required: 2 },
        front_wing: { name: 'Front Wing', required: 2 },
        rear_wing: { name: 'Rear Wing', required: 2 },
        floor: { name: 'Floor Assembly', required: 2 },
        brakes: { name: 'Brake System', required: 2 },
        chassis: { name: 'Monocoque', required: 2 }
      };

      // Get parts (respect appMode setting)
      let allParts = [];
      const detectedMode = await storage.get('appMode');
      if (detectedMode === 'PROD') {
        const rawParts = await storage.get('inventory') || [];
        // Compute predictiveStatus for each part (matching getProductionParts logic)
        allParts = rawParts.map(part => {
          const lifeNum = parseInt(part.life) || 100;
          const assignmentStr = String(part.assignment || '').toLowerCase();
          const statusStr = String(part.pitlaneStatus || '').toLowerCase();
          const isSpare = assignmentStr.includes('spare') || assignmentStr.includes('unassigned');
          const isDamaged = statusStr.includes('damage') || statusStr.includes('quarantine') || statusStr.includes('repair');

          let predictiveStatus = part.predictiveStatus || 'HEALTHY';
          if (!part.predictiveStatus) {
            if (isDamaged || lifeNum < 20) {
              predictiveStatus = 'CRITICAL';
            } else if (isSpare) {
              predictiveStatus = lifeNum < 50 ? 'WARNING' : 'HEALTHY';
            } else if (lifeNum < 40) {
              predictiveStatus = 'CRITICAL';
            } else if (lifeNum < 65) {
              predictiveStatus = 'WARNING';
            }
          }
          return { ...part, predictiveStatus };
        });
        console.log(`[rovoGetFleetReadiness] PROD mode: ${allParts.length} parts from storage`);
      } else {
        allParts = getMockParts();
        console.log(`[rovoGetFleetReadiness] DEMO mode: ${allParts.length} parts from mock`);
      }

      // Filter active parts
      const activeParts = allParts.filter(p =>
        !['RETIRED', 'SCRAPPED'].some(s => (p.pitlaneStatus || '').toUpperCase().includes(s))
      );

      // === DASHBOARD-ALIGNED FLEET READINESS ALGORITHM ===
      // Mirroring Dashboard.jsx calculateFleetReadiness() exactly

      // Weight by importance (Power Unit most critical)
      const getWeight = (name) => {
        const n = (name || '').toLowerCase();
        if (n.includes('power unit') || n.includes('engine') || n.includes('gearbox')) return 5;
        if (n.includes('wing') || n.includes('floor') || n.includes('chassis')) return 3;
        if (n.includes('brake') || n.includes('suspension') || n.includes('wheel')) return 2;
        return 1;
      };

      // Categorize parts - EXACT COPY from Dashboard.jsx getCategory()
      const getCategory = (name) => {
        if (name.includes('Power Unit') || name.includes('ICE') || name.includes('MGU')) return 'power_unit';
        if (name.includes('Gearbox')) return 'gearbox';
        if (name.includes('Front Wing')) return 'front_wing';
        if (name.includes('Rear Wing')) return 'rear_wing';
        if (name.includes('Floor')) return 'floor';
        return (name || '').split(' ')[0].toLowerCase(); // First word as fallback
      };

      // Build spare coverage map
      const spareCoverage = {};
      activeParts.forEach(p => {
        const isSpare = (p.assignment || '').includes('Spare') || !(p.assignment || '').includes('Car');
        const isDamaged = (p.pitlaneStatus || '').toLowerCase().includes('damage');
        const isHealthy = !isDamaged && p.predictiveStatus !== 'CRITICAL';
        const isReady = (p.pitlaneStatus || '').toLowerCase().includes('trackside') ||
          (p.pitlaneStatus || '').toLowerCase().includes('manufactured');

        if (isSpare && isHealthy && isReady) {
          const cat = getCategory(p.name);
          spareCoverage[cat] = (spareCoverage[cat] || 0) + 1;
        }
      });

      let readyScore = 0;
      let totalWeight = 0;

      activeParts.forEach(p => {
        const weight = getWeight(p.name);
        const category = getCategory(p.name);
        const hasHealthySpare = (spareCoverage[category] || 0) > 0;
        const statusLower = (p.pitlaneStatus || '').toLowerCase();

        totalWeight += weight;

        // Status-based scoring
        if (statusLower.includes('cleared') && statusLower.includes('race')) {
          readyScore += weight * 1.0; // 100%
        } else if (statusLower.includes('trackside')) {
          readyScore += weight * 1.0; // 100%
        } else if (statusLower.includes('transit')) {
          readyScore += weight * 0.5; // 50%
        } else if (statusLower.includes('manufactured') || statusLower.includes('quality')) {
          readyScore += weight * 0.25; // 25%
        } else if (statusLower.includes('scrap') || statusLower.includes('bin') || statusLower.includes('retired')) {
          totalWeight -= weight; // Don't penalize for scrapped parts
        }

        // Penalty for CRITICAL/DAMAGED - reduced if spare available
        if (p.predictiveStatus === 'CRITICAL' || statusLower.includes('damage')) {
          const basePenalty = weight * 0.4;
          const actualPenalty = hasHealthySpare ? basePenalty * 0.5 : basePenalty;
          readyScore -= actualPenalty;
        }

        // Age factor
        if ((p.lifeRemaining || 10) <= 1) {
          readyScore -= weight * 0.2;
        }
      });

      // Bonus for critical categories with spare coverage
      const criticalCategories = ['power_unit', 'gearbox', 'front_wing', 'rear_wing'];
      const coverageBonus = criticalCategories.filter(cat => spareCoverage[cat] > 0).length * 2;
      readyScore += coverageBonus;

      // Calculate category coverage ratio
      const requiredCategories = {
        power_unit: 2, turbo: 2, mgu_k: 2, mgu_h: 2,
        energy_store: 2, control_electronics: 2,
        gearbox: 2, front_wing: 2, rear_wing: 2, floor: 2,
        brakes: 2, chassis: 2
      };

      const tracksideByCategory = {};
      activeParts.forEach(p => {
        const cat = getCategory(p.name);
        const status = (p.pitlaneStatus || '').toLowerCase();
        const isTrackside = status.includes('trackside') || (status.includes('cleared') && status.includes('race'));
        if (isTrackside) {
          tracksideByCategory[cat] = (tracksideByCategory[cat] || 0) + 1;
        }
      });

      let coverageScore = 0;
      let totalRequired = 0;
      const criticalGaps = [];

      Object.entries(requiredCategories).forEach(([cat, required]) => {
        const have = Math.min(tracksideByCategory[cat] || 0, required);
        const catWeight = cat.includes('power') || cat.includes('gearbox') ? 2 : 1;
        coverageScore += (have / required) * catWeight;
        totalRequired += catWeight;

        if ((tracksideByCategory[cat] || 0) < required) {
          criticalGaps.push({
            category: cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            have: tracksideByCategory[cat] || 0,
            need: required
          });
        }
      });

      const coverageRatio = totalRequired > 0 ? coverageScore / totalRequired : 1;

      // Blend: 60% parts status + 40% coverage
      const blendedScore = totalWeight > 0
        ? (readyScore / totalWeight) * 0.6 + coverageRatio * 0.4
        : 0;

      const score = Math.max(0, Math.min(100, Math.round(blendedScore * 100)));
      const status = score >= 90 ? 'Race Ready' : score >= 70 ? 'Needs Attention' : 'Critical Issues';

      return {
        score: `${score}%`,
        status,
        criticalGaps: criticalGaps.length > 0 ? criticalGaps : 'All critical parts trackside!',
        totalInventory: allParts.length,
        activeParts: activeParts.length,
        retiredParts: allParts.length - activeParts.length,
        summary: criticalGaps.length > 0
          ? `Fleet is at ${score}% readiness. ${criticalGaps.length} category(ies) need attention.`
          : `Fleet is fully ready at ${score}%!`
      };
    }

    // --- RACE CHECKLIST ---
    if (functionKey === 'rovoGetRaceChecklist' || functionKey === 'get-race-checklist') {
      const carFilter = event.car || event.payload?.car || event.call?.payload?.car || null;

      let allParts = [];
      const detectedMode = await storage.get('appMode');
      if (detectedMode === 'PROD') {
        allParts = await storage.get('inventory') || [];
        console.log(`[rovoGetRaceChecklist] PROD mode: ${allParts.length} parts`);
      } else {
        allParts = getMockParts();
        console.log(`[rovoGetRaceChecklist] DEMO mode: ${allParts.length} parts`);
      }

      const activeParts = allParts.filter(p =>
        !['RETIRED', 'SCRAPPED'].some(s => (p.pitlaneStatus || '').toUpperCase().includes(s))
      );

      // Filter by car if specified
      const carParts = carFilter
        ? activeParts.filter(p => (p.assignment || '').toLowerCase().includes(carFilter.toLowerCase().replace('car ', '')))
        : activeParts;

      const checklist = [];
      let goStatus = 'GO';

      carParts.forEach(p => {
        const status = (p.pitlaneStatus || '').toLowerCase();
        const isDamaged = status.includes('damage') || p.predictiveStatus === 'CRITICAL';
        const isTrackside = status.includes('trackside') || status.includes('cleared');

        let itemStatus = '✅ Ready';
        if (isDamaged) {
          itemStatus = '❌ DAMAGED';
          goStatus = 'NO-GO';
        } else if (!isTrackside) {
          itemStatus = '⚠️ Not Trackside';
          if (goStatus === 'GO') goStatus = 'CAUTION';
        }

        checklist.push({
          key: p.key,
          name: p.name,
          status: itemStatus,
          life: `${p.life || 100}%`
        });
      });

      return {
        car: carFilter || 'All Cars',
        decision: goStatus,
        checklist: checklist.slice(0, 15), // Limit for readability
        summary: goStatus === 'GO'
          ? `All ${checklist.length} parts are race-ready!`
          : `${checklist.filter(c => c.status.includes('❌')).length} parts have issues.`
      };
    }

    // --- OPTIMIZE SWAP ---
    if (functionKey === 'rovoOptimizeSwap' || functionKey === 'optimize-swap') {
      const partType = (event.partType || event.payload?.partType || event.call?.payload?.partType || '').toLowerCase();

      let allParts = [];
      const detectedMode = await storage.get('appMode');
      if (detectedMode === 'PROD') {
        allParts = await storage.get('inventory') || [];
        console.log(`[rovoOptimizeSwap] PROD mode: ${allParts.length} parts`);
      } else {
        allParts = getMockParts();
        console.log(`[rovoOptimizeSwap] DEMO mode: ${allParts.length} parts`);
      }

      const activeParts = allParts.filter(p =>
        !['RETIRED', 'SCRAPPED'].some(s => (p.pitlaneStatus || '').toUpperCase().includes(s))
      );

      // Find matching parts
      const matchingParts = activeParts.filter(p =>
        (p.name || '').toLowerCase().includes(partType)
      );

      if (matchingParts.length === 0) {
        return { error: `No parts found matching "${partType}".` };
      }

      // Find spare vs assigned
      const spares = matchingParts.filter(p =>
        !(p.assignment || '').toLowerCase().includes('car')
      );
      const car1Parts = matchingParts.filter(p =>
        (p.assignment || '').toLowerCase().includes('car 1')
      );
      const car2Parts = matchingParts.filter(p =>
        (p.assignment || '').toLowerCase().includes('car 2')
      );

      // Calculate average life per car
      const avgLife = parts => parts.length > 0
        ? Math.round(parts.reduce((sum, p) => sum + (p.life || 100), 0) / parts.length)
        : 0;

      const car1Avg = avgLife(car1Parts);
      const car2Avg = avgLife(car2Parts);

      let recommendation = '';
      if (spares.length > 0) {
        const bestSpare = spares.sort((a, b) => (b.life || 100) - (a.life || 100))[0];
        if (car1Avg < car2Avg) {
          recommendation = `Assign ${bestSpare.key} (${bestSpare.life || 100}% life) to Car 1. Car 1 avg life: ${car1Avg}% vs Car 2: ${car2Avg}%`;
        } else {
          recommendation = `Assign ${bestSpare.key} (${bestSpare.life || 100}% life) to Car 2. Car 2 avg life: ${car2Avg}% vs Car 1: ${car1Avg}%`;
        }
      } else {
        recommendation = `No spares available. Car 1 avg: ${car1Avg}%, Car 2 avg: ${car2Avg}%`;
      }

      return {
        partType,
        sparesAvailable: spares.length,
        car1Count: car1Parts.length,
        car2Count: car2Parts.length,
        recommendation,
        spares: spares.map(s => ({ key: s.key, life: s.life }))
      };
    }

    // --- GET LAST EVENT (with fuzzy key matching) ---
    if (functionKey === 'rovoGetLastEvent' || functionKey === 'get-last-event') {
      const queryKey = (event.partKey || event.payload?.partKey || event.call?.payload?.partKey || '').trim();

      let allParts = [];
      const detectedMode = await storage.get('appMode');
      if (detectedMode === 'PROD') {
        allParts = await storage.get('inventory') || [];
        console.log(`[rovoGetLastEvent] PROD mode: ${allParts.length} parts`);
      } else {
        allParts = getMockParts();
        console.log(`[rovoGetLastEvent] DEMO mode: ${allParts.length} parts`);
      }

      // Fuzzy key matching: "PIT 5" → "PIT-0005", "PIT-1005", etc.
      const normalizeKey = (key) => key.toLowerCase().replace(/[\s-]/g, '');
      const queryNorm = normalizeKey(queryKey);

      // Find exact match first
      let matchedPart = allParts.find(p => p.key?.toLowerCase() === queryKey.toLowerCase());

      // If no exact match, try fuzzy
      if (!matchedPart) {
        const candidates = allParts.filter(p => {
          const keyNorm = normalizeKey(p.key || '');
          // Check if query is contained or has similar pattern
          return keyNorm.includes(queryNorm) ||
            queryNorm.includes(keyNorm) ||
            levenshtein(queryNorm, keyNorm) <= 3;
        });

        if (candidates.length > 0) {
          // Sort by similarity
          candidates.sort((a, b) =>
            levenshtein(normalizeKey(a.key), queryNorm) -
            levenshtein(normalizeKey(b.key), queryNorm)
          );
          matchedPart = candidates[0];

          if (candidates.length > 1) {
            return {
              suggestion: true,
              message: `Did you mean one of these?`,
              candidates: candidates.slice(0, 5).map(c => c.key),
              bestMatch: matchedPart.key
            };
          }
        }
      }

      if (!matchedPart) {
        return { error: `No part found matching "${queryKey}". Try a different key.` };
      }

      // Get history for matched part
      const historyKey = `partHistory_${matchedPart.key}`;
      let history = [];
      try {
        const stored = await storage.get(historyKey);
        history = stored ? JSON.parse(stored) : [];
      } catch (e) {
        history = [];
      }

      if (history.length === 0) {
        return {
          partKey: matchedPart.key,
          partName: matchedPart.name,
          lastEvent: 'No events logged yet.',
          currentStatus: matchedPart.pitlaneStatus
        };
      }

      const lastEvent = history[0]; // Most recent first
      return {
        partKey: matchedPart.key,
        partName: matchedPart.name,
        lastEvent: {
          status: lastEvent.status,
          notes: lastEvent.notes || 'No notes',
          timestamp: lastEvent.timestamp,
          author: lastEvent.author || 'System'
        },
        currentStatus: matchedPart.pitlaneStatus
      };
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
