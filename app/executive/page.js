import AppHeader from "@/components/AppHeader";
import DashboardShell from "@/components/DashboardShell";

export const metadata = {
  title: "Executive EVD Dashboard",
};

export default function ExecutivePage() {
  return (
    <>
      <AppHeader variant="executive" />
      <DashboardShell />
    </>
  );
}
