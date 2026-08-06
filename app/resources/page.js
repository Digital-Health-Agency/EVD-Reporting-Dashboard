import AppHeader from "@/components/AppHeader";

export const metadata = {
  title: "KNPHI EVD Resource Library",
};

export default function ResourcesPage() {
  return (
    <>
      <AppHeader variant="public" />
      <main className="resources-page">
        <section className="public-hero resources-hero">
          <div className="public-hero__copy">
            <div>
              <p className="public-label">KNPHI Resource Library</p>
              <h1 className="public-hero__title">
                Ebola Response
                <br />
                Resources
              </h1>
              <p className="public-hero__meta">
                Access approved guidance, training materials, and tools for Ebola preparedness and response.
              </p>
            </div>
            <div className="hero-tile__actions">
              <a className="btn btn--secondary" href="#resource-library">
                Browse resources
              </a>
            </div>
          </div>
        </section>
        <iframe
          id="resource-library"
          className="resources-page__frame"
          src="https://evd.khsc.site/resource-library.html"
          title="KNPHI EVD Resource Library"
          loading="lazy"
          allowFullScreen
        />
      </main>
    </>
  );
}
