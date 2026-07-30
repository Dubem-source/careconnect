"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastContext";
import { 
  Activity, Users, Calendar, Clock, Stethoscope, CheckCircle, 
  AlertCircle, ShieldCheck, Heart, UserPlus, CheckCircle2, ChevronRight, X
} from "lucide-react";

type Doctor = {
  id: string;
  fullName: string;
  email: string;
  specialty: string;
  department: string | null;
  approved: boolean;
};

type Appointment = {
  id: string;
  dateTime: string;
  status: "SCHEDULED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED";
  reasonForVisit: string | null;
};

const formatDoctorName = (name: string) => {
  if (!name) return "";
  return name.toLowerCase().startsWith("dr.") ? name : `Dr. ${name}`;
};

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientsCount, setPatientsCount] = useState(0);
  const [approvedDocName, setApprovedDocName] = useState<string | null>(null);

  async function loadDashboardData() {
    try {
      // 1. Get logged in Auth User & check authorization
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      
      const role = user.app_metadata?.role ?? user.user_metadata?.role ?? null;
      if (role !== "ADMIN") {
        router.push(role === "DOCTOR" ? "/staff/dashboard" : "/dashboard");
        return;
      }

      // 2. Fetch doctors/staff
      const docRes = await fetch("/api/doctors");
      if (docRes.ok) {
        setDoctors(await docRes.json());
      }

      // 3. Fetch appointments
      const apptRes = await fetch("/api/appointments");
      if (apptRes.ok) {
        setAppointments(await apptRes.json());
      }

      // 4. Fetch patients count
      const patientRes = await fetch("/api/patients");
      if (patientRes.ok) {
        const patientsData = await patientRes.json();
        setPatientsCount(Array.isArray(patientsData) ? patientsData.length : 0);
      }

    } catch (e) {
      console.error("Error fetching admin dashboard details", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function handleApproveDoctor(docId: string) {
    try {
      const docRecord = doctors.find((d) => d.id === docId);
      const res = await fetch("/api/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId: docId, approved: true }),
      });
      if (res.ok) {
        if (docRecord) {
          setApprovedDocName(formatDoctorName(docRecord.fullName));
        }
        showToast("Practitioner registration approved successfully!", "success");
        loadDashboardData();
      } else {
        showToast("Failed to approve practitioner application.", "error");
      }
    } catch (e) {
      showToast("Unexpected error processing approval request.", "error");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F8F7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Activity className="w-10 h-10 text-[#E1614A] animate-pulse" />
          <p className="text-[#0B3D3F] font-semibold text-sm">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const pendingStaff = doctors.filter((d) => !d.approved);
  const activeStaff = doctors.filter((d) => d.approved);
  const completedApptsCount = appointments.filter((a) => a.status === "COMPLETED").length;

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 bg-[#F4F8F7] flex-1 min-w-0">
      
      {/* Title Header */}
      <div>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#0B3D3F] tracking-tight">Clinic Administration</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">Welcome back. Here is what is happening today.</p>
      </div>

      {/* Administration Stat Cards (Image 3) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Total Patients</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#0B3D3F]">{patientsCount}</span>
            <span className="text-xs text-[#1D8A5C] font-bold">↑ Live</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Active Staff</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#0B3D3F]">{activeStaff.length}</span>
            <span className="text-xs text-gray-500 font-semibold">Approved practitioners</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative">
          {pendingStaff.length > 0 && (
            <span className="absolute top-4 right-4 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E1614A] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#E1614A]"></span>
            </span>
          )}
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Pending Approvals</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#0B3D3F]">{pendingStaff.length}</span>
            <span className="text-xs text-[#E1614A] font-bold">Requires Verification</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Completed Consultations</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#0B3D3F]">{completedApptsCount}</span>
            <span className="text-xs text-gray-500 font-semibold">Patient records finalized</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Pending Approvals + Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Verification Queue */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-[#0B3D3F] text-base leading-none">Practitioner Verification Queue</h3>
              <span className="text-xs text-[#E1614A] font-bold">{pendingStaff.length} Pending Review</span>
            </div>

            <div className="divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
              {pendingStaff.map((doc) => (
                <div key={doc.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/30 uppercase tracking-wide">
                      Credentials Pending
                    </span>
                    <h4 className="font-bold text-[#0B3D3F] text-base">{formatDoctorName(doc.fullName)}</h4>
                    <p className="text-xs text-gray-500 font-medium">Specialty: {doc.specialty} • Department: {doc.department || "General Practice"}</p>
                    <p className="text-[10px] text-gray-400">Registry Email: {doc.email}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleApproveDoctor(doc.id)}
                      className="bg-[#0B3D3F] hover:bg-[#0E5C57] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Approve &amp; Verify
                    </button>
                  </div>
                </div>
              ))}

              {pendingStaff.length === 0 && (
                <div className="p-12 text-center text-gray-400 text-xs font-medium space-y-2">
                  <Heart className="w-10 h-10 text-gray-200 mx-auto" />
                  <p>No practitioner verification requests pending review.</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 border-t border-gray-100 py-3 text-center text-xs font-semibold text-gray-400">
            System Identity Provider Registry
          </div>
        </div>

        {/* Right Column: Live Logs */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
            <h3 className="text-xs font-bold text-[#0E5C57] tracking-wider uppercase">Live Activity</h3>
            <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-gray-100">
              
              <div className="flex gap-3 items-start text-xs relative">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold z-10">✓</span>
                <div>
                  <p className="font-bold text-[#0B3D3F]">New Staff Registered</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Database entry added</p>
                </div>
              </div>

              <div className="flex gap-3 items-start text-xs relative">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold z-10">i</span>
                <div>
                  <p className="font-bold text-[#0B3D3F]">Schema Synchronized</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Migration applied successfully</p>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Approved Practitioner Confirmation Modal */}
      {approvedDocName && (
        <div className="fixed inset-0 z-50 bg-[#0B3D3F]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 border border-gray-100 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-16 h-16 bg-[#D9F0E6] text-[#1D8A5C] border border-[#6FCF97]/20 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-[#0B3D3F] tracking-tight">Practitioner Verified</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                {approvedDocName} has been successfully approved. They now have immediate access to their medical queues and calendar.
              </p>
            </div>
            <button
              onClick={() => setApprovedDocName(null)}
              className="w-full bg-[#0B3D3F] hover:bg-[#0E5C57] text-white font-bold text-sm py-3 rounded-xl transition-all shadow-md"
            >
              Close Confirmation
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
