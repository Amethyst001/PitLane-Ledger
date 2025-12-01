import { storage } from '@forge/api';
import { getMockParts } from './mockData.js';

// DASHBOARD RESOLVER - Simple and Direct
export const handler = async (event, context) => {
    console.log("📊 [DASHBOARD] Handler invoked");
    console.log("📊 [DASHBOARD] Event:", JSON.stringify(event, null, 2));

    // Simple switch based on common patterns
    const action = event?.action || event?.payload?.action || 'getAllParts';

    console.log(`📊 [DASHBOARD] Action: ${action}`);

    switch (action) {
        case 'getAllParts':
            console.log("📊 [DASHBOARD] Returning parts array");
            return getMockParts();

        case 'getRaceCalendar':
            return [
                { round: 1, race: 'Bahrain GP', date: '2025-03-02', location: 'Sakhir', weather: 'Clear, 28°C' },
                { round: 2, race: 'Saudi Arabian GP', date: '2025-03-09', location: 'Jeddah', weather: 'Night, 26°C' },
                { round: 3, race: 'Australian GP', date: '2025-03-23', location: 'Melbourne', weather: 'Partly Cloudy, 22°C' }
            ];

        case 'getDriverNames':
            return {
                car1: 'Alex Albon',
                car2: 'Carlos Sainz'
            };

        case 'checkInitialLoad':
            const hasOnboarded = await storage.get('onboardingComplete');
            return !hasOnboarded;

        default:
            // Default to returning parts if action is unclear
            console.log("📊 [DASHBOARD] Unknown action, defaulting to parts");
            return getMockParts();
    }
};
