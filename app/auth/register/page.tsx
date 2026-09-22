import { Suspense } from "react";
import RegisterPage from "./RegisterPage";

const page = () => {
  return (
    <Suspense>
      <RegisterPage />
    </Suspense>
  );
};

export default page;
