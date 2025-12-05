import { invoke } from '@forge/bridge';

// ========================================
// FORGE STORAGE CLEAR UTILITY
// ========================================
// Use this in browser console when you need to reset Forge storage during development
//
// Instructions:
// 1. Open Jira and navigate to your Forge app
// 2. Open browser dev tools (F12)
// 3. Go to Console tab
// 4. Copy and paste the code below:

// ===== CLEAR ALL STORAGE (Complete Reset) =====
invoke('clearAllStorage').then(result => {
    console.log('✅', result.message);
    console.log('🔄 Refresh the page to start fresh.');
}).catch(err => console.error('❌ Error:', err));

// ===== OR Clear Production Data Only =====
// invoke('clearProductionData').then(result => {
//     console.log('✅', result.message);
//     console.log('🔄 Refresh the page.');
// }).catch(err => console.error('❌ Error:', err));
