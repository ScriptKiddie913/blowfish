import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ThreatIntelRequest {
  type: 'ip' | 'domain' | 'url' | 'hash' | 'email';
  target: string;
  sources?: string[];
  apiKey?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, target, sources = ['virustotal', 'abuse', 'circl'], apiKey } = await req.json() as ThreatIntelRequest;
    
    console.log(`Threat intel request: ${type} - ${target}`);
    console.log(`Sources: ${sources.join(', ')}`);
    if (apiKey) {
      console.log('API Key received in request body');
    } else {
      console.log('No API Key in request body, falling back to ENV');
    }
    
    const results: Record<string, any> = {};
    const errors: string[] = [];
    
    // VirusTotal API
    if (sources.includes('virustotal')) {
      const vtResult = await queryVirusTotal(type, target, apiKey);
      if (vtResult.error) {
        errors.push(`VirusTotal: ${vtResult.error}`);
      } else {
        results.virustotal = vtResult;
      }
    }
    
    // Abuse.ch feeds
    if (sources.includes('abuse')) {
      const abuseResult = await queryAbuseCh(type, target);
      if (abuseResult.error) {
        errors.push(`Abuse.ch: ${abuseResult.error}`);
      } else {
        results.abuse = abuseResult;
      }
    }

    // MalwareBazaar (Abuse.ch)
    if (sources.includes('malware_bazaar') || type === 'hash') {
      const mbResult = await queryMalwareBazaar(type, target);
      if (mbResult.found) {
        results.malware_bazaar = mbResult;
      } else if (mbResult.error) {
         // Log error but don't fail everything
         console.error(`MalwareBazaar: ${mbResult.error}`);
      }
    }
    
    // CIRCL Hashlookup
    if (sources.includes('circl') && type === 'hash') {
      const circlResult = await queryCirclHashlookup(target);
      if (circlResult.error) {
        errors.push(`CIRCL: ${circlResult.error}`);
      } else {
        results.circl = circlResult;
      }
    }
    
    // URLhaus for URLs
    if (sources.includes('urlhaus') && type === 'url') {
      const urlhausResult = await queryUrlhaus(target);
      if (urlhausResult.error) {
        errors.push(`URLhaus: ${urlhausResult.error}`);
      } else {
        results.urlhaus = urlhausResult;
      }
    }
    
    // Geolocation for IPs
    if (type === 'ip') {
      const geoResult = await queryGeolocation(target);
      if (geoResult.found) {
        results.geolocation = geoResult;
      }
    }
    
    // Use AI to format the data into a structured table format
    let formattedData = await formatWithAI(type, target, results);
    
    if (!formattedData) {
      formattedData = formatManually(type, target, results);
    }
    
    return new Response(JSON.stringify({
      success: true,
      type,
      target,
      raw: results,
      formatted: formattedData,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Threat intel error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function queryMalwareBazaar(type: string, target: string): Promise<any> {
  if (type !== 'hash') {
    return { found: false, message: 'MalwareBazaar only supports hash lookups' };
  }
  
  try {
    const response = await fetch('https://mb-api.abuse.ch/api/v1/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `query=get_info&hash=${target}`,
    });
    
    if (!response.ok) {
       return { error: `API error: ${response.status}` };
    }
    
    const data = await response.json();
    if (data.query_status === 'ok') {
       return {
         found: true,
         data: data.data[0],
         source: 'MalwareBazaar'
       };
    } else {
       return { found: false, message: data.query_status };
    }
  } catch (error) {
    console.error('MalwareBazaar query error:', error);
    return { error: error instanceof Error ? error.message : 'Query failed' };
  }
}

// Helper function to submit a URL to VirusTotal and then query its results
async function submitAndQueryUrl(url: string, apiKey: string): Promise<any> {
  try {
    // Submit URL for analysis
    const submitResponse = await fetch('https://www.virustotal.com/api/v3/urls', {
      method: 'POST',
      headers: {
        'x-apikey': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `url=${encodeURIComponent(url)}`,
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error(`VirusTotal URL submit error: ${submitResponse.status} - ${errorText}`);
      return { error: `Failed to submit URL: ${submitResponse.status}` };
    }

    const submitData = await submitResponse.json();
    const analysisId = submitData.data?.id;

    if (!analysisId) {
      return { found: false, message: 'URL submitted but no analysis ID returned' };
    }

    console.log(`URL submitted, analysis ID: ${analysisId}`);

    // Wait a moment for analysis to begin, then query results
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Query the URL analysis results using the links from submission response
    const analysisUrl = submitData.data?.links?.self || `https://www.virustotal.com/api/v3/analyses/${analysisId}`;
    
    const analysisResponse = await fetch(analysisUrl, {
      headers: {
        'x-apikey': apiKey,
        'Accept': 'application/json',
      },
    });

    if (!analysisResponse.ok) {
      return { found: true, message: 'URL submitted for analysis, results pending', analysisId };
    }

    const analysisData = await analysisResponse.json();
    return {
      found: true,
      data: analysisData.data,
      attributes: analysisData.data?.attributes,
      status: 'submitted',
    };
  } catch (error) {
    console.error('VirusTotal URL submit/query error:', error);
    return { error: error instanceof Error ? error.message : 'URL submission failed' };
  }
}

async function queryVirusTotal(type: string, target: string, apiKeyOverride?: string): Promise<any> {
  // Try multiple sources for API key: override from request, env variable, or fallback
  const apiKey = apiKeyOverride || Deno.env.get('VIRUSTOTAL_API_KEY') || Deno.env.get('VITE_VIRUSTOTAL_API_KEY');
  
  console.log(`[VirusTotal] API Key check - Override provided: ${!!apiKeyOverride}, ENV key exists: ${!!Deno.env.get('VIRUSTOTAL_API_KEY')}`);
  
  if (!apiKey) {
    console.error('[VirusTotal] No API key available from any source');
    return { error: 'VirusTotal API key not configured' };
  }
  
  console.log(`[VirusTotal] Using API key: ${apiKey.substring(0, 8)}...`);
  
  let endpoint = '';
  switch (type) {
    case 'ip':
      endpoint = `https://www.virustotal.com/api/v3/ip_addresses/${encodeURIComponent(target)}`;
      break;
    case 'domain':
      endpoint = `https://www.virustotal.com/api/v3/domains/${encodeURIComponent(target)}`;
      break;
    case 'url':
      // VirusTotal URL lookup requires base64url encoding (URL-safe base64 without padding)
      // The URL must be encoded as: base64url(url) where base64url uses - and _ instead of + and /
      const encoder = new TextEncoder();
      const urlBytes = encoder.encode(target);
      const base64 = btoa(String.fromCharCode(...urlBytes));
      // Convert to URL-safe base64 (replace + with -, / with _, remove = padding)
      const urlId = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      endpoint = `https://www.virustotal.com/api/v3/urls/${urlId}`;
      break;
    case 'hash':
      endpoint = `https://www.virustotal.com/api/v3/files/${encodeURIComponent(target)}`;
      break;
    default:
      return { error: `Unsupported type: ${type}` };
  }
  
  try {
    console.log(`Querying VirusTotal: ${endpoint}`);
    const response = await fetch(endpoint, {
      headers: {
        'x-apikey': apiKey,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        // For URLs, try submitting first then querying
        if (type === 'url') {
          console.log('URL not found, attempting to submit for analysis...');
          return await submitAndQueryUrl(target, apiKey);
        }
        return { found: false, message: 'Not found in VirusTotal database' };
      }
      const errorText = await response.text();
      console.error(`VirusTotal error: ${response.status} - ${errorText}`);
      return { error: `API error: ${response.status}` };
    }
    
    const data = await response.json();
    return {
      found: true,
      data: data.data,
      attributes: data.data?.attributes,
    };
  } catch (error) {
    console.error('VirusTotal fetch error:', error);
    return { error: error instanceof Error ? error.message : 'Fetch failed' };
  }
}

async function queryAbuseCh(type: string, target: string): Promise<any> {
  try {
    const results: any = { matched: false, sources: [] };
    
    // Check Feodo Tracker for IPs
    if (type === 'ip') {
      const feodoResponse = await fetch('https://feodotracker.abuse.ch/downloads/ipblocklist.txt');
      if (feodoResponse.ok) {
        const feodoData = await feodoResponse.text();
        if (feodoData.includes(target)) {
          results.matched = true;
          results.sources.push({
            name: 'Feodo Tracker',
            type: 'Botnet C2',
            risk: 'high',
          });
        }
      }
    }
    
    // Check SSL Blacklist
    if (type === 'ip') {
      const sslResponse = await fetch('https://sslbl.abuse.ch/blacklist/sslipblacklist.txt');
      if (sslResponse.ok) {
        const sslData = await sslResponse.text();
        if (sslData.includes(target)) {
          results.matched = true;
          results.sources.push({
            name: 'SSL Blacklist',
            type: 'Malicious SSL',
            risk: 'high',
          });
        }
      }
    }
    
    // Check Spamhaus DROP
    if (type === 'ip') {
      const spamhausResponse = await fetch('https://www.spamhaus.org/drop/drop.txt');
      if (spamhausResponse.ok) {
        const spamhausData = await spamhausResponse.text();
        // Check if IP falls in any CIDR range (simplified - checks prefix)
        const ipPrefix = target.split('.').slice(0, 2).join('.');
        if (spamhausData.includes(ipPrefix)) {
          results.matched = true;
          results.sources.push({
            name: 'Spamhaus DROP',
            type: 'Known Bad IP Range',
            risk: 'critical',
          });
        }
      }
    }
    
    return results;
  } catch (error) {
    console.error('Abuse.ch query error:', error);
    return { error: error instanceof Error ? error.message : 'Query failed' };
  }
}

async function queryCirclHashlookup(hash: string): Promise<any> {
  try {
    // Determine hash type
    let hashType = 'sha256';
    if (hash.length === 32) hashType = 'md5';
    else if (hash.length === 40) hashType = 'sha1';
    
    const response = await fetch(`https://hashlookup.circl.lu/lookup/${hashType}/${hash}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return { found: false, message: 'Hash not found in CIRCL database' };
      }
      return { error: `API error: ${response.status}` };
    }
    
    const data = await response.json();
    return {
      found: true,
      filename: data.FileName,
      filesize: data.FileSize,
      knownSource: data.KnownMalicious ? 'malicious' : 'benign',
      md5: data.MD5,
      sha1: data.SHA1,
      sha256: data.SHA256,
    };
  } catch (error) {
    console.error('CIRCL query error:', error);
    return { error: error instanceof Error ? error.message : 'Query failed' };
  }
}

async function queryUrlhaus(url: string): Promise<any> {
  try {
    const response = await fetch('https://urlhaus-api.abuse.ch/v1/url/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `url=${encodeURIComponent(url)}`,
    });
    
    if (!response.ok) {
      return { error: `API error: ${response.status}` };
    }
    
    const data = await response.json();
    return {
      found: data.query_status === 'ok',
      status: data.url_status,
      threat: data.threat,
      dateAdded: data.date_added,
      tags: data.tags,
    };
  } catch (error) {
    console.error('URLhaus query error:', error);
    return { error: error instanceof Error ? error.message : 'Query failed' };
  }
}

async function formatWithAI(type: string, target: string, results: Record<string, any>): Promise<any> {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!lovableApiKey) {
    console.log('LOVABLE_API_KEY not configured, returning unformatted results');
    return null;
  }
  
  const prompt = `You are a cybersecurity analyst. Analyze the following threat intelligence data and format it into a structured JSON response.

Target: ${target}
Type: ${type}

Raw Data:
${JSON.stringify(results, null, 2)}

Return a JSON object with this exact structure:
{
  "summary": "One sentence threat summary",
  "riskLevel": "critical|high|medium|low|info",
  "riskScore": 0-100,
  "indicators": [
    {
      "type": "string (e.g., 'malicious_detection', 'reputation', 'association')",
      "value": "string",
      "source": "string",
      "severity": "critical|high|medium|low|info"
    }
  ],
  "detections": {
    "malicious": number,
    "suspicious": number,
    "clean": number,
    "undetected": number
  },
  "categories": ["array of threat categories"],
  "recommendations": ["array of security recommendations"],
  "metadata": {
    "asn": "string or null",
    "country": "string or null",
    "city": "string or null",
    "region": "string or null",
    "latitude": number or null,
    "longitude": number or null,
    "owner": "string or null",
    "lastAnalysis": "ISO date string or null"
  }
}

IMPORTANT: Return ONLY valid JSON, no markdown or explanation.`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: prompt }
        ]
      }),
    });
    
    if (!response.ok) {
      console.error('AI format error:', await response.text());
      return null;
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Extract JSON from code block if present
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/{[\s\S]*}/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('AI format failed:', error);
    return null;
  }
}

function formatManually(type: string, target: string, results: Record<string, any>): any {
  let maliciousCount = 0;
  let suspiciousCount = 0;
  let cleanCount = 0;
  let undetectedCount = 0;
  let riskLevel = 'low';
  let riskScore = 0;
  const indicators: any[] = [];
  const categories: string[] = [];
  const recommendations: string[] = [];
  const metadata: any = { asn: null, country: null, owner: null, lastAnalysis: null };

  // Process VirusTotal
  if (results.virustotal && results.virustotal.found) {
     const attr = results.virustotal.attributes;
     if (attr) {
        if (attr.last_analysis_stats) {
           maliciousCount += attr.last_analysis_stats.malicious || 0;
           suspiciousCount += attr.last_analysis_stats.suspicious || 0;
           cleanCount += attr.last_analysis_stats.harmless || 0;
           undetectedCount += attr.last_analysis_stats.undetected || 0;
        }
        
        if (maliciousCount > 0) {
           riskLevel = maliciousCount > 5 ? 'critical' : 'high';
           riskScore = Math.min(100, maliciousCount * 10 + 50);
        } else if (suspiciousCount > 0) {
           riskLevel = 'medium';
           riskScore = 40;
        }
        
        // Metadata
        metadata.country = attr.country || metadata.country;
        metadata.asn = attr.asn || metadata.asn;
        metadata.owner = attr.as_owner || metadata.owner;
        if (attr.last_analysis_date) {
            metadata.lastAnalysis = new Date(attr.last_analysis_date * 1000).toISOString();
        }
        
        // Tags
        if (attr.tags) categories.push(...attr.tags);
     }
  }

  // Process Abuse.ch
  if (results.abuse && results.abuse.matched) {
     riskLevel = 'high';
     riskScore = Math.max(riskScore, 80);
     results.abuse.sources.forEach((s: any) => {
        indicators.push({
           type: s.type,
           value: target,
           source: s.name,
           severity: s.risk
        });
        categories.push(s.type);
     });
     maliciousCount++;
  }

  // Process URLhaus
  if (results.urlhaus && results.urlhaus.found) {
     riskLevel = results.urlhaus.threat === 'malware_download' ? 'critical' : 'high';
     riskScore = Math.max(riskScore, 90);
     maliciousCount++;
     indicators.push({
        type: 'malicious_url',
        value: target,
        source: 'URLhaus',
        severity: riskLevel
     });
     if (results.urlhaus.tags) categories.push(...results.urlhaus.tags);
     if (results.urlhaus.dateAdded) metadata.lastAnalysis = results.urlhaus.dateAdded;
  }
  
  // Process MalwareBazaar
  if (results.malware_bazaar && results.malware_bazaar.found) {
     riskLevel = 'critical';
     riskScore = 100;
     maliciousCount++;
     const data = results.malware_bazaar.data;
     indicators.push({
        type: 'malware_hash',
        value: target,
        source: 'MalwareBazaar',
        severity: 'critical'
     });
     if (data.signature) categories.push(data.signature);
     if (data.tags) categories.push(...data.tags);
     metadata.country = data.origin_country || metadata.country;
     if (data.first_seen) metadata.lastAnalysis = data.first_seen;
  }

  // Process Geolocation
  if (results.geolocation && results.geolocation.found) {
    const geo = results.geolocation.data;
    metadata.country = geo.country || metadata.country;
    metadata.city = geo.city;
    metadata.region = geo.regionName;
    metadata.latitude = geo.lat;
    metadata.longitude = geo.lon;
    if (!metadata.asn && geo.as) metadata.asn = geo.as;
    if (!metadata.owner && geo.isp) metadata.owner = geo.isp;
  }

  // Generate Summary
  const summary = `Analysis of ${type} ${target} shows ${maliciousCount > 0 ? 'malicious' : 'clean'} indicators. Risk Level: ${riskLevel.toUpperCase()}.`;
  
  if (riskLevel === 'critical' || riskLevel === 'high') {
     recommendations.push('Block immediate access to this target');
     recommendations.push('Scan endpoints for communication with this target');
  } else if (riskLevel === 'medium') {
     recommendations.push('Monitor traffic to/from this target');
  } else {
     recommendations.push('No immediate threats detected, but continue monitoring');
  }

  return {
    summary,
    riskLevel,
    riskScore,
    indicators,
    detections: {
       malicious: maliciousCount,
       suspicious: suspiciousCount,
       clean: cleanCount,
       undetected: undetectedCount
    },
    categories: [...new Set(categories)],
    recommendations,
    metadata
  };
}

async function queryGeolocation(ip: string): Promise<any> {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as`);
    if (!response.ok) {
       return { error: `Geolocation API error: ${response.status}` };
    }
    const data = await response.json();
    if (data.status === 'success') {
       return {
         found: true,
         data: data
       };
    } else {
       return { found: false, message: data.message };
    }
  } catch (error) {
    console.error('Geolocation query error:', error);
    return { error: error instanceof Error ? error.message : 'Geolocation query failed' };
  }
}
