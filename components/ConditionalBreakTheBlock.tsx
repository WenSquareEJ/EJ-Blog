"use client";
import { usePathname } from "next/navigation";
import BreakTheBlockFollowerLeft from "@/components/BreakTheBlockFollowerLeft";

export default function ConditionalBreakTheBlock() {
  const pathname = usePathname();
  
  // Only show on homepage
  if (pathname !== "/") {
    return null;
  }
  
  return <BreakTheBlockFollowerLeft />;
}