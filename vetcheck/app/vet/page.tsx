import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import VetDashboard from "./components/VetDashboard";
import { verifyAuthToken } from "@/lib/auth";

export default async function VetPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vetcheck_token")?.value;

  if (!token) {
    redirect("/login");
  }

  try {
    const payload = await verifyAuthToken(token);

    if (payload.userType !== "USER") {
      redirect("/login");
    }

    if (payload.role !== "VET" && payload.role !== "ADMIN") {
      redirect("/login");
    }

    return <VetDashboard />;
  } catch (error) {
    console.error("VET_PAGE_TOKEN_ERROR", error);
    redirect("/login");
  }
}