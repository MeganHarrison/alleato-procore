# Auto-Updating Sitemap System

Your sitemap is now **fully automated** and always up-to-date! No more hardcoded route lists.

## 🎯 How It Works

The sitemap system automatically scans your `src/app` directory at build time to discover all page files. When you add or remove pages, the sitemap updates automatically.

## 📁 Files

### Core Utilities
- **`src/lib/auto-sitemap-utils.ts`** - Auto-discovery logic that scans the file system
  - `getAllRoutes()` - Gets all discovered routes
  - `getRoutesByCategory()` - Groups routes by category
  - `getStaticRoutes()` - Gets only static routes (no dynamic segments)
  - `getDynamicRoutes()` - Gets only dynamic routes (with [id], etc.)
  - `getRouteStats()` - Statistics about your routes

### Pages
- **`src/app/sitemap.ts`** - XML sitemap for search engines (`/sitemap.xml`)
- **`src/app/sitemap-list/page.tsx`** - Human-readable sitemap page (`/sitemap-list`)
- **`src/app/sitemap-list/sitemap-list-client.tsx`** - Client component with search

## 🚀 Features

### Automatic Discovery
- ✅ Scans `src/app` directory recursively
- ✅ Finds all `page.tsx`, `page.ts`, `page.jsx`, `page.js` files
- ✅ Handles route groups: `(tables)`, `(forms)`, `(chat)`
- ✅ Detects dynamic routes: `[id]`, `[projectId]`, `[table]`
- ✅ Categorizes routes automatically

### Sitemap List Page (`/sitemap-list`)
- 🔍 Search functionality
- 📊 Statistics dashboard (total routes, static vs dynamic)
- 📁 Grouped by category
- 🏷️ Shows dynamic route parameters
- 🔗 Clickable links to all pages
- 📱 Responsive grid layout

### XML Sitemap (`/sitemap.xml`)
- 🤖 SEO-friendly for search engines
- ⚡ Includes only static routes (excludes dynamic [id] routes)
- 📅 Uses file modification dates
- 🔄 Updates automatically on build

## 📝 Usage

### View All Routes
Simply visit:
```
http://localhost:3000/sitemap-list
```

### XML Sitemap for SEO
```
http://localhost:3000/sitemap.xml
```

### Use in Code
```typescript
import {
  getAllRoutes,
  getRoutesByCategory,
  getStaticRoutes,
  searchRoutes
} from '@/lib/auto-sitemap-utils'

// Get all routes
const routes = getAllRoutes()

// Get routes by category
const categorized = getRoutesByCategory()

// Search routes
const results = searchRoutes('dashboard')

// Get statistics
const stats = getRouteStats()
```

## 🏷️ Route Categories

Routes are automatically categorized based on their path:

- **Main** - `/`, `/dashboard`, `/welcome`
- **Tables** - Routes in `(tables)` group or `/table` paths
- **Forms** - Routes in `(forms)` group or `/form` paths
- **Financial** - `/budget`, `/invoice`, `/contract`, etc.
- **Project Pages** - Routes with `[projectId]` parameter
- **Authentication** - `/auth/*` routes
- **Admin** - `/admin/*` routes
- **Developer Tools** - `/dev/*` routes
- **Other** - Everything else

## 🎨 Route Types

### Static Routes
Regular pages like:
- `/dashboard`
- `/projects`
- `/auth/login`

### Dynamic Routes
Pages with parameters like:
- `/projects/[id]` - Parameter: `id`
- `/admin/tables/[table]` - Parameter: `table`
- `/[projectId]/budget` - Parameter: `projectId`

## 🔧 Customization

### Change Categorization Logic
Edit the `categorizeRoute()` function in `src/lib/auto-sitemap-utils.ts`:

```typescript
function categorizeRoute(route: string, filePath: string): string {
  if (route.startsWith('/my-custom-path')) return 'My Category'
  // ... add your logic
}
```

### Change Title Generation
Edit the `routeToTitle()` function:

```typescript
function routeToTitle(route: string): string {
  // Your custom title logic
  return 'Custom Title'
}
```

### Exclude Routes
The scanner automatically skips:
- `/api` routes
- `node_modules`
- Hidden directories (starting with `.`)

To exclude more, edit `scanDirectory()` in `auto-sitemap-utils.ts`.

## 📊 Statistics

The sitemap tracks:
- Total number of routes
- Static routes count
- Dynamic routes count
- Number of categories
- Routes per category

View stats on the `/sitemap-list` page by clicking "Show Stats".

## 🆚 Old vs New System

### ❌ Old System (Manual)
```typescript
// Had to manually list every route
const URLS = [
  'http://localhost:3000/',
  'http://localhost:3000/dashboard',
  'http://localhost:3000/projects',
  // ... hardcoded list that gets outdated
]
```

### ✅ New System (Automatic)
```typescript
// Automatically discovers all routes
const routes = getAllRoutes()
// Always up-to-date!
```

## 🚀 Benefits

1. **Always Current** - Add/remove pages, sitemap updates automatically
2. **No Maintenance** - No manual route lists to maintain
3. **Comprehensive** - Never miss a route
4. **Type-Safe** - Full TypeScript support
5. **Fast** - Scans at build time, cached for runtime
6. **Searchable** - Find routes easily with search
7. **Categorized** - Routes organized logically
8. **SEO-Friendly** - Proper XML sitemap for search engines

## 🐛 Troubleshooting

### Routes Not Showing Up
- Check the file is named `page.tsx` (not `Page.tsx`)
- Ensure it's in the `src/app` directory
- Check it's not in `/api` directory (API routes are excluded)

### Wrong Category
- Edit `categorizeRoute()` in `auto-sitemap-utils.ts`

### Missing Dynamic Route
- Dynamic routes show on `/sitemap-list` but not in `/sitemap.xml` (by design - XML sitemaps should only include static URLs)

---

**Old hardcoded sitemap files can now be safely removed:**
- ❌ `src/lib/sitemap-utils.ts` (old manual version)
- ✅ `src/lib/auto-sitemap-utils.ts` (new auto version)
