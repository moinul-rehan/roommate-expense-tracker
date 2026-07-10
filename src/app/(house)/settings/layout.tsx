import Link from "next/link";
import { getCurrentProfile } from "@/lib/data/dal";
import { Button } from "@/components/ui/button";

const memberLinks = [{ href: "/settings/profile", label: "Profile" }];
const adminLinks = [{ href: "/settings/rent", label: "Rent" }];
const trailingLinks = [{ href: "/settings/security", label: "Security" }];

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  const links = [
    ...memberLinks,
    ...(profile.role === "super_admin" ? adminLinks : []),
    ...trailingLinks,
  ];

  return (
    <div className="flex flex-col gap-8 sm:flex-row">
      <nav className="flex shrink-0 flex-row gap-1 overflow-x-auto sm:w-48 sm:flex-col sm:overflow-visible">
        {links.map((link) => (
          <Button
            key={link.href}
            variant="ghost"
            size="sm"
            className="justify-start"
            nativeButton={false}
            render={<Link href={link.href} />}
          >
            {link.label}
          </Button>
        ))}
      </nav>
      <div className="flex-1">{children}</div>
    </div>
  );
}
