"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Calendar, User, LogOut, Activity, Plus, Clock, FileText, CheckCircle2, Eye, Pill, Heart, X } from "lucide-react";

type MedicalRecord = {
  id: string;
  diagnosis: string;
  treatmentPlan: string | null;
  prescription: string | null;
  createdAt: string;
};

type Appointment = {
  id: string;
  dateTime: string;
  status: "SCHEDULED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED";
  doctor: { fullName: string; specialty: string };
  record?: MedicalRecord | null;
};

type PatientProfile = {
  fullName: string;
  email: string;
  contactNumber: string;
  appointments: Appointment[];
};

const STATUS_CONFIG = {
  SCHEDULED: { bg: "bg-amber-50 border-amber-200 text-amber-700", label: "Scheduled" },
  CHECKED_IN: { bg: "bg-[#D9F0E6] border-[#6FCF97]/30 text-[#1D8A5C]", label: "Checked-In" },
  COMPLETED: { bg: "bg-[#E4EFEC] border-[#0B3D3F]/10 text-[#0B3D3F]", label: "Completed" },
  CANCELLED: { bg: "bg-red-50 border-red-200 text-red-600", label: "Cancelled" },
};

export default function PatientDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile() {
    try {
      const res = await fetch("/api/patients");
      if (res.ok) {
        setProfile(await res.json());
      }
    } catch (e) {
      console.error("Failed to load profile", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F8F7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Activity className="w-10 h-10 text-[#E1614A] animate-pulse" />
          <p className="text-[#0B3D3F] font-semibold text-sm">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const appointments = profile?.appointments ?? [];
  const upcoming = appointments.filter((a) => a.status === "SCHEDULED" || a.status === "CHECKED_IN");
  const nextAppt = upcoming.length > 0 ? upcoming[upcoming.length - 1] : null;

  return (
    <div className="min-h-screen bg-[#F4F8F7] flex flex-col font-sans selection:bg-[#E1614A]/20">
      
      {/* Dashboard Header */}
      <header className="w-full bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-[#0B3D3F] text-white p-2 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold text-[#0B3D3F] block leading-none">CareConnect</span>
              <span className="text-[8px] tracking-widest text-[#0E5C57] font-bold uppercase block mt-0.5">Patient Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-500 hidden sm:inline">
              Logged in as <span className="text-[#0B3D3F] font-bold">{profile?.fullName}</span>
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-[#E1614A] transition-colors border border-gray-200 rounded-lg px-3 py-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-[#0B3D3F]">
              Welcome back, {profile?.fullName}!
            </h2>
            <p className="text-sm text-gray-500">
              Manage your clinic appointments, view details, and book new visits online.
            </p>
          </div>
          <Link
            href="/book"
            className="inline-flex items-center justify-center gap-2 bg-[#E1614A] hover:bg-[#E1614A]/90 text-white font-bold text-sm rounded-xl px-6 py-3.5 transition-all shadow-md shadow-[#E1614A]/25"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Book Appointment
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-[#F4F8F7] p-3 rounded-lg text-[#0B3D3F]">
              <Calendar className="w-6 h-6 text-[#E1614A]" />
            </div>
            <div>
              <p className="text-2xl font-black text-[#0B3D3F]">{appointments.length}</p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Booked</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-[#F4F8F7] p-3 rounded-lg text-[#0B3D3F]">
              <Clock className="w-6 h-6 text-[#E1614A]" />
            </div>
            <div>
              <p className="text-2xl font-black text-[#0B3D3F]">{upcoming.length}</p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Upcoming Visits</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-[#F4F8F7] p-3 rounded-lg text-[#0B3D3F]">
              <CheckCircle2 className="w-6 h-6 text-[#E1614A]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0B3D3F] truncate max-w-[200px]">
                {nextAppt ? `Dr. ${nextAppt.doctor.fullName}` : "None"}
              </p>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Next Consult</p>
            </div>
          </div>
        </div>

        {/* Appointments Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#0B3D3F] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#0E5C57]" />
              Appointment Records
            </h3>
            <span className="text-xs text-gray-400 font-medium">Sorted by latest date</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appointments.map((appt) => {
              const statusInfo = STATUS_CONFIG[appt.status] || { bg: "bg-gray-100 text-gray-500", label: appt.status };
              return (
                <div 
                  key={appt.id} 
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start justify-between hover:shadow-md hover:border-gray-200 transition-all"
                >
                  <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                    <div>
                      <p className="font-bold text-[#0B3D3F] text-base leading-tight">
                        {appt.doctor.fullName.toLowerCase().startsWith("dr.") ? appt.doctor.fullName : `Dr. ${appt.doctor.fullName}`}
                      </p>
                      <p className="text-xs font-semibold text-[#0E5C57]">{appt.doctor.specialty}</p>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1.5 pt-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(appt.dateTime).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </div>
                    
                    {appt.status === "COMPLETED" && appt.record && (
                      <div className="pt-3">
                        <button
                          onClick={() => setSelectedAppt(appt)}
                          className="inline-flex items-center gap-1.5 bg-[#0B3D3F] hover:bg-[#0E5C57] text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm transition-all"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View Consultation Notes
                        </button>
                      </div>
                    )}
                  </div>

                  <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full border shrink-0 ${statusInfo.bg}`}>
                    {statusInfo.label}
                  </span>
                </div>
              );
            })}

            {appointments.length === 0 && (
              <div className="col-span-full bg-white rounded-2xl border border-gray-100 p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm">
                <Calendar className="w-12 h-12 text-gray-300" />
                <div className="space-y-1">
                  <p className="text-base font-bold text-[#0B3D3F]">No appointments scheduled yet</p>
                  <p className="text-sm text-gray-400 max-w-sm">
                    Keep track of your health consultations in one place. Schedule your first appointment with our specialist physicians.
                  </p>
                </div>
                <Link
                  href="/book"
                  className="inline-flex items-center gap-2 bg-[#E1614A] hover:bg-[#E1614A]/90 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all shadow-sm"
                >
                  Book Your First Visit
                </Link>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* VIEW CONSULTATION NOTES MODAL */}
      {selectedAppt && selectedAppt.record && (
        <div className="fixed inset-0 z-50 bg-[#0B3D3F]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="bg-[#0B3D3F] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#6FCF97]" />
                <h4 className="font-bold text-sm uppercase tracking-wide">My Clinical Summary Notes</h4>
              </div>
              <button 
                onClick={() => setSelectedAppt(null)} 
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 border-b border-gray-50 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Attending Practitioner</span>
                  <span className="font-bold text-[#0B3D3F] text-sm block mt-0.5">
                    {selectedAppt.doctor.fullName.toLowerCase().startsWith("dr.") ? selectedAppt.doctor.fullName : `Dr. ${selectedAppt.doctor.fullName}`}
                  </span>
                  <span className="text-[10px] text-gray-400">{selectedAppt.doctor.specialty}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Consultation Date</span>
                  <span className="font-bold text-gray-700 text-xs block mt-1">
                    {new Date(selectedAppt.dateTime).toLocaleDateString(undefined, { dateStyle: "long" })}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#0E5C57] uppercase tracking-wide block">Diagnosed Condition</span>
                <p className="text-gray-700 bg-gray-50 rounded-xl p-3 border border-gray-100 leading-relaxed font-semibold">
                  {selectedAppt.record.diagnosis}
                </p>
              </div>

              {selectedAppt.record.treatmentPlan && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#0E5C57] uppercase tracking-wide block">Recommended Treatment Plan</span>
                  <p className="text-gray-700 bg-gray-50 rounded-xl p-3 border border-gray-100 leading-relaxed font-medium">
                    {selectedAppt.record.treatmentPlan}
                  </p>
                </div>
              )}

              {selectedAppt.record.prescription && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#0E5C57] uppercase tracking-wide block">Prescribed Medication</span>
                  <p className="text-[#E1614A] bg-amber-50/30 rounded-xl p-3.5 border border-amber-200/20 leading-relaxed font-bold italic">
                    &quot;{selectedAppt.record.prescription}&quot;
                  </p>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedAppt(null)}
                  className="bg-[#0B3D3F] hover:bg-[#0E5C57] text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-md"
                >
                  Close Window
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
