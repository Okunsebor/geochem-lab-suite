import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { ApiAuthError, ApiForbiddenError, requireApiUser } from "./server/rbac";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.status,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }
    if (error instanceof ApiForbiddenError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.status,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Minimal backend RBAC enforcement for any future API routes.
// All `/api/*` requests must present a valid Supabase access token.
const apiAuthMiddleware = createMiddleware().server(async ({ request, next }) => {
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) {
    await requireApiUser(request);
  }
  return next();
});

export const startInstance = createStart(() => ({
  requestMiddleware: [apiAuthMiddleware, errorMiddleware],
}));
