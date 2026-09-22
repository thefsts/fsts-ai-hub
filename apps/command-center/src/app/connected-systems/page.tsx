import { Page } from "@/components/Page";

export default function PageComponent() {
  return (
    <Page
      title="Connected Systems"
      subtitle="FSTS-owned and authorized client systems connected to the AI Hub."
      status="interface_only"
      emptyTitle="No systems connected"
      emptyDescription="The connected-system and product-adapter contracts are implemented. No systems are connected in this environment."
      emptyNote="Client-owned systems receive independent tenant boundaries."
    />
  );
}
