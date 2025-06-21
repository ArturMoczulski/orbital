"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import styles from "../styles/Auth.module.css";

// Dynamically load PhaserGame component without SSR
const PhaserGame = dynamic(() => import("../components/PhaserGame"), {
  ssr: false,
});

export default function GamePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    console.log("Checking authentication token...");
    const token = localStorage.getItem("token");
    console.log("Token found:", !!token);
    if (token) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      console.log("No token found, redirecting to /auth");
      router.push("/auth");
    }
  }, [router]);

  // Render PhaserGame only if authenticated
  if (!isClient || isAuthenticated === null) {
    console.log("Authentication pending or not client, rendering loading");
    return <div>Loading...</div>;
  }
  if (isAuthenticated === false) {
    console.log("Not authenticated, redirecting to /auth");
    return <div>Redirecting...</div>;
  }
  console.log("Authenticated, rendering PhaserGame");

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <PhaserGame />
    </div>
  );
}

export async function getServerSideProps() {
  return {
    props: {},
  };
}
