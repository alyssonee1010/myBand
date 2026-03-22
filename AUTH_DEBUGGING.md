# 🔐 Authentication Debugging Guide

## ✅ What Was Fixed

### 1. **Error Response Format Mismatch**
**Problem**: Backend sent `{ error: "...", status: 401 }` but frontend looked for `data.message`
**Fix**: Updated API client to extract `data.error` field correctly

### 2. **Premature 401 Redirect on Login**
**Problem**: When login failed (401 status), the error interceptor redirected to `/auth/login`, causing page refresh and loss of error message
**Fix**: Only redirect on 401 for protected routes, NOT on authentication pages (`/auth/*`)

### 3. **Error Messages Disappearing**
**Problem**: Error message displayed but cleared immediately
**Fix**: 
- Error message now persists until user starts typing again
- Added success message confirmation before redirect
- Better visual styling for error/success messages

### 4. **Missing Console Logging**
**Problem**: No way to debug what's happening in auth flow
**Fix**: Added detailed console logs:
- Frontend: `📡 Attempting login`, `✅ Login successful`, `❌ Login error`
- Backend: `[AUTH] Login attempt`, `[AUTH] Login failed`, `[AUTH] Login successful`

## 🐛 Debugging Login Issues

### Check Frontend Console (Browser DevTools - F12)
```
📡 Attempting login with: { email: 'user@example.com' }
✅ Login successful, token stored
```
or
```
❌ Login error: Invalid email or password
Error message displayed: Invalid email or password
```

### Check Backend Console (Terminal)
```
[AUTH] Login attempt for email: user@example.com
[AUTH] Login successful for user user@example.com, token issued
```
or
```
[AUTH] Login attempt for email: user@example.com
[AUTH] Login failed: Invalid password for user user@example.com
```

### Check Network Tab (Browser DevTools)
1. Open DevTools → Network tab
2. Try login
3. Look for POST to `http://localhost:3001/api/auth/login`
4. Check Response:
   - ✅ Success: `{ token: "...", user: { id, email, name } }`
   - ❌ Failed: `{ error: "Invalid email or password", status: 401 }`

## 🔍 Common Issues & Solutions

### Issue: "Invalid email or password" - But I know password is correct
**Debugging steps**:
1. Check backend console - does it show "Login failed: Invalid password"?
2. Check Network tab - backend returned 401?
3. If yes, the password entered doesn't match what's in database
4. Try resetting password by registering a new account

### Issue: Error message disappears immediately
**This is fixed!** Error now persists until you either:
- Clear the field and type again
- Try login again

### Issue: Page refreshes when clicking login
**This is fixed!** Previously happened when:
- Error interceptor redirected on 401 during login
- Now it only redirects on protected routes

### Issue: Page redirects but nothing loads (stuck)
**Debugging**:
1. Check browser console for errors
2. Check if `/dashboard` page is loading: Network tab should show requests to `/api/auth/me`
3. Check if token is stored: `localStorage.getItem('token')` in console
4. If token exists but `/dashboard` fails, the issue is in DashboardPage or API calls there

## 🧪 Testing the Auth Flow

### Test 1: Register New Account
```
Email: test@example.com
Name: Test User
Password: password123
```
**Expected**:
- Frontend console: ✅ Registration successful
- Backend console: [AUTH] success logs
- Redirects to dashboard

### Test 2: Login with Correct Credentials
```
Email: test@example.com
Password: password123
```
**Expected**: Same as Test 1

### Test 3: Login with Wrong Password
```
Email: test@example.com
Password: wrongpassword
```
**Expected**:
- Frontend shows: "Invalid email or password" (red box)
- Error persists until you modify input
- Frontend console: ❌ Login error
- Backend console: [AUTH] Login failed: Invalid password
- No page refresh or redirect

### Test 4: Login with Non-existent Email
```
Email: nonexistent@example.com
Password: password123
```
**Expected**: Same as Test 3 (same error message for security)

## 🔐 Token Storage & Usage

### Token Storage
- Token stored in `localStorage` with key `token`
- Check in console: `localStorage.getItem('token')`
- Cleared on logout or session expiry (401 on protected routes)

### Token Usage
- Attached to all API requests in Authorization header
- Format: `Authorization: Bearer <token>`
- Can check in Network tab → Request headers

### Token Expiry
- Set to 7 days in backend (`.env` → `JWT_EXPIRY=7d`)
- When expired, backend returns 401
- Frontend redirects to `/auth/login`

## 📝 What Gets Logged

### Frontend (Browser Console)
- **Auth attempts**: Email being sent
- **Success/Failure**: With error message details
- **Navigation**: Redirects to dashboard

### Backend (Server Console)  
- **Attempt**: Email, method, status code
- **Failure reason**: User not found? Invalid password?
- **Success**: Token issued

### Network Tab
- Full request/response bodies
- Status codes
- Response headers (includes timestamp if error handler working)

## 🚀 Next Steps

If auth is still not working:

1. **Clear everything**:
   ```
   localStorage.clear()
   // Refresh page
   ```

2. **Register fresh account**:
   - Watch console logs - should see ✅
   - Check Network tab - should see 200 with token

3. **Check database**:
   ```bash
   # From project root
   npm run db:studio --workspace=@myband/api
   # Opens Prisma Studio - see all users
   ```

4. **Reset database if stuck**:
   ```bash
   # Delete database and recreate schema
   npm run db:push --workspace=@myband/api
   ```

## 📞 Support

If still stuck, provide:
1. Frontend console logs (copy/paste)
2. Backend console logs (copy/paste)
3. Network tab response for login request
4. What you're trying to do (register? login? what email/password?)
