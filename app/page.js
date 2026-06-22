import DashboardShell from "@/components/DashboardShell";

// The shell owns disease tabs + data fetching. It calls the API routes
// (the data-layer seam) — components never touch the warehouse directly.
export default function Page() {
  return <DashboardShell />;
}
