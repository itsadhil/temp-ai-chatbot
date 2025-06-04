"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      alert("Account created successfully!");
      router.push("/");
    } catch (error: any) {
      setError(error.message);
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  };

  return (
    <main className="relative w-full h-dvh bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 overflow-hidden">
      <div className="max-w-4xl mx-auto h-full flex items-center justify-center">
        <motion.div
          key="register"
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -60, scale: 0.95 }}
          transition={{ duration: 0.7, type: "spring" }}
          className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-8"
        >
          <motion.form
            onSubmit={handleRegister}
            className="space-y-6"
            animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl font-extrabold text-center text-blue-700 drop-shadow">
              Register
            </h1>
            <motion.input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-blue-200 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-400 focus:border-blue-500 focus:shadow-[0_0_8px_2px_rgba(59,130,246,0.4)] transition"
              required
              whileFocus={{ scale: 1.03 }}
            />
            <motion.input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-blue-200 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-400 focus:border-blue-500 focus:shadow-[0_0_8px_2px_rgba(59,130,246,0.4)] transition"
              required
              whileFocus={{ scale: 1.03 }}
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
              Register
            </motion.button>
            <p className="text-sm text-center text-gray-600">
              Already have an account?{" "}
              <a
                href="/"
                className="text-blue-500 hover:underline font-semibold"
              >
                Login
              </a>
            </p>
          </motion.form>
        </motion.div>
      </div>
    </main>
  );
};

export default Register;