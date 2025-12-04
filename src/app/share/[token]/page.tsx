import ShareClient from "./ShareClient";

export default async function SharedDocumentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;  // <-- server-side await is allowed
  return <ShareClient token={token} />;
}
