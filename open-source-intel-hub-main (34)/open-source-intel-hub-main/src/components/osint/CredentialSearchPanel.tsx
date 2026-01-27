import { useState, KeyboardEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from 'sonner';
import {
  Search,
  Loader2,
  Download,
  Eye,
  EyeOff,
  Globe,
  User,
  Mail,
  Key,
  Calendar,
  AlertTriangle,
  Shield,
  Copy,
  CheckCircle2
} from 'lucide-react';
import {
  searchLeakedCredentials,
  exportToCSV,
  maskPassword,
  formatDate,
  extractDomain,
  isEmail,
  type LeakedCredential,
  type SearchResult
} from '@/services/leakedCredentialsService';
import { cn } from '@/lib/utils';

interface CredentialSearchPanelProps {
  showExport?: boolean;
  maxHeight?: string;
  className?: string;
}

export function CredentialSearchPanel({ 
  showExport = true, 
  maxHeight = "500px",
  className 
}: CredentialSearchPanelProps) {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'username' | 'email' | 'both'>('both');
  const [results, setResults] = useState<LeakedCredential[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Please enter a username or email to search');
      return;
    }

    if (query.trim().length < 2) {
      toast.error('Search query must be at least 2 characters');
      return;
    }

    setSearching(true);
    setHasSearched(true);

    try {
      const result: SearchResult = await searchLeakedCredentials(query, searchType);
      
      if (result.success) {
        setResults(result.results);
        setTotalResults(result.total);
        
        if (result.results.length === 0) {
          toast.info('No leaked credentials found for this query');
        } else {
          toast.success(`Found ${result.total} leaked credential(s)`);
        }
      } else {
        toast.error(result.error || 'Search failed');
        setResults([]);
        setTotalResults(0);
      }
    } catch (error) {
      toast.error('Failed to search leaked credentials');
      console.error('Search error:', error);
      setResults([]);
      setTotalResults(0);
    } finally {
      setSearching(false);
    }
  };

  const handleExport = () => {
    if (results.length === 0) {
      toast.error('No results to export');
      return;
    }

    const csv = exportToCSV(results);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leaked_credentials_${query}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Results exported to CSV');
  };

  const togglePasswordVisibility = (id: number) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = async (text: string, id: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Card className={cn("bg-slate-900/50 border-slate-800", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-red-500" />
          Leaked Credentials Search
        </CardTitle>
        <CardDescription>
          Search for compromised credentials by username or email
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Label htmlFor="search-query" className="sr-only">Username or Email</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-query"
                placeholder="Enter username or email..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10 bg-slate-800 border-slate-700"
              />
            </div>
          </div>
          <div className="w-full sm:w-[160px]">
            <Label htmlFor="search-type" className="sr-only">Search Type</Label>
            <Select value={searchType} onValueChange={(v) => setSearchType(v as typeof searchType)}>
              <SelectTrigger id="search-type" className="bg-slate-800 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="both">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    All
                  </div>
                </SelectItem>
                <SelectItem value="username">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Username
                  </div>
                </SelectItem>
                <SelectItem value="email">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handleSearch} 
            disabled={searching}
            className="bg-red-600 hover:bg-red-700"
          >
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Search
          </Button>
        </div>

        {/* Results Stats */}
        {hasSearched && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span>
                {totalResults > 0 ? (
                  <>Found <span className="font-bold text-red-400">{totalResults}</span> compromised credential(s)</>
                ) : (
                  'No compromised credentials found'
                )}
              </span>
            </div>
            {showExport && results.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        )}

        {/* Results Table */}
        {hasSearched && (
          <div className="border border-slate-700 rounded-lg overflow-hidden">
            <ScrollArea className={`h-[${maxHeight}]`} style={{ maxHeight }}>
              {results.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">No Results</p>
                  <p className="text-sm">No leaked credentials found for "{query}"</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-800 sticky top-0">
                    <TableRow>
                      <TableHead className="w-[200px]">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Site
                        </div>
                      </TableHead>
                      <TableHead className="w-[200px]">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Username/Email
                        </div>
                      </TableHead>
                      <TableHead className="w-[180px]">
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4" />
                          Password
                        </div>
                      </TableHead>
                      <TableHead className="w-[150px]">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Date Found
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((credential) => (
                      <TableRow key={credential.id} className="hover:bg-slate-800/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className="font-mono text-xs truncate max-w-[280px]"
                              title={credential.site_url}
                            >
                              {credential.site_url}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isEmail(credential.username) ? (
                              <Mail className="h-3 w-3 text-blue-400 flex-shrink-0" />
                            ) : (
                              <User className="h-3 w-3 text-green-400 flex-shrink-0" />
                            )}
                            <span className="font-mono text-sm truncate max-w-[150px]" title={credential.username}>
                              {credential.username}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => copyToClipboard(credential.username, credential.id)}
                            >
                              {copiedId === credential.id ? (
                                <CheckCircle2 className="h-3 w-3 text-green-400" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-muted-foreground">
                              {showPasswords[credential.id] 
                                ? credential.password || 'N/A'
                                : maskPassword(credential.password)
                              }
                            </span>
                            {credential.password && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => togglePasswordVisibility(credential.id)}
                              >
                                {showPasswords[credential.id] ? (
                                  <EyeOff className="h-3 w-3" />
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(credential.created_at)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </div>
        )}

        {/* Warning Notice */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-yellow-400">Security Notice</p>
            <p className="text-muted-foreground mt-1">
              This tool is for authorized security research only. Do not use exposed credentials 
              for unauthorized access. Always notify affected users and recommend password changes.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
