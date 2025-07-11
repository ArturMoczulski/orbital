import React, { useState } from "react";
import styles from "../styles/Auth.module.css";

interface AuthFormProps {
  onAuthSuccess: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const endpoint = isLogin ? `/api/auth/login` : `/api/auth/signup`;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.message || (isLogin ? "Login failed" : "Signup failed")
        );
      }

      if (isLogin) {
        const data = await res.json();
        localStorage.setItem("token", data.token);
        onAuthSuccess();
      } else {
        alert("Signup successful! Please login.");
        setIsLogin(true); // Switch to login form after successful signup
      }
    } catch (error: any) {
      console.error(error);
      setError(error.message);
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h1>{isLogin ? "Login" : "Sign Up"}</h1>
        {error && <div className={styles.error}>{error}</div>}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={styles.input}
          required
        />
        <input
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
        <p className={styles.link} onClick={() => setIsLogin(!isLogin)}>
          {isLogin
            ? "Don't have an account? Sign Up"
            : "Already have an account? Log In"}
        </p>
      </form>
    </div>
  );
};

export default AuthForm;
