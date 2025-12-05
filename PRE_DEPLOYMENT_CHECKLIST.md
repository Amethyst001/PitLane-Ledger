# Pre-Deployment Checklist

## Code Cleanup
- [ ] **Remove Debug Logging**
  - [ ] Remove excessive `console.log` statements from production code
  - [ ] Keep only critical error logging
  - [ ] Search for `console.log('[DEBUG]` and remove
  - [ ] Search for `console.log('[getHistory` etc and clean up

- [ ] **Remove Dev Tools**
  - [ ] Delete `CLEAR_STORAGE.js` from project root
  - [ ] Delete `PROD_HISTORY_SNIPPET.txt` if present
  
## Performance Optimization
- [ ] **Dashboard Loading Speed**
  - [ ] Implement caching strategy for parts data
  - [ ] Add pagination for large inventories (10,000+ parts)
  - [ ] Lazy load calendar/timeline components
  - [ ] Add "Refresh Data" button instead of auto-fetch on mount
  - [ ] Consider service worker cache for production data

- [ ] **Bundle Size Optimization**
  - [ ] Run production build analysis
  - [ ] Check for unused dependencies
  - [ ] Optimize images/assets
  - [ ] Enable tree-shaking

## Security Hardening
- [ ] **CSV Import Security**
  - [x] CSV formula injection prevention
  - [x] XSS prevention in QR code generation
  - [x] File size limits (10MB)
  - [x] Row count validation
  - [ ] Review all input sanitization

- [ ] **Authentication & Authorization**
  - [ ] Verify pit-crew group permissions
  - [ ] Test mobile-only access for crew members
  - [ ] Verify manager-only access for onboarding

- [ ] **Data Validation**
  - [ ] Review all resolver input validation
  - [ ] Test edge cases (empty arrays, null values, etc.)
  - [ ] Verify storage quota limits

## Production Readiness
- [ ] **Background Carousel Timing**
  - [ ] Change rotation from 4s back to 12s in `BackgroundCarousel.jsx`
  - [ ] Line 29: Change `4000` to `12000`
  
- [ ] **Onboarding Persistence**
  - [ ] Uncomment `appConfigured` flag implementation
  - [ ] Test first-time setup flow
  - [ ] Test returning user flow (should skip onboarding)
  - [ ] Test multi-user scenarios

- [ ] **Error Handling**
  - [ ] Add error boundaries to all major components
  - [ ] Implement graceful degradation for API failures
  - [ ] Add retry logic for critical operations
  - [ ] Improve error messages for users

- [ ] **Data Migration**
  - [ ] Document CSV format requirements
  - [ ] Create sample CSV template with all columns
  - [ ] Test with various CSV sizes (100, 1000, 10000 parts)
  - [ ] Verify data integrity after import

## Testing
- [ ] **Demo Mode**
  - [ ] Verify 50 mock parts load correctly
  - [ ] Test all dashboard features work
  - [ ] Verify no storage pollution
  - [ ] Test mobile pit crew access

- [ ] **Production Mode**
  - [ ] Test CSV import flow end-to-end
  - [ ] Verify data persists after reload
  - [ ] Test dashboard with imported data
  - [ ] Test QR code generation with production data
  - [ ] Verify fleet config saves and persists

- [ ] **Mobile Pit Crew**
  - [ ] Test responsive layout on various screen sizes
  - [ ] Verify event logging works
  - [ ] Test part search and selection
  - [ ] Verify history displays correctly

- [ ] **Cross-Browser Testing**
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge

## Documentation
- [ ] Update README with:
  - [ ] Installation instructions
  - [ ] CSV format documentation
  - [ ] User roles and permissions
  - [ ] Troubleshooting guide

- [ ] Create user guides:
  - [ ] Manager onboarding guide
  - [ ] Pit crew mobile guide
  - [ ] CSV import best practices

## Final Checklist
- [ ] Remove all debug console.logs from production code
- [ ] Verify all environment variables are set
- [ ] Test on actual Jira production environment
- [ ] Run `forge lint` with no errors
- [ ] Build production bundle successfully
- [ ] Review Forge app permissions
- [ ] Set proper app version number
- [ ] Create backup of Forge storage before deployment
