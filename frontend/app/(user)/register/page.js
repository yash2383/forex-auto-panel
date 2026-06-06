import { redirect } from "next/navigation";

export default async function RegisterPage(props) {
  const searchParams = await props.searchParams;
  const campaign = searchParams?.campaign;

  redirect(`/login${campaign ? `?campaign=${campaign}` : ""}`);
}
