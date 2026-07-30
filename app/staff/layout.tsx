"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  Activity, Users, Clipboard, BarChart3, ShieldCheck, 
  Settings, LogOut, Menu, X, AlertTriangle, ShieldAlert 
} from "lucide-react";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [alertActive, setAlertActive] = useState(false);
  const [practitionerName, setPractitionerName] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserEmail(user.email ?? null);
        const userRole = user.app_metadata?.role ?? user.user_metadata?.role ?? null;
        setRole(userRole);

        if (userRole === "DOCTOR") {
          try {
            const res = await fetch("/api/doctors");
            if (res.ok) {
              const doctorsList = await res.json();
              const matchingDoc = doctorsList.find((d: any) => d.email === user.email);
              if (matchingDoc) {
                let name = matchingDoc.fullName;
                if (!name.toLowerCase().startsWith("dr.")) {
                  name = `Dr. ${name}`;
                }
                setPractitionerName(name);
              }
            }
          } catch (e) {
            console.error("Failed to load doctor name in sidebar", e);
          }
        }
      }
    }
    loadUser();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  // Active link check helper
  const isActive = (path: string) => {
    return pathname.startsWith(path) 
      ? "bg-[#0E5C57] text-white shadow-md shadow-[#0B3D3F]/20" 
      : "text-gray-300 hover:bg-[#0E5C57]/40 hover:text-white";
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F4F8F7] text-gray-900 font-sans selection:bg-[#E1614A]/20">
      
      {/* Waveform Keyframes Styles */}
      <style jsx global>{`
        @keyframes wavePulse {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1.3); }
        }
        .wave-bar {
          display: inline-block;
          width: 3px;
          height: 16px;
          background-color: #6FCF97;
          border-radius: 9999px;
          transform-origin: center;
          animation: wavePulse 1s ease-in-out infinite;
        }
        .wb-1 { animation-delay: 0.1s; }
        .wb-2 { animation-delay: 0.3s; }
        .wb-3 { animation-delay: 0.5s; }
        .wb-4 { animation-delay: 0.2s; }
        .wb-5 { animation-delay: 0.4s; }
      `}</style>

      {/* EMERGENCY ALERT MODAL OVERLAY */}
      {alertActive && (
        <div className="fixed inset-0 z-50 bg-red-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 border-2 border-red-500 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <ShieldAlert className="w-10 h-10" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-red-600 uppercase tracking-tight">Emergency Alert Active</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                A system-wide emergency alert signal has been dispatched. Medical coordinators and trauma response staff are notified.
              </p>
            </div>
            <button
              onClick={() => setAlertActive(false)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-sm py-3 rounded-xl transition-all shadow-md shadow-red-600/20"
            >
              Acknowledge & Dismiss Alert
            </button>
          </div>
        </div>
      )}

      {/* MOBILE CONTAINER HEADER */}
      <header className="lg:hidden w-full bg-[#0B3D3F] text-white px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3">
          {/* Heartbeat Waveform Logo */}
          <div className="flex items-center gap-1 bg-[#0E5C57] p-2 rounded-lg">
            <span className="wave-bar wb-1"></span>
            <span className="wave-bar wb-2"></span>
            <span className="wave-bar wb-3"></span>
            <span className="wave-bar wb-4"></span>
            <span className="wave-bar wb-5"></span>
          </div>
          <span className="text-base font-black tracking-tight">CareConnect</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-1.5 rounded-xl text-[#CFE7E3] hover:bg-[#0E5C57] transition-colors"
          aria-label="Open Navigation"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* MOBILE SLIDE-OUT DRAWER SIDEBAR */}
      <div 
        className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${
          mobileMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {/* Backdrop overlay */}
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Drawer container */}
        <div 
          className={`absolute top-0 bottom-0 left-0 w-[280px] bg-[#0B3D3F] text-white p-6 shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out transform ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-[#0E5C57] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-[#0E5C57] p-2 rounded-lg">
                  <span className="wave-bar wb-1"></span>
                  <span className="wave-bar wb-2"></span>
                  <span className="wave-bar wb-3"></span>
                </div>
                <div>
                  <span className="text-base font-black tracking-tight block">CareConnect</span>
                  <span className="text-[9px] tracking-wider text-[#CFE7E3]/60 font-bold uppercase block -mt-0.5">
                    {role === "ADMIN" ? "Admin" : (practitionerName || "Dr. Practitioner")}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-gray-300 hover:bg-[#0E5C57] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-2">
              <Link
                href={role === "ADMIN" ? "/admin/dashboard" : "/staff/dashboard"}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-bold transition-all ${isActive(role === "ADMIN" ? "/admin/dashboard" : "/staff/dashboard")}`}
              >
                <Activity className="w-5 h-5" />
                Dashboard
              </Link>
              <Link
                href="/admin/patients"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-bold transition-all ${isActive("/admin/patients")}`}
              >
                <Users className="w-5 h-5" />
                Patients
              </Link>
              <Link
                href={role === "ADMIN" ? "/admin/reports" : "/staff/reports"}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-bold transition-all ${isActive(role === "ADMIN" ? "/admin/reports" : "/staff/reports")}`}
              >
                <BarChart3 className="w-5 h-5" />
                Analytics
              </Link>
              <Link
                href={role === "ADMIN" ? "/admin/records" : "/staff/records"}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-bold transition-all ${isActive(role === "ADMIN" ? "/admin/records" : "/staff/records")}`}
              >
                <Clipboard className="w-5 h-5" />
                Records
              </Link>
              <Link
                href={role === "ADMIN" ? "/admin/settings" : "/staff/settings"}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-bold transition-all ${isActive(role === "ADMIN" ? "/admin/settings" : "/staff/settings")}`}
              >
                <Settings className="w-5 h-5" />
                Settings
              </Link>
            </nav>
          </div>

          <div className="space-y-4 pt-6 border-t border-[#0E5C57]">
            <button
              onClick={() => { setMobileMenuOpen(false); setAlertActive(true); }}
              className="w-full bg-[#E1614A] hover:bg-[#E1614A]/90 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 tracking-wide uppercase"
            >
              <AlertTriangle className="w-4 h-4" />
              Emergency Alert
            </button>

            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-between py-2.5 px-4 rounded-xl text-sm font-bold text-red-200 hover:bg-red-950/30 hover:text-red-400 transition-all border border-transparent hover:border-red-900/30"
            >
              <span>Logout</span>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* DESKTOP SIDEBAR PANEL */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0B3D3F] text-white p-6 sticky top-0 h-screen shrink-0 justify-between shadow-xl">
        <div className="space-y-8">
          
          {/* Heartbeat Waveform Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[#0E5C57] p-3 rounded-xl shadow-md">
              <span className="wave-bar wb-1"></span>
              <span className="wave-bar wb-2"></span>
              <span className="wave-bar wb-3"></span>
              <span className="wave-bar wb-4"></span>
              <span className="wave-bar wb-5"></span>
            </div>
            <div>
              <span className="text-lg font-black tracking-tight block">CareConnect</span>
              <span className="text-[9px] tracking-wider text-[#CFE7E3]/60 font-bold uppercase block -mt-0.5">
                {role === "ADMIN" ? "Admin" : (practitionerName || "Dr. Practitioner")}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            <Link
              href={role === "ADMIN" ? "/admin/dashboard" : "/staff/dashboard"}
              className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-bold transition-all ${isActive(role === "ADMIN" ? "/admin/dashboard" : "/staff/dashboard")}`}
            >
              <Activity className="w-5 h-5" />
              Dashboard
            </Link>
            <Link
              href="/admin/patients"
              className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-bold transition-all ${isActive("/admin/patients")}`}
            >
              <Users className="w-5 h-5" />
              Patients
            </Link>
            <Link
              href={role === "ADMIN" ? "/admin/reports" : "/staff/reports"}
              className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-bold transition-all ${isActive(role === "ADMIN" ? "/admin/reports" : "/staff/reports")}`}
            >
              <BarChart3 className="w-5 h-5" />
              Analytics
            </Link>
            <Link
              href={role === "ADMIN" ? "/admin/records" : "/staff/records"}
              className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-bold transition-all ${isActive(role === "ADMIN" ? "/admin/records" : "/staff/records")}`}
            >
              <Clipboard className="w-5 h-5" />
              Records
            </Link>
            <Link
              href={role === "ADMIN" ? "/admin/settings" : "/staff/settings"}
              className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-bold transition-all ${isActive(role === "ADMIN" ? "/admin/settings" : "/staff/settings")}`}
            >
              <Settings className="w-5 h-5" />
              Settings
            </Link>
          </nav>
        </div>

        {/* Bottom Elements: User Session + Emergency Button */}
        <div className="space-y-4 pt-6 border-t border-[#0E5C57]">
          
          {/* Emergency Alert Button */}
          <button
            onClick={() => setAlertActive(true)}
            className="w-full bg-[#E1614A] hover:bg-[#E1614A]/90 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-md shadow-[#E1614A]/25 flex items-center justify-center gap-2 tracking-wide uppercase"
          >
            <AlertTriangle className="w-4 h-4" />
            Emergency Alert
          </button>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-between py-2.5 px-4 rounded-xl text-sm font-bold text-gray-300 hover:bg-[#0E5C57] hover:text-white transition-all"
          >
            <span>Logout</span>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </div>

    </div>
  );
}
