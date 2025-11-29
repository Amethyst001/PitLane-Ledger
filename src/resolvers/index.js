import Resolver from '@forge/resolver';
import { storage, route, asUser } from '@forge/api';
import crypto from 'crypto';

const resolver = new Resolver();

function uuid() {
  return crypto.randomUUID();
}

resolver.define('getIssuePanel', async ({ payload, context }) => {
  const issueId = context.extension.issue.id;
  await seedDemoDataInternal(issueId);
  const history = await getHistoryInternal(issueId);
  return { issueId, history };
});

resolver.define('logEvent', async ({ payload }) => {
  const { issueId, status, note } = payload;
  if (!issueId || !status) throw new Error('issueId and status are required');
  const storageKey = `history_${issueId}`;
  let history = await storage.get(storageKey);
  if (!history) history = [];
  const newEvent = { id: uuid(), timestamp: new Date().toISOString(), status, note: note || '' };
  history.unshift(newEvent);
  await storage.set(storageKey, history);
  return history;
});

resolver.define('getHistory', async ({ payload }) => {
  const { issueId } = payload;
  return await getHistoryInternal(issueId);
});

async function getAllPartsInternal() {
  let parts = [];
  try {
    const response = await asUser().requestJira(route`/rest/api/3/search?jql=project IS NOT EMPTY ORDER BY updated DESC&maxResults=20&fields=summary,status,updated`);
    const data = await response.json();
    const issues = data.issues || [];
    if (issues.length > 0) {
      parts = await Promise.all(issues.map(async (issue) => {
        const history = await getHistoryInternal(issue.id);
        return { id: issue.id, key: issue.key, name: issue.fields.summary, jiraStatus: issue.fields.status.name, lastUpdated: issue.fields.updated, pitlaneStatus: history.length > 0 ? history[0].status : 'New Part', historyLength: history.length };
      }));
    }
  } catch (err) {
    console.error("JQL Search failed:", err);
  }

  if (parts.length === 0) {
    const now = Date.now();
    parts = [
      { id: 'demo-1', key: 'PIT-101', name: 'Power Unit ICE #1', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 18 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-2', key: 'PIT-102', name: 'Power Unit MGU-H #2', pitlaneStatus: '✈️ In Transit', lastUpdated: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 5 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-3', key: 'PIT-103', name: 'Power Unit MGU-K #1', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 8 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-4', key: 'PIT-104', name: 'Power Unit Turbocharger', pitlaneStatus: '⚠️ DAMAGED', lastUpdated: new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 19 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-5', key: 'PIT-201', name: 'Gearbox Casing Titanium', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 14 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-6', key: 'PIT-202', name: 'Gearbox Sequential Actuator', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 6 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-7', key: 'PIT-301', name: 'Front Wing Assembly FW47', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 2 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-8', key: 'PIT-302', name: 'Front Wing Endplate Left', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 1 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-9', key: 'PIT-303', name: 'Front Wing Flap Upper', pitlaneStatus: '🏭 Manufactured', lastUpdated: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 0 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-10', key: 'PIT-304', name: 'Rear Wing DRS Mainplane', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 5 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-11', key: 'PIT-305', name: 'Rear Wing DRS Actuator', pitlaneStatus: '✈️ In Transit', lastUpdated: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 3 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-12', key: 'PIT-306', name: 'Beam Wing Carbon', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 1 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-13', key: 'PIT-401', name: 'Floor Diffuser Carbon', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 9 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-14', key: 'PIT-402', name: 'Floor Plank Wooden', pitlaneStatus: '⚠️ DAMAGED', lastUpdated: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 12 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-15', key: 'PIT-403', name: 'Floor Edge Blade', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 2 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-16', key: 'PIT-404', name: 'Floor Skid Block', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 7 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-17', key: 'PIT-501', name: 'Sidepod Left Cooling', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 15 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-18', key: 'PIT-502', name: 'Sidepod Right Radiator', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 12 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-19', key: 'PIT-503', name: 'Sidepod Inlet Vane', pitlaneStatus: '🏭 Manufactured', lastUpdated: new Date(now - 9 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 1 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-20', key: 'PIT-601', name: 'Suspension Wishbone Upper', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 11 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-21', key: 'PIT-602', name: 'Suspension Wishbone Lower', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 7 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-22', key: 'PIT-603', name: 'Suspension Pushrod Front', pitlaneStatus: '✈️ In Transit', lastUpdated: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 4 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-23', key: 'PIT-604', name: 'Suspension Pullrod Rear', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 9 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-24', key: 'PIT-701', name: 'Monocoque Chassis #02', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 22 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-25', key: 'PIT-702', name: 'Halo Titanium Structure', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 23 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-26', key: 'PIT-801', name: 'Brake Disc Carbon FL', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 2 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-27', key: 'PIT-802', name: 'Brake Caliper RR', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 8 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-28', key: 'PIT-803', name: 'Brake Cooling Duct', pitlaneStatus: '🏭 Manufactured', lastUpdated: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 1 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-29', key: 'PIT-901', name: 'Steering Wheel Assembly', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 16 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-30', key: 'PIT-902', name: 'Telemetry Main ECU', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 20 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-31', key: 'PIT-903', name: 'Display Screen Cockpit', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 10 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-32', key: 'PIT-904', name: 'Fuel Collector Tank', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 19 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-33', key: 'PIT-905', name: 'Seat Carbon Fiber', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 21 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-34', key: 'PIT-906', name: 'Headrest FIA Approved', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 17 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-35', key: 'PIT-907', name: 'Camera Mount Main', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 13 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-36', key: 'PIT-908', name: 'Mirror Assembly Left', pitlaneStatus: '✈️ In Transit', lastUpdated: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 3 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-37', key: 'PIT-909', name: 'Mirror Assembly Right', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 4 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-38', key: 'PIT-910', name: 'Clutch Paddle Mechanism', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 11 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-39', key: 'PIT-911', name: 'DRS Override Button', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 6 * 14 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'demo-40', key: 'PIT-912', name: 'Pit Lane Speed Limiter', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(), installDate: new Date(now - 15 * 14 * 24 * 60 * 60 * 1000).toISOString() }
    ];
  }

  return parts.map(part => {
    let maxRaces = 24;
    if (part.name.includes('Power Unit') || part.name.includes('Engine') || part.name.includes('ICE') || part.name.includes('MGU') || part.name.includes('Turbo')) maxRaces = 6;
    else if (part.name.includes('Gearbox')) maxRaces = 5;
    else if (part.name.includes('Wing') || part.name.includes('DRS') || part.name.includes('Beam')) maxRaces = 3;
    else if (part.name.includes('Floor') || part.name.includes('Plank') || part.name.includes('Diffuser') || part.name.includes('Skid')) maxRaces = 4;
    else if (part.name.includes('Sidepod') || part.name.includes('Cooling') || part.name.includes('Radiator')) maxRaces = 8;
    else if (part.name.includes('Suspension') || part.name.includes('Wishbone') || part.name.includes('Pushrod') || part.name.includes('Pullrod')) maxRaces = 6;
    else if (part.name.includes('Monocoque') || part.name.includes('Chassis') || part.name.includes('Halo')) maxRaces = 24;
    else if (part.name.includes('Brake')) maxRaces = 4;

    const installDate = part.installDate ? new Date(part.installDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const daysInstalled = Math.floor((Date.now() - installDate.getTime()) / (1000 * 60 * 60 * 24));
    const raceCount = Math.min(Math.floor(daysInstalled / 14), maxRaces);
    const lifeRemaining = maxRaces - raceCount;

    let predictiveStatus = 'OK';
    if (lifeRemaining <= 1) predictiveStatus = 'CRITICAL';
    else if (lifeRemaining === 2) predictiveStatus = 'WARNING';

    return { ...part, maxRaces, raceCount, lifeRemaining, predictiveStatus, installDate: installDate.toISOString() };
  });
}

resolver.define('getAllParts', async () => {
  return await getAllPartsInternal();
});

resolver.define('rovoGetStats', async () => {
  const parts = await getAllPartsInternal();
  const stats = { total: parts.length, trackside: parts.filter(p => p.pitlaneStatus.includes('Trackside')).length, issues: parts.filter(p => p.pitlaneStatus.includes('DAMAGED')).length, criticalParts: parts.filter(p => p.pitlaneStatus.includes('DAMAGED')).map(p => p.name), predictiveWarnings: parts.filter(p => p.predictiveStatus === 'CRITICAL').length };
  const readiness = stats.total > 0 ? Math.round((stats.trackside / stats.total) * 100) : 0;
  return { readinessScore: `${readiness}%`, totalParts: stats.total, criticalIssuesCount: stats.issues, criticalPartNames: stats.criticalParts, predictiveWarnings: stats.predictiveWarnings, summary: `Fleet Readiness is ${readiness}%. There are ${stats.issues} critical issues. Predictive AI warns that ${stats.predictiveWarnings} parts are near End-of-Life.` };
});

async function getHistoryInternal(issueId) {
  if (!issueId) return [];
  const storageKey = `history_${issueId}`;
  const history = await storage.get(storageKey);
  return history || [];
}

resolver.define('seedDemoData', async ({ payload }) => {
  const { issueId } = payload;
  return await seedDemoDataInternal(issueId);
});

async function seedDemoDataInternal(issueId) {
  if (!issueId) return [];
  const storageKey = `history_${issueId}`;
  const existing = await storage.get(storageKey);
  if (existing && existing.length > 0) return existing;
  const demoHistory = [
    { id: uuid(), timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), status: '🏭 Manufactured', note: 'Forged at Grove Factory' },
    { id: uuid(), timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), status: '🏁 Trackside', note: 'Ready for installation' }
  ];
  await storage.set(storageKey, demoHistory);
  return demoHistory;
}

export const handler = resolver.getDefinitions();
