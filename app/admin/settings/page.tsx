"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastContext";
import { Settings, Shield, Clock, Database, Globe, Save, ChevronDown } from "lucide-react";

const SYNC_LABELS: Record<string, string> = {
  "30": "30 seconds",
  "60": "1 minute",
  "300": "5 minutes",
  "600": "10 minutes",
};

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  // Clinic Profile State
  const [clinicName, setClinicName] = useState("CareConnect Family Practice");
  const [supportEmail, setSupportEmail] = useState("support@careconnect.org");
  const [supportPhone, setSupportPhone] = useState("+1 (555) 019-2834");
  
  // Operating Hours State
  const [openTime, setOpenTime] = useState("08:00");
  const [closeTime, setCloseTime] = useState("18:00");
  const [weekendOps, setWeekendOps] = useState(false);

  // Security & System State
  const [autoVerifyDoc, setAutoVerifyDoc] = useState(false);
  const [apiSyncInterval, setApiSyncInterval] = useState("60");
  const [syncDropdownOpen, setSyncDropdownOpen] = useState(false);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    
    // Simulate API persistence
    setTimeout(() => {
      setSaving(false);
      showToast("Clinic settings updated successfully!", "success");
    }, 1000);
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 bg-[#F4F8F7] flex-1 min-w-0">
      
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-black text-[#0B3D3F] tracking-tight">System Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Configure clinic-wide parameters, scheduling hours, and directory synchronization protocols.</p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6 max-w-4xl">
        
        {/* Clinic Info Settings Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2.5 bg-gray-50/50">
            <Globe className="w-4 h-4 text-[#0E5C57]" />
            <h3 className="font-bold text-[#0B3D3F] text-sm uppercase tracking-wider">Clinic Profile</h3>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Clinic Name</label>
              <input
                type="text"
                required
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0B3D3F]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Support Desk Email</label>
              <input
                type="email"
                required
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0B3D3F]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Support Desk Phone</label>
              <input
                type="text"
                required
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0B3D3F]"
              />
            </div>
          </div>
        </div>

        {/* Operating Hours Settings Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2.5 bg-gray-50/50">
            <Clock className="w-4 h-4 text-[#0E5C57]" />
            <h3 className="font-bold text-[#0B3D3F] text-sm uppercase tracking-wider">Operating & Appointment Slots</h3>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Opening Time</label>
                <input
                  type="time"
                  required
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0B3D3F]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Closing Time</label>
                <input
                  type="time"
                  required
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0B3D3F]"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between border-t border-gray-50 pt-3">
              <div>
                <span className="text-xs font-bold text-[#0B3D3F] block">Weekend Slots Available</span>
                <span className="text-[10px] text-gray-400">Allow patient self-booking slots on Saturday/Sunday.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={weekendOps}
                  onChange={(e) => setWeekendOps(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0B3D3F]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Security & System Controls Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2.5 bg-gray-50/50 rounded-t-2xl">
            <Shield className="w-4 h-4 text-[#0E5C57]" />
            <h3 className="font-bold text-[#0B3D3F] text-sm uppercase tracking-wider">System Credentials & Safety</h3>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#0B3D3F] block">Auto-Verify Medical Credentials</span>
                <span className="text-[10px] text-gray-400">Instantly active registers without manual clinic admin approval.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={autoVerifyDoc}
                  onChange={(e) => setAutoVerifyDoc(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0B3D3F]"></div>
              </label>
            </div>

            <div className="border-t border-gray-50 pt-3">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">API Synch Cache Interval (Seconds)</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSyncDropdownOpen(!syncDropdownOpen)}
                  className="w-full flex items-center justify-between rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0B3D3F] transition-all text-left"
                >
                  <span>{SYNC_LABELS[apiSyncInterval] || `${apiSyncInterval} seconds`}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                {syncDropdownOpen && (
                  <div className="absolute left-0 mt-1.5 w-full bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-100">
                    {Object.entries(SYNC_LABELS).map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          setApiSyncInterval(val);
                          setSyncDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs hover:bg-gray-50 transition-colors ${
                          apiSyncInterval === val ? "text-[#E1614A] font-bold" : "text-gray-700"
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

        {/* Save Trigger */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 bg-[#0B3D3F] hover:bg-[#0E5C57] text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving Changes..." : "Save Config Settings"}
          </button>
        </div>

      </form>
    </div>
  );
}
