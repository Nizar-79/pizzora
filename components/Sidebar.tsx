"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import {
  LayoutDashboard,
  MapPin,
  UtensilsCrossed,
  ClipboardList,
  Phone,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/locations", label: "Locations", icon: MapPin },
  { href: "/menu-editor", label: "Menu Editor", icon: UtensilsCrossed },
  { href: "/order-history", label: "Order History", icon: ClipboardList },
  { href: "/call-logs", label: "Call Logs", icon: Phone },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="w-64 bg-slate-800 flex flex-col border-r border-slate-700/60 shrink-0">
      <div className="px-5 py-4 border-b border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
            <span className="text-base leading-none">🍕</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white tracking-tight">Pizzora</p>
            <p className="text-[11px] text-zinc-500 leading-none mt-0.5">Voice AI Ordering</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-orange-500/10 text-orange-400"
                  : "text-zinc-400 hover:bg-slate-700/60 hover:text-zinc-100"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive ? "text-orange-400" : "text-zinc-500"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-slate-700/60">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-200 hover:bg-slate-700/60 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0 text-slate-300" />
          Sign Out
        </button>
        <p className="text-[11px] text-slate-400 px-3 pt-2">Powered by A.I. Automated Impact</p>
      </div>
    </aside>
  );
}
