# Auth Migration Checklist

Complete guide for setting up authentication in KeCarajoComer.

## Supabase Setup (Backend)

### 1. Create Supabase Project
- [ ] Create Supabase project at https://supabase.com
- [ ] Copy project URL and anon key

### 2. Enable Email Auth
- [ ] Go to Authentication → Providers
- [ ] Enable Email provider
- [ ] Enable "Email OTP" (magic link) in Authentication → Providers → Email

### 3. Configure Email Templates (Optional)
- [ ] Go to Authentication → Email Templates
- [ ] Customize "Magic Link" template with your branding

### 4. Environment Variables
Add to `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Optional, for server-side operations
```

## Testing Checklist

### Magic Link Flow
- [ ] Send test magic link email
- [ ] Verify email arrives within 1 minute
- [ ] Click link and verify login works
- [ ] Verify session persists after page refresh

### Route Protection
- [ ] Visit `/planificador` without auth → Redirects to `/login`
- [ ] Visit `/dashboard` without auth → Redirects to `/login`
- [ ] Visit `/historial` without auth → Redirects to `/login`
- [ ] Visit `/recetas` without auth → No redirect (public)
- [ ] Visit `/shared/[token]` without auth → No redirect (public)

### Logout Flow
- [ ] Click logout in user menu
- [ ] Toast shows "Sesión cerrada exitosamente"
- [ ] Session cleared, redirected to home
- [ ] Protected routes now redirect to login

### Share Plan
- [ ] Create meal plan while NOT logged in
- [ ] Click share button → Redirects to login
- [ ] Complete login
- [ ] Plan automatically shared after redirect

## Production Deployment

### Environment Setup
- [ ] Set environment variables in Vercel/hosting platform
- [ ] Configure production email sender (optional: SendGrid, AWS SES)

### Verification
- [ ] Test magic link in production
- [ ] Monitor auth errors in production logs
- [ ] Verify HTTPS is enforced for auth routes

## Protected Routes Reference

| Route | Access |
|-------|--------|
| `/planificador` | Authenticated |
| `/dashboard` | Authenticated |
| `/historial` | Authenticated |
| `/settings` | Authenticated |
| `/perfil` | Authenticated |
| `/despensa` | Authenticated |
| `/lista-compras` | Authenticated |
| `/` | Public |
| `/recetas` | Public |
| `/shared/*` | Public |
| `/login` | Public |

## API Endpoints

### POST /api/auth/signin
Send magic link to email:
```bash
curl -X POST http://localhost:3010/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "redirectTo": "/planificador"}'
```

Response:
```json
{"success": true, "message": "Magic link sent to your email"}
```
