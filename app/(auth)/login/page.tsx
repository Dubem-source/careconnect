"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, Activity, LogIn } from "lucide-react";
import { useToast } from "@/components/ToastContext";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setError(error.message);
      showToast(error.message, "error");
      return;
    }

    showToast("Login successful!", "success");

    const role = user?.app_metadata?.role ?? user?.user_metadata?.role;
    if (role === "ADMIN") {
      router.push("/admin/dashboard");
    } else if (role === "DOCTOR") {
      router.push("/staff/dashboard");
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F4F8F7] to-[#E4EFEC] px-4 py-12 selection:bg-[#E1614A]/20">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-[#0B3D3F]/5 border border-gray-100 overflow-hidden">
        
        {/* Brand Header */}
        <div className="bg-[#0B3D3F] px-8 py-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-[#6FCF97]" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">CARECONNECT</h1>
              <p className="text-[10px] tracking-wider text-[#CFE7E3] uppercase font-semibold">Clinic Portal Login</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-5">
          
          <div>
            <label className="block text-xs font-bold text-[#0E5C57] uppercase tracking-wide mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                placeholder="e.g. patient@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0E5C57] uppercase tracking-wide mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F] focus:border-transparent transition-all"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-[#E1614A] bg-[#E1614A]/10 border border-[#E1614A]/20 px-4 py-2.5 rounded-xl font-medium">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E1614A] hover:bg-[#E1614A]/90 text-white font-bold text-sm rounded-xl py-3.5 transition-all shadow-md shadow-[#E1614A]/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              "Logging in..."
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Sign In
              </>
            )}
          </button>

        </form>

        {/* Footer Redirect */}
        <div className="bg-gray-50 border-t border-gray-100 py-4 text-center">
          <p className="text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <a href="/register" className="text-[#0B3D3F] font-bold hover:underline">
              Register here
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
