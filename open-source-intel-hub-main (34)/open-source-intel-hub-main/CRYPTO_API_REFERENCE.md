# Crypto Investigation API Reference

## Overview
This document lists all the blockchain APIs and endpoints used in the crypto investigation feature.

## Current Implementations

### 1. Blockchain.info (Bitcoin)
**Primary Bitcoin Data Source**

#### Wallet Information
- **Endpoint**: `https://blockchain.info/rawaddr/{address}?limit={limit}`
- **Method**: GET
- **Rate Limit**: ~5 requests/second
- **Data Returned**:
  - Final balance (satoshis)
  - Total received (satoshis)
  - Total sent (satoshis)
  - Transaction count
  - Transaction list with full details

**Example**:
```
https://blockchain.info/rawaddr/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?limit=50
```

#### Transaction Lookup
- **Endpoint**: `https://blockchain.info/rawtx/{txHash}`
- **Method**: GET
- **Data Returned**:
  - Block height and hash
  - Timestamp
  - Inputs and outputs
  - Fee amount
  - Confirmation status

**Example**:
```
https://blockchain.info/rawtx/4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b
```

---

### 2. Blockchair (Bitcoin)
**Fallback Bitcoin Data Source with USD Conversion**

#### Address Dashboard
- **Endpoint**: `https://api.blockchair.com/bitcoin/dashboards/address/{address}`
- **Method**: GET
- **Rate Limit**: 30 requests/minute (free tier)
- **Data Returned**:
  - Balance with USD value
  - Transaction statistics
  - First/last seen timestamps
  - Detailed address analytics

**Example**:
```
https://api.blockchair.com/bitcoin/dashboards/address/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
```

**Response Format**:
```json
{
  "data": {
    "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa": {
      "address": {
        "balance": 6839588590,
        "balance_usd": 2894678.24,
        "received": 6839588590,
        "spent": 0,
        "transaction_count": 3789,
        "first_seen_receiving": "2009-01-03 18:15:05",
        "last_seen_receiving": "2024-03-15 10:30:22"
      }
    }
  }
}
```

---

### 3. Ethplorer (Ethereum)
**Primary Ethereum Data Source**

#### Address Information
- **Endpoint**: `https://api.ethplorer.io/getAddressInfo/{address}?apiKey=freekey`
- **Method**: GET
- **Rate Limit**: 5 requests/second (free key)
- **Data Returned**:
  - ETH balance
  - Token holdings
  - Transaction count
  - USD values

**Example**:
```
https://api.ethplorer.io/getAddressInfo/0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae?apiKey=freekey
```

**Response Format**:
```json
{
  "ETH": {
    "balance": 18.4567,
    "price": {
      "rate": 2345.67,
      "diff": 2.5,
      "ts": 1647532800
    }
  },
  "countTxs": 1234,
  "tokens": [
    {
      "tokenInfo": {
        "name": "USD Coin",
        "symbol": "USDC",
        "decimals": "6"
      },
      "balance": 100000000
    }
  ]
}
```

---

## Planned Integrations

### 4. WalletExplorer.com (Future)
**Advanced Wallet Clustering**

#### Potential Endpoints:
- **Wallet Lookup**: `https://www.walletexplorer.com/api/1/address?address={address}`
- **Wallet Cluster**: `https://www.walletexplorer.com/api/1/wallet?wallet={walletId}`
- **Features**:
  - Wallet clustering algorithms
  - Entity identification
  - Address grouping
  - Ownership analysis

**Note**: Currently investigating API access and rate limits

---

### 5. Blockpath.com (Future)
**Transaction Path Analysis**

#### Potential Features:
- Transaction flow visualization
- Path finding between addresses
- Money flow tracking
- Route analysis
- Mixing detection

**Note**: Exploring API availability and integration options

---

### 6. BTCScan.org (Future)
**Additional Bitcoin Data**

#### Potential Features:
- Alternative Bitcoin explorer
- Additional metadata
- Enhanced address labeling
- Transaction annotations

**Note**: Evaluating as tertiary fallback source

---

## Data Structure Mapping

### Bitcoin Address Data
```typescript
{
  address: string;              // Wallet address
  network: 'bitcoin';           // Network identifier
  balance: string;              // Current balance (BTC)
  balanceUSD: number;           // USD equivalent
  totalReceived: string;        // Total received (BTC)
  totalSent: string;            // Total sent (BTC)
  transactionCount: number;     // Total TX count
  firstSeen: string;            // ISO timestamp
  lastSeen: string;             // ISO timestamp
  labels: string[];             // Entity labels
  isExchange: boolean;          // Exchange wallet
  isMixer: boolean;             // Mixing service
  isRansomware: boolean;        // Ransomware wallet
  riskScore: number;            // 0-100
  riskLevel: string;            // Critical/High/Med/Low/Safe
}
```

### Transaction Data
```typescript
{
  hash: string;                 // TX hash
  blockNumber: number;          // Block height
  blockHash: string;            // Block hash
  timestamp: string;            // ISO timestamp
  confirmations: number;        // Confirmation count
  from: string;                 // Sender address
  to: string;                   // Receiver address
  value: string;                // TX value
  valueUSD: number;             // USD equivalent
  fee: string;                  // Fee paid
  feeUSD: number;               // Fee in USD
  status: string;               // confirmed/pending/failed
  inputs: Array<{
    address: string;
    value: string;
    previousTxHash: string;
    previousIndex: number;
  }>;
  outputs: Array<{
    address: string;
    value: string;
    index: number;
    spent: boolean;
    spentTxHash?: string;
  }>;
}
```

---

## API Error Handling

### Retry Logic
```typescript
// Automatic fallback chain
1. Try blockchain.info
2. If fails → Try blockchair.com
3. If both fail → Return error
```

### Rate Limiting
- Client-side throttling
- Exponential backoff on 429 errors
- Queue management for bulk requests
- Cache to reduce API calls

### Error Types
```typescript
- Network errors: API unreachable
- Rate limit: 429 Too Many Requests
- Invalid address: 400 Bad Request
- Not found: 404 Not Found
- Server error: 500 Internal Server Error
```

---

## Caching Strategy

### Cache Keys
```typescript
- wallet_info_{network}_{address}
- tx_details_{network}_{hash}
- wallet_txs_{network}_{address}_{limit}
```

### TTL (Time To Live)
- Wallet info: 10 minutes
- Transaction details: 15 minutes (immutable once confirmed)
- Transaction lists: 5 minutes (may update)

### Cache Benefits
- Reduced API calls
- Faster repeat searches
- Lower rate limit usage
- Better user experience

---

## Network Detection

### Address Format Patterns

#### Bitcoin
- **Legacy (P2PKH)**: `^[1][a-km-zA-HJ-NP-Z1-9]{25,34}$`
- **Script (P2SH)**: `^[3][a-km-zA-HJ-NP-Z1-9]{25,34}$`
- **Bech32 (SegWit)**: `^bc1[a-z0-9]{39,59}$`

**Examples**:
- `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa` (Legacy)
- `3J98t1WpEZ73CNmYviecrnyiWrnqRhWNLy` (P2SH)
- `bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq` (Bech32)

#### Ethereum
- **Format**: `^0x[a-fA-F0-9]{40}$`
- **Example**: `0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae`

#### Tron
- **Format**: `^T[A-Za-z1-9]{33}$`
- **Example**: `TYm5t4Qp6pqcQwN8y7X1xBVkXc7Uv8YqJZ`

#### Litecoin
- **Format**: `^[LM][a-km-zA-HJ-NP-Z1-9]{26,33}$`
- **Example**: `LZnFNhMJJSiE6VWtBW9fU9Nx1Ec1yGXs72`

---

## Transaction Hash Formats

### Bitcoin/Litecoin
- **Format**: 64 hexadecimal characters
- **Pattern**: `^[a-fA-F0-9]{64}$`
- **Example**: `4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b`

### Ethereum/Tron
- **Format**: 0x prefix + 64 hex characters
- **Pattern**: `^0x[a-fA-F0-9]{64}$`
- **Example**: `0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`

---

## API Rate Limits Summary

| Provider      | Free Tier          | Paid Tier         | Notes                    |
|---------------|-------------------|-------------------|--------------------------|
| Blockchain.info | ~5 req/sec       | Custom            | No API key required      |
| Blockchair    | 30 req/min        | 1000+ req/min     | Free key available       |
| Ethplorer     | 5 req/sec         | Higher limits     | Free key: "freekey"      |

---

## Best Practices

### 1. Always Use Cache
```typescript
const cached = await getCachedData(cacheKey);
if (cached) return cached;
```

### 2. Implement Fallbacks
```typescript
try {
  return await primaryAPI();
} catch {
  return await fallbackAPI();
}
```

### 3. Validate Input
```typescript
const network = detectNetworkFromAddress(address);
if (network === 'unknown') {
  throw new Error('Invalid address');
}
```

### 4. Handle Errors Gracefully
```typescript
try {
  const data = await fetchAPI();
} catch (error) {
  console.error('API Error:', error);
  toast.error('Failed to fetch data');
  return null;
}
```

### 5. Log API Calls
```typescript
console.log(`[API] Fetching ${address} from ${provider}`);
```

---

## Testing Endpoints

### Test with curl:
```bash
# Bitcoin wallet
curl "https://blockchain.info/rawaddr/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?limit=10"

# Bitcoin transaction
curl "https://blockchain.info/rawtx/4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b"

# Ethereum wallet
curl "https://api.ethplorer.io/getAddressInfo/0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae?apiKey=freekey"

# Blockchair
curl "https://api.blockchair.com/bitcoin/dashboards/address/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
```

---

## Future Enhancements

### Additional APIs to Consider:
1. **CoinGecko**: Real-time price data
2. **Etherscan**: Enhanced Ethereum data (requires API key)
3. **Blockcypher**: Multi-chain support
4. **CryptoCompare**: Historical price data
5. **Whale Alert**: Large transaction tracking

### Advanced Features:
- WebSocket connections for real-time updates
- GraphQL endpoints for complex queries
- Direct blockchain node connections
- IPFS for decentralized data storage

---

## Support & Documentation

### Official API Docs:
- [Blockchain.info API](https://www.blockchain.com/api)
- [Blockchair API](https://blockchair.com/api/docs)
- [Ethplorer API](https://github.com/EverexIO/Ethplorer/wiki/Ethplorer-API)

### Rate Limit Monitoring:
Check response headers:
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1647532800
```

---

**Last Updated**: January 2026
**Version**: 1.0
**Maintained By**: OSINT Intelligence Hub Team
