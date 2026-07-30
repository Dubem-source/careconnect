"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastContext";
import { Settings, Shield, Clock, BookOpen, Save, Check, ChevronDown } from "lucide-react";

const SLOT_LABELS: Record<string, string> = {
  "15": "15 minutes per patient",
  "30": "30 minutes per patient",
  "45": "45 minutes per patient",
  "60": "1 hour per patient",
};

export default function DoctorSettingsPage() {
  const supabase = createClient();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  // Doctor Info States
  const [doctorName, setDoctorName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");

  // Work Schedule selection
  const [days, setDays] = useState({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  });

  // Slot Duration
  const [slotDuration, setSlotDuration] = useState("30");
  const [slotDropdownOpen, setSlotDropdownOpen] = useState(false);

  async function loadDoctorProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const docRes = await fetch("/api/doctors");
      if (docRes.ok) {
        const docList = await docRes.json();
        const myProfile = docList.find((d: any) => d.email === user.email);
        if (myProfile) {
          setDoctorName(myProfile.fullName);
          setSpecialty(myProfile.specialty);
          setPhone(myProfile.phone || "");
          setDepartment(myProfile.department || "General Practice");
        }
      }
    } catch (e) {
      console.error("Failed to load doctor profile for settings", e);
    }
  }

  useEffect(() => {
    loadDoctorProfile();
  }, []);

  const toggleDay = (day: keyof typeof days) => {
    setDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    
    // Simulate updating API
    setTimeout(() => {
      setSaving(false);
      showToast("Availability and profile settings saved successfully!", "success");
    }, 1000);
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 bg-[#F4F8F7] flex-1 min-w-0">
      
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-black text-[#0B3D3F] tracking-tight">My Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Configure your personal daily consulting schedule, booking slot intervals, and contact information.</p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6 max-w-4xl">
        
        {/* Availability Calendar Selection Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2.5 bg-gray-50/50 rounded-t-2xl">
            <Clock className="w-4 h-4 text-[#0E5C57]" />
            <h3 className="font-bold text-[#0B3D3F] text-sm uppercase tracking-wider">My Active Consulting Days</h3>
          </div>
          
          <div className="p-6 space-y-4">
            <p className="text-xs text-gray-400">Select the days you are available to consult patients at CareConnect. Unchecked days will block patient booking requests.</p>
            
            <div className="flex flex-wrap gap-2.5">
              {(Object.keys(days) as Array<keyof typeof days>).map((day) => {
                const checked = days[day];
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl border capitalize transition-all flex items-center gap-1.5 ${
                      checked 
                        ? "bg-[#0B3D3F] border-[#0B3D3F] text-white shadow-sm" 
                        : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {checked && <Check className="w-3.5 h-3.5" />}
                    {day}
                  </button>
                );
              })}
            </div>

            <div className="border-t border-gray-50 pt-4">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Consultation Slot Interval</label>
              <div className="relative max-w-xs">
                <button
                  type="button"
                  onClick={() => setSlotDropdownOpen(!slotDropdownOpen)}
                  className="w-full flex items-center justify-between rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0B3D3F] transition-all text-left"
                >
                  <span>{SLOT_LABELS[slotDuration] || `${slotDuration} minutes`}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                {slotDropdownOpen && (
                  <div className="absolute left-0 mt-1.5 w-full bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-100">
                    {Object.entries(SLOT_LABELS).map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          setSlotDuration(val);
                          setSlotDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs hover:bg-gray-50 transition-colors ${
                          slotDuration === val ? "text-[#E1614A] font-bold" : "text-gray-700"
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
        </div>

        {/* Doctor Profile Details Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2.5 bg-gray-50/50">
            <BookOpen className="w-4 h-4 text-[#0E5C57]" />
            <h3 className="font-bold text-[#0B3D3F] text-sm uppercase tracking-wider">Professional Profile Info</h3>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Practitioner Name</label>
              <input
                type="text"
                disabled
                value={doctorName}
                className="w-full rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-2.5 text-xs text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Primary Phone Number</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0B3D3F]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Specialty / Category</label>
              <input
                type="text"
                required
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0B3D3F]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Assigned Medical Department</label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0B3D3F]"
              />
            </div>
          </div>
        </div>

        {/* Save Controls */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 bg-[#0B3D3F] hover:bg-[#0E5C57] text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving Changes..." : "Save Settings Settings"}
          </button>
        </div>

      </form>
    </div>
  );
}
