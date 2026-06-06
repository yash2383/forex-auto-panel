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
    "/infrastructure",
    "/contact"
  ];
  
  const isPublicRoute = publicRoutes.some(
    (route) => path === route || path.startsWith(route + "/")
  );

  // 2. ROUTE PROTECTION LOGIC

  // Protect admin routes separately
  if (path.startsWith("/admin") && path !== "/admin/login") {
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  // Protect user routes separately
  if (path.startsWith("/dashboard") || path.startsWith("/profile") || path === "/checkout" || path.startsWith("/checkout/")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      const destination = req.nextUrl.pathname + req.nextUrl.search;
      loginUrl.searchParams.set("redirect", destination);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. AUTH LOGGED-IN REDIRECTS (Admins and Users going to login/signup/etc.)
  if (isAuthenticated) {
    if (path === "/login" || path === "/signup") {
      if (isAdmin) {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      } else {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  }

  // 4. CLIENT / USER ROUTES ALLOWANCE
  if (path.startsWith("/dashboard") || path.startsWith("/profile") || path === "/checkout" || path.startsWith("/checkout/") || isPublicRoute) {
    return NextResponse.next();
  }

  // 5. ADMIN ROUTES ALLOWANCE
  if (path.startsWith("/admin")) {
    if (path === "/admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // 6. DEFAULT REDIRECTS FOR GUESTS
  if (!isAuthenticated) {
    if (path === "/login" || path === "/signup" || path === "/register" || path === "/admin/login" || isPublicRoute) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 7. SECURE FALLBACK
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
