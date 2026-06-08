import { redirect } from "next/navigation";
import { cookies } from "next/headers";

function decodeJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payloadB64 = parts[1];
    const rawPayload = Buffer.from(payloadB64, "base64").toString("utf-8");
    const payload = JSON.parse(rawPayload);
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null;
    }
    return payload;
  } catch (err) {
    return null;
  }
}

export default async function RegisterPage(props) {
  const searchParams = await props.searchParams;
  const campaign = searchParams?.campaign;

  const cookieStore = await cookies();
  const token = cookieStore.get("forex-auto-panel-token")?.value;
  const user = token ? decodeJwtPayload(token) : null;

  if (user) {
    redirect("/dashboard");
  }

  if (campaign) {
    redirect(`/signup?campaign=${campaign}`);
  }

  redirect("/signup");
}
