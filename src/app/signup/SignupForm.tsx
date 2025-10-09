"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      // Use Supabase to create the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      setMessage("Account created successfully! Check your email to confirm.");
      // Optional: redirect after short delay
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: any) {
      console.error(err);
      setMessage(`${err.message || "Error creating account"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-600">Sign Up</h1>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4 text-gray-400">
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-pink-600 text-white py-3 rounded-md hover:bg-pink-700 transition disabled:opacity-50"
        >
          {isLoading ? "Signing up..." : "Sign Up"}
        </button>
      </form>

      {message && (
        <p className="mt-4 text-center text-sm text-green-700">{message}</p>
      )}
    </div>
  );
}
