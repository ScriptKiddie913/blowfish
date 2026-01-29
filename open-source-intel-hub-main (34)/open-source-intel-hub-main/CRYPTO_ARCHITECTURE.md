# Crypto Investigation Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE LAYER                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              ThreatIntelSearch Component                      │  │
│  │  ┌────────┬────────┬────────┬────────┬──────────────────┐   │  │
│  │  │   IP   │ Domain │  URL   │  Hash  │  CryptoIntel    │   │  │
│  │  └────────┴────────┴────────┴────────┴──────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│                              ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              CryptoInvestigator Component                     │  │
│  │                                                                │  │
│  │  ┌─────────────────────────────────────────────────────┐    │  │
│  │  │  Search Interface                                    │    │  │
│  │  │  ┌──────────────┬──────────────────────────────┐   │    │  │
│  │  │  │ Wallet Addr  │  Transaction Hash           │   │    │  │
│  │  │  └──────────────┴──────────────────────────────┘   │    │  │
│  │  │  [Advanced Options: Graph Depth, TX Fetch]         │    │  │
│  │  └─────────────────────────────────────────────────────┘    │  │
│  │                                                                │  │
│  │  ┌─────────────────────────────────────────────────────┐    │  │
│  │  │  Results Tabs                                        │    │  │
│  │  │  ┌─────┬─────┬──────┬───────┬─────────┐           │    │  │
│  │  │  │Graph│ TXs │Conns │Threat │Analysis │           │    │  │
│  │  │  └─────┴─────┴──────┴───────┴─────────┘           │    │  │
│  │  └─────────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│                              ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │         CryptoWalletGraph Component                           │  │
│  │                                                                │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │  Canvas-based Force-Directed Graph                     │ │  │
│  │  │  • Nodes: Wallets (color-coded by risk)              │ │  │
│  │  │  • Edges: Transactions (width by volume)             │ │  │
│  │  │  • Interactive: Click, Zoom, Pan                     │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │    cryptoWalletInvestigationService                           │  │
│  │                                                                │  │
│  │  Core Functions:                                              │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  │ • investigateWallet(address, network, options)          │ │  │
│  │  │ • getWalletInfo(address, network)                       │ │  │
│  │  │ • getTransactionDetails(hash, network)                  │ │  │
│  │  │ • getWalletTransactions(address, network, limit)        │ │  │
│  │  │ • buildWalletGraph(address, network, depth)             │ │  │
│  │  │ • detectNetworkFromAddress(address)                     │ │  │
│  │  │ • isValidTransactionHash(hash, network)                 │ │  │
│  │  └─────────────────────────────────────────────────────────┘ │  │
│  │                                                                │  │
│  │  Analysis Functions:                                          │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  │ • analyzeBehaviorPattern(transactions)                  │ │  │
│  │  │ • analyzeVolume(transactions)                           │ │  │
│  │  │ • analyzeFrequency(transactions)                        │ │  │
│  │  │ • identifyRiskFactors(wallet, transactions)             │ │  │
│  │  │ • generateRecommendations(wallet, transactions)         │ │  │
│  │  └─────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│                              ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │           Caching Layer (database.ts)                         │  │
│  │  • getCachedData(key) → Check cache first                    │  │
│  │  • cacheAPIResponse(key, data, ttl) → Store results          │  │
│  │  • TTL: 10 minutes for wallet info                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL API LAYER                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  BITCOIN APIS                                                        │
│  ┌──────────────────┐        ┌──────────────────┐                  │
│  │ Blockchain.info  │───┐    │ Blockchair.com   │                  │
│  │                  │   │    │                  │                  │
│  │ • Primary source │   │    │ • Fallback source│                  │
│  │ • /rawaddr       │   │    │ • /dashboards    │                  │
│  │ • /rawtx         │   │    │ • USD conversion │                  │
│  │ • 5 req/sec      │   │    │ • 30 req/min     │                  │
│  └──────────────────┘   │    └──────────────────┘                  │
│                         │                                            │
│                         ▼                                            │
│               [Bitcoin Wallet Data]                                 │
│                         │                                            │
│                         ├──► Balance, TXs, History                  │
│                         └──► Connected Addresses                    │
│                                                                       │
│  ETHEREUM APIS                                                       │
│  ┌──────────────────┐                                               │
│  │ Ethplorer.io     │                                               │
│  │                  │                                               │
│  │ • ETH & tokens   │                                               │
│  │ • /getAddressInfo│                                               │
│  │ • Free API key   │                                               │
│  │ • 5 req/sec      │                                               │
│  └──────────────────┘                                               │
│           │                                                          │
│           ▼                                                          │
│  [Ethereum Wallet Data]                                             │
│           │                                                          │
│           └──► ETH Balance, Token Holdings, TX Count                │
│                                                                       │
│  FUTURE INTEGRATIONS (Planned)                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │ WalletExplorer   │  │ Blockpath.com    │  │ BTCScan.org      │ │
│  │ • Clustering     │  │ • Path analysis  │  │ • Additional data│ │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────┐
│  User   │
│  Input  │
└────┬────┘
     │
     ▼
┌─────────────────────┐
│ Network Detection   │ ──► Bitcoin? Ethereum? Tron?
└─────────┬───────────┘
          │
          ▼
    ┌─────────┐
    │  Cache  │ ──► Check if data already fetched
    │  Check  │
    └────┬────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
  Hit       Miss
    │         │
    │         ▼
    │    ┌────────────┐
    │    │ API Call   │ ──► Primary API
    │    └─────┬──────┘
    │          │
    │     ┌────┴────┐
    │     │         │
    │   Success   Fail
    │     │         │
    │     │         ▼
    │     │    ┌────────────┐
    │     │    │ Fallback   │ ──► Secondary API
    │     │    │    API     │
    │     │    └─────┬──────┘
    │     │          │
    │     ▼          ▼
    │   ┌──────────────┐
    │   │ Cache Result │
    │   └──────┬───────┘
    │          │
    └──────────┘
         │
         ▼
┌────────────────────┐
│   Data Processing  │
│ • Parse response   │
│ • Calculate risk   │
│ • Format data      │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│  Graph Building    │
│ • BFS traversal    │
│ • Find connections │
│ • Limit nodes      │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ Threat Analysis    │
│ • Check databases  │
│ • Calculate score  │
│ • Identify risks   │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│   UI Rendering     │
│ • Display info     │
│ • Render graph     │
│ • Show analysis    │
└────────────────────┘
```

## Component Interaction Flow

```
ThreatIntelSearch
       │
       │ User selects "CryptoIntel" tab
       │
       ▼
┌──────────────────────────────────────┐
│      CryptoInvestigator              │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  User enters address/hash      │ │
│  └───────────┬────────────────────┘ │
│              │                       │
│              ▼                       │
│  ┌────────────────────────────────┐ │
│  │  detectNetworkFromAddress()    │ │
│  └───────────┬────────────────────┘ │
│              │                       │
│              ▼                       │
│  ┌────────────────────────────────┐ │
│  │  investigateWallet()           │ ────────┐
│  └────────────────────────────────┘ │       │
└──────────────────────────────────────┘       │
                                                │
                                                ▼
                                ┌───────────────────────────────┐
                                │ cryptoWalletInvestigationSvc │
                                │                               │
                                │ ┌───────────────────────────┐ │
                                │ │ getWalletInfo()           │ │
                                │ └─────────┬─────────────────┘ │
                                │           │                   │
                                │           ▼                   │
                                │ ┌───────────────────────────┐ │
                                │ │ getWalletTransactions()   │ │
                                │ └─────────┬─────────────────┘ │
                                │           │                   │
                                │           ▼                   │
                                │ ┌───────────────────────────┐ │
                                │ │ buildWalletGraph()        │ │
                                │ └─────────┬─────────────────┘ │
                                │           │                   │
                                │           ▼                   │
                                │ ┌───────────────────────────┐ │
                                │ │ analyzeBehaviorPattern()  │ │
                                │ └─────────┬─────────────────┘ │
                                └───────────┼───────────────────┘
                                            │
                                            ▼
                        ┌───────────────────────────────────┐
                        │   Returns Investigation Result    │
                        │   • Wallet info                   │
                        │   • Transactions                  │
                        │   • Connected wallets             │
                        │   • Graph data                    │
                        │   • Threat intel                  │
                        │   • Analysis                      │
                        └───────────────┬───────────────────┘
                                        │
                                        ▼
┌───────────────────────────────────────────────────────────────────┐
│                  CryptoInvestigator (Display)                     │
│                                                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐             │
│  │ WalletInfo  │  │ Transactions │  │ Connections│             │
│  │    Card     │  │     Card     │  │    Card    │             │
│  └─────────────┘  └──────────────┘  └────────────┘             │
│                                                                   │
│  ┌─────────────┐  ┌──────────────┐                              │
│  │ ThreatIntel │  │   Analysis   │                              │
│  │    Card     │  │     Card     │                              │
│  └─────────────┘  └──────────────┘                              │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │           CryptoWalletGraph                               │  │
│  │  • Force-directed layout                                 │  │
│  │  • Interactive canvas                                    │  │
│  │  • Click → investigateWallet(clickedAddress)            │  │
│  └───────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
```

## Graph Building Algorithm

```
┌─────────────────────────────────────────┐
│ buildWalletGraph(rootAddress, depth)    │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│ Initialize:                              │
│ • nodes = []                             │
│ • edges = []                             │
│ • visited = Set()                        │
│ • queue = [{ address: root, level: 0 }] │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│ Add root node to nodes[]                │
│ Mark root as visited                     │
└───────────────┬─────────────────────────┘
                │
                ▼
        ┌───────────────┐
        │ while queue   │
        │ not empty     │
        └───────┬───────┘
                │
                ▼
┌─────────────────────────────────────────┐
│ Pop address from queue                   │
│ if level >= depth: skip                 │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│ Get transactions for address             │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│ For each transaction:                    │
│   Extract connected addresses            │
│   • From inputs (senders)               │
│   • From outputs (receivers)            │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│ For each connected address:              │
│   if not visited:                        │
│     • Fetch wallet info                 │
│     • Add as node                       │
│     • Mark as visited                   │
│     • Add to queue (level + 1)          │
│   • Create edge between nodes           │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│ Stop when:                               │
│ • Reached depth limit                   │
│ • Hit node limit (50)                   │
│ • Queue is empty                        │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│ Return { nodes, edges, clusters }       │
└─────────────────────────────────────────┘
```

## Force-Directed Graph Physics

```
For each node:
  
  1. Repulsion Force (between all nodes)
     ┌─────────────────────────────────────┐
     │ F_repulsion = k² / distance         │
     │ Direction: Away from other nodes    │
     └─────────────────────────────────────┘
  
  2. Attraction Force (along edges)
     ┌─────────────────────────────────────┐
     │ F_attraction = distance × k         │
     │ Direction: Toward connected nodes   │
     └─────────────────────────────────────┘
  
  3. Center Gravity
     ┌─────────────────────────────────────┐
     │ F_gravity = (center - position) × k │
     │ Direction: Toward canvas center     │
     └─────────────────────────────────────┘
  
  4. Update Velocity
     ┌─────────────────────────────────────┐
     │ velocity += (all forces) × damping  │
     └─────────────────────────────────────┘
  
  5. Update Position
     ┌─────────────────────────────────────┐
     │ position += velocity                │
     └─────────────────────────────────────┘

Repeat for 300 frames → Stable layout
```

## Risk Scoring Logic

```
Risk Score Calculation (0-100):

Base Score = 0

Add points for:
┌────────────────────────────────────────┐
│ • Known ransomware wallet:      +50    │
│ • Mixer/tumbler service:        +40    │
│ • Darknet marketplace:          +35    │
│ • Sanctioned entity:            +45    │
│ • High abuse reports (>10):     +30    │
│ • Suspicious transaction pattern: +20  │
│ • New wallet (<30 days):        +10    │
│ • High volume (>100 BTC):       +15    │
└────────────────────────────────────────┘

Subtract points for:
┌────────────────────────────────────────┐
│ • Known exchange wallet:        -20    │
│ • Long history (>5 years):     -15    │
│ • Regular transaction pattern:  -10    │
│ • Verified entity:              -25    │
└────────────────────────────────────────┘

Final Score = Clamp(0, 100)

Risk Levels:
• 0-20:    Safe
• 21-40:   Low
• 41-60:   Medium
• 61-80:   High
• 81-100:  Critical
```

## Error Handling Flow

```
API Call
   │
   ▼
Try Primary API
   │
   ├─ Success → Return data
   │
   └─ Failure
        │
        ▼
   Check Error Type
        │
        ├─ Network Error → Try fallback
        ├─ Rate Limit → Wait & retry
        ├─ 404 Not Found → Return null
        ├─ 400 Bad Request → Validate input
        └─ 500 Server Error → Try fallback
              │
              ▼
       Try Fallback API
              │
              ├─ Success → Return data
              │
              └─ Failure
                    │
                    ▼
               Log error
               Show user message
               Return null/default
```

---

**Architecture Version**: 1.0  
**Last Updated**: January 2026  
**Complexity**: High (Distributed System with Multiple APIs)  
**Scalability**: Horizontal (Can add more API providers)
