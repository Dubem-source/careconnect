"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastContext";
import { Mail, Lock, ShieldCheck, AlertTriangle, Activity } from "lucide-react";

export default function AdminLoginPage() {
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

    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      setError("Invalid credentials. Access denied.");
      showToast("Invalid credentials. Access denied.", "error");
      return;
    }

    const role =
      user?.app_metadata?.role ??
      user?.user_metadata?.role;

    if (role !== "ADMIN") {
      await supabase.auth.signOut();
      setError("Access restricted to authorized clinic administrators only.");
      showToast("Unauthorized. This portal is for administrators only.", "error");
      return;
    }

    showToast("Welcome back, Administrator.", "success");
    router.push("/admin/patients");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F8F7] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-[#0B3D3F] px-8 py-7 flex flex-col items-center gap-3">
          <div className="bg-white/10 p-3 rounded-xl">
            <Activity className="w-7 h-7 text-[#6FCF97]" />
          </div>
          <div className="text-center">
            <h1 className="text-white font-black tracking-tight text-xl">CARECONNECT</h1>
            <span className="text-[#6FCF97] text-[10px] font-bold tracking-widest uppercase">
              Admin Control Panel
            </span>
          </div>
        </div>

        {/* Form Body */}
        <div className="px-8 py-8 space-y-5">

          <h2 className="text-xl font-black text-[#0B3D3F] tracking-tight text-center">
            Administrator Sign In
          </h2>

          {/* Security notice */}
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 font-medium leading-relaxed">
              Restricted access. Unauthorized attempts are logged and reported.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0E5C57] uppercase tracking-wide mb-1.5">
              Administrator Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="username"
                placeholder="admin@careconnect.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0E5C57] uppercase tracking-wide mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                id="admin-password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F] focus:border-transparent transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 text-sm text-[#E1614A] bg-[#E1614A]/10 border border-[#E1614A]/20 px-4 py-3 rounded-xl font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="button"
            id="admin-login-submit"
            disabled={loading}
            onClick={handleLogin as any}
            className="w-full bg-[#E1614A] hover:bg-[#E1614A]/90 text-white font-bold text-sm rounded-xl py-3.5 transition-all shadow-md shadow-[#E1614A]/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Activity className="w-4 h-4 animate-spin" />
                Verifying credentials...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Access Admin Portal
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
