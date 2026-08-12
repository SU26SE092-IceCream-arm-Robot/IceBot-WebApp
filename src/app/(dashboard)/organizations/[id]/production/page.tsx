import { redirect } from "next/navigation";

export default async function OrganizationProductionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/production?organizationId=${encodeURIComponent(id)}`);
}
