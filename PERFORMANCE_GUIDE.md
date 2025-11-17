# Performance Utilities Usage Guide

This guide provides practical examples for using the performance optimization utilities in your code.

## Table of Contents
1. [Debounce & Throttle](#debounce--throttle)
2. [Caching](#caching)
3. [Image Optimization](#image-optimization)
4. [API Helpers](#api-helpers)
5. [Database Optimization](#database-optimization)
6. [React Optimization](#react-optimization)

---

## Debounce & Throttle

### Debounce - Use for Search Inputs
```typescript
import { debounce } from '@/lib/utils/performance';

// In your component
const [searchQuery, setSearchQuery] = useState('');
const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

const handleSearchChange = useCallback((value: string) => {
  if (searchDebounceRef.current) {
    clearTimeout(searchDebounceRef.current);
  }
  
  searchDebounceRef.current = setTimeout(() => {
    setSearchQuery(value);
  }, 300); // Wait 300ms after user stops typing
}, []);

// In JSX
<input
  type="text"
  onChange={(e) => handleSearchChange(e.target.value)}
  placeholder="Search..."
/>
```

### Throttle - Use for Scroll Events
```typescript
import { throttle } from '@/lib/utils/performance';

// In your component
useEffect(() => {
  const handleScroll = throttle(() => {
    console.log('Scroll position:', window.scrollY);
    // Your scroll logic here
  }, 200); // Execute at most once per 200ms

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

---

## Caching

### Client-Side Cache with TTL
```typescript
import { CacheManager } from '@/lib/utils/performance';

// Create cache with 60-second TTL
const conversationsCache = new CacheManager<Conversation[]>(60000);

async function fetchConversations() {
  // Check cache first
  const cached = conversationsCache.get('conversations');
  if (cached) {
    console.log('Cache hit!');
    return cached;
  }

  // Fetch from API
  const response = await fetch('/api/conversations');
  const data = await response.json();

  // Store in cache
  conversationsCache.set('conversations', data);
  
  return data;
}
```

### useRef Cache (React Hook Pattern)
```typescript
// In your component
const cacheRef = useRef<{ data: T[]; timestamp: number } | null>(null);

const getCachedData = useCallback(() => {
  const cache = cacheRef.current;
  if (cache && Date.now() - cache.timestamp < 30000) {
    return cache.data;
  }
  return null;
}, []);

const setCachedData = useCallback((data: T[]) => {
  cacheRef.current = {
    data,
    timestamp: Date.now()
  };
}, []);

// Usage
const cached = getCachedData();
if (cached) {
  setData(cached);
} else {
  const fresh = await fetchData();
  setCachedData(fresh);
  setData(fresh);
}
```

---

## Image Optimization

### Optimize Before Upload
```typescript
import { optimizeImage, formatFileSize } from '@/lib/utils/performance';

async function handleImageUpload(file: File) {
  try {
    // Check original size
    console.log('Original size:', formatFileSize(file.size));

    // Optimize image (resize to 1920px max, 80% quality)
    const optimized = await optimizeImage(file, 1920, 1920, 0.8);
    
    console.log('Optimized size:', formatFileSize(optimized.size));
    console.log('Reduction:', ((1 - optimized.size / file.size) * 100).toFixed(1) + '%');

    // Create File from Blob
    const optimizedFile = new File([optimized], file.name, {
      type: 'image/jpeg',
    });

    // Upload optimized file
    const formData = new FormData();
    formData.append('image', optimizedFile);
    
    await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
  } catch (error) {
    console.error('Image optimization failed:', error);
    // Fallback: upload original
  }
}
```

### Lazy Loading Images
```typescript
// Method 1: Native lazy loading (recommended)
<img
  src="/path/to/image.jpg"
  alt="Description"
  loading="lazy"
  width={300}
  height={200}
/>

// Method 2: With utility function
import { setupImageLazyLoading } from '@/lib/utils/performance';

useEffect(() => {
  setupImageLazyLoading();
}, []);

// Then use data-src attribute
<img
  data-src="/path/to/image.jpg"
  alt="Description"
  className="lazy-load"
/>
```

---

## API Helpers

### Response with Caching
```typescript
import { jsonResponse, errorResponse, cacheHeaders } from '@/lib/utils/apiHelpers';

export async function GET(request: NextRequest) {
  try {
    const data = await fetchDataFromDB();

    // Cache for 60 seconds
    return jsonResponse(data, {
      status: 200,
      cache: true,
      maxAge: 60,
    });
  } catch (error) {
    return errorResponse('Failed to fetch data', 500);
  }
}
```

### Rate Limiting
```typescript
import { rateLimit } from '@/lib/utils/apiHelpers';

export async function POST(request: NextRequest) {
  const ip = request.ip || 'unknown';
  
  // 100 requests per minute
  const { allowed, remaining } = rateLimit(ip, 100, 60000);
  
  if (!allowed) {
    return errorResponse('Too many requests. Please try again later.', 429);
  }

  // Add rate limit headers
  const response = await processRequest(request);
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  
  return response;
}
```

### Batch Processing
```typescript
import { batchProcess } from '@/lib/utils/apiHelpers';

// Process 1000 items in batches of 100
const results = await batchProcess(
  items,
  async (item) => {
    return await processItem(item);
  },
  100 // batch size
);
```

### Request Deduplication
```typescript
import { deduplicate } from '@/lib/utils/apiHelpers';

// Multiple calls with same key will only execute once
const data1 = deduplicate('user-profile-123', () => fetchUserProfile('123'));
const data2 = deduplicate('user-profile-123', () => fetchUserProfile('123'));
// Only one actual fetch occurs, both get same result
```

---

## Database Optimization

### Connection Pool Setup
```typescript
// Replace in your API routes
import { connectWithPool } from '@/lib/mongodbOptimized';

// Instead of:
// await connectDB();

// Use:
await connectWithPool();
```

### Query Builder
```typescript
import { QueryBuilder } from '@/lib/mongodbOptimized';
import User from '@/lib/models/User';

// Build complex query with fluent API
const users = await new QueryBuilder(User.find({ isActive: true }))
  .paginate(1, 20)                    // Page 1, 20 items per page
  .selectFields(['name', 'email'])    // Only select needed fields
  .sortBy('-createdAt')               // Sort by newest first
  .execute();

console.log('Total pages:', users.totalPages);
console.log('Users:', users.data);
```

### Lean Queries (2-3x Faster)
```typescript
import { leanQuery } from '@/lib/mongodbOptimized';
import Message from '@/lib/models/Message';

// Instead of:
// const messages = await Message.find({ userId }).exec();

// Use lean query (returns plain JS objects)
const messages = await leanQuery(
  Message.find({ userId })
).exec();

// 2-3x faster, but no mongoose methods
// Use when: You only need data for display, not manipulation
```

### Batch Insert
```typescript
import { batchInsert } from '@/lib/mongodbOptimized';
import Message from '@/lib/models/Message';

// Insert 10,000 messages in batches of 1,000
await batchInsert(Message, largeArrayOfMessages, 1000);
```

### Performance Monitoring
```typescript
import { queryWithStats } from '@/lib/mongodbOptimized';

const users = await queryWithStats('fetch-active-users', async () => {
  return await User.find({ isActive: true }).exec();
});

// Logs: Query 'fetch-active-users' completed in 45ms
// Warns if > 1000ms: ⚠️ Slow query detected
```

---

## React Optimization

### Component Memoization
```typescript
import React, { memo, useMemo, useCallback } from 'react';

interface UserCardProps {
  user: User;
  onSelect: (id: string) => void;
}

// Wrap component with memo to prevent unnecessary re-renders
const UserCard = memo<UserCardProps>(({ user, onSelect }) => {
  // Memoize expensive computation
  const initials = useMemo(() => {
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
  }, [user.name]);

  // Memoize callback to prevent child re-renders
  const handleClick = useCallback(() => {
    onSelect(user.id);
  }, [user.id, onSelect]);

  return (
    <div onClick={handleClick}>
      <div className="avatar">{initials}</div>
      <p>{user.name}</p>
    </div>
  );
});

// Set display name for debugging
UserCard.displayName = 'UserCard';

export default UserCard;
```

### List Memoization
```typescript
// Memoize filtered/sorted lists
const filteredUsers = useMemo(() => {
  return users
    .filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));
}, [users, searchQuery]);

// Memoize grouped data
const usersByDepartment = useMemo(() => {
  return users.reduce((acc, user) => {
    const dept = user.department || 'Uncategorized';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(user);
    return acc;
  }, {} as Record<string, User[]>);
}, [users]);
```

### Event Handler Memoization
```typescript
// Wrap all event handlers with useCallback
const handleSubmit = useCallback(async (e: FormEvent) => {
  e.preventDefault();
  await submitForm(formData);
}, [formData]);

const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
  setFormData(prev => ({
    ...prev,
    [e.target.name]: e.target.value,
  }));
}, []);

const handleFileSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
  if (e.target.files) {
    setFiles(Array.from(e.target.files));
  }
}, []);
```

### Dynamic Imports (Code Splitting)
```typescript
import dynamic from 'next/dynamic';

// Lazy load heavy component
const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
  ssr: false,
  loading: () => <div className="p-4 text-center">Loading...</div>
});

// Use in component
{showEmojiPicker && <EmojiPicker onEmojiClick={handleEmojiClick} />}
```

### Virtual Scrolling (Large Lists)
```typescript
import { calculateVisibleRange } from '@/lib/utils/performance';

const [scrollTop, setScrollTop] = useState(0);
const containerHeight = 600; // px
const itemHeight = 80; // px per item

const { start, end } = calculateVisibleRange(
  scrollTop,
  containerHeight,
  itemHeight,
  messages.length,
  3 // overscan (render 3 extra items above/below)
);

const visibleMessages = messages.slice(start, end);

return (
  <div
    className="message-container"
    style={{ height: containerHeight }}
    onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
  >
    <div style={{ height: messages.length * itemHeight }}>
      <div style={{ transform: `translateY(${start * itemHeight}px)` }}>
        {visibleMessages.map(msg => (
          <MessageItem key={msg.id} message={msg} />
        ))}
      </div>
    </div>
  </div>
);
```

---

## Best Practices Summary

### When to Use Each Technique

**Debounce**: 
- Search inputs (300-500ms)
- Form validation (500ms)
- Auto-save features (1000-2000ms)

**Throttle**:
- Scroll events (100-200ms)
- Window resize (200ms)
- Mouse move tracking (50-100ms)

**Caching**:
- Static content (long TTL: 1 hour+)
- User profiles (medium TTL: 5-10 minutes)
- Real-time data (short TTL: 10-30 seconds)

**React.memo**:
- Components that render often with same props
- List items in large lists
- Child components that receive callbacks

**useMemo**:
- Expensive computations (sorting, filtering large arrays)
- Complex object/array creation
- Derived state calculations

**useCallback**:
- Event handlers passed to child components
- Functions used as dependencies in other hooks
- Functions passed to memoized components

**Lean Queries**:
- Read-only operations
- Large result sets
- Display data (no manipulation needed)

**Connection Pooling**:
- All production applications
- High-traffic routes
- Concurrent request handling

---

## Performance Checklist

Before deploying, verify:

- [ ] All search inputs debounced (300ms+)
- [ ] Large lists use virtual scrolling (>100 items)
- [ ] Images lazy loaded with `loading="lazy"`
- [ ] Heavy components dynamically imported
- [ ] API responses cached appropriately
- [ ] Database queries use lean() when possible
- [ ] Connection pooling configured
- [ ] Event handlers wrapped with useCallback
- [ ] Expensive computations wrapped with useMemo
- [ ] List components wrapped with React.memo

---

**Version**: 1.0  
**Last Updated**: December 2024  
**For Questions**: Check PERFORMANCE_OPTIMIZATION.md
