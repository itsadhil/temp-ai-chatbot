"use client";

import React, { useState } from "react";
import Chatbot from "@/components/chat-box";

const HomePage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // State to track login status
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      alert("Login successful!");
      setIsLoggedIn(true); // Set login status to true
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <main className="w-full h-dvh bg-background">
      <div className="max-w-4xl mx-auto h-full">
        {isLoggedIn ? (
          <Chatbot /> // Render Chatbot if logged in
        ) : (
          <div className="h-screen flex items-center justify-center">
            <form onSubmit={handleLogin} className="space-y-4">
              <h1 className="text-2xl font-bold">Login</h1>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border p-2 w-full"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border p-2 w-full"
                required
              />
              {error && <p className="text-red-500">{error}</p>}
              <button type="submit" className="bg-blue-500 text-white px-4 py-2">
                Login
              </button>
              <p className="text-sm text-center">
                Don't have an account?{" "}
                <a href="/register" className="text-blue-500 hover:underline">
                  Register
                </a>
              </p>
            </form>
          </div>
        )}
      </div>
    </main>
  );
};

export default HomePage;