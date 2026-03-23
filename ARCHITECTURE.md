# Architecture & System Design

## Overview

This document describes the architecture of the Post Generator application, including the backend synchronization pattern, database design, and API layer.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  App.tsx ──────────────────────┬──────────────────────────────  │
│    ├── PostsList              │                               │
│    ├── Magazine Cover         │                               │
│    ├── Red Pill Generator     │                               │
│    └── MisyFaTsy Studio       │                               │
│                               │                               │
│  UI Components:               │   API Service Layer           │
│  ├── PostCard                 │   ├── postService.ts          │
│  ├── PostForm                 │   │   ├── createPost()        │
│  ├── SearchBar                │   │   ├── getAllPosts()       │
│  └── PostsList                │   │   ├── updatePost()        │
│                               │   │   ├── deletePost()        │
│                               │   │   └── subscribeToChanges()│
│                               │                               │
└───────────────────────────────┼───────────────────────────────┘
                                │
                 ┌──────────────┴───────────────┐
                 │  Supabase Client Library    │
                 │  (@supabase/supabase-js)    │
                 └──────────────┬───────────────┘
                                │
                 ┌──────────────┴────────────────┐
         ┌───────┴─────────┐           ┌────────┴────────┐
         │                 │           │                 │
    ┌────▼──────┐   ┌─────▼─────┐  ┌──▼──────┐    ┌────▼────┐
    │ PostgreSQL│   │    Auth   │  │  Realtime│   │   S3    │
    │ Database  │   │ Management│  │  Updates │   │ Storage │
    └───────────┘   └───────────┘  └──────────┘   └─────────┘
         │
    ┌────▼──────────────────────┐
    │   Tables & Security       │
    ├───────────────────────────┤
    │ ○ posts (with RLS)        │
    │ ○ auth.users              │
    │ ○ Indexes for performance │
    └───────────────────────────┘
```

## Data Flow

### Create Operation

```
User Input (PostForm)
    ↓
Validation
    ↓
postService.createPost()
    ↓
supabase.from('posts').insert()
    ↓
Database: INSERT post
    ↓
Return new post with ID
    ↓
Update UI (PostsList)
    ↓
Display in grid
```

### Read Operation

```
Component Mount (PostsList)
    ↓
loadPosts()
    ↓
postService.getAllPosts(filters)
    ↓
supabase.from('posts').select()
    ↓
Apply filters (search, category, status)
    ↓
Order by created_at
    ↓
Apply pagination
    ↓
Return posts array
    ↓
Update state
    ↓
Render cards
```

### Update Operation

```
Edit Button Click
    ↓
PostForm Modal Opens
    ↓
User Modifies Data
    ↓
Submit Form
    ↓
postService.updatePost(id, updates)
    ↓
supabase.from('posts').update()
    ↓
Database: UPDATE post
    ↓
Return updated post
    ↓
Update local state
    ↓
Close modal
    ↓
Refresh list
```

### Delete Operation

```
Delete Button Click
    ↓
Confirmation Dialog
    ↓
User Confirms
    ↓
postService.deletePost(id)
    ↓
supabase.from('posts').delete()
    ↓
Database: DELETE post
    ↓
Return success
    ↓
Remove from local state
    ↓
Update grid display
```

## API Service Layer (`lib/postService.ts`)

The service layer abstracts all database operations and provides:

### Abstraction from Supabase API

```
postService.ts (abstraction)
    ├── Input validation
    ├── Error handling
    ├── Type conversion
    └── Pagination logic
            ↓
        Supabase Client
            ↑
        (Low-level API)
```

### Error Handling Strategy

```
Database Error
    ↓
Catch in postService
    ↓
Format error message
    ↓
Log to console
    ↓
Throw formatted error
    ↓
Component catches (try-catch)
    ↓
Display to user in UI
```

## Component Synchronization Pattern

### PostsList Component State Management

```typescript
State:
├── posts: Post[]           // Raw data from DB
├── filteredPosts: Post[]   // Filtered/searched data
├── searchQuery: string     // Current search term
├── selectedCategory: string// Current filter
├── isLoading: boolean      // Loading state
└── error: string | null    // Error message

Side Effects:
├── useEffect([])           // Initial load
├── useEffect([searchQuery, selectedCategory])
│   └── Reload posts when filters change
└── Various event handlers
    ├── handleSearch()      // Update on search
    ├── handleCreatePost()  // Add to list
    ├── handleUpdatePost()  // Update in list
    └── handleDeletePost()  // Remove from list
```

### Real-time Synchronization

The `subscribeToPostChanges()` function enables real-time updates:

```typescript
// When any user modifies posts in database
supabase
  .channel("posts:changes")
  .on(
    "postgres_changes",
    {
      event: "*", // any INSERT/UPDATE/DELETE
      schema: "public",
      table: "posts",
    },
    () => {
      // Fetch fresh data
      getAllPosts().then(callback);
      // Update UI automatically
    },
  )
  .subscribe();
```

## Database Design

### Posts Table Structure

```sql
posts (
  id UUID PRIMARY KEY,        -- Unique identifier
  title TEXT,                 -- Post title (required)
  content TEXT,               -- Post body (required)
  author_name TEXT,           -- Creator's name
  category TEXT,              -- Classification
  image_url TEXT,             -- Cover/preview image
  status TEXT,                -- draft|published|archived
  created_at TIMESTAMP,       -- Creation time
  updated_at TIMESTAMP,       -- Last modification
  user_id UUID,               -- Owner reference

  INDEXES:
  - created_at (DESC)  -- Fast sorting
  - category           -- Fast filtering
  - status             -- Fast filtering
  - user_id            -- Owner lookups
)
```

### Security with Row Level Security (RLS)

```
Query from user (unauthenticated):
    ├── SELECT * FROM posts
    ├── RLS Policy Check: status = 'published'
    └── Returns: Published posts only

Query from authenticated user:
    ├── SELECT * FROM posts
    ├── RLS Policy Check: status = 'published' OR user.id = user_id
    └── Returns: Published posts + own posts

INSERT/UPDATE/DELETE:
    ├── RLS Policy Check: auth.uid() = user_id
    └── Returns: Only if owner
```

## Error Handling Architecture

### Error Boundary

The `ErrorBoundary` component catches React rendering errors:

```
Component Error
    ↓
ErrorBoundary.componentDidCatch()
    ↓
Parse error (handle Firestore JSON errors)
    ↓
Display error UI
    ↓
Show error details
    ↓
Offer reload button
```

### API Error Handling

```typescript
try {
  const result = await postService.createPost(data);
} catch (error) {
  // In PostForm component
  if (error instanceof Error) {
    setError(error.message);
  }
  // Display error message to user
}
```

### Validation Layers

```
Frontend Validation (PostForm)
    ├── Required fields check
    ├── URL validation for images
    └── Form state validation
         ↓
API Service Validation (postService)
    ├── Type checking
    ├── Data formatting
    └── Pagination validation
         ↓
Database Constraints
    ├── NOT NULL constraints
    ├── CHECK constraints
    └── Foreign key constraints
```

## Performance Optimization

### Search Implementation

- Debounced input (300ms default)
- Server-side search using `ilike` operator
- Search across title and content fields

```typescript
// Client-side debouncing
useEffect(() => {
  const timeout = setTimeout(() => {
    onSearch(query);
  }, 300);
  return () => clearTimeout(timeout);
}, [query]);

// Server-side search
query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
```

### Pagination Strategy

```
Default: 20 items per page

getAllPosts({ limit: 20, offset: 0 })
    ↓
.range(0, 19)
    ↓
Returns: 20 newest posts
```

### Indexes for Fast Queries

```
SELECT * FROM posts WHERE status = 'published'
    Order by: created_at DESC
    └── Uses: posts_created_at_idx or posts_status_idx
```

## Environment & Configuration

### Supabase Configuration Flow

```
.env.local
    ├── VITE_SUPABASE_URL
    └── VITE_SUPABASE_ANON_KEY
         ↓
src/supabase.ts
    ├── createClient(url, key)
    └── Export client instance
         ↓
postService.ts
    └── Import and use client
         ↓
Components
    └── Import and use service
```

## Scalability Considerations

### Current Limitations & Solutions

1. **Large Datasets**
   - Current: Load all posts
   - Solution: Implement pagination on frontend

2. **Real-time Sync**
   - Current: Polling on filter change
   - Solution: Use Supabase subscriptions

3. **Search Performance**
   - Current: Server-side search
   - Solution: Add full-text-search indexes

4. **Image Storage**
   - Current: External URLs
   - Solution: Use Supabase Storage buckets

## Security Model

### Authentication Flow

```
User Login (Google OAuth)
    ↓
Firebase Auth Sets Session
    ↓
App Checks auth.currentUser
    ↓
Requests are sent with auth context
    ↓
Supabase RLS Policies Check Auth
    ↓
Return data based on permissions
```

### Authorization Rules

```
Create Post:
    ├── auth.uid() must exist
    ├── user_id = auth.uid()
    └── User can create

Update Post:
    ├── user_id = auth.uid()
    └── Only owner can update

Delete Post:
    ├── user_id = auth.uid()
    └── Only owner can delete

Read Post:
    ├── status = 'published' (anyone)
    ├── user_id = auth.uid() (own posts)
    └── Public or own posts visible
```

## Testing Considerations

### Unit Tests

- postService functions with mock Supabase
- Component rendering with test data
- Error boundary functionality

### Integration Tests

- Real Supabase connection (test database)
- CRUD operation workflows
- Search and filter functionality

### E2E Tests

- Full user workflows
- Authentication flows
- Real data persistence

## Future Enhancements

1. **Advanced Features**
   - Post scheduling
   - Comments/discussion threads
   - Post ratings/likes
   - User profiles

2. **Performance**
   - Image optimization/CDN
   - Infinite scroll pagination
   - Client-side caching (React Query)

3. **Security**
   - Enhanced RLS policies
   - Audit logging
   - Rate limiting

4. **Analytics**
   - Post view tracking
   - User engagement metrics
   - Popular content ranking
