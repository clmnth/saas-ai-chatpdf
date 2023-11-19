import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

const Page = () => {
  const router = useRouter();

  const searchParams = useSearchParams();
  const origin = searchParams.get("origin");

  return <div>Page</div>;
};

export default Page;
