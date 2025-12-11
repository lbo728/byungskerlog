import Link from "next/link";
import Image from "next/image";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: "/logo-github.svg", href: "https://github.com", label: "GitHub" },
    { icon: "/logo-linkedin.svg", href: "https://linkedin.com", label: "LinkedIn" },
    { icon: "/logo-x.svg", href: "https://x.com", label: "X (Twitter)" },
  ];

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © {currentYear} Byungsker Log. All rights reserved.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-70 transition-opacity"
                aria-label={link.label}
              >
                <Image src={link.icon} alt={link.label} width={24} height={24} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
