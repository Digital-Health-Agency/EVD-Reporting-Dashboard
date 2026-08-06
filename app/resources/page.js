import AppHeader from "@/components/AppHeader";

export const metadata = {
  title: "KNPHI EVD Resource Library",
};

export default function ResourcesPage() {
  return (
    <>
      <AppHeader variant="public" />
      <main className="resources-page">
        <iframe
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
