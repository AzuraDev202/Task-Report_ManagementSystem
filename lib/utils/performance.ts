// Debounce utility for search and typing
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// Throttle utility for scroll events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Cache manager for API responses
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

class CacheManager {
  private cache: Map<string, CacheItem<any>> = new Map();
  private defaultTTL = 30000; // 30 seconds

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now() + ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.timestamp) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.timestamp) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}

export const apiCache = new CacheManager();

// Image lazy loading utility
export function setupImageLazyLoading(): void {
  if ('loading' in HTMLImageElement.prototype) {
    // Native lazy loading supported
    return;
  }

  // Fallback for browsers that don't support native lazy loading
  const images = document.querySelectorAll('img[loading="lazy"]');
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        img.src = img.dataset.src || '';
        imageObserver.unobserve(img);
      }
    });
  });

  images.forEach(img => imageObserver.observe(img));
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Optimize image before upload
export async function optimizeImage(file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Resize if needed
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Could not optimize image'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Could not load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

// Virtual scrolling helper
export function calculateVisibleRange(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan: number = 3
): { start: number; end: number } {
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleItems = Math.ceil(containerHeight / itemHeight);
  const end = Math.min(totalItems, start + visibleItems + overscan * 2);
  
  return { start, end };
}

// Memoization helper for expensive computations
export function memoizeOne<T extends (...args: any[]) => any>(fn: T): T {
  let lastArgs: any[] | null = null;
  let lastResult: ReturnType<T> | null = null;
  
  return ((...args: Parameters<T>) => {
    if (
      lastArgs &&
      args.length === lastArgs.length &&
      args.every((arg, i) => arg === lastArgs![i])
    ) {
      return lastResult;
    }
    
    lastArgs = args;
    lastResult = fn(...args);
    return lastResult;
  }) as T;
}
