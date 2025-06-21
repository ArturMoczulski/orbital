import React, { useState } from "react";
import styles from "../styles/Auth.module.css";

interface AuthUIProps {
  baseUrl: string;
  onSuccess: () => void;
}

export default function AuthUI({ baseUrl, onSuccess }: AuthUIProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const endpoint = isLogin ? `/api/auth/login` : `/api/auth/signup`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(
          data.error ||
            data.message ||
            (isLogin ? "Login failed" : "Signup failed")
        );
      }
      if (isLogin) {
        localStorage.setItem("token", data.access_token);
        onSuccess();
      } else {
        // After successful signup, automatically log in the user
        const loginRes = await fetch(`${baseUrl}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) {
          throw new Error(
            loginData.message || "Automatic login after signup failed"
          );
        }
        localStorage.setItem("token", loginData.access_token);
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h1>{isLogin ? "Login" : "Sign Up"}</h1>
        {error && <div className={styles.error}>{error}</div>}
        <input
          name="username"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={styles.input}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.input}
          required
        />
        <button type="submit" className={styles.button}>
          {isLogin ? "Login" : "Sign Up"}
        </button>
        <p
          className={styles.link}
          onClick={() => {
            setError(null);
            setIsLogin(!isLogin);
          }}
        >
          {isLogin
            ? "Don't have an account? Sign Up"
            : "Already have an account? Log In"}
        </p>
      </form>
    </div>
  );
}
