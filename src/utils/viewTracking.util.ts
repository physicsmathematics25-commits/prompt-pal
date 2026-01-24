import { Request } from 'express';

interface ViewRecord {
  ip: string;
  timestamp: number;
}

// In-memory cache for view tracking (could be moved to Redis in production)
const viewCache = new Map<string, ViewRecord[]>();

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now();
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  for (const [key, records] of viewCache.entries()) {
    const validRecords = records.filter(
      (record) => now - record.timestamp < CACHE_DURATION,
    );
    if (validRecords.length > 0) {
      viewCache.set(key, validRecords);
    } else {
      viewCache.delete(key);
    }
  }
}, 60 * 60 * 1000); // Clean every hour

/**
 * Check if a view should be counted based on IP throttling
 * Returns true if the view should be counted
 */
export function shouldCountView(
  contentId: string,
  req: Request,
  throttleMinutes: number = 5,
): boolean {
  const ip = getClientIp(req);
  const cacheKey = `${contentId}:${ip}`;

  const now = Date.now();
  const throttleMs = throttleMinutes * 60 * 1000;

  const records = viewCache.get(cacheKey) || [];

  // Check if there's a recent view from this IP
  const recentView = records.find((record) => now - record.timestamp < throttleMs);

  if (recentView) {
    // View already counted recently, don't count again
    return false;
  }

  // Add new view record
  const newRecord: ViewRecord = {
    ip,
    timestamp: now,
  };

  records.push(newRecord);
  viewCache.set(cacheKey, records);

  return true;
}

/**
 * Extract client IP from request
 * Handles proxies and load balancers
 */
export function getClientIp(req: Request): string {
  // Check for X-Forwarded-For header (proxy/load balancer)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor.split(',')[0];
    return ips.trim();
  }

  // Check for X-Real-IP header
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Fall back to socket address
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Get view statistics for debugging/admin purposes
 */
export function getViewCacheStats() {
  let totalRecords = 0;
  for (const records of viewCache.values()) {
    totalRecords += records.length;
  }

  return {
    uniqueContentIps: viewCache.size,
    totalRecords,
    cacheSize: viewCache.size,
  };
}

/**
 * Clear view cache (for testing or manual reset)
 */
export function clearViewCache() {
  viewCache.clear();
}

