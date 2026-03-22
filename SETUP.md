# MyBand - Running Locally

## Prerequisites

- **Node.js**: 18 or higher
- **npm** or **yarn**: For package management
- **PostgreSQL**: 12 or higher (running on localhost:5432)

## Step 1: Database Setup

### Option A: Using Docker (Recommended)

```bash
# Run PostgreSQL in Docker
docker run --name myband-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=myband_dev \
  -p 5432:5432 \
  -d postgres:15

# Verify connection
psql -h localhost -U postgres -d myband_dev -c "SELECT 1;"
```

### Option B: Local PostgreSQL Installation

```bash
# Create database
createdb myband_dev

# Verify
psql -U postgres -d myband_dev -c "SELECT 1;"
```

## Step 2: Environment Configuration

### Backend (.env)

```bash
cd apps/api
cp .env.example .env
```

Edit `apps/api/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/myband_dev"
PORT=3001
NODE_ENV=development
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRY=7d
FRONTEND_URL="http://localhost:3000"
```

### Frontend (.env.local)

```bash
cd ../web
cp .env.example .env.local
```

No changes needed for local development (uses defaults).

## Step 3: Install Dependencies

```bash
# From root directory
npm install
```

## Step 4: Setup Database Schema

```bash
# From root directory
# This creates all tables in PostgreSQL
npm run db:push --workspace=@myband/api
```

## Step 5: Start Development Servers

**Terminal 1 - Start API Server:**
```bash
npm run dev --workspace=@myband/api
```

Expected output:
```
🎸 MyBand API running on http://localhost:3001
📚 API docs: See routes/* for endpoints
```

**Terminal 2 - Start Web Server:**
```bash
npm run dev --workspace=@myband/web
```

Expected output:
```
▲ Next.js 14.1.0
- Local:        http://localhost:3000
```

## Step 6: Access the App

Open your browser and visit: **http://localhost:3000**

You should see the MyBand landing page with Login and Sign Up options.

## Testing the App

### 1. Register a New User
- Click "Sign Up"
- Enter email: `test@example.com`
- Enter password: `password123`
- Click "Sign Up"

### 2. Create a Band
- Click "+ New Band"
- Enter name: "My First Band"
- Click "Create"

### 3. Upload Content
- Click on your band
- Click "+ Upload Content"
- Select a PDF or image file
- Enter title and click "Upload"

### 4. Create a Setlist
- Click on "Setlists" tab
- Click "+ New Setlist"
- Enter name: "Concert Setlist"
- Click "Create"

### 5. Add Content to Setlist
- Click on your setlist
- Click "+ Add Song"
- Select content from the list
- Click "Add"

### 6. Try Drag & Drop
- In the setlist, drag songs to reorder them
- The order is saved automatically

## Database Management

### View Data in Prisma Studio

```bash
npm run db:studio --workspace=@myband/api
```

This opens a web UI at `http://localhost:5555` where you can:
- View all tables
- Create/edit/delete records
- See relationships visually

### Run Migrations

```bash
# Create a new migration
npm run db:migrate --workspace=@myband/api

# Apply pending migrations
npm run db:push --workspace=@myband/api
```

## Troubleshooting

### "connect ECONNREFUSED 127.0.0.1:5432"
- Database is not running
- On Docker: `docker ps` to check, `docker start myband-postgres` to restart
- On local: `brew services start postgresql` (macOS) or `pg_ctl start` (Linux)

### "Port 3000/3001 already in use"
```bash
# Kill the process (macOS/Linux)
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# Windows PowerShell:
netstat -ano | findstr :3000
taskkill /PID <pid> /F
```

### CORS errors in browser console
- Make sure API is running on `http://localhost:3001`
- Check `FRONTEND_URL` in `apps/api/.env` is set to `http://localhost:3000`

### "Invalid token" errors
- Tokens expire after 7 days
- Clear localStorage: `localStorage.removeItem('token')` in browser console
- Log in again

## Performance Tips

### Development Mode
- Hot reload is enabled for both frontend and backend
- Changes to `.ts` files are detected automatically
- Frontend rebuilds are fast with Next.js

### Database Queries
- Prisma generates optimized queries
- Check SQL in `.env` by adding `DEBUG=prisma:*`

### File Uploads
- Large files (PDFs) are compressed with Sharp
- Images are validated and limited to 5MB

## Next Steps

Once you have the app running locally:

1. **Add More Users**: Register another account and invite them to your band
2. **Explore API**: Use curl or Postman to test endpoints
3. **Customize Styling**: Edit `apps/web/app/globals.css` and Tailwind config
4. **Add Features**: Check the schema in `apps/api/prisma/schema.prisma` for ideas

## Stopping the App

Press `Ctrl+C` in both terminals to stop the servers.

---

**Need help?** Check the main [README.md](../README.md) for API documentation.
