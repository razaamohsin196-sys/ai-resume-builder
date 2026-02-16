"use client";

import { useEffect } from "react";
import { initUUIDPolyfill } from "@/lib/utils/uuid-polyfill";

/**
 * Provider component that initializes the UUID polyfill
 * This ensures crypto.randomUUID is available globally
 */
export function UUIDProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initUUIDPolyfill();
  }, []);

  return <>{children}</>;
}
