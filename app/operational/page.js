import AppHeader from "@/components/AppHeader";
import OperationalLocked from "@/components/OperationalLocked";

export const metadata = {
  title: "Operational Workspace",
};

export default function OperationalPage() {
  return (
    <>
      <AppHeader variant="operational" />
      <OperationalLocked />
    </>
  );
}
