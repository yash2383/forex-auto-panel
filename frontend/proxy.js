import { NextResponse } from "next/server";

function decodeJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payloadB64 = parts[1];
    let s = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) {
      s += "=";
    }
    const jsonStr = atob(s);
    const payload = JSON.parse(jsonStr);
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null;
    }
    return payload;
  } catch (err) {
    return null;
  }
}

export function proxy(req) {
  const token = req.cookies.get("tradebot-token")?.value;
  const path = req.nextUrl.pathname;

  const payload = token ? decodeJwtPayload(token) : null;
  const isAuthenticated = !!payload;
  const role = payload?.role;
  const adminRoles = ["SUPER_ADMIN", "MANAGER", "VIEWER"];
  
  const isAdmin = isAuthenticated && adminRoles.includes(role);
  const isUser = isAuthenticated && role === "USER";

  // 1. PUBLIC ROUTES (accessed by guests or users)
  const publicRoutes = [
    "/",
    "/pricing",
    "/past-trades",
    "/profit-simulator",
    "/infrastructure"
  ];
  
  const isPublicRoute = publicRoutes.some(
    (route) => path === route || path.startsWith(route + "/")
  );

  // 2. UNAUTHENTICATED GUEST FLOW
  if (!isAuthenticated) {
    // If attempting to access admin routes (except login), redirect to admin login
    if (path.startsWith("/admin") && path !== "/admin/login") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    // If attempting to access client routes, redirect to user login
    if (path.startsWith("/dashboard") || path === "/checkout" || path.startsWith("/checkout/")) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("next", path);
      return NextResponse.redirect(loginUrl);
    }
    // Guest is allowed to see public routes, /login, /signup, and /admin/login
    if (isPublicRoute || path === "/login" || path === "/signup" || path === "/admin/login") {
      return NextResponse.next();
    }
    // Fallback for any other path: redirect to login
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 3. AUTHENTICATED ADMIN FLOW
  if (isAdmin) {
    // Admins cannot access login/signup or user space, redirect them to admin dashboard
    if (path === "/login" || path === "/signup" || path === "/admin/login" || path.startsWith("/dashboard") || path === "/checkout" || path.startsWith("/checkout/")) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    // Redirect /admin to /admin/dashboard
    if (path === "/admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    // Allow access to admin routes and public routes
    if (path.startsWith("/admin") || isPublicRoute) {
      return NextResponse.next();
    }
    // Fallback for admins: redirect to admin dashboard
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  // 4. AUTHENTICATED USER FLOW
  if (isUser) {
    // Users cannot access login/signup or admin space, redirect to dashboard or home
    if (path === "/login" || path === "/signup" || path === "/admin/login") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (path.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    // Redirect /dashboard/live-trades and /dashboard/performance back to dashboard
    if (path === "/dashboard/live-trades" || path === "/dashboard/performance") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    // Allow access to dashboard, checkout, and public routes
    if (path.startsWith("/dashboard") || path === "/checkout" || path.startsWith("/checkout/") || isPublicRoute) {
      return NextResponse.next();
    }
    // Fallback for users: redirect to user dashboard
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 5. SECURE FALLBACK
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
