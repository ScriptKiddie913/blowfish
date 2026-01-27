import { supabase } from "@/integrations/supabase/client";
import { sanitizeInput, maskApiKey } from "@/lib/securityUtils";

export interface ThreatIntelResult {
  success: boolean;
  type: string;
  target: string;
  raw: Record<string, any>;
  formatted: FormattedThreatData | null;
  errors?: string[];
  timestamp: string;
}

export interface FormattedThreatData {
  summary: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'info';
  riskScore: number;
  indicators: ThreatIndicator[];
  detections: {
    malicious: number;
    suspicious: number;
    clean: number;
    undetected: number;
  };
  categories: string[];
  recommendations: string[];
  metadata: {
    asn: string | null;
    country: string | null;
    owner: string | null;
    lastAnalysis: string | null;
    city?: string | null;
    region?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
}

export interface ThreatIndicator {
  type: string;
  value: string;
  source: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
}

export async function queryThreatIntel(
  type: 'ip' | 'domain' | 'url' | 'hash' | 'email',
  target: string,
  sources: string[] = ['virustotal', 'abuse', 'circl', 'malware_bazaar', 'urlhaus']
): Promise<ThreatIntelResult> {
  try {
    // SECURITY: Sanitize target input
    const sanitizedTarget = sanitizeInput(target, 1000);
    
    if (!sanitizedTarget) {
      throw new Error('Invalid target input');
    }

    // SECURITY: Get API key from environment - Vite requires VITE_ prefix
    const apiKey = import.meta.env.VITE_VIRUSTOTAL_API_KEY;
    
    if (!apiKey) {
       console.error("[ThreatIntel] VITE_VIRUSTOTAL_API_KEY is missing in frontend env!");
       console.error("[ThreatIntel] Available env keys:", Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
    } else {
       // SECURITY: Use maskApiKey to avoid logging full key
       console.log("[ThreatIntel] VITE_VIRUSTOTAL_API_KEY is present:", maskApiKey(apiKey));
    }

    const requestBody = { 
      type, 
      target: sanitizedTarget, 
      sources, 
      apiKey: apiKey || undefined  // Ensure we don't send empty string
    };
    
    console.log("[ThreatIntel] Invoking edge function with body:", { 
      ...requestBody, 
      apiKey: apiKey ? maskApiKey(apiKey) : 'NOT SET' 
    });

    const { data, error } = await supabase.functions.invoke('threat-intel', {
      body: requestBody,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data as ThreatIntelResult;
  } catch (error) {
    console.error('Threat intel query error:', error);
    throw error;
  }
}

// Free OSINT feeds - no API key required
export async function queryFreeThreatFeeds(type: string, target: string): Promise<Record<string, any>> {
  const results: Record<string, any> = {};

  try {
    // OpenPhish for phishing URLs
    if (type === 'url' || type === 'domain') {
      const openPhishResponse = await fetch('https://openphish.com/feed.txt');
      if (openPhishResponse.ok) {
        const phishData = await openPhishResponse.text();
        const phishUrls = phishData.split('\n').filter(u => u.includes(target));
        results.openphish = {
          matched: phishUrls.length > 0,
          matchedUrls: phishUrls.slice(0, 10),
        };
      }
    }
  } catch (error) {
    console.error('OpenPhish query failed:', error);
  }

  return results;
}

export function getRiskColor(level: string): string {
  switch (level) {
    case 'critical': return 'text-red-500';
    case 'high': return 'text-orange-500';
    case 'medium': return 'text-yellow-500';
    case 'low': return 'text-blue-500';
    default: return 'text-muted-foreground';
  }
}

export function getRiskBgColor(level: string): string {
  switch (level) {
    case 'critical': return 'bg-red-500/20 border-red-500';
    case 'high': return 'bg-orange-500/20 border-orange-500';
    case 'medium': return 'bg-yellow-500/20 border-yellow-500';
    case 'low': return 'bg-blue-500/20 border-blue-500';
    default: return 'bg-muted border-border';
  }
}
