"use client"

import { usePathname } from "next/navigation"
import Sidebar from "./Sidebar"

const HIDE_ON = ["/login", "/auth"]

export default function ConditionalSidebar() {
  const pathname = usePathname()
  if (HIDE_ON.some((route) => pathname.startsWith(route))) return null
  return <Sidebar />
}
