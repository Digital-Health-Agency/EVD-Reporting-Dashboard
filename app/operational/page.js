import AppHeader from "@/components/AppHeader";
import OperationalWorkspace from "@/components/OperationalWorkspace";

export const metadata = {
  title: "Operational Workspace",
};

export default function OperationalPage() {
  return (
    <>
      <AppHeader variant="operational" />
      <OperationalWorkspace />
    </>
  );
}
