import { Suspense } from "react";
import AuthErrorPage from "./AuthErrorPage";

const page = () => {
  return (
    <Suspense>
      <AuthErrorPage />
    </Suspense>
  );
};

export default page;
