# Development Guide

## Architecture Overview

### Backend (Express + TypeScript)

**Layers:**
1. **Routes** (`src/routes/`) - Define API endpoints
2. **Controllers** (`src/controllers/`) - Handle requests, call services
3. **Services** (`src/services/`) - Business logic (future expansion)
4. **Middleware** (`src/middleware/`) - Auth, CORS, error handling
5. **Utils** (`src/utils/`) - Helpers (JWT, crypto, errors)

**Key Flow:**
```
Request → Middleware (auth) → Router → Controller → Service/Prisma → Response
         ↓ (error)
    Error Handler
```

### Frontend (Next.js + React)

**Layers:**
1. **Pages** (`app/`) - Next.js file-based routing
2. **Components** (`components/`) - Reusable UI components
3. **API Client** (`lib/api.ts`) - Centralized API calls
4. **Styles** (`globals.css`) - TailwindCSS utilities

**Key Flow:**
```
Page → Components → useEffect(API call) → State Update → Re-render
```

## Common Tasks

### Adding a New Endpoint

1. **Create Controller** in `apps/api/src/controllers/ `
   ```typescript
   export const myAction = asyncHandler(async (req, res) => {
     // Your code
   });
   ```

2. **Create Route** in `apps/api/src/routes/`
   ```typescript
   router.post('/path', asyncHandler(myAction));
   ```

3. **Add to Main Server** in `src/index.ts`
   ```typescript
   app.use('/api/path', authMiddleware, myRoutes);
   ```

4. **Create API Client** in `apps/web/lib/api.ts`
   ```typescript
   export const myApi = {
     myAction: async (data) => fetchApi('/path', { method, body })
   };
   ```

5. **Use in Frontend Component**
   ```typescript
   await myApi.myAction(data);
   ```

### Adding a New Database Model

1. **Update Schema** in `apps/api/prisma/schema.prisma`
2. **Create Migration**
   ```bash
   npm run db:migrate --workspace=@myband/api
   ```
3. **Use in Code**
   ```typescript
   await prisma.myModel.create({ data });
   ```

### Handling Errors

**Backend:**
```typescript
throw new ApiError(400, 'Error message');
// Auto-caught, returns { error, status }
```

**Frontend:**
```typescript
try {
  await api.call();
} catch (err: any) {
  console.error(err.message); // "Error message"
}
```

### Adding Authentication

All protected routes need `authMiddleware`:
```typescript
app.use('/api/protected', authMiddleware, routes);
```

Inside controllers:
```typescript
const userId = req.userId; // Set by middleware
if (!userId) throw new ApiError(401, 'Unauthorized');
```

## Testing Endpoints

### Using cURL

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123"}'

# Protected endpoint (add token)
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <token>"
```

### Using Postman

1. Import API collection from endpoints in README.md
2. Create Environment with variable `token`
3. Save token from login response: `Tests` tab
   ```javascript
   var jsonData = pm.response.json();
   pm.environment.set("token", jsonData.token);
   ```

## Code Style

### Backend (TypeScript + Express)

- Use async/await, never callbacks
- Always wrap async routes with `asyncHandler`
- Use `ApiError` for all errors
- Add JSDoc comments for controllers
- Validate inputs at controller level

```typescript
// ✅ Good
export const myAction = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  if (!email) throw new ApiError(400, 'Email required');
  
  const user = await prisma.user.findUnique({ where: { email } });
  res.json(user);
});
```

### Frontend (React + TypeScript)

- Use functional components
- Use `const` for functions
- Define types explicitly
- Keep components under 300 lines
- Extract hooks for logic reuse

```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  // ...
  return <div>{user?.name}</div>;
}
```

## Performance Tips

### Backend
- Use Prisma's `include` to avoid N+1 queries
- Create indexes on frequently filtered columns
- Compress files with Sharp before storing
- Cache responses with ETag (future)

### Frontend
- Use Next.js Image component for images
- Lazy load components with `dynamic()`
- Memoize expensive components
- Use SWR for caching API responses

## Debug Tips

### Backend
```bash
# Enable Prisma logging
DEBUG=prisma:* npm run dev --workspace=@myband/api

# Check database
npm run db:studio --workspace=@myband/api
```

### Frontend
```javascript
// In browser console
localStorage.getItem('token'); // Check token
fetch('http://localhost:3001/api/auth/me', {
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
}).then(r => r.json()).then(console.log);
```

## Deployment Considerations

- [ ] Use environment variables for all config
- [ ] Hash passwords (done: bcryptjs)
- [ ] Validate all inputs (add express-validator)
- [ ] Rate limit auth endpoints
- [ ] Use HTTPS in production
- [ ] Move uploads to S3
- [ ] Add database backup strategy
- [ ] Monitor error logs
- [ ] Add request logging
- [ ] Test with load testing tool

## File Size Limits

Current limits defined in `.env`:
- **PDFs**: 10MB
- **Images**: 5MB
- **Total upload size in KB**: Tracked for future billing

Increase in `.env`:
```env
MAX_FILE_SIZE=52428800  // 50MB
```

## Future Optimization Ideas

1. **Database**: Add read replicas, connection pooling
2. **Cache**: Redis for frequently accessed data
3. **CDN**: CloudFront for file delivery
4. **Search**: Full-text search for content
5. **Sync**: Real-time updates with Web Sockets
6. **Mobile**: React Native version
