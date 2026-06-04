# Supabase email verification setup

GeoChem Suite sends signup confirmation through **Supabase Auth**. If users do not receive emails or OTP codes, fix the project configuration below. Most issues are dashboard settings, not app code.

## 1. Environment variables (local app)

In the project root `.env`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Restart the dev server after changing `.env` (`npm run dev`).

## 2. Supabase Auth URLs

In **Supabase Dashboard > Authentication > URL configuration**:

| Setting           | Value (local dev)                                      |
| ----------------- | ------------------------------------------------------ |
| **Site URL**      | `http://localhost:5173`                                |
| **Redirect URLs** | `http://localhost:5173/verify-email`                   |
|                   | `http://localhost:5173/**` (optional wildcard for dev) |

For production, add your deployed origin, e.g. `https://your-domain.com/verify-email`.

The app passes `emailRedirectTo: {origin}/verify-email` on signup and resend so older email-link templates still resolve correctly.

## 3. Enable email signups

**Authentication > Providers > Email**

- Email provider **enabled**
- **Confirm email** enabled (required for this flow)
- Signups **allowed**

## 4. Set the OTP verification window

**Authentication > Providers > Email > Email OTP Expiration**

Set the email OTP expiration to **900 seconds (15 minutes)** for production. If your risk profile needs a tighter window, use **300 seconds (5 minutes)**. Avoid shorter windows because email delivery delays can lock legitimate customers out before they can finish registration.

The app also rate-limits resend attempts to one request every **5 minutes**, with a maximum of 5 resend attempts per hour per email address.

## 5. Include only the 6-digit OTP in the email template

By default, the "Confirm signup" template may only show a **link**, not a visible code.

**Authentication > Email Templates > Confirm signup**

Use an OTP-only message. Do not include the confirmation link because this app verifies signups through the 6-digit code:

```html
<h2>Confirm your signup</h2>
<p>Your verification code is:</p>
<p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">{{ .Token }}</p>
<p>This code expires in 15 minutes.</p>
```

Save the template. Without `{{ .Token }}`, users will not see a 6-digit code in the email.

## 6. Enable Google sign-in

**Authentication > Providers > Google**

- Enable the Google provider
- Add the Google OAuth client ID and secret
- Add the Supabase callback URL shown in the dashboard to your Google Cloud OAuth app
- Add the deployed app origin to Supabase URL configuration

## 7. Custom SMTP (recommended for production)

Supabase's built-in email is limited by rate limits and may only deliver to team addresses on some plans.

**Project Settings > Authentication > SMTP Settings**

Configure your provider (SendGrid, Resend, AWS SES, etc.) and set a verified **From** address.

## 8. Check Auth logs

**Authentication > Logs**

Look for failed `signup` / `user_confirmation_requested` events and SMTP errors.

## 9. How the app verifies

1. **6-digit code** - user enters code on `/verify-email`, then the app calls `verifyOtp` with type `signup` or `email`.
2. **Existing email links** - older templates that still contain links continue to land on `/verify-email?token_hash=...&type=signup` or `?code=...`, and the app completes verification automatically for backward compatibility.

## Quick checklist

- [ ] Real `VITE_SUPABASE_*` values in `.env`
- [ ] `http://localhost:5173/verify-email` in Redirect URLs
- [ ] Confirm email enabled
- [ ] Email OTP expiration set to `900` seconds, or `300` seconds for a stricter policy
- [ ] Confirm signup template includes `{{ .Token }}`
- [ ] Confirm signup template does not include `{{ .ConfirmationURL }}`
- [ ] Google provider enabled, if Google sign-in is needed
- [ ] Custom SMTP configured, if not using team/test emails only
- [ ] Check spam/junk folder
