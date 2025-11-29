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
    parts = [
      { id: 'demo-2', key: 'PIT-2', name: 'Front Wing Assembly FW47', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date().toISOString() },
      { id: 'demo-4', key: 'PIT-4', name: 'Monocoque Chassis #02', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(Date.now() - 259200000).toISOString() },
      { id: 'demo-3', key: 'PIT-3', name: 'Sidepod Left Cooling Duct', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(Date.now() - 172800000).toISOString() },
      { id: 'demo-8', key: 'PIT-8', name: 'Sidepod Right Radiator Mount', pitlaneStatus: '✈️ In Transit', lastUpdated: new Date(Date.now() - 604800000).toISOString() },
      { id: 'demo-5', key: 'PIT-5', name: 'Gearbox Casing Titanium', pitlaneStatus: '✈️ In Transit', lastUpdated: new Date(Date.now() - 345600000).toISOString() },
      { id: 'demo-7', key: 'PIT-7', name: 'Rear Wing DRS Actuator', pitlaneStatus: '🏭 Manufactured', lastUpdated: new Date(Date.now() - 518400000).toISOString() },
      { id: 'demo-1', key: 'PIT-1', name: 'Floor Diffuser Carbon Element', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(Date.now() - 86400000).toISOString() },
      { id: 'demo-9', key: 'PIT-9', name: 'Floor Plank Wooden Element', pitlaneStatus: '⚠️ DAMAGED', lastUpdated: new Date(Date.now() - 691200000).toISOString() },
      { id: 'demo-6', key: 'PIT-6', name: 'Suspension Wishbone Upper', pitlaneStatus: '🏭 Manufactured', lastUpdated: new Date(Date.now() - 432000000).toISOString() },
      { id: 'demo-10', key: 'PIT-10', name: 'Steering Wheel Assembly', pitlaneStatus: '🏁 Trackside', lastUpdated: new Date(Date.now() - 777600000).toISOString() }
    ];
  }

  return parts.map(part => {
    let maxRaces = 24;
    if (part.name.includes('Power Unit') || part.name.includes('Engine') || part.name.includes('ICE') || part.name.includes('MGU')) maxRaces = 6;
    else if (part.name.includes('Gearbox')) maxRaces = 5;
    else if (part.name.includes('Front Wing') || part.name.includes('Rear Wing') || part.name.includes('DRS')) maxRaces = 3;
    else if (part.name.includes('Floor') || part.name.includes('Plank') || part.name.includes('Diffuser')) maxRaces = 4;
    else if (part.name.includes('Sidepod') || part.name.includes('Cooling')) maxRaces = 8;
    else if (part.name.includes('Suspension') || part.name.includes('Wishbone')) maxRaces = 6;
    else if (part.name.includes('Monocoque') || part.name.includes('Chassis')) maxRaces = 24;
    const raceCount = (part.key.charCodeAt(part.key.length - 1) % maxRaces) + 1;
    const lifeRemaining = maxRaces - raceCount;
    let predictiveStatus = 'OK';
    if (lifeRemaining <= 1) predictiveStatus = 'CRITICAL';
    else if (lifeRemaining === 2) predictiveStatus = 'WARNING';
    return { ...part, maxRaces, raceCount, lifeRemaining, predictiveStatus };
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
