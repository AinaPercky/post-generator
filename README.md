<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Post Generator & Magazine Studio

A full-stack web application for creating, managing, and sharing posts and magazine covers with AI-generated images. Built with React, TypeScript, Vite, Tailwind CSS, and Supabase.

## ✨ Features

### 📝 Post Management (NEW - Supabase Backend)

- **Create** new posts with title, content, images, and categories
- **Read** posts with advanced search and filtering capabilities
- **Update** existing posts with real-time synchronization
- **Delete** posts with confirmation dialogs
- Full CRUD operations with Supabase backend

### 🎨 UI/UX Components (NEW)

- **PostCard**: Beautiful cards displaying post information with metadata
- **PostForm**: Modal-based form for creating and editing posts
- **SearchBar**: Real-time search with debouncing
- **PostsList**: Grid layout with sorting and filtering capabilities
- Category filtering with predefined categories
- Status badges (Draft, Published, Archived)
- Edit/Delete action buttons on each post

### 📰 Magazine Cover Generator

- AI-powered cover generation using Google Gemini
- Custom issue numbering
- Background scene descriptions
- Image upload capability
- PNG and JPEG download options
- Save to library functionality

### 🎭 Additional Generators

- **Red Pill Generator**: Create impactful visual content
- **MisyFaTsy Studio**: Dedicated creation tool

### 🔐 Authentication

- Google Sign-In integration
- User-specific data management
- Session persistence

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account (free tier available)
- Google Gemini API key

### Installation

1. **Clone and Install**

   ```bash
   npm install
   ```

2. **Configure Supabase**
   - Create a Supabase account at https://supabase.com
   - Create a new project
   - Follow the setup guide: [SETUP_SUPABASE.md](./SETUP_SUPABASE.md)

3. **Set Environment Variables**

   Create `.env.local` in the project root:

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   GEMINI_API_KEY=your-gemini-api-key-here
   ```

4. **Run Development Server**

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

## 📂 Project Structure

```
src/
├── App.tsx                      # Main application component
├── firebase.ts                  # Firebase configuration (legacy)
├── supabase.ts                  # Supabase client initialization
├── types.ts                     # TypeScript interfaces
├── lib/
│   ├── postService.ts          # CRUD API service for posts
│   └── utils.ts                # Utility functions
├── components/
│   ├── CoverPreview.tsx        # Magazine cover preview
│   ├── MagazineLibrary.tsx     # Magazine covers library
│   ├── RedPillGenerator.tsx    # Red pill content generator
│   ├── MisyFaTsyGenerator.tsx  # MisyFaTsy generator
│   ├── ErrorBoundary.tsx       # Error boundary component
│   ├── PostCard.tsx            # Post display card (NEW)
│   ├── PostForm.tsx            # Post create/edit form (NEW)
│   ├── PostsList.tsx           # Posts list with filters (NEW)
│   └── SearchBar.tsx           # Search component (NEW)
├── index.css                    # Global styles
└── main.tsx                     # React entry point

public/
├── firebase-applet-config.json # Firebase config
└── ...other assets
```

## 🔧 API Reference

### Post Service (`lib/postService.ts`)

#### Create Post

```typescript
import { createPost } from "./lib/postService";

const newPost = await createPost({
  title: "My First Post",
  content: "Post content here...",
  author_name: "John Doe",
  category: "article",
  status: "published",
});
```

#### Get All Posts

```typescript
import { getAllPosts } from "./lib/postService";

const posts = await getAllPosts({
  search: "search term",
  category: "article",
  status: "published",
  limit: 20,
  offset: 0,
});
```

#### Update Post

```typescript
import { updatePost } from "./lib/postService";

await updatePost(postId, {
  title: "Updated Title",
  content: "Updated content...",
});
```

#### Delete Post

```typescript
import { deletePost } from "./lib/postService";

await deletePost(postId);
```

#### Subscribe to Changes

```typescript
import { subscribeToPostChanges } from "./lib/postService";

const subscription = subscribeToPostChanges((posts) => {
  console.log("Posts updated:", posts);
});
```

## 🎨 UI Components

### PostCard

Displays a post with image, title, content preview, metadata, and action buttons.

```typescript
<PostCard
  post={post}
  onEdit={(post) => handleEdit(post)}
  onDelete={(id) => handleDelete(id)}
  onView={(post) => handleView(post)}
/>
```

### PostForm

Modal form for creating or editing posts with validation.

```typescript
<PostForm
  post={selectedPost}
  onSave={(post) => handleSave(post)}
  onCancel={() => setOpen(false)}
  authorName="John Doe"
/>
```

### SearchBar

Real-time search with debouncing.

```typescript
<SearchBar
  onSearch={(query) => handleSearch(query)}
  placeholder="Search posts..."
  debounceMs={300}
/>
```

## 🛡️ Database Schema

### Posts Table

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_name TEXT DEFAULT 'Anonyme',
  category TEXT DEFAULT 'général',
  image_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);
```

Row Level Security (RLS) policies are configured to:

- Allow anyone to read published posts
- Allow authenticated users to create posts
- Allow users to modify only their own posts
- Allow users to delete only their own posts

## 🔑 Environment Variables

| Variable                 | Description                     | Required |
| ------------------------ | ------------------------------- | -------- |
| `VITE_SUPABASE_URL`      | Your Supabase project URL       | ✅       |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous API key | ✅       |
| `GEMINI_API_KEY`         | Google Gemini API key           | ✅       |

## 📦 Available Scripts

- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run TypeScript type checking
- `npm run clean` - Remove build artifacts

## 🎯 Key Features Explained

### CRUD Operations

All operations are synchronized with Supabase backend:

- **Create**: Form validation with required fields
- **Read**: Search, filter by category and status
- **Update**: Edit existing posts with real-time preview
- **Delete**: Confirmation dialog before deletion

### Search & Filtering

- Full-text search across title and content
- Filter by category (General, Article, Tutorial, News, Reflection, Other)
- Filter by status (Draft, Published, Archived)
- Pagination support (20 items per page by default)

### Responsive Design

- Mobile-first approach
- Tailwind CSS utility-first styling
- Responsive grid layouts (1, 2, or 3 columns based on screen size)
- Touch-friendly buttons and controls

### Error Handling

- User-friendly error messages
- Error boundary for crash protection
- Loading states with spinners
- Validation feedback in forms

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The build artifacts will be in the `dist` directory.

### Deploy to Cloud

The app can be deployed to various platforms:

- **Vercel**: Connect your Git repository
- **Netlify**: Connect your Git repository
- **Firebase Hosting**: `firebase deploy`
- **Any static hosting**: Serve files from `dist` directory

## 🔐 Security Considerations

1. **API Keys**: Never commit `.env.local` file
2. **RLS Policies**: Enforce database-level security
3. **Authentication**: Use Google OAuth for user verification
4. **HTTPS**: Always use HTTPS in production
5. **CORS**: Configure Supabase CORS settings appropriately

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Setup Guide](./SETUP_SUPABASE.md)
- [Google Gemini API Docs](https://ai.google.dev/)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🐛 Troubleshooting

### Supabase Connection Issues

- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`
- Check Supabase project status in the dashboard
- Ensure RLS policies are correctly configured

### Image Upload Issues

- Verify the image URL is accessible and valid
- Check that the image CORS settings allow cross-origin requests
- Ensure the image format is supported (JPEG, PNG, WebP, etc.)

### Search Not Working

- Verify the posts table exists in Supabase
- Check that posts have content in `title` and `content` fields
- Ensure RLS policies allow reads for published posts

## 📄 License

This project is part of the Google AI Studio Environment.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

---

**Last Updated**: March 2026
