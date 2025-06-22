import React from "react";
import dynamic from "next/dynamic";
import styles from "../styles/Auth.module.css";

// Dynamically load ClientAuth component without SSR
const ClientAuth = dynamic(() => import("../components/ClientAuth"), {
  ssr: false,
});

export default function AuthPage() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        height: "100vh",
        paddingTop: "42vh",
      }}
      className={styles.backgroundAnimationContainer}
    >
      <ClientAuth baseUrl={process.env.NEXT_PUBLIC_API_BASE_URL!} />
    </div>
  );
}

export async function getServerSideProps() {
  return {
    props: {},
  };
}
