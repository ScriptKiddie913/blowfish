import { useState, useEffect } from 'react';
import { Shield, Search, Loader2, ExternalLink, AlertTriangle, Clock, Code, FileText, Bug, Info, Copy, CheckCircle2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  searchCVE, 
  getCVEDetails, 
  getRecentCVEs, 
  searchExploitDB,
  getSeverityColor,
  getSeverityBg,
  CVEData,
  ExploitData 
} from '@/services/cveService';
import { saveSearchHistory } from '@/services/userDataService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function CVEExplorer() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'recent' | 'exploits'>('recent');
  const [cveResults, setCveResults] = useState<CVEData[]>([]);
  const [exploitResults, setExploitResults] = useState<ExploitData[]>([]);
  const [selectedCVE, setSelectedCVE] = useState<CVEData | null>(null);
  const [viewingDetails, setViewingDetails] = useState(false);

  useEffect(() => {
    if (activeTab === 'recent') {
      loadRecentCVEs();
    }
  }, [activeTab]);

  const loadRecentCVEs = async () => {
    setLoading(true);
    try {
      const cves = await getRecentCVEs(20, 30);
      setCveResults(cves);
    } catch (error) {
      toast.error('Failed to load recent CVEs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchCVE = async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setLoading(true);
    setCveResults([]);
    setSelectedCVE(null);

    try {
      if (query.match(/^CVE-\d{4}-\d{4,}$/i)) {
        // Direct CVE lookup
        const cve = await getCVEDetails(query.toUpperCase());
        if (cve) {
          setCveResults([cve]);
          // Auto-open details for direct lookup
          setSelectedCVE(cve);
          setViewingDetails(true);
          
          // Save to Supabase search history (for logged-in users)
          await saveSearchHistory(query.toUpperCase(), 'cve', 1, {
            severity: cve.cvss?.severity,
            cvssScore: cve.cvss?.score,
          });
        } else {
          toast.error('CVE not found');
        }
      } else {
        // Search
        const results = await searchCVE(query, 30);
        setCveResults(results);
        toast.success(`Found ${results.length} CVEs`);

        // Save to Supabase search history (for logged-in users)
        await saveSearchHistory(query, 'cve', results.length, {
          resultsCount: results.length,
        });
      }
    } catch (error) {
      toast.error('CVE search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchExploits = async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setLoading(true);
    setExploitResults([]);

    try {
      const results = await searchExploitDB(query, 50);
      setExploitResults(results);
      toast.success(`Found ${results.length} exploits`);

      // Save to Supabase search history (for logged-in users)
      await saveSearchHistory(query, 'exploit', results.length, {
        resultsCount: results.length,
      });
    } catch (error) {
      toast.error('Exploit search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCVE = async (cve: CVEData) => {
    setSelectedCVE(cve);
    setViewingDetails(true);
    
    // Fetch full details if not already complete or if it's a stub
    if (!cve.exploitAvailable || !cve.cwe || cve.cwe.length === 0) {
      try {
        const details = await getCVEDetails(cve.id);
        if (details) {
          setSelectedCVE(details);
        }
      } catch (error) {
        console.error('Failed to fetch CVE details:', error);
      }
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">CVE & Exploit Database</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Search vulnerabilities, CVEs, and public exploits
        </p>
      </div>

      {/* Search Bar */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    activeTab === 'exploits' ? handleSearchExploits() : handleSearchCVE();
                  }
                }}
                placeholder={
                  activeTab === 'exploits' 
                    ? 'Search exploits (e.g., "wordpress", "CVE-2021-44228")'
                    : 'Search CVEs (e.g., "CVE-2021-44228", "log4j")'
                }
                className="pl-10 bg-background"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={activeTab === 'exploits' ? handleSearchExploits : handleSearchCVE}
                disabled={loading}
                className="min-w-[100px]"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="bg-secondary/50 border border-border w-full md:w-auto grid grid-cols-3 md:flex">
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden md:inline">Recent CVEs</span>
            <span className="md:hidden">Recent</span>
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden md:inline">CVE Search</span>
            <span className="md:hidden">Search</span>
          </TabsTrigger>
          <TabsTrigger value="exploits" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Exploits
          </TabsTrigger>
        </TabsList>

        {/* Recent CVEs */}
        <TabsContent value="recent" className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {cveResults.map((cve) => (
                <CVECard key={cve.id} cve={cve} onSelect={handleSelectCVE} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* CVE Search */}
        <TabsContent value="search" className="mt-4">
          <div className="grid grid-cols-1 gap-4">
            {cveResults.map((cve) => (
              <CVECard key={cve.id} cve={cve} onSelect={handleSelectCVE} />
            ))}
            {cveResults.length === 0 && !loading && (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No CVEs Found</p>
                <p className="text-sm">Search by CVE ID (e.g. CVE-2023-1234) or keywords</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Exploits */}
        <TabsContent value="exploits" className="mt-4">
          <div className="grid grid-cols-1 gap-4">
            {exploitResults.map((exploit) => (
              <ExploitCard key={exploit.id} exploit={exploit} />
            ))}
            {exploitResults.length === 0 && !loading && (
              <div className="text-center py-12 text-muted-foreground">
                <Code className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Exploit Database</p>
                <p className="text-sm">Search for public exploits and PoCs</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* CVE Details Dialog */}
      <Dialog open={viewingDetails} onOpenChange={setViewingDetails}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 bg-slate-950 border-slate-800">
          <DialogHeader className="p-6 pb-2 border-b border-slate-800 bg-slate-900/50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-2xl font-mono font-bold flex items-center gap-3">
                  {selectedCVE?.id}
                  {selectedCVE && (
                    <Badge className={cn("ml-2 text-white border-none", getSeverityBg(selectedCVE.cvss.severity))}>
                      {selectedCVE.cvss.severity} ({selectedCVE.cvss.score})
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="mt-2 flex items-center gap-4 text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Published: {selectedCVE && new Date(selectedCVE.published).toLocaleDateString()}
                  </span>
                  {selectedCVE?.exploitAvailable && (
                    <Badge variant="destructive" className="h-5 text-[10px] px-1.5">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Exploit Available
                    </Badge>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <ScrollArea className="flex-1 p-6">
            {selectedCVE && <CVEDetailsContent cve={selectedCVE} />}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CVECard({ cve, onSelect }: { cve: CVEData; onSelect: (cve: CVEData) => void }) {
  return (
    <Card 
      className={cn(
        'bg-card border hover:border-primary/50 transition-all cursor-pointer group',
        'hover:shadow-lg hover:shadow-primary/5 relative overflow-hidden'
      )}
      onClick={() => onSelect(cve)}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardContent className="p-5 relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-2">
              <h3 className="text-lg font-mono font-bold text-primary group-hover:underline decoration-primary/50 underline-offset-4">
                {cve.id}
              </h3>
              <Badge variant="outline" className={cn("font-mono text-[10px]", getSeverityColor(cve.cvss.severity))}>
                CVSS {cve.cvss.score}
              </Badge>
              {cve.exploitAvailable && (
                <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
                  Exploit
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {cve.description}
            </p>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {new Date(cve.published).toLocaleDateString()}
              </span>
              {cve.cwe.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <Bug className="h-3.5 w-3.5" />
                  {cve.cwe[0]}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className={cn(
              "flex flex-col items-center justify-center min-w-[80px] h-20 rounded-lg border bg-slate-900/50",
              cve.cvss.severity === 'CRITICAL' ? "border-red-900/50 bg-red-950/10" : 
              cve.cvss.severity === 'HIGH' ? "border-orange-900/50 bg-orange-950/10" : 
              "border-slate-800"
            )}>
              <span className={cn("text-2xl font-bold font-mono", getSeverityColor(cve.cvss.severity))}>
                {cve.cvss.score.toFixed(1)}
              </span>
              <span className="text-[10px] uppercase font-bold text-muted-foreground mt-1">
                {cve.cvss.severity.substring(0, 3)}
              </span>
            </div>
            <Button variant="ghost" size="sm" className="h-8 text-xs opacity-0 group-hover:opacity-100 transition-opacity -mr-2 text-primary">
              View Details <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CVEDetailsContent({ cve }: { cve: CVEData }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Description Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <Info className="h-5 w-5 text-primary" />
          Description
        </h3>
        <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 text-sm leading-relaxed">
          {cve.description}
        </div>
      </div>

      {/* Technical Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CVSS Metrics */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <Shield className="h-5 w-5 text-primary" />
            CVSS Metrics
          </h3>
          <Card className="bg-slate-900/30 border-slate-800">
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-sm text-muted-foreground">Base Score</span>
                <span className={cn("font-mono font-bold text-lg", getSeverityColor(cve.cvss.severity))}>
                  {cve.cvss.score} / 10.0
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-sm text-muted-foreground">Severity</span>
                <Badge variant="outline" className={cn(getSeverityColor(cve.cvss.severity), "border-current")}>
                  {cve.cvss.severity}
                </Badge>
              </div>
              <div>
                <span className="text-sm text-muted-foreground block mb-1">Vector String</span>
                <div className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-slate-800">
                  <code className="text-xs font-mono flex-1 truncate text-slate-300">
                    {cve.cvss.vector || 'N/A'}
                  </code>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(cve.cvss.vector)}>
                    {copied ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weakness & Source */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <Bug className="h-5 w-5 text-primary" />
            Vulnerability Type (CWE)
          </h3>
          <Card className="bg-slate-900/30 border-slate-800 h-full">
            <CardContent className="p-4">
              {cve.cwe.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {cve.cwe.map((cwe, i) => (
                    <Badge key={i} variant="secondary" className="hover:bg-primary/20 transition-colors cursor-default">
                      {cwe}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No CWE information available</p>
              )}
              
              <div className="mt-6 pt-4 border-t border-slate-800">
                <span className="text-sm text-muted-foreground block mb-2">Data Source</span>
                <Badge variant="outline" className="uppercase text-xs font-mono">
                  {cve.source}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* References */}
      {cve.references.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <ExternalLink className="h-5 w-5 text-primary" />
            References
          </h3>
          <Card className="bg-slate-900/30 border-slate-800">
            <CardContent className="p-0">
              <ScrollArea className="h-[150px]">
                <div className="divide-y divide-slate-800">
                  {cve.references.map((ref, i) => (
                    <a 
                      key={i}
                      href={ref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 text-sm text-primary hover:underline hover:bg-slate-900/50 transition-colors truncate"
                    >
                      <div className="flex items-center gap-2">
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{ref}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Exploit Details (if available) */}
      {cve.exploitDetails && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Exploit Details
          </h3>
          <div className="p-4 rounded-lg bg-red-950/10 border border-red-900/30">
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="text-muted-foreground block">Title</span>
                <span className="font-medium text-red-200">{cve.exploitDetails.title}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Author</span>
                <span className="font-medium text-red-200">{cve.exploitDetails.author}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Type</span>
                <span className="font-medium text-red-200">{cve.exploitDetails.type}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Platform</span>
                <span className="font-medium text-red-200">{cve.exploitDetails.platform}</span>
              </div>
            </div>
            <Button variant="destructive" size="sm" asChild className="w-full">
              <a href={cve.exploitDetails.sourceUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Exploit on Exploit-DB
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ExploitCard({ exploit }: { exploit: ExploitData }) {
  return (
    <Card className="bg-card border hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardContent className="p-4 relative">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Code className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{exploit.title}</h3>
                {exploit.verified && (
                  <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                EDB-ID: {exploit.edbId} | {exploit.date}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3 pl-[52px]">
          <span>Type: <strong className="text-foreground">{exploit.type}</strong></span>
          <span>Platform: <strong className="text-foreground">{exploit.platform}</strong></span>
          <span>Author: <strong className="text-foreground">{exploit.author}</strong></span>
        </div>

        <div className="flex items-center justify-between pl-[52px]">
          <div className="flex flex-wrap gap-2">
            {exploit.cve?.slice(0, 3).map((cve, i) => (
              <Badge key={i} variant="outline" className="text-xs font-mono">
                {cve}
              </Badge>
            ))}
          </div>
          <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
            <a
              href={exploit.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              <ExternalLink className="h-3 w-3" />
              View Source
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
