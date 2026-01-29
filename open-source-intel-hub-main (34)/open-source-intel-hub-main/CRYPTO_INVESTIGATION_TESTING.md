# Crypto Investigation Feature - Testing Guide

## Quick Test Instructions

### 1. Start the Application
```bash
npm run dev
# or
yarn dev
```

### 2. Navigate to Crypto Investigation
1. Open your browser to `http://localhost:5173` (or your dev server URL)
2. Log in to the application
3. Go to **Dashboard** → **Threat Intel**
4. Click on the **"CryptoIntel"** tab

## Test Cases

### Test Case 1: Bitcoin Wallet Investigation
**Objective**: Test Bitcoin wallet analysis with graph visualization

**Steps**:
1. Select "Wallet Address" mode
2. Enter: `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa` (Satoshi's Genesis wallet)
3. Enable all options:
   - ✓ Fetch Transaction History
   - ✓ Build Connection Graph
   - Graph Depth: 2
4. Click "Search"

**Expected Results**:
- Loading indicator appears
- Wallet info card displays:
  - Address with copy button
  - Network: BITCOIN
  - Balance and transaction count
  - First/last seen dates
- Graph tab shows connected wallets
- Transactions tab lists history
- All 5 tabs are populated with data

### Test Case 2: High-Activity Bitcoin Wallet
**Objective**: Test wallet with many transactions

**Steps**:
1. Enter: `1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF`
2. Set Graph Depth: 1 (to prevent timeout)
3. Click "Search"

**Expected Results**:
- More transaction history
- Multiple connected wallets
- Graph with many nodes
- Higher transaction count displayed

### Test Case 3: Ethereum Wallet
**Objective**: Test Ethereum support

**Steps**:
1. Enter: `0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae` (Ethereum Foundation)
2. Click "Search"

**Expected Results**:
- Network detected as ETHEREUM
- Wallet info displays
- Token information in metadata
- Connected addresses shown

### Test Case 4: Transaction Hash Lookup
**Objective**: Test transaction detail view

**Steps**:
1. Switch to "Transaction Hash" mode
2. Enter: `4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b`
3. Click "Search"

**Expected Results**:
- Transaction details card appears
- Shows inputs and outputs
- Displays value, fee, confirmations
- Block number and timestamp
- Status badge (confirmed/pending)

### Test Case 5: Graph Interaction
**Objective**: Test interactive graph features

**Steps**:
1. Search any Bitcoin wallet
2. Navigate to "Graph" tab
3. Perform these actions:
   - Click a node → Details appear in bottom panel
   - Drag canvas → Graph pans
   - Click "Zoom In" → Graph enlarges
   - Click "Zoom Out" → Graph shrinks
   - Click "Reset" → Returns to original view
   - Click "Download" → PNG downloads

**Expected Results**:
- All interactions work smoothly
- Selected node highlights with white border
- Info panels update correctly
- Zoom level displays in top-left stats

### Test Case 6: Connected Wallet Exploration
**Objective**: Test drilling into connected wallets

**Steps**:
1. Search initial wallet
2. Go to "Connections" tab
3. Click "Explore" on any connected wallet
4. Verify new search initiates

**Expected Results**:
- Search query updates with selected address
- New investigation begins automatically
- Can chain multiple explorations
- Build a transaction network

### Test Case 7: Invalid Address Detection
**Objective**: Test error handling

**Steps**:
1. Enter invalid addresses:
   - Random text: "invalid123"
   - Partial address: "1A1zP1eP"
   - Wrong format: "abcdefg"
2. Click "Search"

**Expected Results**:
- Error toast appears
- Message: "Invalid address or transaction hash"
- No crash or loading state stuck

### Test Case 8: Advanced Options
**Objective**: Test configuration controls

**Steps**:
1. Click "Advanced Options" accordion
2. Toggle switches:
   - Disable "Fetch Transaction History"
   - Disable "Build Connection Graph"
3. Search a wallet

**Expected Results**:
- Transactions tab shows "No transactions found"
- Graph tab shows "No graph data available"
- Investigation completes faster

### Test Case 9: Risk Assessment
**Objective**: Test threat intelligence features

**Steps**:
1. Search various wallets
2. Check "Threat Intel" tab

**Expected Results**:
- Risk score displayed (0-100)
- Risk level badge (Safe/Low/Medium/High/Critical)
- Known threat detection works
- Threat types identified if applicable

### Test Case 10: Copy to Clipboard
**Objective**: Test copy functionality

**Steps**:
1. Search any wallet
2. Click copy buttons:
   - Wallet address copy
   - Transaction hash copy
3. Check clipboard contents

**Expected Results**:
- Toast: "Copied to clipboard"
- Correct data in clipboard
- Can paste into search field

## Performance Tests

### Test 11: Large Graph Performance
**Steps**:
1. Search high-activity wallet
2. Set Graph Depth: 3
3. Monitor performance

**Expected Results**:
- Graph loads within 30 seconds
- Animation runs smoothly (60fps target)
- Browser doesn't freeze
- Node limit (50) prevents overload

### Test 12: API Timeout Handling
**Steps**:
1. Disable internet connection temporarily
2. Attempt search
3. Re-enable connection

**Expected Results**:
- Error message appears
- No infinite loading
- Can retry after connection restored

## Visual Tests

### Test 13: Risk Color Coding
**Objective**: Verify visual risk indicators

**Expected Color Scheme**:
- Critical: Red (#ef4444)
- High: Orange (#f97316)
- Medium: Yellow (#eab308)
- Low: Blue (#3b82f6)
- Safe: Green (#10b981)

### Test 14: Responsive Design
**Steps**:
1. Resize browser window
2. Test on mobile viewport (375px)
3. Test on tablet (768px)
4. Test on desktop (1920px)

**Expected Results**:
- Cards stack properly on mobile
- Graph canvas scales
- All buttons remain accessible
- Text remains readable

## Integration Tests

### Test 15: Navigation Between Tabs
**Steps**:
1. Complete a search
2. Switch between all tabs multiple times
3. Verify data persists

**Expected Results**:
- Tab switching is instant
- Data doesn't reload
- Selected node remains highlighted
- No console errors

### Test 16: Multiple Searches
**Steps**:
1. Search wallet A
2. Search wallet B
3. Search wallet C
4. Use browser back button

**Expected Results**:
- Each search clears previous results
- No data mixing
- Back button works correctly
- Search history maintained

## Edge Cases

### Test 17: Empty Wallet
**Steps**:
1. Search newly created/empty wallet
2. Check all tabs

**Expected Results**:
- Balance: 0
- Transaction count: 0
- Empty transaction list
- No graph connections
- Risk: Safe

### Test 18: Very Old Wallet
**Steps**:
1. Search Genesis block wallet
2. Check timestamps

**Expected Results**:
- First seen: ~2009
- Historical data loads
- Old transaction formats handled

## API Testing

### Test 19: API Fallback
**Steps**:
1. Monitor network requests
2. Search Bitcoin wallet
3. Observe API calls

**Expected Results**:
- Primary API tried first (blockchain.info)
- Falls back to blockchair if needed
- Successful data retrieval
- Errors logged to console

### Test 20: Cache Testing
**Steps**:
1. Search a wallet
2. Wait 5 minutes
3. Search same wallet again

**Expected Results**:
- First search: API call made
- Second search: Cached data used (faster)
- Toast indicates cache hit (optional)
- Data consistency maintained

## Accessibility Tests

### Test 21: Keyboard Navigation
**Steps**:
1. Use Tab key to navigate
2. Use Enter to submit searches
3. Use Escape to close modals

**Expected Results**:
- All interactive elements reachable
- Focus indicators visible
- Logical tab order
- Keyboard shortcuts work

## Console Checks

### During All Tests, Monitor Console For:
- ✓ No React errors
- ✓ No TypeScript errors
- ✓ API calls logged correctly
- ✓ Network errors handled gracefully
- ✓ No memory leaks

## Success Criteria

All tests should pass with:
- No application crashes
- No infinite loading states
- No data corruption
- Clear error messages
- Smooth animations
- Fast response times (<5s for most operations)

## Known Limitations

1. **API Rate Limits**: Public APIs may throttle requests
2. **Graph Size**: Limited to 50 nodes for performance
3. **Network Support**: Bitcoin and Ethereum fully tested
4. **Cache Duration**: 10 minutes may need adjustment
5. **Animation Frames**: Capped at 300 for stability

## Troubleshooting

### Graph Not Loading
- Check browser console for API errors
- Verify internet connection
- Try reducing graph depth
- Check API rate limits

### Slow Performance
- Reduce graph depth to 1
- Disable transaction fetching
- Clear browser cache
- Update to latest browser version

### TypeScript Errors
- Run: `npm install`
- Check all dependencies installed
- Restart development server

### Missing Data
- Some wallets may have limited public data
- Try alternative blockchain explorers
- Check if address is correct format

## Reporting Issues

When reporting bugs, include:
1. Wallet address tested
2. Browser and version
3. Console error messages
4. Screenshots if applicable
5. Steps to reproduce

---

**Happy Testing! 🚀**

For questions or issues, check the console logs or review the implementation documentation in `CRYPTO_INVESTIGATION_FEATURE.md`.
