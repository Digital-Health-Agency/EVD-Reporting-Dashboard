"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { displayName, initialsFor } from "@/lib/auth-user";

const VARIANT_LABEL = {
  public: "Situation update",
  operational: "Restricted workspace",
};

const DASHBOARD_LINKS = [
  { href: "/", label: "Public", key: "public" },
  { href: "/operational", label: "Operational", key: "operational" },
];

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 4h3l2 5-2 1a12 12 0 0 0 6 6l1-2 5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M4 7l8 6 8-6" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg className="app-header__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export default function AppHeader({ variant = "public" }) {
  const label = VARIANT_LABEL[variant] || VARIANT_LABEL.public;
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isPending, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const isProfileRoute = pathname?.startsWith("/profile");

  async function handleLogout() {
    setMenuOpen(false);
    router.replace("/");
    await logout();
  }

  return (
    <header className={`app-header app-header--${variant}`}>
      <div className="app-header__top">
        <div className="app-header__top-inner">
          <a className="app-header__contact" href="tel:719">
            <PhoneIcon />
            <span>Dial <strong>719</strong></span>
          </a>
          <a className="app-header__contact app-header__contact--email" href="mailto:dg@nphi.go.ke">
            <MailIcon />
            <span>dg@nphi.go.ke</span>
          </a>
          <div className="app-header__auth">
            {!isPending && !isAuthenticated ? (
              <Link className="app-header__login" href="/login">Login</Link>
            ) : null}
            {!isPending && isAuthenticated ? (
              <div className="app-header__user-menu">
                <button
                  className="app-header__user-button"
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((open) => !open)}
                >
                  <span className="app-header__avatar" aria-hidden="true">{initialsFor(user)}</span>
                  <span className="app-header__user-name">{displayName(user)}</span>
                  <ChevronDownIcon />
                </button>
                {menuOpen ? (
                  <div className="app-header__menu" role="menu">
                    <p className="app-header__menu-label">Dashboards</p>
                    <div className="app-header__menu-divider" role="separator" />
                    <div role="group" aria-label="Dashboards">
                      {DASHBOARD_LINKS.map((item) => (
                        <Link
                          key={item.href}
                          role="menuitem"
                          href={item.href}
                          aria-current={!isProfileRoute && variant === item.key ? "page" : undefined}
                          onClick={() => setMenuOpen(false)}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                    <div className="app-header__menu-divider" role="separator" />
                    <Link
                      role="menuitem"
                      href="/profile"
                      aria-current={isProfileRoute ? "page" : undefined}
                      onClick={() => setMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <button role="menuitem" type="button" onClick={handleLogout}>Logout</button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="app-header__main">
        <Link className="app-header__brand" href="/" aria-label="Kenya EVD dashboard home">
          <Image
            src="/nphi-kenya.png"
            alt="Kenya National Public Health Institute"
            width={128}
            height={40}
            priority
          />
        </Link>

        <span className="app-header__eyebrow" aria-label={`Current surface: ${label}`}>
          {label}
        </span>

        <div className="app-header__partner">
          <span>Powered by</span>
          <Image src="/dhalogo.png" alt="Digital Health Agency" width={74} height={36} />
        </div>
      </div>
    </header>
  );
}
