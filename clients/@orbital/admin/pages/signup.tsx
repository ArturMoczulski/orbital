import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function SignupPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    router.replace("/");
  }, [router]);

  if (!isClient) {
    return null;
  }

  return null;
}

export async function getServerSideProps() {
  return {
    props: {},
  };
}
