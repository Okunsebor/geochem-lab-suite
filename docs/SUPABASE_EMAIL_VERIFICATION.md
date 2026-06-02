# Supabase email verification setup

GeoChem Suite sends signup confirmation through **Supabase Auth**. If users do not receive emails or OTP codes, fix the project configuration below (most issues are dashboard settings, not app code).

## 1. Environment variables (local app)

In the project root `.env`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Restart the dev server after changing `.env` (`npm run dev`).

## 2. Supabase Auth URLs

In **Supabase Dashboard ? Authentication ? URL configuration**:

| Setting | Value (local dev) |
|--------|-------------------|
| **Site URL** | `http://localhost:5173` |
| **Redirect URLs** | `http://localhost:5173/verify-email` |
| | `http://localhost:5173/**` (optional wildcard for dev) |

For production, add your deployed origin, e.g. `https://your-domain.com/verify-email`.

The app passes `emailRedirectTo: {origin}/verify-email` on signup and resend.

## 3. Enable email signups

**Authentication ? Providers ? Email**

- Email provider **enabled**
- **Confirm email** enabled (required for this flow)
- Signups **allowed**

## 4. Include the 6-digit OTP in the email template

By default, the “Confirm signup” template may only show a **link**, not a visible code.

**Authentication ? Email Templates ? Confirm signup**

Add the OTP to the body, for example:

```html
<h2>Confirm your signup</h2>
<p>Your verification code is:</p>
<p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">{{ .Token }}</p>
<p>Or confirm by opening this link:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm email</a></p>
```

Save the template. Without `{{ .Token }}`, users will not see a 6-digit code in the email.

## 5. Custom SMTP (recommended for production)

Supabase’s built-in email is limited (rate limits, may only deliver to team addresses on some plans).

**Project Settings ? Authentication ? SMTP Settings**

Configure your provider (SendGrid, Resend, AWS SES, etc.) and set a verified **From** address.

## 6. Check Auth logs

**Authentication ? Logs**

Look for failed `signup` / `user_confirmation_requested` events and SMTP errors.

## 7. How the app verifies

1. **6-digit code** — user enters code on `/verify-email` ? `verifyOtp` with type `signup` or `email`.
2. **Email link** — user clicks link ? lands on `/verify-email?token_hash=...&type=signup` (or `?code=...` for PKCE) ? app completes verification automatically.

## Quick checklist

- [ ] Real `VITE_SUPABASE_*` values in `.env`
- [ ] `http://localhost:5173/verify-email` in Redirect URLs
- [ ] Confirm email enabled
- [ ] Confirm signup template includes `{{ .Token }}`
- [ ] Custom SMTP configured (if not using team/test emails only)
- [ ] Check spam/junk folder
