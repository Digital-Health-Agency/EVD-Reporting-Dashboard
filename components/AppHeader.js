import Image from "next/image";
import Link from "next/link";

const VARIANT_LABEL = {
  public: "Situation update",
  executive: "Situation dashboard",
  operational: "Restricted workspace",
};

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

export default function AppHeader({ variant = "public" }) {
  const label = VARIANT_LABEL[variant] || VARIANT_LABEL.public;

  return (
    <header className={`app-header app-header--${variant}`}>
      <div className="app-header__top">
        <div className="app-header__top-inner">
          <a className="app-header__contact" href="tel:147">
            <PhoneIcon />
            <span>Dial <strong>147</strong></span>
          </a>
          <a className="app-header__contact app-header__contact--email" href="mailto:helpdesk@dha.go.ke">
            <MailIcon />
            <span>helpdesk@dha.go.ke</span>
          </a>
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
