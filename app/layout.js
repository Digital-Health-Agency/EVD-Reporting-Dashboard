import "./globals.css";
import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: "Kenya EVD Dashboard",
  description:
    "Ministry of Health national Ebola surveillance dashboard for public and operational response surfaces.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
