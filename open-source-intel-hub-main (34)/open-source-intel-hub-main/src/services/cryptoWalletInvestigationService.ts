// ============================================================================
// cryptoWalletInvestigationService.ts
// COMPREHENSIVE CRYPTOCURRENCY WALLET INVESTIGATION SERVICE
// ============================================================================
// Features:
// - Multi-chain wallet address investigation
// - Transaction hash analysis
// - Connected wallet graph generation
// - Real-time blockchain data
// - Risk scoring and threat intelligence
// ============================================================================

import { cacheAPIResponse, getCachedData } from '@/lib/database';

const CACHE_TTL = 10; // minutes

// ============================================================================
// TYPES
// ============================================================================

export interface CryptoWalletInfo {
  address: string;
  network: 'bitcoin' | 'ethereum' | 'tron' | 'litecoin' | 'unknown';
  balance: string;
  balanceUSD: number;
  totalReceived: string;
  totalSent: string;
  transactionCount: number;
  firstSeen: string;
  lastSeen: string;
  labels: string[];
  isExchange: boolean;
  isMixer: boolean;
  isRansomware: boolean;
  riskScore: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'safe';
  metadata: Record<string, any>;
}

export interface CryptoTransaction {
  hash: string;
  blockNumber: number;
  blockHash: string;
  timestamp: string;
  confirmations: number;
  from: string;
  to: string;
  value: string;
  valueUSD: number;
  fee: string;
  feeUSD: number;
  gasUsed?: string;
  gasPrice?: string;
  status: 'confirmed' | 'pending' | 'failed';
  inputs: TransactionInput[];
  outputs: TransactionOutput[];
  metadata: Record<string, any>;
}

export interface TransactionInput {
  address: string;
  value: string;
  previousTxHash: string;
  previousIndex: number;
}

export interface TransactionOutput {
  address: string;
  value: string;
  index: number;
  spent: boolean;
  spentTxHash?: string;
}

export interface ConnectedWallet {
  address: string;
  relationship: 'sender' | 'receiver' | 'both';
  transactionCount: number;
  totalVolume: string;
  totalVolumeUSD: number;
  firstInteraction: string;
  lastInteraction: string;
  riskScore: number;
}

export interface WalletGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: WalletCluster[];
}

export interface GraphNode {
  id: string;
  address: string;
  label: string;
  type: 'wallet' | 'exchange' | 'mixer' | 'contract' | 'unknown';
  balance: string;
  transactionCount: number;
  riskScore: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'safe';
  metadata: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  transactions: number;
  totalVolume: string;
  totalVolumeUSD: number;
  firstTx: string;
  lastTx: string;
  direction: 'outgoing' | 'incoming' | 'bidirectional';
}

export interface WalletCluster {
  id: string;
  addresses: string[];
  entityType: 'exchange' | 'mixer' | 'ransomware' | 'darknet' | 'gambling' | 'defi' | 'unknown';
  entityName?: string;
  totalBalance: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'safe';
}

export interface CryptoInvestigationResult {
  wallet: CryptoWalletInfo;
  transactions: CryptoTransaction[];
  connectedWallets: ConnectedWallet[];
  graph: WalletGraph;
  threatIntel: {
    isKnownThreat: boolean;
    threatType: string[];
    associatedCampaigns: string[];
    sanctioned: boolean;
    abuseReports: number;
    details: string[];
  };
  analysis: {
    behaviorPattern: string;
    volumeAnalysis: string;
    frequencyAnalysis: string;
    riskFactors: string[];
    recommendations: string[];
  };
}

// ============================================================================
// BLOCKCHAIN API FUNCTIONS
// ============================================================================

/**
 * Get wallet information from blockchain
 */
export async function getWalletInfo(address: string, network: string): Promise<CryptoWalletInfo | null> {
  const cacheKey = `wallet_info_${network}_${address}`;
  const cached = await getCachedData(cacheKey);
  if (cached) return cached;

  try {
    let walletInfo: CryptoWalletInfo | null = null;

    if (network === 'bitcoin') {
      walletInfo = await getBitcoinWalletInfo(address);
    } else if (network === 'ethereum') {
      walletInfo = await getEthereumWalletInfo(address);
    }

    if (walletInfo) {
      await cacheAPIResponse(cacheKey, walletInfo, CACHE_TTL);
    }

    return walletInfo;
  } catch (error) {
    console.error(`[CryptoWallet] Error fetching wallet info:`, error);
    return null;
  }
}

/**
 * Get Bitcoin wallet information using blockpath.com and btcscan.org APIs
 */
async function getBitcoinWalletInfo(address: string): Promise<CryptoWalletInfo> {
  // Try multiple APIs for redundancy
  
  // Try blockchain.com API first
  try {
    const response = await fetch(`https://blockchain.info/rawaddr/${address}?limit=0`);
    if (response.ok) {
      const data = await response.json();
      return {
        address,
        network: 'bitcoin',
        balance: (data.final_balance / 100000000).toString(),
        balanceUSD: 0, // Will be calculated with current BTC price
        totalReceived: (data.total_received / 100000000).toString(),
        totalSent: (data.total_sent / 100000000).toString(),
        transactionCount: data.n_tx,
        firstSeen: new Date(data.txs?.[data.txs.length - 1]?.time * 1000 || Date.now()).toISOString(),
        lastSeen: new Date(data.txs?.[0]?.time * 1000 || Date.now()).toISOString(),
        labels: [],
        isExchange: false,
        isMixer: false,
        isRansomware: false,
        riskScore: 0,
        riskLevel: 'safe',
        metadata: {
          unspentTxCount: data.n_unredeemed,
        },
      };
    }
  } catch (error) {
    console.error('[Bitcoin] blockchain.info API error:', error);
  }

  // Fallback to blockchair API
  try {
    const response = await fetch(`https://api.blockchair.com/bitcoin/dashboards/address/${address}`);
    if (response.ok) {
      const data = await response.json();
      const addrData = data.data?.[address];
      if (addrData) {
        return {
          address,
          network: 'bitcoin',
          balance: (addrData.address.balance / 100000000).toString(),
          balanceUSD: addrData.address.balance_usd || 0,
          totalReceived: (addrData.address.received / 100000000).toString(),
          totalSent: (addrData.address.spent / 100000000).toString(),
          transactionCount: addrData.address.transaction_count,
          firstSeen: addrData.address.first_seen_receiving || '',
          lastSeen: addrData.address.last_seen_receiving || '',
          labels: [],
          isExchange: false,
          isMixer: false,
          isRansomware: false,
          riskScore: 0,
          riskLevel: 'safe',
          metadata: addrData,
        };
      }
    }
  } catch (error) {
    console.error('[Bitcoin] blockchair API error:', error);
  }

  throw new Error('Failed to fetch Bitcoin wallet information');
}

/**
 * Get Ethereum wallet information
 */
async function getEthereumWalletInfo(address: string): Promise<CryptoWalletInfo> {
  // Try etherscan-like APIs
  try {
    const response = await fetch(`https://api.ethplorer.io/getAddressInfo/${address}?apiKey=freekey`);
    if (response.ok) {
      const data = await response.json();
      return {
        address,
        network: 'ethereum',
        balance: (data.ETH?.balance || 0).toString(),
        balanceUSD: data.ETH?.price?.rate ? (data.ETH.balance * data.ETH.price.rate) : 0,
        totalReceived: '0', // Not provided by this API
        totalSent: '0',
        transactionCount: data.countTxs || 0,
        firstSeen: '',
        lastSeen: '',
        labels: [],
        isExchange: false,
        isMixer: false,
        isRansomware: false,
        riskScore: 0,
        riskLevel: 'safe',
        metadata: {
          tokenCount: data.tokens?.length || 0,
          tokens: data.tokens || [],
        },
      };
    }
  } catch (error) {
    console.error('[Ethereum] ethplorer API error:', error);
  }

  throw new Error('Failed to fetch Ethereum wallet information');
}

/**
 * Get transaction details by hash
 */
export async function getTransactionDetails(txHash: string, network: string): Promise<CryptoTransaction | null> {
  const cacheKey = `tx_details_${network}_${txHash}`;
  const cached = await getCachedData(cacheKey);
  if (cached) return cached;

  try {
    let txDetails: CryptoTransaction | null = null;

    if (network === 'bitcoin') {
      txDetails = await getBitcoinTransaction(txHash);
    } else if (network === 'ethereum') {
      txDetails = await getEthereumTransaction(txHash);
    }

    if (txDetails) {
      await cacheAPIResponse(cacheKey, txDetails, CACHE_TTL);
    }

    return txDetails;
  } catch (error) {
    console.error(`[CryptoTx] Error fetching transaction:`, error);
    return null;
  }
}

/**
 * Get Bitcoin transaction details
 */
async function getBitcoinTransaction(txHash: string): Promise<CryptoTransaction> {
  try {
    const response = await fetch(`https://blockchain.info/rawtx/${txHash}`);
    if (response.ok) {
      const data = await response.json();
      
      const inputs: TransactionInput[] = data.inputs.map((input: any) => ({
        address: input.prev_out?.addr || 'Unknown',
        value: (input.prev_out?.value / 100000000).toString(),
        previousTxHash: input.prev_out?.tx_index?.toString() || '',
        previousIndex: input.prev_out?.n || 0,
      }));

      const outputs: TransactionOutput[] = data.out.map((output: any, index: number) => ({
        address: output.addr || 'Unknown',
        value: (output.value / 100000000).toString(),
        index,
        spent: output.spent || false,
        spentTxHash: output.spending_outpoints?.[0]?.tx_index?.toString(),
      }));

      return {
        hash: txHash,
        blockNumber: data.block_height || 0,
        blockHash: data.block_hash || '',
        timestamp: new Date(data.time * 1000).toISOString(),
        confirmations: 0, // Would need current block height
        from: inputs[0]?.address || 'Unknown',
        to: outputs[0]?.address || 'Unknown',
        value: outputs.reduce((sum: number, out: any) => sum + parseFloat(out.value), 0).toString(),
        valueUSD: 0,
        fee: (data.fee / 100000000).toString(),
        feeUSD: 0,
        status: data.block_height ? 'confirmed' : 'pending',
        inputs,
        outputs,
        metadata: {
          size: data.size,
          weight: data.weight,
          version: data.ver,
        },
      };
    }
  } catch (error) {
    console.error('[Bitcoin] Transaction fetch error:', error);
  }

  throw new Error('Failed to fetch Bitcoin transaction');
}

/**
 * Get Ethereum transaction details
 */
async function getEthereumTransaction(txHash: string): Promise<CryptoTransaction> {
  // This would require Etherscan API key or similar
  throw new Error('Ethereum transaction lookup not fully implemented - requires API key');
}

/**
 * Get wallet transactions
 */
export async function getWalletTransactions(
  address: string, 
  network: string, 
  limit: number = 50
): Promise<CryptoTransaction[]> {
  const cacheKey = `wallet_txs_${network}_${address}_${limit}`;
  const cached = await getCachedData(cacheKey);
  if (cached) return cached;

  try {
    let transactions: CryptoTransaction[] = [];

    if (network === 'bitcoin') {
      transactions = await getBitcoinWalletTransactions(address, limit);
    } else if (network === 'ethereum') {
      transactions = await getEthereumWalletTransactions(address, limit);
    }

    if (transactions.length > 0) {
      await cacheAPIResponse(cacheKey, transactions, CACHE_TTL);
    }

    return transactions;
  } catch (error) {
    console.error(`[CryptoTxs] Error fetching transactions:`, error);
    return [];
  }
}

/**
 * Get Bitcoin wallet transactions
 */
async function getBitcoinWalletTransactions(address: string, limit: number): Promise<CryptoTransaction[]> {
  try {
    const response = await fetch(`https://blockchain.info/rawaddr/${address}?limit=${limit}`);
    if (response.ok) {
      const data = await response.json();
      return data.txs.map((tx: any) => {
        const inputs: TransactionInput[] = tx.inputs.map((input: any) => ({
          address: input.prev_out?.addr || 'Unknown',
          value: (input.prev_out?.value / 100000000).toString(),
          previousTxHash: input.prev_out?.tx_index?.toString() || '',
          previousIndex: input.prev_out?.n || 0,
        }));

        const outputs: TransactionOutput[] = tx.out.map((output: any, index: number) => ({
          address: output.addr || 'Unknown',
          value: (output.value / 100000000).toString(),
          index,
          spent: output.spent || false,
          spentTxHash: output.spending_outpoints?.[0]?.tx_index?.toString(),
        }));

        return {
          hash: tx.hash,
          blockNumber: tx.block_height || 0,
          blockHash: tx.block_hash || '',
          timestamp: new Date(tx.time * 1000).toISOString(),
          confirmations: 0,
          from: inputs[0]?.address || 'Unknown',
          to: outputs[0]?.address || 'Unknown',
          value: outputs.reduce((sum: number, out: any) => sum + parseFloat(out.value), 0).toString(),
          valueUSD: 0,
          fee: (tx.fee / 100000000).toString(),
          feeUSD: 0,
          status: tx.block_height ? 'confirmed' : 'pending',
          inputs,
          outputs,
          metadata: { size: tx.size, weight: tx.weight },
        };
      });
    }
  } catch (error) {
    console.error('[Bitcoin] Transaction list fetch error:', error);
  }

  return [];
}

/**
 * Get Ethereum wallet transactions
 */
async function getEthereumWalletTransactions(address: string, limit: number): Promise<CryptoTransaction[]> {
  // Would require Etherscan API key or similar
  return [];
}

/**
 * Build wallet connection graph
 */
export async function buildWalletGraph(
  rootAddress: string, 
  network: string, 
  depth: number = 2,
  maxNodes: number = 50
): Promise<WalletGraph> {
  console.log(`[Graph] Building wallet graph for ${rootAddress}, depth=${depth}`);
  
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const visited = new Set<string>();
  const queue: Array<{ address: string; level: number }> = [{ address: rootAddress, level: 0 }];

  // Add root node
  const rootWallet = await getWalletInfo(rootAddress, network);
  if (rootWallet) {
    nodes.push({
      id: rootAddress,
      address: rootAddress,
      label: rootAddress.substring(0, 8) + '...' + rootAddress.substring(rootAddress.length - 6),
      type: rootWallet.isExchange ? 'exchange' : rootWallet.isMixer ? 'mixer' : 'wallet',
      balance: rootWallet.balance,
      transactionCount: rootWallet.transactionCount,
      riskScore: rootWallet.riskScore,
      riskLevel: rootWallet.riskLevel,
      metadata: rootWallet.metadata,
    });
    visited.add(rootAddress);
  }

  // BFS traversal
  while (queue.length > 0 && nodes.length < maxNodes) {
    const { address, level } = queue.shift()!;
    
    if (level >= depth) continue;

    const transactions = await getWalletTransactions(address, network, 20);
    const connections = new Map<string, { count: number; volume: number; txHashes: string[] }>();

    // Analyze transactions to find connected wallets
    for (const tx of transactions) {
      const connectedAddresses = new Set<string>();
      
      // Add inputs (senders)
      tx.inputs.forEach(input => {
        if (input.address !== address && input.address !== 'Unknown') {
          connectedAddresses.add(input.address);
        }
      });

      // Add outputs (receivers)
      tx.outputs.forEach(output => {
        if (output.address !== address && output.address !== 'Unknown') {
          connectedAddresses.add(output.address);
        }
      });

      // Track connections
      connectedAddresses.forEach(connAddr => {
        const existing = connections.get(connAddr) || { count: 0, volume: 0, txHashes: [] };
        existing.count += 1;
        existing.volume += parseFloat(tx.value);
        existing.txHashes.push(tx.hash);
        connections.set(connAddr, existing);
      });
    }

    // Add connected wallets as nodes and edges
    for (const [connAddr, data] of Array.from(connections.entries()).slice(0, 10)) {
      if (!visited.has(connAddr)) {
        const connWallet = await getWalletInfo(connAddr, network);
        if (connWallet) {
          nodes.push({
            id: connAddr,
            address: connAddr,
            label: connAddr.substring(0, 8) + '...' + connAddr.substring(connAddr.length - 6),
            type: connWallet.isExchange ? 'exchange' : connWallet.isMixer ? 'mixer' : 'wallet',
            balance: connWallet.balance,
            transactionCount: connWallet.transactionCount,
            riskScore: connWallet.riskScore,
            riskLevel: connWallet.riskLevel,
            metadata: connWallet.metadata,
          });
          visited.add(connAddr);
          queue.push({ address: connAddr, level: level + 1 });
        }
      }

      // Add edge
      edges.push({
        id: `${address}-${connAddr}`,
        source: address,
        target: connAddr,
        transactions: data.count,
        totalVolume: data.volume.toString(),
        totalVolumeUSD: 0,
        firstTx: data.txHashes[0] || '',
        lastTx: data.txHashes[data.txHashes.length - 1] || '',
        direction: 'bidirectional',
      });
    }
  }

  return {
    nodes,
    edges,
    clusters: [], // Would require clustering algorithm
  };
}

/**
 * Perform comprehensive wallet investigation
 */
export async function investigateWallet(
  address: string, 
  network: string,
  options: {
    fetchTransactions?: boolean;
    buildGraph?: boolean;
    graphDepth?: number;
  } = {}
): Promise<CryptoInvestigationResult | null> {
  const {
    fetchTransactions = true,
    buildGraph = true,
    graphDepth = 2,
  } = options;

  try {
    console.log(`[Investigation] Starting investigation for ${address}`);

    // Get wallet info
    const wallet = await getWalletInfo(address, network);
    if (!wallet) {
      throw new Error('Failed to fetch wallet information');
    }

    // Get transactions
    let transactions: CryptoTransaction[] = [];
    if (fetchTransactions) {
      transactions = await getWalletTransactions(address, network, 50);
    }

    // Build connection graph
    let graph: WalletGraph = { nodes: [], edges: [], clusters: [] };
    if (buildGraph) {
      graph = await buildWalletGraph(address, network, graphDepth, 30);
    }

    // Extract connected wallets
    const connectedWallets: ConnectedWallet[] = graph.edges.map(edge => ({
      address: edge.target === address ? edge.source : edge.target,
      relationship: 'both',
      transactionCount: edge.transactions,
      totalVolume: edge.totalVolume,
      totalVolumeUSD: edge.totalVolumeUSD,
      firstInteraction: edge.firstTx,
      lastInteraction: edge.lastTx,
      riskScore: graph.nodes.find(n => n.id === edge.target)?.riskScore || 0,
    }));

    // Threat intelligence analysis
    const threatIntel = {
      isKnownThreat: wallet.isRansomware || wallet.isMixer,
      threatType: [
        wallet.isRansomware ? 'Ransomware' : '',
        wallet.isMixer ? 'Mixer' : '',
      ].filter(Boolean),
      associatedCampaigns: [],
      sanctioned: false,
      abuseReports: 0,
      details: [],
    };

    // Behavioral analysis
    const analysis = {
      behaviorPattern: analyzeBehaviorPattern(transactions),
      volumeAnalysis: analyzeVolume(transactions),
      frequencyAnalysis: analyzeFrequency(transactions),
      riskFactors: identifyRiskFactors(wallet, transactions),
      recommendations: generateRecommendations(wallet, transactions),
    };

    return {
      wallet,
      transactions,
      connectedWallets,
      graph,
      threatIntel,
      analysis,
    };
  } catch (error) {
    console.error('[Investigation] Error:', error);
    return null;
  }
}

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

function analyzeBehaviorPattern(transactions: CryptoTransaction[]): string {
  if (transactions.length === 0) return 'No transaction history';
  
  const avgValue = transactions.reduce((sum, tx) => sum + parseFloat(tx.value), 0) / transactions.length;
  const frequency = transactions.length;

  if (frequency > 100 && avgValue > 1) {
    return 'High-frequency, high-value transactions - Possible exchange or business';
  } else if (frequency > 50) {
    return 'Active wallet with regular transactions';
  } else if (frequency < 10) {
    return 'Low activity wallet - Possibly dormant or new';
  }

  return 'Normal transaction pattern';
}

function analyzeVolume(transactions: CryptoTransaction[]): string {
  if (transactions.length === 0) return 'No volume data';
  
  const totalVolume = transactions.reduce((sum, tx) => sum + parseFloat(tx.value), 0);
  
  if (totalVolume > 1000) {
    return 'Very high volume - Major player or institutional';
  } else if (totalVolume > 100) {
    return 'High volume - Active trader or business';
  } else if (totalVolume > 10) {
    return 'Moderate volume - Regular user';
  }
  
  return 'Low volume - Casual user';
}

function analyzeFrequency(transactions: CryptoTransaction[]): string {
  if (transactions.length < 2) return 'Insufficient data';
  
  const timestamps = transactions.map(tx => new Date(tx.timestamp).getTime());
  const intervals = [];
  for (let i = 1; i < timestamps.length; i++) {
    intervals.push(timestamps[i - 1] - timestamps[i]);
  }
  
  const avgInterval = intervals.reduce((sum, int) => sum + int, 0) / intervals.length;
  const days = avgInterval / (1000 * 60 * 60 * 24);
  
  if (days < 1) return 'Multiple transactions per day - Very active';
  if (days < 7) return 'Weekly transaction pattern';
  if (days < 30) return 'Monthly transaction pattern';
  
  return 'Infrequent transactions';
}

function identifyRiskFactors(wallet: CryptoWalletInfo, transactions: CryptoTransaction[]): string[] {
  const factors: string[] = [];
  
  if (wallet.isRansomware) factors.push('Associated with ransomware activities');
  if (wallet.isMixer) factors.push('Connected to mixing services');
  if (wallet.isExchange) factors.push('Exchange wallet - high volume expected');
  if (parseFloat(wallet.balance) > 100) factors.push('High balance - attractive target');
  if (transactions.length > 100) factors.push('High transaction count');
  
  return factors;
}

function generateRecommendations(wallet: CryptoWalletInfo, transactions: CryptoTransaction[]): string[] {
  const recommendations: string[] = [];
  
  if (wallet.riskScore > 70) {
    recommendations.push('High risk - Investigate further before interaction');
  }
  if (wallet.isMixer) {
    recommendations.push('Avoid direct transactions - potential money laundering');
  }
  if (wallet.isRansomware) {
    recommendations.push('Report to authorities - known criminal activity');
  }
  if (transactions.length === 0) {
    recommendations.push('New or unused wallet - verify legitimacy');
  }
  
  return recommendations;
}

/**
 * Detect network type from address
 */
export function detectNetworkFromAddress(address: string): string {
  const trimmed = address.trim();
  
  // Bitcoin patterns
  if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(trimmed) || /^bc1[a-z0-9]{39,59}$/.test(trimmed)) {
    return 'bitcoin';
  }
  
  // Ethereum pattern
  if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
    return 'ethereum';
  }
  
  // Tron pattern
  if (/^T[A-Za-z1-9]{33}$/.test(trimmed)) {
    return 'tron';
  }
  
  // Litecoin pattern
  if (/^[LM][a-km-zA-HJ-NP-Z1-9]{26,33}$/.test(trimmed)) {
    return 'litecoin';
  }
  
  return 'unknown';
}

/**
 * Validate transaction hash format
 */
export function isValidTransactionHash(hash: string, network: string): boolean {
  const trimmed = hash.trim();
  
  if (network === 'bitcoin' || network === 'litecoin') {
    return /^[a-fA-F0-9]{64}$/.test(trimmed);
  }
  
  if (network === 'ethereum' || network === 'tron') {
    return /^0x[a-fA-F0-9]{64}$/.test(trimmed);
  }
  
  return false;
}
