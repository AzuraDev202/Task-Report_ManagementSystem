import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Cache control headers
export function cacheHeaders(maxAge: number = 60) {
  return {
    'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`,
  };
}

// No cache headers
export function noCacheHeaders() {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };
}

// Compression helpers
export function shouldCompress(contentType: string): boolean {
  const compressibleTypes = [
    'text/',
    'application/json',
    'application/javascript',
    'application/xml',
  ];
  
  return compressibleTypes.some(type => contentType.includes(type));
}

// Rate limiting helper
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true, remaining: limit - 1 };
  }
  
  if (record.count >= limit) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: limit - record.count };
}

// Response helpers with caching
export function jsonResponse(
  data: any,
  options: {
    status?: number;
    cache?: boolean;
    maxAge?: number;
  } = {}
): NextResponse {
  const { status = 200, cache = false, maxAge = 60 } = options;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(cache ? cacheHeaders(maxAge) : noCacheHeaders()),
  };
  
  return NextResponse.json(data, { status, headers });
}

// Error response helper
export function errorResponse(
  message: string,
  status: number = 500
): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { 
      status,
      headers: noCacheHeaders()
    }
  );
}

// Pagination helper
export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function getPaginationParams(request: NextRequest): PaginationParams {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
}

// Batch operations helper
export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 10
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  
  return results;
}

// Request deduplication
const pendingRequests = new Map<string, Promise<any>>();

export async function deduplicate<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }
  
  const promise = fn().finally(() => {
    pendingRequests.delete(key);
  });
  
  pendingRequests.set(key, promise);
  return promise;
}
