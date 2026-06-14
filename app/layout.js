import "./globals.css";

export const metadata = {
  title: "Kenya EVD Situation Dashboard",
  description:
    "Ministry of Health — National EOC situation overview for the Ebola Virus Disease response in Kenya.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
