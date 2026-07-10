import Link from "next/link";
import { getCurrentProfile } from "@/lib/data/dal";
import { logout } from "@/lib/auth-actions";

const memberLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/expenses", label: "Expenses" },
  { href: "/history", label: "History" },
  { href: "/settle-up", label: "Settle Up" },
];

const adminLinks = [
  { href: "/admin/members", label: "Members" },
  { href: "/admin/rent", label: "Rent" },
];

export default async function HouseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            {memberLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-medium text-zinc-600 hover:text-zinc-900"
              >
                {link.label}
              </Link>
            ))}
            {profile.role === "super_admin" &&
              adminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-medium text-zinc-400 hover:text-zinc-900"
                >
                  {link.label}
                </Link>
              ))}
          </nav>
          <div className="flex items-center gap-3 text-sm text-zinc-500">
            <span>{profile.full_name}</span>
            <form action={logout}>
              <button type="submit" className="font-medium text-zinc-600 hover:text-zinc-900">
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
