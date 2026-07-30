"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Activity, Calendar, Phone, Mail, ArrowLeft, Clock, 
  Plus, ChevronRight, CheckCircle2, Stethoscope, FileText, Pill, X, ChevronDown 
} from "lucide-react";

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
  status: string;
  reasonForVisit: string | null;
  doctor: { fullName: string; specialty: string };
  record: MedicalRecord | null;
};

type Patient = {
  id: string;
  fullName: string;
  dob: string;
  gender: string;
  contactNumber: string;
  email: string;
  address: string | null;
  appointments: Appointment[];
};

type DoctorList = {
  id: string;
  fullName: string;
  specialty: string;
};

export default function PatientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctors, setDoctors] = useState<DoctorList[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"history" | "records" | "prescriptions">("history");
  
  // Note Modal States
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [prescription, setPrescription] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [doctorDropdownOpen, setDoctorDropdownOpen] = useState(false);

  // Full note review overlay
  const [viewRecord, setViewRecord] = useState<MedicalRecord | null>(null);

  async function loadData() {
    try {
      const res = await fetch(`/api/patients/${id}`);
      if (res.ok) {
        setPatient(await res.json());
      }
      
      const docRes = await fetch("/api/doctors");
      if (docRes.ok) {
        const docList = await docRes.json();
        setDoctors(docList);
        if (docList.length > 0) {
          setSelectedDoctorId(docList[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load patient history details", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  async function handleAddConsultNote(e: React.FormEvent) {
    e.preventDefault();
    setNoteError(null);
    if (diagnosis.trim().length < 3) {
      setNoteError("Diagnosis text is required.");
      return;
    }

    setSavingNote(true);

    try {
      // 1. Create a Walk-In appointment
      const apptRes = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: selectedDoctorId,
          dateTime: new Date().toISOString(),
          reasonForVisit: "Clinic Walk-in Consultation",
        }),
      });

      if (!apptRes.ok) {
        setNoteError("Failed to initialize walk-in appointment record.");
        setSavingNote(false);
        return;
      }

      const appt = await apptRes.json();

      // 2. Automatically check-in the appointment
      await fetch(`/api/appointments/${appt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CHECKED_IN" }),
      });

      // 3. Post consultation notes
      const noteRes = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appt.id,
          diagnosis,
          treatmentPlan: treatment || undefined,
          prescription: prescription || undefined,
        }),
      });

      if (!noteRes.ok) {
        setNoteError("Failed to save clinical medical record.");
        setSavingNote(false);
        return;
      }

      // Success
      setShowNoteModal(false);
      setDiagnosis("");
      setTreatment("");
      setPrescription("");
      loadData();
    } catch (e) {
      setNoteError("Unexpected error writing clinical consultation log.");
    } finally {
      setSavingNote(false);
    }
  }

  if (loading) {
    return null;
  }

  if (!patient) {
    return (
      <div className="p-8 text-center text-gray-500 text-xs">
        Patient record directory index could not resolve the specified user profile.
      </div>
    );
  }

  // Age calculation helper
  const birthYear = new Date(patient.dob).getFullYear();
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;

  const completedAppointments = patient.appointments.filter(
    (a) => a.status === "COMPLETED" && a.record
  );

  return (
    <div className="p-4 sm:p-8 space-y-6 bg-[#F4F8F7] flex-1 min-w-0">
      
      {/* Navigation breadcrumb */}
      <div className="flex items-center gap-2">
        <Link 
          href="/admin/patients" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-[#0B3D3F] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Directory
        </Link>
      </div>

      {/* Demographic Panel (Image 2) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
          {/* Avatar circle representation */}
          <div className="w-16 h-16 bg-[#E4EFEC] text-[#0B3D3F] border border-[#6FCF97]/20 rounded-full flex items-center justify-center font-black text-xl shadow-inner">
            {patient.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#0B3D3F] tracking-tight">{patient.fullName}</h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1.5 mt-2 text-xs text-gray-500 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                DOB: {new Date(patient.dob).toLocaleDateString(undefined, { dateStyle: "long" })} ({age} yrs)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                {patient.contactNumber}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                {patient.email}
              </span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => alert("Demographic updates feature coming soon.")}
          className="border border-gray-200 hover:border-[#0B3D3F] text-xs font-bold text-[#0E5C57] rounded-xl px-4 py-2.5 bg-white transition-all shadow-sm self-center md:self-auto"
        >
          Edit Details
        </button>
      </div>

      {/* Tab bar Navigation (Image 2) */}
      <div className="border-b border-gray-200 flex gap-4 text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab("history")}
          className={`py-3 border-b-2 transition-all ${
            activeTab === "history" 
              ? "border-[#E1614A] text-[#0B3D3F]" 
              : "border-transparent text-gray-400 hover:text-[#0B3D3F]"
          }`}
        >
          Appointment History
        </button>
        <button
          onClick={() => setActiveTab("records")}
          className={`py-3 border-b-2 transition-all ${
            activeTab === "records" 
              ? "border-[#E1614A] text-[#0B3D3F]" 
              : "border-transparent text-gray-400 hover:text-[#0B3D3F]"
          }`}
        >
          Medical Records
        </button>
        <button
          onClick={() => setActiveTab("prescriptions")}
          className={`py-3 border-b-2 transition-all ${
            activeTab === "prescriptions" 
              ? "border-[#E1614A] text-[#0B3D3F]" 
              : "border-transparent text-gray-400 hover:text-[#0B3D3F]"
          }`}
        >
          Prescriptions
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="space-y-6">
        
        {/* APPOINTMENT HISTORY TIMELINE (IMAGE 2) */}
        {activeTab === "history" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0B3D3F]">Recent Visits</h3>
              
              <button
                onClick={() => setShowNoteModal(true)}
                className="inline-flex items-center gap-1.5 bg-[#E1614A] hover:bg-[#E1614A]/90 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition-all shadow-[#E1614A]/25"
              >
                <Plus className="w-4 h-4" />
                Add Consultation Note
              </button>
            </div>

            {/* Vertical Timeline */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
              {completedAppointments.map((appt) => (
                <div key={appt.id} className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all">
                  {/* Circle locator dot */}
                  <span className="absolute -left-[23px] top-6 w-3 h-3 rounded-full bg-[#0B3D3F] ring-4 ring-[#E4EFEC] z-10" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-50 pb-3 mb-3">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                        {new Date(appt.dateTime).toLocaleDateString(undefined, { dateStyle: "long" })} • {new Date(appt.dateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <h4 className="text-base font-bold text-[#0B3D3F] mt-1">
                        {appt.reasonForVisit ?? "Consultation Visit"}
                      </h4>
                      <span className="text-xs text-[#0E5C57] font-semibold mt-0.5 block">
                        Attending Physician: {appt.doctor.fullName.toLowerCase().startsWith("dr.") ? appt.doctor.fullName : `Dr. ${appt.doctor.fullName}`} ({appt.doctor.specialty})
                      </span>
                    </div>
                    <span className="inline-flex self-start sm:self-center text-[10px] font-bold px-2.5 py-1 rounded-full border bg-[#E4EFEC] text-[#0B3D3F] border-[#0B3D3F]/10">
                      Completed
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <span className="font-bold text-[#0E5C57] uppercase tracking-wide text-[10px] block">Diagnosis Summary</span>
                    <p className="text-gray-600 leading-relaxed italic">&quot;{appt.record?.diagnosis}&quot;</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-50 flex justify-end">
                    <button
                      onClick={() => setViewRecord(appt.record)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#0B3D3F] hover:underline"
                    >
                      View Full Note
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              ))}

              {completedAppointments.length === 0 && (
                <p className="text-xs text-gray-400 py-6 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                  No completed medical consultations recorded on this patient profile.
                </p>
              )}
            </div>

          </div>
        )}

        {/* MEDICAL RECORDS TABS */}
        {activeTab === "records" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#0B3D3F] uppercase tracking-wide flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#E1614A]" />
              Diagnostic Logs
            </h3>

            <div className="divide-y divide-gray-50">
              {completedAppointments.map((appt) => (
                <div key={appt.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#0B3D3F]">{appt.record?.diagnosis}</span>
                    <span className="text-gray-400">{new Date(appt.dateTime).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    <span className="font-semibold text-gray-700 block mb-0.5">Treatment Plan:</span>
                    {appt.record?.treatmentPlan ?? "No treatment plan recorded."}
                  </p>
                </div>
              ))}
              {completedAppointments.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">No diagnostic history available.</p>
              )}
            </div>
          </div>
        )}

        {/* PRESCRIPTIONS TAB */}
        {activeTab === "prescriptions" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#0B3D3F] uppercase tracking-wide flex items-center gap-2">
              <Pill className="w-4 h-4 text-[#E1614A]" />
              Prescribed Medications
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedAppointments.filter(a => a.record?.prescription).map((appt) => (
                <div key={appt.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0B3D3F] bg-[#E4EFEC] px-2 py-1 rounded-md">Medication Log</span>
                    <span className="text-[10px] text-gray-400">{new Date(appt.dateTime).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-gray-600 font-semibold leading-relaxed italic">
                    &quot;{appt.record?.prescription}&quot;
                  </p>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wide font-bold">
                    Doctor: {appt.doctor.fullName.toLowerCase().startsWith("dr.") ? appt.doctor.fullName : `Dr. ${appt.doctor.fullName}`}
                  </p>
                </div>
              ))}
              {completedAppointments.filter(a => a.record?.prescription).length === 0 && (
                <div className="col-span-2 text-center text-xs text-gray-400 py-4">No active or historic medication prescriptions found.</div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ADD CONSULTATION NOTE MODAL */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 bg-[#0B3D3F]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="bg-[#0B3D3F] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-[#6FCF97]" />
                <h4 className="font-bold text-sm uppercase tracking-wide">Write Clinical Consultation Note</h4>
              </div>
              <button onClick={() => setShowNoteModal(false)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddConsultNote} className="p-6 space-y-4">
              
              <div>
                <label className="block text-[10px] font-bold text-[#0E5C57] uppercase tracking-wide mb-1">Attending Doctor</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDoctorDropdownOpen(!doctorDropdownOpen)}
                    className="w-full flex items-center justify-between rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F] transition-all text-left"
                  >
                    <span className="text-gray-950 truncate">
                      {(() => {
                        const doc = doctors.find((d) => d.id === selectedDoctorId);
                        if (!doc) return "Select Attending Doctor";
                        const prefix = doc.fullName.toLowerCase().startsWith("dr.") ? doc.fullName : `Dr. ${doc.fullName}`;
                        return `${prefix} (${doc.specialty})`;
                      })()}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-1.5" />
                  </button>
                  {doctorDropdownOpen && (
                    <div className="absolute left-0 mt-1.5 w-full max-h-48 overflow-y-auto bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-100">
                      {doctors.map((doc) => {
                        const prefix = doc.fullName.toLowerCase().startsWith("dr.") ? doc.fullName : `Dr. ${doc.fullName}`;
                        const label = `${prefix} (${doc.specialty})`;
                        return (
                          <button
                            key={doc.id}
                            type="button"
                            onClick={() => {
                              setSelectedDoctorId(doc.id);
                              setDoctorDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2 text-xs hover:bg-gray-50 transition-colors truncate ${
                              selectedDoctorId === doc.id ? "text-[#E1614A] font-bold" : "text-gray-700"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#0E5C57] uppercase tracking-wide mb-1">Diagnosis (Required)</label>
                <textarea
                  required
                  placeholder="Enter medical diagnosis details..."
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#0E5C57] uppercase tracking-wide mb-1">Treatment Plan</label>
                <textarea
                  placeholder="Enter planned treatment procedures..."
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#0E5C57] uppercase tracking-wide mb-1">Prescription</label>
                <textarea
                  placeholder="Enter drug prescriptions, dosages..."
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F]"
                />
              </div>

              {noteError && (
                <div className="text-xs font-semibold text-[#E1614A] bg-[#E1614A]/10 border border-[#E1614A]/20 px-3.5 py-2 rounded-xl">
                  {noteError}
                </div>
              )}

              <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="border border-gray-200 text-gray-500 font-semibold text-xs rounded-xl px-4 py-2.5 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNote}
                  className="bg-[#E1614A] hover:bg-[#E1614A]/90 text-white font-bold text-xs rounded-xl px-5 py-2.5 disabled:opacity-50"
                >
                  {savingNote ? "Recording..." : "Save Consultation Note"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* VIEW DETAILS FULL NOTE OVERLAY */}
      {viewRecord && (
        <div className="fixed inset-0 z-50 bg-[#0B3D3F]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="bg-[#0B3D3F] px-6 py-4 text-white flex items-center justify-between">
              <h4 className="font-bold text-sm uppercase tracking-wide">Clinical Consultation Report</h4>
              <button onClick={() => setViewRecord(null)} className="text-white/60 hover:text-white">
                <X className="w-5.5 h-5.5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-gray-600">
              <div>
                <span className="font-bold text-[#0E5C57] uppercase tracking-wide block mb-1">Diagnosis</span>
                <p className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-gray-900 font-semibold italic">
                  &quot;{viewRecord.diagnosis}&quot;
                </p>
              </div>

              <div>
                <span className="font-bold text-[#0E5C57] uppercase tracking-wide block mb-1">Treatment Plan</span>
                <p className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-gray-800 leading-relaxed font-medium">
                  {viewRecord.treatmentPlan ?? "—"}
                </p>
              </div>

              <div>
                <span className="font-bold text-[#0E5C57] uppercase tracking-wide block mb-1">Prescription Details</span>
                <p className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-gray-800 leading-relaxed font-semibold italic">
                  {viewRecord.prescription ?? "—"}
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
