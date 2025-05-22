"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // ShadCN Input component
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // ShadCN Card components
import { cn } from "@/lib/utils";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        // Simulate login process
        setTimeout(() => {
            if (email === "admin" && password === "admin") {
                alert("Logged in successfully as admin!");
            } else {
                setError("Invalid email or password. Try 'admin' as email and 'admin' as password.");
            }
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="relative h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-100">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader>
                    <CardTitle className="text-center text-3xl font-semibold">
                        Welcome Back 👋
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Email
                            </label>
                            <Input
                                type="text"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="admin"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Password
                            </label>
                            <Input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="admin"
                            />
                        </div>
                        {error && (
                            <p className="text-sm text-red-500">{error}</p>
                        )}
                        <Button
                            type="submit"
                            className={cn(
                                "w-full py-2 px-4 rounded-md text-white font-medium",
                                isLoading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
                            )}
                            disabled={isLoading}
                        >
                            {isLoading ? "Logging in..." : "Login"}
                        </Button>
                    </form>
                    <p className="mt-4 text-sm text-center text-gray-600">
                        Don't have an account?{" "}
                        <a
                            href="/register"
                            className="text-blue-500 hover:underline"
                        >
                            Sign up
                        </a>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default Login;