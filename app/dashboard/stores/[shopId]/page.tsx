import StoreDetailPage from "@/components/StoreDetailPage";
import React from "react";

interface ProfilePageProps {
  params: Promise<{ shopId: string }>;
}

const page = async ({ params }: ProfilePageProps) => {
  const { shopId } = await params;
  return <StoreDetailPage params={{ shopId }} />;
};

export default page;
