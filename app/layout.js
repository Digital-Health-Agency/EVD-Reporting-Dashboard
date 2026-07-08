import "./globals.css";

export const metadata = {
  title: "Kenya EVD Dashboard",
  description:
    "Ministry of Health national Ebola surveillance dashboard for public, executive and operational response surfaces.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
