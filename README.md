# 🎸 MyBand - Music Collaboration App

A production-ready MVP for musician groups to collaborate on setlists, lyrics, chords, and more.

## 🌟 Features

- **User Authentication**: Email + password with JWT tokens
- **Group Management**: Create bands, invite members
- **Content Management**: Upload PDFs, images, or add typed lyrics/chords
- **Setlists**: Organize content into ordered setlists with drag-and-drop reordering
- **Member Permissions**: Only group members can view/edit content

## 🛠 Tech Stack

### Backend
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT (stored in httpOnly cookies)
- **File Storage**: Local filesystem (abstracted for S3 migration)

### Frontend
- **Framework**: Next.js 14 + TypeScript
- **UI**: TailwindCSS + Shadcn components
- **Drag & Drop**: React Beautiful DnD
- **HTTP Client**: Fetch API + SWR

## 📁 Project Structure

```
myBand/
├── apps/
│   ├── api/                    # Express backend
│   │   ├── src/
│   │   │   ├── controllers/    # Request handlers
│   │   │   ├── routes/         # API endpoints
│   │   │   ├── middleware/     # Auth, CORS, etc.
│   │   │   ├── services/       # Business logic
│   │   │   └── utils/          # Helpers (JWT, crypto, errors)
│   │   ├── prisma/             # Database schema + migrations
│   │   └── uploads/            # Uploaded files (local storage)
│   │
│   └── web/                    # Next.js frontend
│       ├── app/                # Pages & layouts
│       ├── components/         # React components
│       ├── lib/               # API client
│       └── public/            # Static assets
│
├── package.json               # Monorepo root
└── README.md
```

## 🚀 Quick Start

See [SETUP.md](./SETUP.md) for detailed setup instructions.

### TL;DR

```bash
# 1. Setup database (create myband_dev in PostgreSQL)
# 2. Configure .env files
npm install

# 3. Create schema
npm run db:push --workspace=@myband/api

# 4. Run servers
npm run dev --workspace=@myband/api     # Terminal 1
npm run dev --workspace=@myband/web     # Terminal 2

# 5. Open http://localhost:3000
```

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication Routes

**POST /auth/register**
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "name": "John Doe"
}
```

**POST /auth/login**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**GET /auth/me** (Protected)
Returns current user profile and groups

---

### Groups Routes

**POST /groups** (Protected)
```json
{
  "name": "The Beatles",
  "description": "British rock band"
}
```

**GET /groups** (Protected)
Returns all groups for current user

**GET /groups/:groupId** (Protected)
Returns group details with members and content

**POST /groups/:groupId/members** (Protected)
```json
{
  "email": "newmember@example.com"
}
```

---

### Content Routes

**POST /groups/:groupId/content/upload** (Protected, multipart)
- file: File (PDF or image, max 10MB)
- title: string
- description: string (optional)

**POST /groups/:groupId/content/text** (Protected)
```json
{
  "title": "Song Lyrics",
  "textContent": "Lorem ipsum...",
  "contentType": "lyrics" | "chords",
  "description": "Optional"
}
```

**GET /groups/:groupId/content** (Protected)
Returns all content in a group

**DELETE /groups/:groupId/content/:contentId** (Protected)
Deletes content

---

### Setlists Routes

**POST /groups/:groupId/setlists** (Protected)
```json
{
  "name": "Concert Setlist"
}
```

**GET /groups/:groupId/setlists** (Protected)
Returns all setlists in group

**GET /groups/:groupId/setlists/:setlistId** (Protected)
Returns setlist with ordered items

**POST /groups/:groupId/setlists/:setlistId/items** (Protected)
```json
{
  "contentId": "content-id"
}
```

**PUT /groups/:groupId/setlists/:setlistId/reorder** (Protected)
```json
{
  "items": [
    { "itemId": "item-1", "position": 0 },
    { "itemId": "item-2", "position": 1 }
  ]
}
```

**DELETE /groups/:groupId/setlists/:setlistId/items/:itemId** (Protected)
Removes item from setlist

---

## 🔐 Authentication

- Tokens are JWT-based and expire after 7 days
- Include token in requests via `Authorization: Bearer <token>` header

## 📂 File Upload

- **Supported formats**: PDF, JPEG, PNG, GIF, WebP
- **Size limits**: PDFs 10MB, Images 5MB
- **Storage**: Local filesystem (easy to migrate to S3)

## 🔮 Future-Proofing

### Cloud Storage
The file storage is abstracted for easy S3 migration:
1. Create `apps/api/src/services/storage.ts`
2. Implement S3 client
3. Update `contentController.ts`

### Payments
Ready for Stripe integration:
1. Add subscription model to Prisma schema
2. Create billing routes
3. File size in KB already tracked for usage

### Real-time Features
WebSocket-ready architecture. To add:
1. Install `socket.io`
2. Create namespaces per group
3. Emit events on updates

## 📝 Development Notes

- TypeScript strict mode enabled
- All errors wrapped in `ApiError` class
- Async handlers use `asyncHandler` wrapper
- Prisma provides type-safe database queries
- File uploads validated on both client and server

## 📄 License

MIT

---

**Built with ❤️ for musicians**
