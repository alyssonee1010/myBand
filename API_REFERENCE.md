# 🎸 MyBand API Endpoints Reference

**Base URL:** `http://localhost:3001/api`

## Table of Contents
1. [Authentication](#authentication)
2. [Groups](#groups)
3. [Content](#content)
4. [Setlists](#setlists)

---

## Authentication

### Register
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"  // optional
}

Response (201):
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "cuid123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response (200):
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "cuid123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Get Current User
```
GET /auth/me
Authorization: Bearer <token>

Response (200):
{
  "user": {
    "id": "cuid123",
    "email": "user@example.com",
    "name": "John Doe",
    "groups": [
      {
        "id": "group123",
        "name": "The Beatles",
        "description": "British rock band"
      }
    ]
  }
}
```

---

## Groups

### Create Group
```
POST /groups
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "The Beatles",
  "description": "British rock band"  // optional
}

Response (201):
{
  "id": "group123",
  "name": "The Beatles",
  "description": "British rock band",
  "createdAt": "2024-03-22T10:00:00Z",
  "updatedAt": "2024-03-22T10:00:00Z",
  "members": [
    {
      "id": "member123",
      "userId": "user123",
      "groupId": "group123",
      "role": "admin",
      "joinedAt": "2024-03-22T10:00:00Z"
    }
  ]
}
```

### Get User's Groups
```
GET /groups
Authorization: Bearer <token>

Response (200):
{
  "groups": [
    {
      "id": "group123",
      "name": "The Beatles",
      "description": "British rock band",
      "createdAt": "2024-03-22T10:00:00Z",
      "updatedAt": "2024-03-22T10:00:00Z"
    }
  ]
}
```

### Get Group Details
```
GET /groups/:groupId
Authorization: Bearer <token>

Response (200):
{
  "id": "group123",
  "name": "The Beatles",
  "description": "British rock band",
  "members": [
    {
      "id": "member123",
      "userId": "user123",
      "user": {
        "id": "user123",
        "email": "john@example.com",
        "name": "John Lennon"
      },
      "role": "admin"
    }
  ],
  "contents": [...],
  "setlists": [...]
}
```

### Add Member to Group
```
POST /groups/:groupId/members
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newmember@example.com"
}

Response (201):
{
  "id": "member456",
  "userId": "user456",
  "groupId": "group123",
  "role": "member",
  "joinedAt": "2024-03-22T10:30:00Z",
  "user": {
    "id": "user456",
    "email": "newmember@example.com",
    "name": "Paul McCartney"
  }
}
```

---

## Content

### Upload File (PDF or Image)
```
POST /groups/:groupId/content/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <PDF or Image file>
title: "Song Sheet"
description: "Lyrics and chords"  // optional

Response (201):
{
  "id": "content123",
  "title": "Song Sheet",
  "contentType": "pdf",
  "description": "Lyrics and chords",
  "fileUrl": "/uploads/abc123.pdf",
  "fileName": "song_sheet.pdf",
  "fileSizeKb": 245,
  "groupId": "group123",
  "createdById": "user123",
  "textContent": null,
  "createdAt": "2024-03-22T10:00:00Z",
  "updatedAt": "2024-03-22T10:00:00Z"
}
```

### Add Text Content (Lyrics/Chords)
```
POST /groups/:groupId/content/text
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Song Lyrics",
  "textContent": "Let it be, let it be...",
  "contentType": "lyrics",  // or "chords"
  "description": "The Beatles - Let It Be"  // optional
}

Response (201):
{
  "id": "content124",
  "title": "Song Lyrics",
  "contentType": "lyrics",
  "description": "The Beatles - Let It Be",
  "fileUrl": null,
  "fileName": null,
  "textContent": "Let it be, let it be...",
  "groupId": "group123",
  "createdById": "user123",
  "createdAt": "2024-03-22T10:00:00Z",
  "updatedAt": "2024-03-22T10:00:00Z"
}
```

### Get Group Content
```
GET /groups/:groupId/content
Authorization: Bearer <token>

Response (200):
{
  "contents": [
    {
      "id": "content123",
      "title": "Song Sheet",
      "contentType": "pdf",
      "description": "Lyrics and chords",
      "fileUrl": "/uploads/abc123.pdf",
      "createdBy": {
        "id": "user123",
        "email": "john@example.com",
        "name": "John Lennon"
      }
    }
  ]
}
```

### Delete Content
```
DELETE /groups/:groupId/content/:contentId
Authorization: Bearer <token>

Response (200):
{
  "message": "Content deleted"
}
```

---

## Setlists

### Create Setlist
```
POST /groups/:groupId/setlists
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Concert Setlist"
}

Response (201):
{
  "id": "setlist123",
  "name": "Concert Setlist",
  "groupId": "group123",
  "createdAt": "2024-03-22T10:00:00Z",
  "updatedAt": "2024-03-22T10:00:00Z",
  "items": []
}
```

### Get Group Setlists
```
GET /groups/:groupId/setlists
Authorization: Bearer <token>

Response (200):
{
  "setlists": [
    {
      "id": "setlist123",
      "name": "Concert Setlist",
      "items": [
        {
          "id": "item1",
          "position": 0,
          "content": {
            "id": "content123",
            "title": "Let It Be",
            "contentType": "lyrics"
          }
        }
      ]
    }
  ]
}
```

### Get Setlist Details
```
GET /groups/:groupId/setlists/:setlistId
Authorization: Bearer <token>

Response (200):
{
  "id": "setlist123",
  "name": "Concert Setlist",
  "groupId": "group123",
  "items": [
    {
      "id": "item1",
      "setlistId": "setlist123",
      "contentId": "content123",
      "position": 0,
      "content": {
        "id": "content123",
        "title": "Let It Be",
        "contentType": "lyrics"
      }
    }
  ],
  "group": {
    "id": "group123",
    "name": "The Beatles"
  }
}
```

### Add Content to Setlist
```
POST /groups/:groupId/setlists/:setlistId/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "contentId": "content123"
}

Response (201):
{
  "id": "item1",
  "setlistId": "setlist123",
  "contentId": "content123",
  "position": 0,
  "content": {
    "id": "content123",
    "title": "Let It Be",
    "contentType": "lyrics"
  }
}
```

### Reorder Setlist Items (Drag & Drop)
```
PUT /groups/:groupId/setlists/:setlistId/reorder
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    { "itemId": "item1", "position": 0 },
    { "itemId": "item2", "position": 1 },
    { "itemId": "item3", "position": 2 }
  ]
}

Response (200):
{
  "id": "setlist123",
  "name": "Concert Setlist",
  "items": [
    {
      "id": "item1",
      "position": 0,
      "content": { ... }
    }
  ]
}
```

### Remove Item from Setlist
```
DELETE /groups/:groupId/setlists/:setlistId/items/:itemId
Authorization: Bearer <token>

Response (200):
{
  "message": "Item removed from setlist"
}
```

---

## Error Responses

All endpoints return error responses in the same format:

```
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Email is required",
  "status": 400
}
```

### Common Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request (invalid data) |
| 401 | Unauthorized (no/invalid token) |
| 403 | Forbidden (no permission) |
| 404 | Not Found (resource doesn't exist) |
| 500 | Server Error |

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Save the token from response
export TOKEN="your-token-here"
```

### Get Current User
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Create Group
```bash
curl -X POST http://localhost:3001/api/groups \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Band","description":"Rock band"}'
```

### Upload File
```bash
curl -X POST http://localhost:3001/api/groups/:groupId/content/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@song.pdf" \
  -F "title=Song Sheet" \
  -F "description=Lyrics and chords"
```

---

**Need help?** See README.md and DEVELOPMENT.md for more details.
