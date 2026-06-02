"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The Live Trades page and its functionality have been disabled/commented out.
export default function LiveTradesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return null;
}
