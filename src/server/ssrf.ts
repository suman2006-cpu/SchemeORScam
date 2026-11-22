import dns from 'node:dns/promises';
import net from 'node:net';

export interface SafeExpandResult {
  originalUrl: string;
  finalUrl: string;
  hops: number;
  statusCode?: number;
  contentType?: string;
  attachmentFilename?: string;
  blockedReason?: string;
  unresolved: boolean;
}

export interface SafeExpandDeps {
  resolveDns?: (hostname: string) => Promise<Array<{ address: string; family: number }>>;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
  maxRedirects?: number;
}

function ipv4ToInt(ip: string): number {
  const parts = ip.split('.').map(Number);
  return (
    ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0
  );
}

function isBlockedIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) {
    return true;
  }
  const n = ipv4ToInt(ip);
  const ranges: Array<[number, number]> = [
    [ipv4ToInt('0.0.0.0'), ipv4ToInt('0.255.255.255')],         // 0.0.0.0/8
    [ipv4ToInt('10.0.0.0'), ipv4ToInt('10.255.255.255')],       // 10.0.0.0/8
    [ipv4ToInt('100.64.0.0'), ipv4ToInt('100.127.255.255')],    // CGNAT 100.64/10
    [ipv4ToInt('127.0.0.0'), ipv4ToInt('127.255.255.255')],     // Loopback 127/8
    [ipv4ToInt('169.254.0.0'), ipv4ToInt('169.254.255.255')],   // Link-local 169.254/16
    [ipv4ToInt('172.16.0.0'), ipv4ToInt('172.31.255.255')],     // Private 172.16/12
    [ipv4ToInt('192.168.0.0'), ipv4ToInt('192.168.255.255')],   // Private 192.168/16
    [ipv4ToInt('224.0.0.0'), ipv4ToInt('255.255.255.255')],     // Multicast & reserved
  ];
  return ranges.some(([start, end]) => n >= start && n <= end);
}

export function isBlockedIp(rawIp: string): boolean {
  const ip = rawIp.trim().toLowerCase().replace(/^\[|\]$/g, '');
  const version = net.isIP(ip);
  if (version === 4) {
    return isBlockedIpv4(ip);
  }
  if (version === 6) {
    // Unspecified & loopback
    if (ip === '::' || ip === '::1' || /^0+:0+:0+:0+:0+:0+:0+:[01]$/.test(ip)) {
      return true;
    }
    // IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1 or ::ffff:7f00:1)
    if (ip.startsWith('::ffff:')) {
      const rest = ip.slice('::ffff:'.length);
      if (net.isIP(rest) === 4) {
        return isBlockedIpv4(rest);
      }
      // Hex form like 7f00:0001
      const hexParts = rest.split(':');
      if (hexParts.length === 2) {
        const hi = parseInt(hexParts[0], 16);
        const lo = parseInt(hexParts[1], 16);
        if (!Number.isNaN(hi) && !Number.isNaN(lo)) {
          const ipv4 = `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
          return isBlockedIpv4(ipv4);
        }
      }
      return true;
    }
    // Unique local fc00::/7 (fc.. or fd..)
    if (/^f[cd][0-9a-f]{2}:/.test(ip) || ip.startsWith('fc00:') || ip.startsWith('fd00:')) {
      return true;
    }
    // Link-local fe80::/10 (fe80..febf)
    if (/^fe[89ab][0-9a-f]:/.test(ip)) {
      return true;
    }
    // Multicast ff00::/8
    if (ip.startsWith('ff')) {
      return true;
    }
    return false;
  }
  // Unknown / invalid IP strings are blocked by default
  return true;
}

function parseAttachmentFilename(contentDisposition: string | null): string | undefined {
  if (!contentDisposition) return undefined;
  const starMatch = contentDisposition.match(/filename\*\s*=\s*(?:utf-8''|UTF-8'')?([^;\s]+)/i);
  if (starMatch?.[1]) {
    try {
      return decodeURIComponent(starMatch[1].replace(/^["']|["']$/g, ''));
    } catch {
      return starMatch[1].replace(/^["']|["']$/g, '');
    }
  }
  const match = contentDisposition.match(/filename\s*=\s*"?([^";\r\n]+)"?/i);
  return match?.[1]?.trim();
}

async function assertHostSafe(
  hostname: string,
  resolveDns: (h: string) => Promise<Array<{ address: string; family: number }>>,
): Promise<void> {
  const cleanHost = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!cleanHost || cleanHost === 'localhost' || cleanHost.endsWith('.localhost')) {
    throw new Error('SSRF_BLOCKED_LOCALHOST');
  }
  if (net.isIP(cleanHost)) {
    if (isBlockedIp(cleanHost)) {
      throw new Error('SSRF_BLOCKED_IP');
    }
    return;
  }

  const records = await resolveDns(cleanHost);
  if (!records || records.length === 0) {
    throw new Error('DNS_NO_RECORDS');
  }
  for (const rec of records) {
    if (isBlockedIp(rec.address)) {
      throw new Error('SSRF_BLOCKED_RESOLVED_IP');
    }
  }
}

/**
 * SSRF-safe URL expander and metadata probe (Section 5A):
 * - http/https only
 * - DNS lookup before EVERY hop; rejects loopback, RFC1918, link-local, ULA
 * - Max 5 redirects, 5s total timeout
 * - HEAD first, then ranged GET of max 1 KB (never executes or renders)
 * - No cookies sent
 */
export async function expandUrlSafely(
  rawUrl: string,
  deps: SafeExpandDeps = {},
): Promise<SafeExpandResult> {
  const resolveDns =
    deps.resolveDns ??
    ((h: string) => dns.lookup(h, { all: true }));
  const fetchFn = deps.fetchFn ?? fetch;
  const timeoutMs = deps.timeoutMs ?? 5000;
  const maxRedirects = deps.maxRedirects ?? 5;

  const deadline = Date.now() + timeoutMs;
  let currentUrl = rawUrl.trim();
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(currentUrl)) {
    currentUrl = `https://${currentUrl}`;
  }

  let hops = 0;

  while (hops <= maxRedirects) {
    let parsed: URL;
    try {
      parsed = new URL(currentUrl);
    } catch {
      return {
        originalUrl: rawUrl,
        finalUrl: currentUrl,
        hops,
        blockedReason: 'INVALID_URL',
        unresolved: true,
      };
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        originalUrl: rawUrl,
        finalUrl: currentUrl,
        hops,
        blockedReason: 'BLOCKED_PROTOCOL',
        unresolved: true,
      };
    }

    try {
      await assertHostSafe(parsed.hostname, resolveDns);
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'SSRF_BLOCKED';
      return {
        originalUrl: rawUrl,
        finalUrl: currentUrl,
        hops,
        blockedReason: reason,
        unresolved: true,
      };
    }

    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      return {
        originalUrl: rawUrl,
        finalUrl: currentUrl,
        hops,
        blockedReason: 'TIMEOUT',
        unresolved: true,
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), remaining);

    try {
      let res = await fetchFn(parsed.href, {
        method: 'HEAD',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': 'NijamaMosamaLinkChecker/1.0',
          Accept: '*/*',
        },
      });

      // Fallback to 1KB ranged GET if server rejects HEAD (405/501)
      if (res.status === 405 || res.status === 501) {
        res = await fetchFn(parsed.href, {
          method: 'GET',
          redirect: 'manual',
          signal: controller.signal,
          headers: {
            'User-Agent': 'NijamaMosamaLinkChecker/1.0',
            Range: 'bytes=0-1023',
            Accept: '*/*',
          },
        });
        // Cancel body immediately without reading >1KB
        if (res.body && typeof res.body.cancel === 'function') {
          await res.body.cancel().catch(() => {});
        }
      }

      clearTimeout(timer);

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location');
        if (!location) {
          return {
            originalUrl: rawUrl,
            finalUrl: parsed.href,
            hops,
            statusCode: res.status,
            unresolved: true,
          };
        }
        if (hops >= maxRedirects) {
          return {
            originalUrl: rawUrl,
            finalUrl: parsed.href,
            hops,
            blockedReason: 'MAX_REDIRECTS',
            unresolved: true,
          };
        }
        currentUrl = new URL(location, parsed.href).href;
        hops++;
        continue;
      }

      const contentType = res.headers.get('content-type') ?? undefined;
      const attachmentFilename = parseAttachmentFilename(
        res.headers.get('content-disposition'),
      );

      return {
        originalUrl: rawUrl,
        finalUrl: parsed.href,
        hops,
        statusCode: res.status,
        contentType,
        attachmentFilename,
        unresolved: false,
      };
    } catch (err) {
      clearTimeout(timer);
      const isAbort = err instanceof Error && err.name === 'AbortError';
      return {
        originalUrl: rawUrl,
        finalUrl: currentUrl,
        hops,
        blockedReason: isAbort ? 'TIMEOUT' : 'FETCH_ERROR',
        unresolved: true,
      };
    }
  }

  return {
    originalUrl: rawUrl,
    finalUrl: currentUrl,
    hops,
    blockedReason: 'MAX_REDIRECTS',
    unresolved: true,
  };
}
