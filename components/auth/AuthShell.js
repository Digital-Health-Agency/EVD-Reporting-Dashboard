export default function AuthShell({ eyebrow, title, children }) {
  return (
    <main className="auth-page">
      <section className="auth-panel" aria-label="DHA EVD account access">
        <div className="auth-panel__identity" aria-hidden="true" />
        <div className="auth-card">
          <div className="auth-card__content">
            <div className="auth-panel__copy">
              <span>{eyebrow}</span>
              <h1>{title}</h1>
              <p>Restricted health-security tools for authorized response teams.</p>
            </div>
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
