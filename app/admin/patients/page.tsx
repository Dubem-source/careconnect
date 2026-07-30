"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, UserPlus, SlidersHorizontal, ChevronLeft, ChevronRight, MoreVertical, Eye, Heart, Activity, X, ChevronDown } from "lucide-react";

type Patient = {
  id: string;
  fullName: string;
  email: string;
  dob: string;
  contactNumber: string;
  appointments: {
    id: string;
    dateTime: string;
    status: string;
  }[];
};

const STATUS_LABELS: Record<string, string> = {
  ALL: "All Statuses",
  ACTIVE: "Active Only",
  INACTIVE: "Inactive Only",
};

const SORT_LABELS: Record<string, string> = {
  RECENT_VISIT: "Last Visit: Recent",
  NAME_AZ: "Name: A-Z",
  NAME_ZA: "Name: Z-A",
};

export default function PatientsDirectory() {
  const router = useRouter();
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("RECENT_VISIT");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [genderDropdownOpen, setGenderDropdownOpen] = useState(false);
  
  // Quick Add Patient Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    fullName: "",
    dob: "",
    gender: "MALE",
    contactNumber: "",
    email: "",
    address: "",
  });
  const [addError, setAddError] = useState<string | null>(null);
  const [savingPatient, setSavingPatient] = useState(false);

  async function loadPatients() {
    try {
      setIsFetching(true);
      const res = await fetch("/api/patients");
      if (res.ok) {
        setPatients(await res.json());
      }
    } catch (e) {
      console.error("Failed to load patient directory", e);
    } finally {
      setIsFetching(false);
    }
  }

  useEffect(() => {
    loadPatients();
  }, []);

  async function handleAddPatient(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    setSavingPatient(true);

    if (!addForm.email.includes("@")) {
      setAddError("Email must contain a valid domain (@).");
      setSavingPatient(false);
      return;
    }
    if (!/^\d{11}$/.test(addForm.contactNumber)) {
      setAddError("Phone number must be exactly 11 numeric digits.");
      setSavingPatient(false);
      return;
    }

    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });

      if (!res.ok) {
        const body = await res.json();
        setAddError(body.error?.formErrors?.[0] ?? "Failed to register patient profile.");
        setSavingPatient(false);
        return;
      }

      setShowAddModal(false);
      setAddForm({
        fullName: "",
        dob: "",
        gender: "MALE",
        contactNumber: "",
        email: "",
        address: "",
      });
      loadPatients();
    } catch (e) {
      setAddError("Unexpected error saving patient.");
    } finally {
      setSavingPatient(false);
    }
  }

  // Formatting & calculations
  const parsedPatients = patients.map((pat) => {
    const completedAppts = pat.appointments.filter((a) => a.status === "COMPLETED");
    const upcomingAppts = pat.appointments.filter(
      (a) => a.status === "SCHEDULED" || a.status === "CHECKED_IN"
    );

    const lastVisitDate = completedAppts.length > 0 
      ? new Date(completedAppts[0].dateTime).toLocaleDateString(undefined, { dateStyle: "medium" })
      : "—";

    const nextApptDate = upcomingAppts.length > 0
      ? new Date(upcomingAppts[upcomingAppts.length - 1].dateTime).toLocaleDateString(undefined, { dateStyle: "medium" })
      : "—";

    // Active status is defined as having any future scheduled appointments
    const status = upcomingAppts.length > 0 ? "ACTIVE" : "INACTIVE";

    return {
      ...pat,
      lastVisitDate,
      nextApptDate,
      status,
      lastVisitTimestamp: completedAppts.length > 0 ? new Date(completedAppts[0].dateTime).getTime() : 0,
    };
  });

  // Filtered List
  const filteredPatients = parsedPatients.filter((pat) => {
    const matchesSearch = pat.fullName.toLowerCase().includes(search.toLowerCase()) || 
                          pat.email.toLowerCase().includes(search.toLowerCase()) ||
                          pat.id.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "ALL" || pat.status === statusFilter;

    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortOrder === "RECENT_VISIT") {
      return b.lastVisitTimestamp - a.lastVisitTimestamp;
    } else if (sortOrder === "NAME_AZ") {
      return a.fullName.localeCompare(b.fullName);
    } else if (sortOrder === "NAME_ZA") {
      return b.fullName.localeCompare(a.fullName);
    }
    return 0;
  });

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 bg-[#F4F8F7] flex-1 min-w-0">
      
      {/* Header section (Image 4) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-[#0B3D3F] tracking-tight">Patient Directory</h2>
          <p className="text-sm text-gray-500 mt-1">Manage and monitor patient records and appointments.</p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 bg-[#E1614A] hover:bg-[#E1614A]/90 text-white font-bold text-xs rounded-xl px-5 py-3 shadow-md shadow-[#E1614A]/20 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          Add New Patient
        </button>
      </div>

      {/* Filter Options Bar (Image 4) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-[320px]">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            placeholder="Search by name, email or record ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F] focus:border-transparent transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Custom Status Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setStatusDropdownOpen(!statusDropdownOpen);
                setSortDropdownOpen(false);
              }}
              className="min-w-[130px] flex items-center justify-between rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold text-[#0B3D3F] bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F] transition-all"
            >
              <span>{STATUS_LABELS[statusFilter]}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
            {statusDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-40 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-100">
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setStatusFilter(val);
                      setStatusDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs hover:bg-gray-50 transition-colors ${
                      statusFilter === val ? "text-[#E1614A] font-bold" : "text-[#0B3D3F]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom Sort Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setSortDropdownOpen(!sortDropdownOpen);
                setStatusDropdownOpen(false);
              }}
              className="min-w-[150px] flex items-center justify-between rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold text-[#0B3D3F] bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F] transition-all"
            >
              <span>{SORT_LABELS[sortOrder]}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
            {sortDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-100">
                {Object.entries(SORT_LABELS).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setSortOrder(val);
                      setSortDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs hover:bg-gray-50 transition-colors ${
                      sortOrder === val ? "text-[#E1614A] font-bold" : "text-[#0B3D3F]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Directory Table Grid (Image 4) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Patient ID</th>
                <th className="px-6 py-4 font-semibold">Last Visit</th>
                <th className="px-6 py-4 font-semibold">Next Appointment</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredPatients.map((pat) => (
                <tr key={pat.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-bold text-[#0B3D3F] block leading-none">{pat.fullName}</span>
                    <span className="text-[10px] text-gray-400 mt-1 block">{pat.email}</span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-[#0B3D3F] whitespace-nowrap">
                    #CC-{pat.id.slice(-4).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{pat.lastVisitDate}</td>
                  <td className="px-6 py-4 text-[#0B3D3F] font-medium whitespace-nowrap">{pat.nextApptDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      pat.status === "ACTIVE" 
                        ? "bg-[#D9F0E6] text-[#1D8A5C] border-[#6FCF97]/20" 
                        : "bg-gray-100 text-gray-500 border-gray-200"
                    }`}>
                      {pat.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <Link
                      href={`/admin/patients/${pat.id}`}
                      className="inline-flex items-center gap-1.5 border border-gray-200 hover:border-[#0B3D3F] hover:bg-gray-50 text-[#0E5C57] hover:text-[#0B3D3F] font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Profile
                    </Link>
                  </td>
                </tr>
              ))}

              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-xs">
                    {isFetching ? "Loading patient records..." : "No registered patients located in directory index matching query filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View */}
        <div className="block sm:hidden divide-y divide-gray-50">
          {filteredPatients.map((pat) => (
            <div key={pat.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#0B3D3F] text-sm block">{pat.fullName}</span>
                  <span className="text-[10px] text-gray-400 block">ID: #CC-{pat.id.slice(-4).toUpperCase()}</span>
                </div>
                <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${
                  pat.status === "ACTIVE" 
                    ? "bg-[#D9F0E6] text-[#1D8A5C] border-[#6FCF97]/20" 
                    : "bg-gray-100 text-gray-500 border-gray-200"
                }`}>
                  {pat.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500 bg-gray-50 p-2.5 rounded-xl leading-relaxed">
                <div>
                  <span className="block font-bold text-gray-400 uppercase tracking-wide text-[9px] mb-0.5">Last Visit</span>
                  <span>{pat.lastVisitDate}</span>
                </div>
                <div>
                  <span className="block font-bold text-gray-400 uppercase tracking-wide text-[9px] mb-0.5">Next Appt</span>
                  <span>{pat.nextApptDate}</span>
                </div>
              </div>
              <Link
                href={`/admin/patients/${pat.id}`}
                className="w-full inline-flex items-center justify-center gap-1.5 border border-gray-200 hover:border-[#0B3D3F] hover:bg-gray-50 text-[#0E5C57] hover:text-[#0B3D3F] font-bold text-xs py-2 rounded-xl transition-all shadow-sm"
              >
                <Eye className="w-3.5 h-3.5" />
                View Profile
              </Link>
            </div>
          ))}
          {filteredPatients.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-xs">
              {isFetching ? "Loading patient records..." : "No registered patients located in directory index matching query filters."}
            </div>
          )}
        </div>

        {/* Footer pagination info */}
        <div className="bg-gray-50/50 border-t border-gray-100 px-6 py-4 flex items-center justify-between text-xs font-semibold text-gray-400">
          <span>Showing 1 to {filteredPatients.length} of {filteredPatients.length} patients</span>
          <div className="flex items-center gap-2">
            <button className="p-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[#0B3D3F]">Page 1</span>
            <button className="p-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40" disabled>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* QUICK ADD PATIENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#0B3D3F]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="bg-[#0B3D3F] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#6FCF97]" />
                <h4 className="font-bold text-sm uppercase tracking-wide">Add New Patient Profile</h4>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPatient} className="p-6 space-y-4">
              
              <div>
                <label className="block text-[10px] font-bold text-[#0E5C57] uppercase tracking-wide mb-1">Full Name</label>
                <input
                  required
                  placeholder="e.g. Eleanor Vance"
                  value={addForm.fullName}
                  onChange={(e) => setAddForm({...addForm, fullName: e.target.value})}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#0E5C57] uppercase tracking-wide mb-1">DOB</label>
                  <input
                    type="date"
                    required
                    value={addForm.dob}
                    onChange={(e) => setAddForm({...addForm, dob: e.target.value})}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#0E5C57] uppercase tracking-wide mb-1">Phone Number</label>
                  <input
                    required
                    placeholder="11 digits"
                    value={addForm.contactNumber}
                    onChange={(e) => setAddForm({...addForm, contactNumber: e.target.value})}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#0E5C57] uppercase tracking-wide mb-1">Gender</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setGenderDropdownOpen(!genderDropdownOpen)}
                      className="w-full flex items-center justify-between rounded-xl border border-gray-200 px-3.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F] transition-all text-left"
                    >
                      <span className="text-gray-900 capitalize">{addForm.gender.toLowerCase()}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                    {genderDropdownOpen && (
                      <div className="absolute left-0 mt-1.5 w-full bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-100">
                        {["MALE", "FEMALE", "OTHER"].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => {
                              setAddForm({ ...addForm, gender: val });
                              setGenderDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2 text-xs hover:bg-gray-50 transition-colors capitalize ${
                              addForm.gender === val ? "text-[#E1614A] font-bold" : "text-gray-700"
                            }`}
                          >
                            {val.toLowerCase()}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#0E5C57] uppercase tracking-wide mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. vance@email.com"
                    value={addForm.email}
                    onChange={(e) => setAddForm({...addForm, email: e.target.value})}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#0E5C57] uppercase tracking-wide mb-1">Address</label>
                <textarea
                  required
                  placeholder="Residential address details..."
                  value={addForm.address}
                  onChange={(e) => setAddForm({...addForm, address: e.target.value})}
                  rows={2}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F]"
                />
              </div>

              {addError && (
                <div className="text-xs font-semibold text-[#E1614A] bg-[#E1614A]/10 border border-[#E1614A]/20 px-3.5 py-2 rounded-xl">
                  {addError}
                </div>
              )}

              <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="border border-gray-200 text-gray-500 font-semibold text-xs rounded-xl px-4 py-2.5 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPatient}
                  className="bg-[#E1614A] hover:bg-[#E1614A]/90 text-white font-bold text-xs rounded-xl px-5 py-2.5 disabled:opacity-50"
                >
                  {savingPatient ? "Saving..." : "Save Patient Profile"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
