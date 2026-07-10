import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <span className="site-footer__eyebrow">Kenya Ebola surveillance</span>
          <strong>Ministry of Health, Kenya</strong>
          <p>National public health situation dashboard.</p>
        </div>

        <nav className="site-footer__nav" aria-label="Footer">
          <Link href="/">Public</Link>
          <Link href="/executive">Executive</Link>
          <Link href="/operational">Operational</Link>
        </nav>

        <div className="site-footer__contact">
          <span>Dial 719</span>
          <a href="mailto:dg@nphi.go.ke">dg@nphi.go.ke</a>
          <span>Digital Health Agency</span>
        </div>
      </div>

      <div className="site-footer__bottom">
        (c) Ministry of Health, Kenya - Digital Health Agency. All rights reserved.
      </div>
    </footer>
  );
}
