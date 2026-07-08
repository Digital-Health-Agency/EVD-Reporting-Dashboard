import Image from "next/image";
import Link from "next/link";

const VARIANT_LABEL = {
  public: "Situation update",
  executive: "Situation dashboard",
  operational: "Restricted workspace",
};

export default function AppHeader({ variant = "public" }) {
  return (
    <header className={`app-header app-header--${variant}`}>
      <div className="app-header__top">
        <span>Dial 147</span>
        <span>helpdesk@dha.go.ke</span>
      </div>
      <div className="app-header__main">
        <Link className="app-header__brand" href="/" aria-label="Kenya EVD dashboard home">
          <Image src="/nphi-kenya.png" alt="Kenya National Public Health Institute" width={128} height={40} priority />
        </Link>

        <nav className="app-header__nav" aria-label="Primary">
          <span className="app-header__eyebrow">{VARIANT_LABEL[variant] || VARIANT_LABEL.public}</span>
        </nav>

        <div className="app-header__partner">
          <span>Powered by</span>
          <Image src="/dhalogo.png" alt="Digital Health Agency" width={74} height={36} />
        </div>
      </div>
    </header>
  );
}
