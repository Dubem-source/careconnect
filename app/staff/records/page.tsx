"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, FileText, Eye } from "lucide-react";

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

export default function DoctorRecordsPage() {
  const supabase = createClient();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [search, setSearch] = useState("");
  const [viewRecord, setViewRecord] = useState<MedicalRecord | null>(null);

  async function loadDoctorRecords() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const apptRes = await fetch("/api/appointments");
      if (apptRes.ok) {
        const appts = await apptRes.json();
        const extracted: MedicalRecord[] = [];
        appts.forEach((a: any) => {
          if (a.status === "COMPLETED" && a.record && a.doctor?.email === user.email) {
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
                doctor: a.doctor
              }
            });
          }
        });
        setRecords(extracted);
      }
    } catch (e) {
      console.error("Failed to load doctor records", e);
    }
  }

  useEffect(() => {
    loadDoctorRecords();
  }, []);

  const filteredRecords = records.filter((rec) => {
    return (
      rec.appointment.patient.fullName.toLowerCase().includes(search.toLowerCase()) ||
      rec.diagnosis.toLowerCase().includes(search.toLowerCase()) ||
      rec.appointment.patient.id.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 bg-[#F4F8F7] flex-1 min-w-0">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-[#0B3D3F] tracking-tight">My Consultation Archive</h2>
          <p className="text-sm text-gray-500 mt-1">Search and view past diagnostic logs and treatments you prescribed.</p>
        </div>
        
        <div className="relative w-full sm:w-[280px] self-start sm:self-auto">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="search"
            placeholder="Search by Patient Name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-white">
              <h3 className="font-bold text-[#0B3D3F] text-base leading-none">My Recent Consultations</h3>
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-400 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-3.5 font-semibold">Patient Name</th>
                    <th className="px-6 py-3.5 font-semibold">Diagnosis Summary</th>
                    <th className="px-6 py-3.5 font-semibold">Date Completed</th>
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
                      <td className="px-6 py-4">
                        <span className="text-xs text-gray-600 line-clamp-1">{rec.diagnosis}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(rec.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => setViewRecord(rec)}
                          className="inline-flex items-center gap-1 bg-[#0B3D3F] hover:bg-[#0E5C57] text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-xs">
                        No medical record logs located matching search parameters.
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
                  </div>
                  <div className="text-[10px] text-gray-500 leading-relaxed bg-gray-50 p-2.5 rounded-xl">
                    <span className="font-bold text-gray-400 block uppercase tracking-wide text-[9px] mb-0.5">Diagnosis</span>
                    {rec.diagnosis}
                  </div>
                  <button
                    onClick={() => setViewRecord(rec)}
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-[#0B3D3F] hover:bg-[#0E5C57] text-white font-bold text-xs py-2 rounded-xl transition-all shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Details
                  </button>
                </div>
              ))}
              {filteredRecords.length === 0 && (
                <div className="p-8 text-center text-gray-400 text-xs">
                  No medical record logs located matching search parameters.
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 border-t border-gray-100 py-3 text-center text-xs font-semibold text-gray-400">
            CareConnect EMR Log
          </div>
        </div>

      </div>

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
