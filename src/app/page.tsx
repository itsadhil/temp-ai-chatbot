"use client";

import React, { useState } from "react";
import Chatbot from "@/components/chat-box";
import { motion, AnimatePresence } from "framer-motion";

const bubbleColors = [
  "bg-blue-400",
  "bg-purple-400",
  "bg-pink-400",
  "bg-indigo-400",
  "bg-cyan-400",
];

function AnimatedBubbles() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full opacity-30 blur-2xl ${bubbleColors[i % bubbleColors.length]}`}
          style={{
            width: `${80 + Math.random() * 120}px`,
            height: `${80 + Math.random() * 120}px`,
            top: `${Math.random() * 90}%`,
            left: `${Math.random() * 90}%`,
          }}
          animate={{
            y: [0, Math.random() * 40 - 20, 0],
            x: [0, Math.random() * 40 - 20, 0],
          }}
          transition={{
            duration: 8 + Math.random() * 4,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

const HomePage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

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

      setIsLoggedIn(true);
    } catch (error: any) {
      setError(error.message);
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  };

  return (
    <main className="relative w-full h-dvh bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 overflow-hidden">
      <AnimatedBubbles />
      <div className="max-w-4xl mx-auto h-full">
        <AnimatePresence>
          {!isLoggedIn ? (
            <div className="flex items-center justify-center h-full">
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 60, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -60, scale: 0.95 }}
                transition={{ duration: 0.7, type: "spring" }}
                className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-8"
              >
                <motion.form
                  onSubmit={handleLogin}
                  className="space-y-6"
                  animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
                  transition={{ duration: 0.6 }}
                >
                  <h1 className="text-3xl font-extrabold text-center text-blue-700 drop-shadow">
                    Welcome Back!
                  </h1>
                  <motion.input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border border-blue-200 rounded-lg p-3 w-full transition
                      focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500
                      focus:shadow-[0_0_8px_2px_rgba(59,130,246,0.4)]"
                    required
                    whileFocus={{ scale: 1.03 }}
                  />
                  <motion.input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border border-blue-200 rounded-lg p-3 w-full transition
    focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500
    focus:shadow-[0_0_8px_2px_rgba(59,130,246,0.4)]"
                  />
                  <AnimatePresence>
                    {error && (
                      <motion.p
                        key="error"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-red-500 text-center"
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  <motion.button
                    type="submit"
                    className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold shadow-lg hover:from-blue-600 hover:to-purple-600 transition-all"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Login
                  </motion.button>
                  <p className="text-sm text-center text-gray-600">
                    Don't have an account?{" "}
                    <a
                      href="/register"
                      className="text-blue-500 hover:underline font-semibold"
                    >
                      Register
                    </a>
                  </p>
                </motion.form>
              </motion.div>
            </div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.7, type: "spring" }}
              className="flex flex-col h-dvh"
            >
              {/* Chat area */}
              <div className="flex-1 overflow-y-auto">
                <Chatbot />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
};

export default HomePage;