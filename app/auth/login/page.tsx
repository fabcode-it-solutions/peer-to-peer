import { Suspense } from "react";
import LoginPage from "./LoginPage";

const page = () => {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
};

export default page;
