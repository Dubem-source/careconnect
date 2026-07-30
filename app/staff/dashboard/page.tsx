"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastContext";
import { 
  Activity, Users, Calendar, Clock, Stethoscope, CheckCircle, Play, 
  AlertCircle, X, ShieldCheck, Heart, UserPlus, FileText, CheckCircle2, ChevronRight, Ban
} from "lucide-react";

type Appointment = {
  id: string;
  dateTime: string;
  status: "SCHEDULED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED";
  reasonForVisit: string | null;
  patient: { id: string; fullName: string; email: string };
  doctorId: string;
};

type Doctor = {
  id: string;
  fullName: string;
  email: string;
  specialty: string;
  department: string | null;
  approved: boolean;
};

type PatientInfo = {
  id: string;
  fullName: string;
};

const STATUS_BADGES = {
  SCHEDULED: "bg-gray-100 text-gray-600 border-gray-200",
  CHECKED_IN: "bg-[#D9F0E6] text-[#1D8A5C] border-[#6FCF97]/20",
  COMPLETED: "bg-[#E4EFEC] text-[#0B3D3F] border-[#0B3D3F]/10",
  CANCELLED: "bg-red-50 text-red-500 border-red-100",
};

const formatDoctorName = (name: string) => {
  if (!name) return "";
  return name.toLowerCase().startsWith("dr.") ? name : `Dr. ${name}`;
};

export default function StaffDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentDoctorId, setCurrentDoctorId] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(true);

  // Approval Success Modal State
  const [approvedDocName, setApprovedDocName] = useState<string | null>(null);
  
  // Typewriter Animation States
  const [headerText, setHeaderText] = useState("Today's Summary");
  const [animationDone, setAnimationDone] = useState(true);
  const [doctorName, setDoctorName] = useState("");
  
  // Doctor/Staff Dashboard States
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patientsCount, setPatientsCount] = useState(0);

  // Consultation Modal State
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [prescription, setPrescription] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [savingConsult, setSavingConsult] = useState(false);

  // Search queue in doctor portal
  const [queueSearch, setQueueSearch] = useState("");

  async function loadDashboardData() {
    try {
      // 1. Get logged in Auth User
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      
      const userRole = user.app_metadata?.role ?? user.user_metadata?.role ?? null;
      if (userRole === "ADMIN") {
        router.push("/admin/dashboard");
        return;
      }
      setRole(userRole);
      setCurrentUserEmail(user.email ?? null);

      if (userRole === "DOCTOR") {
        let name = user.user_metadata?.fullName;
        if (name) {
          if (!name.toLowerCase().startsWith("dr.")) {
            name = `Dr. ${name}`;
          }
          setDoctorName(name);
        }
      }

      // 2. Fetch doctors/staff
      const docRes = await fetch("/api/doctors");
      let doctorsList: Doctor[] = [];
      if (docRes.ok) {
        doctorsList = await docRes.json();
        setDoctors(doctorsList);
      }

      // If practitioner, check approval status
      if (userRole === "DOCTOR") {
        const matchingProfile = doctorsList.find((d) => d.email === user.email);
        if (matchingProfile) {
          setIsApproved(matchingProfile.approved);
          setCurrentDoctorId(matchingProfile.id);
        } else {
          setIsApproved(false);
          setCurrentDoctorId(null);
        }
      }

      // 3. Fetch appointments
      const apptRes = await fetch("/api/appointments");
      if (apptRes.ok) {
        setAppointments(await apptRes.json());
      }

      // 4. Fetch patients count for admin view
      const patientRes = await fetch("/api/patients");
      if (patientRes.ok) {
        const patientsData = await patientRes.json();
        setPatientsCount(Array.isArray(patientsData) ? patientsData.length : 0);
      }

    } catch (e) {
      console.error("Error fetching dashboard details", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Update doctor name once profile and role are fetched
  useEffect(() => {
    if (role === "DOCTOR" && currentUserEmail && doctors.length > 0) {
      const match = doctors.find((d) => d.email === currentUserEmail);
      if (match) {
        let name = match.fullName;
        if (!name.toLowerCase().startsWith("dr.")) {
          name = `Dr. ${name}`;
        }
        setDoctorName(name);
        setCurrentDoctorId(match.id);
      }
    }
  }, [role, currentUserEmail, doctors]);

  // Typewriter animation effect
  useEffect(() => {
    if (role !== "DOCTOR") {
      setHeaderText("Today's Summary");
      setAnimationDone(true);
      return;
    }

    const targetWelcome = doctorName ? `Welcome ${doctorName}` : "Welcome Doctor";
    const targetSummary = "Today's Summary";

    let isCancelled = false;
    setAnimationDone(false);

    async function startTypewriter() {
      // Step 1: Type "Welcome Dr. [Name]"
      for (let i = 1; i <= targetWelcome.length; i++) {
        if (isCancelled) return;
        setHeaderText(targetWelcome.slice(0, i));
        await new Promise((resolve) => setTimeout(resolve, 60));
      }

      // Pause at welcome message
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Step 2: Backspace "Welcome Dr. [Name]"
      for (let i = targetWelcome.length; i >= 0; i--) {
        if (isCancelled) return;
        setHeaderText(targetWelcome.slice(0, i));
        await new Promise((resolve) => setTimeout(resolve, 30));
      }

      // Pause at blank before summary
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Step 3: Type "Today's Summary"
      for (let i = 1; i <= targetSummary.length; i++) {
        if (isCancelled) return;
        setHeaderText(targetSummary.slice(0, i));
        await new Promise((resolve) => setTimeout(resolve, 60));
      }

      if (!isCancelled) {
        setAnimationDone(true);
      }
    }

    startTypewriter();

    return () => {
      isCancelled = true;
    };
  }, [role, doctorName]);

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

  async function handleCheckIn(apptId: string) {
    try {
      const res = await fetch(`/api/appointments/${apptId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CHECKED_IN" }),
      });
      if (res.ok) {
        showToast("Patient checked-in successfully!", "success");
        loadDashboardData();
      } else {
        showToast("Failed to process patient check-in.", "error");
      }
    } catch (e) {
      showToast("Unexpected check-in error.", "error");
    }
  }

  async function handleSaveConsultation(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAppt) return;
    if (diagnosis.trim().length < 3) {
      setModalError("Diagnosis description is required (min 3 chars).");
      return;
    }

    setSavingConsult(true);
    setModalError(null);

    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: selectedAppt.id,
          diagnosis,
          treatmentPlan: treatmentPlan || undefined,
          prescription: prescription || undefined,
        }),
      });

      if (!res.ok) {
        let errMsg = "Failed to save medical records.";
        try {
          const body = await res.json();
          if (typeof body.error === "string") {
            errMsg = body.error;
          } else if (body.error?.formErrors?.[0]) {
            errMsg = body.error.formErrors[0];
          } else if (body.error?.fieldErrors) {
            const firstKey = Object.keys(body.error.fieldErrors)[0];
            errMsg = body.error.fieldErrors[firstKey][0];
          }
        } catch (jsonErr) {
          errMsg = `Server error (${res.status}): ${res.statusText || "Internal Server Error"}`;
        }
        setModalError(errMsg);
        setSavingConsult(false);
        return;
      }

      // Close modal & reset forms
      setSelectedAppt(null);
      setDiagnosis("");
      setTreatmentPlan("");
      setPrescription("");

      // Refresh data
      loadDashboardData();
    } catch (e) {
      setModalError("A network or configuration exception occurred while saving.");
    } finally {
      setSavingConsult(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F8F7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Activity className="w-10 h-10 text-[#E1614A] animate-pulse" />
          <p className="text-[#0B3D3F] font-semibold text-sm">Loading console details...</p>
        </div>
      </div>
    );
  }



  if (role === "DOCTOR" && !isApproved) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[70vh]">
        <div className="bg-white max-w-lg w-full rounded-2xl border border-gray-100 shadow-xl p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-[#E1614A]/10 rounded-full w-20 h-20 animate-ping duration-1000" />
            <div className="relative bg-[#0B3D3F] text-white p-5 rounded-2xl shadow-lg">
              <Stethoscope className="w-8 h-8 text-[#6FCF97]" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-[#0B3D3F] uppercase tracking-tight">Account Verification Pending</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Your CareConnect practitioner profile has been successfully registered, but your credentials are currently pending review by our clinic administrative office.
            </p>
            <p className="text-xs text-gray-400 font-medium">
              To expedite access to your diagnostic queues and consultation scheduler, please contact the administrative coordinator.
            </p>
          </div>
          <div className="border border-dashed border-gray-100 bg-[#F4F8F7] p-4 rounded-xl text-[10px] text-gray-400 flex items-center gap-2 justify-center">
            <AlertCircle className="w-4 h-4 text-[#E1614A] shrink-0" />
            <span>Clinic Director notification dispatch: APPROVED = FALSE</span>
          </div>
        </div>
      </div>
    );
  }

  // Filter for doctor's own appointments (all scheduled, active, and completed visits)
  const doctorAppointments = appointments.filter(
    (a) => a.doctorId === currentDoctorId
  );

  const totalScheduled = doctorAppointments.length;
  const completedCount = doctorAppointments.filter((a) => a.status === "COMPLETED").length;
  const pendingCheckIn = doctorAppointments.filter((a) => a.status === "SCHEDULED").length;

  // Filter queue based on queueSearch input
  const filteredQueue = doctorAppointments.filter((a) =>
    a.patient.fullName.toLowerCase().includes(queueSearch.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 bg-[#F4F8F7] min-w-0">
      
      {/* Title Header */}
      <div>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#0B3D3F] tracking-tight min-h-[36px] flex items-center">
          <span>{headerText}</span>
          {!animationDone && (
            <span className="inline-block w-1 h-6 ml-1 bg-[#E1614A] animate-pulse"></span>
          )}
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">Real-time patient queue and check-in console.</p>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-3xl font-black text-[#0B3D3F]">{totalScheduled}</p>
            <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wide">Total Scheduled</p>
          </div>
          <div className="bg-[#F4F8F7] p-3 rounded-xl text-[#E1614A]">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-3xl font-black text-[#0B3D3F]">{completedCount}</p>
            <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wide">Completed Visits</p>
          </div>
          <div className="bg-[#E4EFEC] p-3 rounded-xl text-[#0B3D3F]">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-3xl font-black text-[#0B3D3F]">{pendingCheckIn}</p>
            <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wide">Pending Check-In</p>
          </div>
          <div className="bg-amber-50 p-3 rounded-xl text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Patients Queue Board */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        
        {/* Table Controls (Search filter) */}
        <div className="px-6 py-4 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-[#0B3D3F] text-base leading-none">Patient Visit Queue</h3>
            <p className="text-[10px] text-gray-400 mt-1">Clinical schedules manager</p>
          </div>
          
          <div className="relative w-full sm:w-[250px]">
            <input
              placeholder="Search patients..."
              value={queueSearch}
              onChange={(e) => setQueueSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 pl-8 pr-3 py-1.5 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F] focus:border-transparent transition-all"
            />
            <Clock className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-3.5 font-semibold">Date &amp; Time</th>
                <th className="px-6 py-3.5 font-semibold">Patient Name</th>
                <th className="px-6 py-3.5 font-semibold">Reason</th>
                <th className="px-6 py-3.5 font-semibold">Status</th>
                <th className="px-6 py-3.5 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredQueue.map((appt) => {
                const badgeStyle = STATUS_BADGES[appt.status] || "bg-gray-100 text-gray-600";
                return (
                  <tr key={appt.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#0B3D3F] whitespace-nowrap text-xs">
                      {new Date(appt.dateTime).toLocaleDateString(undefined, { dateStyle: "short" })} • {new Date(appt.dateTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 font-bold text-[#0B3D3F]">{appt.patient.fullName}</td>
                    <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{appt.reasonForVisit ?? "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${badgeStyle}`}>
                        {appt.status.replace("_", "-")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {appt.status === "SCHEDULED" && (
                        <button
                          onClick={() => handleCheckIn(appt.id)}
                          className="bg-[#E1614A] hover:bg-[#E1614A]/90 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm"
                        >
                          Check-In
                        </button>
                      )}

                      {appt.status === "CHECKED_IN" && (
                        <button
                          onClick={() => setSelectedAppt(appt)}
                          className="inline-flex items-center gap-1.5 bg-[#0B3D3F] hover:bg-[#0E5C57] text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm"
                        >
                          <Play className="w-3.5 h-3.5 fill-white text-transparent" />
                          Start Visit
                        </button>
                      )}

                      {appt.status === "COMPLETED" && (
                        <span className="inline-flex items-center gap-1 text-xs text-[#1D8A5C] font-bold">
                          <CheckCircle className="w-4 h-4" />
                          Completed
                        </span>
                      )}

                      {appt.status === "CANCELLED" && (
                        <span className="text-xs text-red-400 font-semibold leading-none">Cancelled</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredQueue.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-xs">
                    No active appointments found in your schedule.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View */}
        <div className="block sm:hidden divide-y divide-gray-50">
          {filteredQueue.map((appt) => {
            const badgeStyle = STATUS_BADGES[appt.status] || "bg-gray-100 text-gray-600";
            return (
              <div key={appt.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-[#0B3D3F]">
                      {new Date(appt.dateTime).toLocaleDateString(undefined, { dateStyle: "short" })} • {new Date(appt.dateTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="font-bold text-[#0B3D3F] text-sm block">{appt.patient.fullName}</span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                    {appt.status.replace("_", "-")}
                  </span>
                </div>
                <div className="text-[11px] text-gray-500 bg-gray-50 p-2 rounded-lg leading-relaxed">
                  <span className="font-bold text-gray-400 block uppercase tracking-wide text-[9px] mb-0.5">Reason for Visit</span>
                  {appt.reasonForVisit ?? "—"}
                </div>
                <div className="flex justify-end pt-1">
                  {appt.status === "SCHEDULED" && (
                    <button
                      onClick={() => handleCheckIn(appt.id)}
                      className="w-full bg-[#E1614A] hover:bg-[#E1614A]/90 text-white font-bold text-xs py-2 rounded-xl transition-all shadow-sm text-center"
                    >
                      Check-In Patient
                    </button>
                  )}

                  {appt.status === "CHECKED_IN" && (
                    <button
                      onClick={() => setSelectedAppt(appt)}
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-[#0B3D3F] hover:bg-[#0E5C57] text-white font-bold text-xs py-2 rounded-xl transition-all shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 fill-white text-transparent" />
                      Start Visit
                    </button>
                  )}

                  {appt.status === "COMPLETED" && (
                    <span className="inline-flex items-center gap-1 text-xs text-[#1D8A5C] font-bold">
                      <CheckCircle className="w-4 h-4" />
                      Visit Completed
                    </span>
                  )}

                  {appt.status === "CANCELLED" && (
                    <span className="text-xs text-red-500 font-bold">
                      Cancelled
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {filteredQueue.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-xs">
              No active appointments matching today&apos;s records.
            </div>
          )}
        </div>
      </div>

      {/* Consultation Modal Overlay */}
      {selectedAppt && (
        <div className="fixed inset-0 z-50 bg-[#0B3D3F]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="bg-[#0B3D3F] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-[#6FCF97]" />
                <h4 className="font-bold text-sm uppercase tracking-wide">Consultation & Clinical Notes</h4>
              </div>
              <button 
                onClick={() => setSelectedAppt(null)} 
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConsultation} className="p-6 space-y-4">
              
              {/* Patient info card */}
              <div className="bg-[#F4F8F7] border border-gray-100 rounded-xl p-3.5 text-xs text-gray-600 flex flex-col gap-1.5">
                <div>
                  Patient: <span className="font-bold text-[#0B3D3F]">{selectedAppt.patient.fullName}</span>
                </div>
                <div>
                  Reason for Visit: <span className="italic text-[#0E5C57] font-medium">&quot;{selectedAppt.reasonForVisit ?? "Not provided"}&quot;</span>
                </div>
              </div>

              {/* Diagnosis Input */}
              <div>
                <label className="block text-[10px] font-bold text-[#0E5C57] uppercase tracking-wide mb-1">Diagnosis (Required)</label>
                <textarea
                  required
                  placeholder="Enter medical diagnosis details..."
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F] focus:border-transparent transition-all"
                  rows={2}
                />
              </div>

              {/* Treatment Plan */}
              <div>
                <label className="block text-[10px] font-bold text-[#0E5C57] uppercase tracking-wide mb-1">Treatment Plan (Optional)</label>
                <textarea
                  placeholder="Enter planned treatment procedures..."
                  value={treatmentPlan}
                  onChange={(e) => setTreatmentPlan(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F] focus:border-transparent transition-all"
                  rows={2}
                />
              </div>

              {/* Prescription */}
              <div>
                <label className="block text-[10px] font-bold text-[#0E5C57] uppercase tracking-wide mb-1">Prescription (Optional)</label>
                <textarea
                  placeholder="Enter prescribed medications and dosages..."
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F] focus:border-transparent transition-all"
                  rows={2}
                />
              </div>

              {modalError && (
                <div className="text-xs font-semibold text-[#E1614A] bg-[#E1614A]/10 border border-[#E1614A]/20 px-3.5 py-2 rounded-xl flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {modalError}
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAppt(null)}
                  className="border border-gray-200 text-gray-500 font-semibold text-xs rounded-xl px-4 py-2.5 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingConsult}
                  className="bg-[#E1614A] hover:bg-[#E1614A]/90 text-white font-bold text-xs rounded-xl px-5 py-2.5 transition-all shadow-md shadow-[#E1614A]/25 disabled:opacity-50"
                >
                  {savingConsult ? "Saving note..." : "Save & Complete Visit"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
