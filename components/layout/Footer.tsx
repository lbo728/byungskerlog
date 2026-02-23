import Link from "next/link";
import Image from "next/image";
import { siteConfig, socialLinks } from "@/lib/site-config";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">© {currentYear} {siteConfig.name}. All rights reserved.</p>

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
                <Image
                  src={link.icon}
                  alt={link.label}
                  width={24}
                  height={24}
                  style={{ filter: "brightness(0) saturate(100%) invert(35%) sepia(0%) saturate(0%) hue-rotate(0deg)" }}
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
