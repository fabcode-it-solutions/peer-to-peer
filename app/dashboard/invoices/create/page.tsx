import CreateInvoicePage from "@/components/invoice/CreateInvoicePage";
import React, { Suspense } from "react";

const page = () => {
  return (
    <Suspense>
      <CreateInvoicePage />
    </Suspense>
  );
};

export default page;
