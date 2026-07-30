"use client";

import { useEffect, useState } from "react";
import { 
  Search, FileText, Eye, Stethoscope, ShieldAlert, Plus, X, AlertCircle, ChevronDown
} from "lucide-react";

type MedicalRecord = {
  id: string;
  diagnosis: string;
  treatmentPlan: string | null;
  prescription: string | null;
  createdAt: string;
  appointment: {
    dateTime: string;
    reasonForVisit: string | null;
    patient: { id: string; fullName: string; email: string };
    doctor: { fullName: string; email: string };
  };
};

type PatientSelect = {
  id: string;
  fullName: string;
};

type DoctorSelect = {
  id: string;
  fullName: string;
  specialty: string;
};

export default function RecordsArchivePage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [patients, setPatients] = useState<PatientSelect[]>([]);
  const [doctors, setDoctors] = useState<DoctorSelect[]>([]);
  const [search, setSearch] = useState("");

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [prescription, setPrescription] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [savingRecord, setSavingRecord] = useState(false);

  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
  const [doctorDropdownOpen, setDoctorDropdownOpen] = useState(false);

  // Full note review overlay
  const [viewRecord, setViewRecord] = useState<MedicalRecord | null>(null);

  async function loadData() {
    try {
      const apptRes = await fetch("/api/appointments");
      if (apptRes.ok) {
        const appts = await apptRes.json();
        const extracted: MedicalRecord[] = [];
        appts.forEach((a: any) => {
          if (a.status === "COMPLETED" && a.record) {
            extracted.push({
              id: a.record.id,
              diagnosis: a.record.diagnosis,
              treatmentPlan: a.record.treatmentPlan,
              prescription: a.record.prescription,
              createdAt: a.record.createdAt,
              appointment: {
                dateTime: a.dateTime,
                reasonForVisit: a.reasonForVisit,
                patient: a.patient,
                doctor: a.doctor || { fullName: "Clinic Doctor", email: "" }
              }
            });
          }
        });
        setRecords(extracted);
      }

      // Fetch patients for lookup selection dropdown
      const patientRes = await fetch("/api/patients");
      if (patientRes.ok) {
        const pList = await patientRes.json();
        setPatients(Array.isArray(pList) ? pList : []);
        if (pList.length > 0) setSelectedPatientId(pList[0].id);
      }

      // Fetch doctors for list selection
      const doctorRes = await fetch("/api/doctors");
      if (doctorRes.ok) {
        const dList = await doctorRes.json();
        setDoctors(dList);
        if (dList.length > 0) setSelectedDoctorId(dList[0].id);
      }

    } catch (e) {
      console.error("Failed to load records archive data", e);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAddRecord(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    if (!selectedPatientId || !selectedDoctorId || diagnosis.trim().length < 3) {
      setAddError("Patient, Doctor, and Diagnosis are required.");
      return;
    }

    setSavingRecord(true);

    try {
      // 1. Create a Walk-In Appointment
      const apptRes = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: selectedDoctorId,
          dateTime: new Date().toISOString(),
          reasonForVisit: "Walk-In Consultation",
        }),
      });

      if (!apptRes.ok) {
        const errBody = await apptRes.json();
        setAddError(errBody.error ?? "Failed to create appointment log.");
        setSavingRecord(false);
        return;
      }

      const apptData = await apptRes.json();

      // 2. Patch appointment to checked in
      await fetch(`/api/appointments/${apptData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CHECKED_IN" }),
      });

      // 3. Complete consult note record
      const recordRes = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: apptData.id,
          diagnosis,
          treatmentPlan: treatment || undefined,
          prescription: prescription || undefined,
        }),
      });

      if (!recordRes.ok) {
        setAddError("Failed to save clinical records.");
        setSavingRecord(false);
        return;
      }

      // Complete
      setShowAddModal(false);
      setDiagnosis("");
      setTreatment("");
      setPrescription("");
      loadData();

    } catch (e) {
      setAddError("Failed to record entry.");
    } finally {
      setSavingRecord(false);
    }
  }

  const filteredRecords = records.filter((rec) => {
    return (
      rec.appointment.patient.fullName.toLowerCase().includes(search.toLowerCase()) ||
      rec.diagnosis.toLowerCase().includes(search.toLowerCase()) ||
      rec.appointment.patient.id.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 bg-[#F4F8F7] flex-1 min-w-0">
      
      {/* Title Header (Image 5 layout) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-[#0B3D3F] tracking-tight">Medical Records Archive</h2>
          <p className="text-sm text-gray-500 mt-1">Manage, search, and verify all patient health documentation.</p>
        </div>
        
        <div className="relative w-full sm:w-[280px] self-start sm:self-auto">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="search"
            placeholder="Search Patient ID, Name, or SSN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Recent Record Updates Table */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-white">
              <h3 className="font-bold text-[#0B3D3F] text-base leading-none">Recent Record Updates</h3>
              <button 
                onClick={() => setSearch("")}
                className="text-xs text-[#0E5C57] font-bold hover:underline"
              >
                View All
              </button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-400 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-3.5 font-semibold">Patient Name</th>
                    <th className="px-6 py-3.5 font-semibold">Record Type</th>
                    <th className="px-6 py-3.5 font-semibold">Date Modified</th>
                    <th className="px-6 py-3.5 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-[#0B3D3F] block leading-none">{rec.appointment.patient.fullName}</span>
                        <span className="text-[10px] text-gray-400 mt-1 block">ID: #CC-{rec.appointment.patient.id.slice(-4).toUpperCase()}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#E4EFEC] text-[#0B3D3F] border border-[#0B3D3F]/10">
                          Consultation
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(rec.createdAt).toLocaleDateString()} • {new Date(rec.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => setViewRecord(rec)}
                          className="inline-flex items-center gap-1 bg-[#0B3D3F] hover:bg-[#0E5C57] text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-xs">
                        No medical record entries located matching query criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="block sm:hidden divide-y divide-gray-50">
              {filteredRecords.map((rec) => (
                <div key={rec.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#0B3D3F] text-sm block">{rec.appointment.patient.fullName}</span>
                      <span className="text-[10px] text-gray-400 block">ID: #CC-{rec.appointment.patient.id.slice(-4).toUpperCase()}</span>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#E4EFEC] text-[#0B3D3F] border border-[#0B3D3F]/10">
                      Consultation
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500 leading-relaxed bg-gray-50 p-2.5 rounded-xl">
                    <span className="font-bold text-gray-400 block uppercase tracking-wide text-[9px] mb-0.5">Date Modified</span>
                    {new Date(rec.createdAt).toLocaleDateString()} • {new Date(rec.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <button
                    onClick={() => setViewRecord(rec)}
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-[#0B3D3F] hover:bg-[#0E5C57] text-white font-bold text-xs py-2 rounded-xl transition-all shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Record Details
                  </button>
                </div>
              ))}
              {filteredRecords.length === 0 && (
                <div className="p-8 text-center text-gray-400 text-xs">
                  No medical record entries located matching query criteria.
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 border-t border-gray-100 py-3 text-center text-xs font-semibold text-gray-400">
            Records Index Archive
          </div>
        </div>

        {/* Right Sidebar: Entry addition button and notification logs */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Action Trigger Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#0E5C57] tracking-wider uppercase">Administrative Controls</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Create and save clinic diagnostic records directly to patient clinical histories.
            </p>
            <button
              onClick={() => {
                if (patients.length === 0) {
                  alert("No registered patients found. Please add a patient first.");
                  return;
                }
                setShowAddModal(true);
              }}
              className="w-full bg-[#E1614A] hover:bg-[#E1614A]/90 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Manually Add Record
            </button>
          </div>

          {/* Flagged Records Card (Image 5) */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#0E5C57] tracking-wider uppercase">Flagged Records</h3>
            
            <div className="space-y-3">
              <div className="border border-red-100 rounded-xl p-3.5 bg-red-50/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-red-600 uppercase tracking-wide bg-red-100 px-2 py-0.5 rounded-md">
                    Discrepancy: Blood Type
                  </span>
                  <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                </div>
                <p className="text-[10px] text-gray-500 leading-normal">
                  Mismatch detected between lab result history logs for Sarah Connor (#CC-5521).
                </p>
                <button 
                  onClick={() => alert("Verification logs loading...")}
                  className="bg-[#0B3D3F] text-white text-[9px] font-bold px-3 py-1.5 rounded-lg w-full"
                >
                  Review Discrepancy
                </button>
              </div>

              <div className="border border-amber-100 rounded-xl p-3.5 bg-amber-50/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wide bg-amber-100 px-2 py-0.5 rounded-md">
                    Signature Missing
                  </span>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <p className="text-[10px] text-gray-500 leading-normal">
                  Consent documentation for Thomas Anderson requires attending physician verification.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* MANUALLY RECORD LOG MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#0B3D3F]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="bg-[#0B3D3F] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-[#6FCF97]" />
                <h4 className="font-bold text-sm uppercase tracking-wide">Write Clinical Consultation Log</h4>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-white/60 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRecord} className="p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#0E5C57] uppercase tracking-wide mb-1">Select Patient</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setPatientDropdownOpen(!patientDropdownOpen);
                        setDoctorDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F] transition-all text-left"
                    >
                      <span className="text-gray-900 truncate">
                        {patients.find((p) => p.id === selectedPatientId)?.fullName ?? "Select Patient"}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    </button>
                    {patientDropdownOpen && (
                      <div className="absolute left-0 mt-1.5 w-full max-h-48 overflow-y-auto bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-100">
                        {patients.map((pat) => (
                          <button
                            key={pat.id}
                            type="button"
                            onClick={() => {
                              setSelectedPatientId(pat.id);
                              setPatientDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors truncate ${
                              selectedPatientId === pat.id ? "text-[#E1614A] font-bold" : "text-gray-700"
                            }`}
                          >
                            {pat.fullName}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#0E5C57] uppercase tracking-wide mb-1">Select Practitioner</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setDoctorDropdownOpen(!doctorDropdownOpen);
                        setPatientDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F] transition-all text-left"
                    >
                      <span className="text-gray-900 truncate">
                        {(() => {
                          const doc = doctors.find((d) => d.id === selectedDoctorId);
                          if (!doc) return "Select Doctor";
                          return doc.fullName.toLowerCase().startsWith("dr.") ? doc.fullName : `Dr. ${doc.fullName}`;
                        })()}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    </button>
                    {doctorDropdownOpen && (
                      <div className="absolute left-0 mt-1.5 w-full max-h-48 overflow-y-auto bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-100">
                        {doctors.map((doc) => {
                          const formattedName = doc.fullName.toLowerCase().startsWith("dr.") ? doc.fullName : `Dr. ${doc.fullName}`;
                          return (
                            <button
                              key={doc.id}
                              type="button"
                              onClick={() => {
                                setSelectedDoctorId(doc.id);
                                setDoctorDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors truncate ${
                                selectedDoctorId === doc.id ? "text-[#E1614A] font-bold" : "text-gray-700"
                              }`}
                            >
                              {formattedName}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#0E5C57] uppercase tracking-wide mb-1">Diagnosis (Required)</label>
                <textarea
                  required
                  placeholder="Enter medical diagnosis..."
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#0E5C57] uppercase tracking-wide mb-1">Treatment Plan (Optional)</label>
                <textarea
                  placeholder="Enter recommended treatment plan..."
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#0E5C57] uppercase tracking-wide mb-1">Prescribe Medications (Optional)</label>
                <input
                  type="text"
                  placeholder="E.g. Amoxicillin 500mg - 3 times daily for 7 days"
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F]"
                />
              </div>

              {addError && (
                <p className="text-red-500 text-[10px] font-semibold">{addError}</p>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold px-4 py-2 rounded-xl text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRecord}
                  className="bg-[#0B3D3F] hover:bg-[#0E5C57] text-white font-bold px-6 py-2 rounded-xl text-xs transition-all disabled:opacity-50"
                >
                  {savingRecord ? "Saving..." : "Save Record"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* VIEW DETAILS NOTE OVERLAY */}
      {viewRecord && (
        <div className="fixed inset-0 z-50 bg-[#0B3D3F]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="bg-[#0B3D3F] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#6FCF97]" />
                <h4 className="font-bold text-sm uppercase tracking-wide">Consultation Log Detail</h4>
              </div>
              <button onClick={() => setViewRecord(null)} className="text-white/60 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 border-b border-gray-50 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Patient Profile</span>
                  <span className="font-bold text-[#0B3D3F] text-sm block mt-0.5">{viewRecord.appointment.patient.fullName}</span>
                  <span className="text-[10px] text-gray-400">ID: #CC-{viewRecord.appointment.patient.id.slice(-4).toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Attending Practitioner</span>
                  <span className="font-bold text-[#0B3D3F] text-sm block mt-0.5">{viewRecord.appointment.doctor.fullName}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#0E5C57] uppercase tracking-wide block">Diagnosis</span>
                <p className="text-gray-700 bg-gray-50 rounded-xl p-3 border border-gray-100 leading-relaxed font-medium">
                  {viewRecord.diagnosis}
                </p>
              </div>

              {viewRecord.treatmentPlan && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#0E5C57] uppercase tracking-wide block">Treatment Plan</span>
                  <p className="text-gray-700 bg-gray-50 rounded-xl p-3 border border-gray-100 leading-relaxed font-medium">
                    {viewRecord.treatmentPlan}
                  </p>
                </div>
              )}

              {viewRecord.prescription && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#0E5C57] uppercase tracking-wide block">Prescribed Medication</span>
                  <p className="text-[#E1614A] bg-amber-50/30 rounded-xl p-3 border border-amber-200/20 leading-relaxed font-bold italic">
                    &quot;{viewRecord.prescription}&quot;
                  </p>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setViewRecord(null)}
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
