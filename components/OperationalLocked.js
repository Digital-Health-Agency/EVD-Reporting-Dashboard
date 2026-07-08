import Link from "next/link";

export default function OperationalLocked() {
  return (
    <main className="locked-page">
      <section className="locked-card">
        <span className="locked-card__label">Restricted</span>
        <h1>Operational workspace requires sign in</h1>
        <p>Real authentication coming later.</p>
        <Link className="btn btn--secondary" href="/">Back to public update</Link>
      </section>
    </main>
  );
}
