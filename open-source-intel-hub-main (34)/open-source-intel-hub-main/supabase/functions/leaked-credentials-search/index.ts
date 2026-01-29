import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  searchTerm?: string;
  query?: string;
  searchType: 'username' | 'email' | 'both';
  limit?: number;
  offset?: number;
}

interface LeakedCredential {
  id: number;
  site_url: string;
  username: string;
  password: string | null;
  created_at: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchTerm, query, searchType = 'both', limit = 100, offset = 0 } = await req.json() as SearchRequest;
    
    // Accept both searchTerm and query for backward compatibility
    const searchQuery = query || searchTerm;
    
    if (!searchQuery || searchQuery.trim().length < 2) {
      return new Response(JSON.stringify({
        success: false,
        results: [],
        total: 0,
        query: searchQuery,
        searchType,
        timestamp: new Date().toISOString(),
        error: 'Search query must be at least 2 characters'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    console.log(`[LeakedCredentials] Searching Neon DB for: ${searchQuery}, type: ${searchType}`);

    // Neon DB Connection
    const client = new Client({
      user: "neondb_owner",
      password: "npg_sMO8u1jAXDRB",
      database: "neondb",
      hostname: "ep-still-field-ahnly324-pooler.c-3.us-east-1.aws.neon.tech",
      port: 5432,
      tls: {
        enabled: true,
        enforce: true,
      },
    });

    try {
      await client.connect();
      
      let sqlQuery: string;
      let sqlParams: any[];
      const searchPattern = `%${searchQuery.toLowerCase()}%`;
      
      // Construct query based on search type
      // We explicitly select columns to match the LeakedCredential interface
      const baseSelect = "SELECT id, site_url, username, password, created_at FROM leaked_credentials";
      
      if (searchType === 'email') {
        sqlQuery = `
          ${baseSelect} 
          WHERE LOWER(username) LIKE $1 AND username LIKE '%@%'
          ORDER BY created_at DESC
          LIMIT $2 OFFSET $3
        `;
        sqlParams = [searchPattern, limit, offset];
      } else {
        // Default to username search (which includes email as username)
        sqlQuery = `
          ${baseSelect} 
          WHERE LOWER(username) LIKE $1
          ORDER BY created_at DESC
          LIMIT $2 OFFSET $3
        `;
        sqlParams = [searchPattern, limit, offset];
      }

      const result = await client.queryObject<LeakedCredential>(sqlQuery, sqlParams);
      
      // Get total count for pagination
      let countQuery: string;
      let countParams: any[] = [searchPattern];
      
      if (searchType === 'email') {
        countQuery = "SELECT COUNT(*) as total FROM leaked_credentials WHERE LOWER(username) LIKE $1 AND username LIKE '%@%'";
      } else {
        countQuery = "SELECT COUNT(*) as total FROM leaked_credentials WHERE LOWER(username) LIKE $1";
      }
      
      const countResult = await client.queryObject<{ total: number }>(countQuery, countParams);
      const total = Number(countResult.rows[0]?.total || 0);

      console.log(`[LeakedCredentials] Found ${result.rows.length} results (total: ${total})`);

      return new Response(JSON.stringify({
        success: true,
        results: result.rows,
        total,
        query: searchQuery,
        searchType,
        timestamp: new Date().toISOString(),
        source: 'neon-db-real' // Flag to indicate real DB data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (dbError) {
      console.error('[LeakedCredentials] Database Error:', dbError);
      throw dbError;
    } finally {
      await client.end();
    }

  } catch (error) {
    console.error('[LeakedCredentials] Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      results: [],
      total: 0,
      error: error instanceof Error ? error.message : 'Internal Server Error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
