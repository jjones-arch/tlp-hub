import InitiativeDetailClient from "./InitiativeDetailClient";

export async function generateStaticParams() {
  return [{ id: "_" }];
}

export default function InitiativeDetailPage() {
  return <InitiativeDetailClient />;
}
