import AppHeader from "@/components/AppHeader";
import ExecutiveAuthGate from "@/components/auth/ExecutiveAuthGate";
import DashboardShell from "@/components/DashboardShell";

export const metadata = {
  title: "Executive EVD Dashboard",
};

export default function ExecutivePage() {
  return (
    <>
      <AppHeader variant="executive" />
      <ExecutiveAuthGate>
        <DashboardShell />
      </ExecutiveAuthGate>
    </>
  );
}
