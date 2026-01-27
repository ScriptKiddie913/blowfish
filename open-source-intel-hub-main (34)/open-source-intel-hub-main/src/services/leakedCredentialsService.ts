// Leaked Credentials Search Service
// Queries the Neon PostgreSQL database for leaked credentials via Supabase Edge Function

// Direct endpoint for the leaked-credentials-search function
const EDGE_FUNCTION_URL = 'https://taumszakhdnwozcnmrtd.supabase.co/functions/v1/leaked-credentials-search';

export interface LeakedCredential {
  id: number;
  site_url: string;
  username: string;
  password: string | null;
  created_at: string;
}

export interface SearchResult {
  success: boolean;
  results: LeakedCredential[];
  total: number;
  query: string;
  searchType: 'username' | 'email' | 'both';
  timestamp: string;
  error?: string;
  source?: string;
}

export interface SearchStats {
  totalSearches: number;
  lastSearchTime: string | null;
  totalResultsFound: number;
}

// Track search statistics locally
let searchStats: SearchStats = {
  totalSearches: 0,
  lastSearchTime: null,
  totalResultsFound: 0
};

/**
 * Search for leaked credentials by username or email
 */
export async function searchLeakedCredentials(
  query: string,
  searchType: 'username' | 'email' | 'both' = 'both',
  limit: number = 100,
  offset: number = 0
): Promise<SearchResult> {
  try {
    console.log(`[LeakedCredentialsService] Searching: ${query}, type: ${searchType}`);
    
    // Call the Edge Function directly
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query.trim(),
        searchType,
        limit,
        offset
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[LeakedCredentialsService] HTTP Error:', response.status, errorText);
      return {
        success: false,
        results: [],
        total: 0,
        query,
        searchType,
        timestamp: new Date().toISOString(),
        error: `HTTP ${response.status}: ${errorText || 'Failed to search leaked credentials'}`
      };
    }

    const data = await response.json();

    if (data.source) {
      console.log(`[LeakedCredentialsService] Data source: ${data.source}`);
    } else {
      console.warn('[LeakedCredentialsService] Data source not specified (possibly mock or old function)');
    }

    // Update local stats
    searchStats.totalSearches++;
    searchStats.lastSearchTime = new Date().toISOString();
    searchStats.totalResultsFound += data.results?.length || 0;

    return data as SearchResult;
  } catch (error) {
    console.error('[LeakedCredentialsService] Exception:', error);
    return {
      success: false,
      results: [],
      total: 0,
      query,
      searchType,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get search statistics
 */
export function getSearchStats(): SearchStats {
  return { ...searchStats };
}

/**
 * Export search results to CSV format
 */
export function exportToCSV(results: LeakedCredential[]): string {
  if (results.length === 0) return '';
  
  const headers = ['ID', 'Site URL', 'Username', 'Password', 'Date Found'];
  const rows = results.map(r => [
    r.id.toString(),
    `"${(r.site_url || '').replace(/"/g, '""')}"`,
    `"${(r.username || '').replace(/"/g, '""')}"`,
    `"${(r.password || '').replace(/"/g, '""')}"`,
    r.created_at
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Mask password for display purposes
 */
export function maskPassword(password: string | null): string {
  if (!password) return 'N/A';
  if (password.length <= 4) return '****';
  return password.substring(0, 2) + '*'.repeat(Math.min(password.length - 4, 8)) + password.substring(password.length - 2);
}

/**
 * Format the date for display
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}

/**
 * Check if a string looks like an email
 */
export function isEmail(str: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname;
  } catch {
    return url;
  }
}
