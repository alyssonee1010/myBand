# 🎸 MyBand - React + Vite Frontend Quick Start

Welcome to the MyBand frontend! This is a React 18 application built with Vite and React Router.

## ✅ What's Included

- **React 18.2.0** - UI framework
- **Vite 5.0.7** - Lightning-fast build tool & dev server
- **React Router 6.20.0** - Client-side routing
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **React Beautiful DnD 13.1.1** - Drag-and-drop for setlists
- **Axios** - HTTP client for API calls
- **TypeScript 5.3** - Type-safe JavaScript

## 🚀 Running the Frontend

### Prerequisites
- Node.js 18+ (verify with `node --version`)
- Backend API running on `http://localhost:3001`
- npm dependencies installed (run `npm install` from project root)

### Start Development Server

```bash
# From project root
npm run dev --workspace=@myband/web

# OR from apps/web directory
cd apps/web
npm run dev
```

The app will start at **http://localhost:3000** 🎉

### Build for Production

```bash
npm run build --workspace=@myband/web
```

## 📁 Project Structure

```
apps/web/
├── src/
│   ├── main.tsx              # React entry point
│   ├── App.tsx               # Router configuration
│   ├── index.css             # Global styles (TailwindCSS)
│   ├── pages/                # Page components
│   │   ├── LandingPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── GroupPage.tsx
│   │   └── SetlistPage.tsx
│   ├── components/           # Reusable components
│   │   ├── GroupList.tsx
│   │   ├── CreateGroupModal.tsx
│   │   ├── ContentList.tsx
│   │   └── UploadContentModal.tsx
│   ├── lib/
│   │   └── api.ts            # Centralized API client
│   └── styles/               # Additional stylesheets
├── vite.config.ts            # Vite configuration
├── tailwind.config.js        # Tailwind configuration
├── postcss.config.js         # PostCSS configuration
├── tsconfig.json             # TypeScript configuration
└── index.html                # HTML entry point
```

## 🎯 Key Features

### Routes
- `/` - Landing page
- `/auth/login` - Login page
- `/auth/register` - Registration page
- `/dashboard` - User's bands list
- `/groups/:groupId` - Group content management
- `/groups/:groupId/setlists/:setlistId` - Setlist viewer with drag-drop

### Components
- **GroupList** - Display bands in a grid
- **CreateGroupModal** - Modal to create new band
- **ContentList** - List of uploaded content (PDFs, images, lyrics, chords)
- **UploadContentModal** - File upload form

### API Integration
All API calls go through `src/lib/api.ts` with automatic JWT token handling:
- Authentication (register, login, get profile)
- Group management (create, view, add members)
- Content management (upload, list, delete)
- Setlist management (create, reorder, manage items)

## 🔌 Environment Variables

Create `.env.local` in `apps/web/`:
```
VITE_API_URL=http://localhost:3001/api
```

## 🎨 Styling

The project uses **Tailwind CSS** with custom utility classes in `index.css`:
- `.btn-primary` - Primary button (blue)
- `.btn-secondary` - Secondary button (gray)
- `.btn-danger` - Danger/delete button (red)
- `.input-field` - Form input styling
- `.card` - Card component styling
- `.container-app` - Content container with max-width

### Responsive Design
- Mobile-first approach using Tailwind's responsive prefixes
- Grid layouts adapt from 1 column (mobile) to 3 columns (desktop)

## 🔄 Development Workflow

### Hot Module Replacement (HMR)
Vite provides instant page reloads when you save files. No manual refresh needed!

### Common Commands
```bash
# Run dev server with auto-reload
npm run dev --workspace=@myband/web

# Build production bundle
npm run build --workspace=@myband/web

# Preview production build locally
npm run preview --workspace=@myband/web

# Lint TypeScript files
npm run lint --workspace=@myband/web
```

## 📝 Adding New Components

1. Create component in `src/components/ComponentName.tsx`
2. Export as default
3. Import and use in pages:
```tsx
import ComponentName from '../components/ComponentName'
```

## 🐛 Debugging

### Redux DevTools
Not currently used, but can be added if needed.

### Browser DevTools
- Use Chrome DevTools (F12) to inspect React components
- React DevTools extension recommended: https://react-devtools-tutorial.vercel.app/

### Network Tab
- Check API calls in Network tab (DevTools)
- Verify requests/responses format

## 🚨 Common Issues

### "Cannot find module" errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

### Port 3000 already in use
The dev server will auto-increment port. Or kill existing process:
```bash
lsof -ti:3000 | xargs kill -9
```

### Backend not responding
- Verify backend is running: `npm run dev --workspace=@myband/api`
- Check backend running on `http://localhost:3001`
- Verify `.env.local` API_URL is correct

## 📚 Learn More

- [Vite Documentation](https://vitejs.dev)
- [React Router Guide](https://reactrouter.com)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [React Beautiful DnD](https://react-beautiful-dnd.netlify.app)

---

Happy coding! 🚀
