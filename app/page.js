import { getDashboardData } from "@/lib/data";
import Dashboard from "@/components/Dashboard";

// Server component: fetches data, hands it to the interactive client dashboard.
export default async function Page() {
  const data = await getDashboardData();
  return <Dashboard data={data} />;
}
