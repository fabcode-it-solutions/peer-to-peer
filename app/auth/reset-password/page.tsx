import React, { Suspense } from "react";
import ResetPasswordPage from "./ResetPasswordPage";

const page = () => {
  return (
    <Suspense>
      {" "}
      <ResetPasswordPage />
    </Suspense>
  );
};

export default page;
