import Link from "next/link";
import type { Profile } from "@/lib/types";

export default function Navbar({ profile }: { profile: Profile }) {
  const links = [
    { href: "/marketplace", label: "Marketplace" },
    { href: "/tasks/create", label: "Create task" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-xl font-bold text-brand-400">
            Devex
          </Link>
          <nav className="hidden gap-1 sm:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium leading-tight">
              {profile.full_name || profile.email}
            </div>
            <div className="text-xs capitalize text-gray-400">
              {profile.user_type}
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button type="submit" className="btn-ghost text-xs">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
