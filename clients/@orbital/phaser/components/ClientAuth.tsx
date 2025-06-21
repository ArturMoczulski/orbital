"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";

const AuthUI = dynamic(() => import("./AuthUI"), {
  ssr: false,
});

interface ClientAuthProps {
  baseUrl: string;
}

export default function ClientAuth({ baseUrl }: ClientAuthProps) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    setIsClient(true);
    console.log("Checking authentication token...");
    const token = localStorage.getItem("token");
    console.log("Token found:", !!token);
    if (token) {
      setIsAuthenticated(true);
      router.push("/");
    } else {
      setIsAuthenticated(false);
      console.log("No token found, rendering AuthUI");
    }
  }, [router]);

  const handleAuthSuccess = () => {
    router.push("/"); // Redirect to the game page on success
  };

  if (!isClient || isAuthenticated === null) {
    console.log("Authentication pending or not client, rendering loading");
    return <div>Loading...</div>;
  }

  if (isAuthenticated === true) {
    console.log("Authenticated, redirecting to /");
    return <div>Redirecting...</div>;
  }

  return <AuthUI baseUrl={baseUrl} onSuccess={handleAuthSuccess} />;
}
