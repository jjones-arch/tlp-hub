import SboDetailClient from "./SboDetailClient";

export async function generateStaticParams() {
  return [{ sboId: "_" }];
}

export default function SboDetailPage() {
  return <SboDetailClient />;
}
