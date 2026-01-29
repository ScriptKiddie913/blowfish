// ============================================================================
// CryptoInvestigator.tsx
// COMPREHENSIVE CRYPTOCURRENCY INVESTIGATION TOOL
// ============================================================================
// Features:
// - Multi-chain wallet address search
// - Transaction hash lookup
// - Connected wallet discovery
// - Interactive graph visualization
// - Detailed transaction history
// - Risk assessment and threat intelligence
// ============================================================================

'use client';

import React, { useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  Loader2,
  Wallet,
  ArrowRightLeft,
  Network,
  AlertTriangle,
  Shield,
  Clock,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Hash,
  Globe,
  Database,
  Target,
  Activity,
  CheckCircle2,
  XCircle,
  Info,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  investigateWallet,
  getTransactionDetails,
  detectNetworkFromAddress,
  isValidTransactionHash,
  type CryptoInvestigationResult,
  type CryptoTransaction,
  type CryptoWalletInfo,
  type ConnectedWallet,
} from '@/services/cryptoWalletInvestigationService';
import { CryptoWalletGraph } from './CryptoWalletGraph';

// ============================================================================
// TYPES
// ============================================================================

interface SearchOptions {
  fetchTransactions: boolean;
  buildGraph: boolean;
  graphDepth: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CryptoInvestigator() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'wallet' | 'transaction'>('wallet');
  const [isSearching, setIsSearching] = useState(false);
  const [investigationResult, setInvestigationResult] = useState<CryptoInvestigationResult | null>(null);
  const [transactionResult, setTransactionResult] = useState<CryptoTransaction | null>(null);
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    fetchTransactions: true,
    buildGraph: true,
    graphDepth: 2,
  });

  // Handle search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a wallet address or transaction hash');
      return;
    }

    setIsSearching(true);
    setInvestigationResult(null);
    setTransactionResult(null);

    try {
      // Detect if it's a wallet address or transaction hash
      const network = detectNetworkFromAddress(searchQuery);

      if (searchType === 'wallet' && network !== 'unknown') {
        // Investigate wallet
        toast.info(`Investigating ${network} wallet...`);
        const result = await investigateWallet(searchQuery, network, searchOptions);
        
        if (result) {
          setInvestigationResult(result);
          toast.success('Investigation complete!');
        } else {
          toast.error('Failed to investigate wallet');
        }
      } else if (searchType === 'transaction') {
        // Look up transaction
        if (network === 'unknown') {
          toast.error('Could not detect blockchain network');
          return;
        }

        if (!isValidTransactionHash(searchQuery, network)) {
          toast.error('Invalid transaction hash format');
          return;
        }

        toast.info(`Looking up ${network} transaction...`);
        const result = await getTransactionDetails(searchQuery, network);
        
        if (result) {
          setTransactionResult(result);
          toast.success('Transaction found!');
        } else {
          toast.error('Transaction not found');
        }
      } else {
        toast.error('Invalid address or transaction hash');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed: ' + (error as Error).message);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, searchType, searchOptions]);

  // Handle node click in graph
  const handleNodeClick = useCallback((address: string) => {
    setSearchQuery(address);
    setSearchType('wallet');
    toast.info(`Selected wallet: ${address.substring(0, 12)}...`);
  }, []);

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Crypto Investigation Tool
          </CardTitle>
          <CardDescription>
            Search wallet addresses, transaction hashes, and explore blockchain connections
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Type Selection */}
          <div className="flex gap-2">
            <Button
              variant={searchType === 'wallet' ? 'default' : 'outline'}
              onClick={() => setSearchType('wallet')}
              className="flex-1"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Wallet Address
            </Button>
            <Button
              variant={searchType === 'transaction' ? 'default' : 'outline'}
              onClick={() => setSearchType('transaction')}
              className="flex-1"
            >
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Transaction Hash
            </Button>
          </div>

          {/* Search Input */}
          <div className="flex gap-2">
            <Input
              placeholder={
                searchType === 'wallet'
                  ? 'Enter wallet address (Bitcoin, Ethereum, etc.)'
                  : 'Enter transaction hash'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="font-mono"
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Search Options (only for wallet search) */}
          {searchType === 'wallet' && (
            <Accordion type="single" collapsible>
              <AccordionItem value="options">
                <AccordionTrigger className="text-sm">
                  Advanced Options
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="fetch-tx" className="text-sm">
                        Fetch Transaction History
                      </Label>
                      <Switch
                        id="fetch-tx"
                        checked={searchOptions.fetchTransactions}
                        onCheckedChange={(checked) =>
                          setSearchOptions({ ...searchOptions, fetchTransactions: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="build-graph" className="text-sm">
                        Build Connection Graph
                      </Label>
                      <Switch
                        id="build-graph"
                        checked={searchOptions.buildGraph}
                        onCheckedChange={(checked) =>
                          setSearchOptions({ ...searchOptions, buildGraph: checked })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="graph-depth" className="text-sm">
                        Graph Depth: {searchOptions.graphDepth}
                      </Label>
                      <input
                        id="graph-depth"
                        type="range"
                        min="1"
                        max="3"
                        value={searchOptions.graphDepth}
                        onChange={(e) =>
                          setSearchOptions({
                            ...searchOptions,
                            graphDepth: parseInt(e.target.value),
                          })
                        }
                        className="w-full"
                      />
                      <p className="text-xs text-slate-400">
                        Higher depth shows more connections but takes longer
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Loading State */}
      {isSearching && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-slate-400">
                {searchType === 'wallet'
                  ? 'Investigating wallet and building connection graph...'
                  : 'Looking up transaction...'}
              </p>
              <Progress value={33} className="w-64" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wallet Investigation Results */}
      {investigationResult && (
        <>
          <WalletInfoCard wallet={investigationResult.wallet} onCopy={copyToClipboard} />
          
          <Tabs defaultValue="graph" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="graph">
                <Network className="h-4 w-4 mr-2" />
                Graph
              </TabsTrigger>
              <TabsTrigger value="transactions">
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="connections">
                <Target className="h-4 w-4 mr-2" />
                Connections
              </TabsTrigger>
              <TabsTrigger value="threat">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Threat Intel
              </TabsTrigger>
              <TabsTrigger value="analysis">
                <Activity className="h-4 w-4 mr-2" />
                Analysis
              </TabsTrigger>
            </TabsList>

            <TabsContent value="graph">
              {investigationResult.graph.nodes.length > 0 ? (
                <CryptoWalletGraph
                  graph={investigationResult.graph}
                  onNodeClick={handleNodeClick}
                />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-slate-400">
                    No graph data available
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="transactions">
              <TransactionsCard transactions={investigationResult.transactions} onCopy={copyToClipboard} />
            </TabsContent>

            <TabsContent value="connections">
              <ConnectionsCard connections={investigationResult.connectedWallets} onExplore={handleNodeClick} />
            </TabsContent>

            <TabsContent value="threat">
              <ThreatIntelCard
                threatIntel={investigationResult.threatIntel}
                wallet={investigationResult.wallet}
              />
            </TabsContent>

            <TabsContent value="analysis">
              <AnalysisCard analysis={investigationResult.analysis} />
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Transaction Results */}
      {transactionResult && (
        <TransactionDetailsCard transaction={transactionResult} onCopy={copyToClipboard} />
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function WalletInfoCard({ wallet, onCopy }: { wallet: CryptoWalletInfo; onCopy: (text: string) => void }) {
  const riskColorMap = {
    critical: 'text-red-500 border-red-500',
    high: 'text-orange-500 border-orange-500',
    medium: 'text-yellow-500 border-yellow-500',
    low: 'text-blue-500 border-blue-500',
    safe: 'text-green-500 border-green-500',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Wallet Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-slate-400">Address</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-sm font-mono bg-slate-900 px-2 py-1 rounded flex-1 truncate">
                  {wallet.address}
                </code>
                <Button size="sm" variant="ghost" onClick={() => onCopy(wallet.address)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-slate-400">Network</Label>
                <Badge variant="outline" className="mt-1">
                  {wallet.network.toUpperCase()}
                </Badge>
              </div>
              <div>
                <Label className="text-sm text-slate-400">Risk Level</Label>
                <Badge className={cn('mt-1', riskColorMap[wallet.riskLevel])}>
                  {wallet.riskLevel.toUpperCase()}
                </Badge>
              </div>
            </div>

            <div>
              <Label className="text-sm text-slate-400">Balance</Label>
              <div className="flex items-center gap-2 mt-1">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span className="text-lg font-semibold">
                  {parseFloat(wallet.balance).toFixed(8)} {wallet.network.toUpperCase()}
                </span>
                {wallet.balanceUSD > 0 && (
                  <span className="text-sm text-slate-400">
                    (${wallet.balanceUSD.toLocaleString()})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-slate-400">Total Received</Label>
                <p className="text-sm font-mono mt-1">{parseFloat(wallet.totalReceived).toFixed(8)}</p>
              </div>
              <div>
                <Label className="text-sm text-slate-400">Total Sent</Label>
                <p className="text-sm font-mono mt-1">{parseFloat(wallet.totalSent).toFixed(8)}</p>
              </div>
            </div>

            <div>
              <Label className="text-sm text-slate-400">Transaction Count</Label>
              <p className="text-lg font-semibold mt-1">{wallet.transactionCount.toLocaleString()}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-slate-400">First Seen</Label>
                <p className="text-xs mt-1">{wallet.firstSeen ? new Date(wallet.firstSeen).toLocaleDateString() : 'Unknown'}</p>
              </div>
              <div>
                <Label className="text-sm text-slate-400">Last Seen</Label>
                <p className="text-xs mt-1">{wallet.lastSeen ? new Date(wallet.lastSeen).toLocaleDateString() : 'Unknown'}</p>
              </div>
            </div>

            {/* Wallet Type Indicators */}
            <div className="flex flex-wrap gap-2">
              {wallet.isExchange && (
                <Badge variant="secondary">
                  <Database className="h-3 w-3 mr-1" />
                  Exchange
                </Badge>
              )}
              {wallet.isMixer && (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Mixer
                </Badge>
              )}
              {wallet.isRansomware && (
                <Badge variant="destructive">
                  <Shield className="h-3 w-3 mr-1" />
                  Ransomware
                </Badge>
              )}
              {wallet.labels.map((label, i) => (
                <Badge key={i} variant="outline">
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionsCard({ transactions, onCopy }: { transactions: CryptoTransaction[]; onCopy: (text: string) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5" />
          Transaction History ({transactions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <p className="text-center text-slate-400 py-12">No transactions found</p>
            ) : (
              transactions.map((tx, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-slate-400" />
                      <code className="text-xs font-mono">{tx.hash.substring(0, 16)}...</code>
                      <Button size="sm" variant="ghost" onClick={() => onCopy(tx.hash)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <Badge variant={tx.status === 'confirmed' ? 'default' : 'secondary'}>
                      {tx.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">From:</span>
                      <code className="ml-2 text-xs">{tx.from.substring(0, 12)}...</code>
                    </div>
                    <div>
                      <span className="text-slate-400">To:</span>
                      <code className="ml-2 text-xs">{tx.to.substring(0, 12)}...</code>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Value:</span>
                      <span className="ml-2 font-semibold">{parseFloat(tx.value).toFixed(6)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Fee:</span>
                      <span className="ml-2">{parseFloat(tx.fee).toFixed(6)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Block:</span>
                      <span className="ml-2">{tx.blockNumber}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {new Date(tx.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function ConnectionsCard({ connections, onExplore }: { connections: ConnectedWallet[]; onExplore: (address: string) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Connected Wallets ({connections.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="space-y-3">
            {connections.length === 0 ? (
              <p className="text-center text-slate-400 py-12">No connections found</p>
            ) : (
              connections.map((conn, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-mono">{conn.address.substring(0, 20)}...</code>
                    <Button size="sm" variant="outline" onClick={() => onExplore(conn.address)}>
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Explore
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Relationship:</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {conn.relationship}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-slate-400">Transactions:</span>
                      <span className="ml-2 font-semibold">{conn.transactionCount}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Volume:</span>
                      <span className="ml-2">{parseFloat(conn.totalVolume).toFixed(4)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-slate-400">
                    <span>First: {new Date(conn.firstInteraction).toLocaleDateString()}</span>
                    <span>Last: {new Date(conn.lastInteraction).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function ThreatIntelCard({ threatIntel, wallet }: { threatIntel: any; wallet: CryptoWalletInfo }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Threat Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {threatIntel.isKnownThreat ? (
              <XCircle className="h-8 w-8 text-red-500" />
            ) : (
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            )}
            <div>
              <p className="font-semibold">
                {threatIntel.isKnownThreat ? 'Known Threat Detected' : 'No Known Threats'}
              </p>
              <p className="text-sm text-slate-400">
                Risk Score: {wallet.riskScore}/100
              </p>
            </div>
          </div>

          {threatIntel.threatType.length > 0 && (
            <div>
              <Label className="text-sm text-slate-400">Threat Types</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {threatIntel.threatType.map((type: string, i: number) => (
                  <Badge key={i} variant="destructive">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {threatIntel.details.length > 0 && (
            <div>
              <Label className="text-sm text-slate-400">Details</Label>
              <ul className="mt-2 space-y-1">
                {threatIntel.details.map((detail: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <Label className="text-sm text-slate-400">Abuse Reports</Label>
              <p className="text-2xl font-semibold mt-1">{threatIntel.abuseReports}</p>
            </div>
            <div>
              <Label className="text-sm text-slate-400">Sanctioned</Label>
              <p className="text-2xl font-semibold mt-1">
                {threatIntel.sanctioned ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalysisCard({ analysis }: { analysis: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Behavioral Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <Label className="text-sm font-semibold">Behavior Pattern</Label>
            <p className="mt-2 text-sm">{analysis.behaviorPattern}</p>
          </div>

          <div>
            <Label className="text-sm font-semibold">Volume Analysis</Label>
            <p className="mt-2 text-sm">{analysis.volumeAnalysis}</p>
          </div>

          <div>
            <Label className="text-sm font-semibold">Frequency Analysis</Label>
            <p className="mt-2 text-sm">{analysis.frequencyAnalysis}</p>
          </div>

          {analysis.riskFactors.length > 0 && (
            <div>
              <Label className="text-sm font-semibold">Risk Factors</Label>
              <ul className="mt-2 space-y-2">
                {analysis.riskFactors.map((factor: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.recommendations.length > 0 && (
            <div>
              <Label className="text-sm font-semibold">Recommendations</Label>
              <ul className="mt-2 space-y-2">
                {analysis.recommendations.map((rec: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionDetailsCard({ transaction, onCopy }: { transaction: CryptoTransaction; onCopy: (text: string) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hash className="h-5 w-5" />
          Transaction Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Transaction Hash */}
          <div>
            <Label className="text-sm text-slate-400">Transaction Hash</Label>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-sm font-mono bg-slate-900 px-2 py-1 rounded flex-1 truncate">
                {transaction.hash}
              </code>
              <Button size="sm" variant="ghost" onClick={() => onCopy(transaction.hash)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Status and Block Info */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-sm text-slate-400">Status</Label>
              <Badge variant={transaction.status === 'confirmed' ? 'default' : 'secondary'} className="mt-1">
                {transaction.status}
              </Badge>
            </div>
            <div>
              <Label className="text-sm text-slate-400">Block Number</Label>
              <p className="mt-1 font-semibold">{transaction.blockNumber}</p>
            </div>
            <div>
              <Label className="text-sm text-slate-400">Confirmations</Label>
              <p className="mt-1 font-semibold">{transaction.confirmations}</p>
            </div>
          </div>

          {/* Value and Fee */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-slate-400">Value</Label>
              <p className="mt-1 text-lg font-semibold text-green-500">
                {parseFloat(transaction.value).toFixed(8)}
              </p>
            </div>
            <div>
              <Label className="text-sm text-slate-400">Fee</Label>
              <p className="mt-1 text-lg font-semibold">
                {parseFloat(transaction.fee).toFixed(8)}
              </p>
            </div>
          </div>

          {/* Timestamp */}
          <div>
            <Label className="text-sm text-slate-400">Timestamp</Label>
            <p className="mt-1">{new Date(transaction.timestamp).toLocaleString()}</p>
          </div>

          {/* Inputs */}
          <div>
            <Label className="text-sm font-semibold">Inputs ({transaction.inputs.length})</Label>
            <ScrollArea className="h-48 mt-2 border rounded-lg p-2">
              <div className="space-y-2">
                {transaction.inputs.map((input, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-900 rounded">
                    <code className="text-xs">{input.address}</code>
                    <p className="text-xs text-slate-400 mt-1">
                      Value: {parseFloat(input.value).toFixed(8)}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Outputs */}
          <div>
            <Label className="text-sm font-semibold">Outputs ({transaction.outputs.length})</Label>
            <ScrollArea className="h-48 mt-2 border rounded-lg p-2">
              <div className="space-y-2">
                {transaction.outputs.map((output, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-900 rounded">
                    <code className="text-xs">{output.address}</code>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-slate-400">
                        Value: {parseFloat(output.value).toFixed(8)}
                      </p>
                      <Badge variant={output.spent ? 'secondary' : 'default'} className="text-xs">
                        {output.spent ? 'Spent' : 'Unspent'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
