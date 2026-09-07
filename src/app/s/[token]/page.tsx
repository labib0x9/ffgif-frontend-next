import React from "react";
import { SharedGifTokenClient } from "@/components/shared/SharedGifTokenClient";

export function generateStaticParams() {
  return [{ token: "preview" }];
}

export default async function SharedGifTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = await params;
  return <SharedGifTokenClient initialToken={resolvedParams?.token} />;
}
