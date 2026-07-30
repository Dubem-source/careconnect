"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Calendar, ShieldCheck, FileText, Activity, Users, 
  ArrowRight, ClipboardList, Menu, X 
} from "lucide-react";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#F4F8F7] to-[#E4EFEC] text-[#0B3D3F] selection:bg-[#E1614A]/20">
      
      {/* Premium Responsive Header */}
      <header className="w-full bg-transparent sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#0B3D3F] text-white p-2.5 rounded-xl shadow-md shadow-[#0B3D3F]/10">
              <Activity className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-[#0B3D3F] block">CareConnect</span>
              <span className="text-[10px] tracking-widest text-[#0E5C57] font-bold uppercase block -mt-1">Clinic Portal</span>
            </div>
          </div>
          
          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm font-semibold text-[#0E5C57] hover:text-[#E1614A] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="bg-[#0B3D3F] hover:bg-[#0E5C57] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm"
            >
              Register Account
            </Link>
          </nav>

          {/* Mobile Hamburger toggle button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-[#0B3D3F] hover:bg-[#E4EFEC] rounded-xl transition-all"
            aria-label="Toggle Menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu Panel */}
        {menuOpen && (
          <div className="md:hidden bg-white border-b border-gray-100 px-6 py-5 space-y-4 shadow-xl animate-in slide-in-from-top-5 duration-200">
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="block text-sm font-bold text-[#0B3D3F] hover:text-[#E1614A] transition-colors py-2 border-b border-gray-50"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              onClick={() => setMenuOpen(false)}
              className="block text-center bg-[#0B3D3F] hover:bg-[#0E5C57] text-white text-sm font-bold py-3 rounded-xl transition-all shadow-md"
            >
              Register Account
            </Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 flex flex-col lg:flex-row items-center justify-center gap-12 py-12 lg:py-24">
        
        {/* Left: Marketing Copy */}
        <div className="flex-1 text-center lg:text-left space-y-6 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-[#E4EFEC] border border-[#6FCF97]/30 text-[#0E5C57] text-xs font-bold px-4 py-2 rounded-full tracking-wide uppercase">
            <ClipboardList className="w-4 h-4 text-[#E1614A]" />
            CareConnect Workspace Platform
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-[#0B3D3F]">
            Clinic scheduling <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E1614A] to-[#FF8C75]">
              without the paper.
            </span>
          </h1>
          
          <p className="text-base sm:text-lg text-[#0E5C57]/80 leading-relaxed">
            Transitioning local healthcare operations into a secure, paperless digital workspace. CareConnect simplifies scheduling workflows, centralizes patient history records, and optimizes doctor time management.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#E1614A] hover:bg-[#E1614A]/90 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-md shadow-[#E1614A]/25"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-white hover:bg-gray-50 border border-gray-200 text-[#0B3D3F] font-bold px-8 py-4 rounded-xl transition-all"
            >
              Portal Login
            </Link>
          </div>
        </div>

        {/* Right: Feature Highlights Cards Grid */}
        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="bg-[#F4F8F7] text-[#0B3D3F] w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-[#E1614A]" />
            </div>
            <h3 className="font-bold text-lg text-[#0B3D3F]">Online Scheduling</h3>
            <p className="text-sm text-[#0E5C57]/70 mt-2 leading-relaxed">
              Book, reschedule, or cancel consultations instantly. Fully enforced slot checking prevents overlapping bookings.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="bg-[#F4F8F7] text-[#0B3D3F] w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-[#E1614A]" />
            </div>
            <h3 className="font-bold text-lg text-[#0B3D3F]">Clinical History</h3>
            <p className="text-sm text-[#0E5C57]/70 mt-2 leading-relaxed">
              Centralized access to diagnosis logging, prescription details, and complete treatment records in seconds.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="bg-[#F4F8F7] text-[#0B3D3F] w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-[#E1614A]" />
            </div>
            <h3 className="font-bold text-lg text-[#0B3D3F]">Role-Based Access</h3>
            <p className="text-sm text-[#0E5C57]/70 mt-2 leading-relaxed">
              Differentiated views and permissions for Patients, Physicians/Doctors, and Administrators.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="bg-[#F4F8F7] text-[#0B3D3F] w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-[#E1614A]" />
            </div>
            <h3 className="font-bold text-lg text-[#0B3D3F]">HIPAA Compliant</h3>
            <p className="text-sm text-[#0E5C57]/70 mt-2 leading-relaxed">
              Patient data encryption at rest and in transit. Strict compliance controls for healthcare records.
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#0E5C57]/60 gap-4">
          <p>© {new Date().getFullYear()} CareConnect Appointment System. Developed for clinical portal environments.</p>
          <p className="font-medium text-[#0B3D3F]">Federal University of Technology, Owerri (FUTO)</p>
        </div>
      </footer>

    </div>
  );
}
