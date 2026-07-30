"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User, Calendar, Phone, Mail, MapPin, Lock, Activity, RefreshCw, Stethoscope, Briefcase, ChevronDown } from "lucide-react";
import { useToast } from "@/components/ToastContext";

type AccountType = "patient" | "practitioner";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();
  
  const [accountType, setAccountType] = useState<AccountType>("patient");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);

  // Form states
  const [patientForm, setPatientForm] = useState({
    fullName: "",
    dob: "",
    gender: "MALE",
    contactNumber: "",
    email: "",
    password: "",
    address: "",
  });

  const [doctorForm, setDoctorForm] = useState({
    fullName: "",
    specialty: "",
    department: "Cardiology",
    phone: "",
    email: "",
    password: "",
  });

  function updatePatient(field: string, value: string) {
    setPatientForm((f) => ({ ...f, [field]: value }));
  }

  function updateDoctor(field: string, value: string) {
    setDoctorForm((f) => ({ ...f, [field]: value }));
  }

  function handleReset() {
    setError(null);
    if (accountType === "patient") {
      setPatientForm({
        fullName: "",
        dob: "",
        gender: "MALE",
        contactNumber: "",
        email: "",
        password: "",
        address: "",
      });
    } else {
      setDoctorForm({
        fullName: "",
        specialty: "",
        department: "Cardiology",
        phone: "",
        email: "",
        password: "",
      });
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (accountType === "patient") {
      // 1. Patient Registration Validations
      if (!patientForm.email.includes("@")) {
        setError("Email must contain '@' domain.");
        showToast("Email must contain '@' domain.", "error");
        setLoading(false);
        return;
      }
      if (!/^\d{11}$/.test(patientForm.contactNumber)) {
        setError("Phone number must be exactly 11 numeric digits.");
        showToast("Phone number must be exactly 11 numeric digits.", "error");
        setLoading(false);
        return;
      }

      // Supabase Sign Up
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: patientForm.email,
        password: patientForm.password,
        options: { data: { role: "PATIENT", fullName: patientForm.fullName } },
      });

      if (signUpError || !data.user) {
        setError(signUpError?.message ?? "Registration failed");
        showToast(signUpError?.message ?? "Registration failed", "error");
        setLoading(false);
        return;
      }

      // Write role into app_metadata via server-side service role key
      await fetch("/api/auth/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: data.user.id, role: "PATIENT" }),
      });

      // Create Patient Row
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: patientForm.fullName,
          dob: patientForm.dob,
          gender: patientForm.gender,
          contactNumber: patientForm.contactNumber,
          email: patientForm.email,
          address: patientForm.address,
        }),
      });

      if (!res.ok) {
        setLoading(false);
        const body = await res.json();
        const msg = body.error?.formErrors?.[0] ?? "Could not save patient demographic profile";
        setError(msg);
        showToast(msg, "error");
        return;
      }

      // Sign in immediately so the session is active for the middleware
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: patientForm.email,
        password: patientForm.password,
      });

      setLoading(false);
      showToast("Registration successful! Welcome to CareConnect.", "success");
      router.push("/dashboard");
      router.refresh();

    } else {
      // 2. Doctor Registration Validations
      if (!doctorForm.email.includes("@")) {
        setError("Email must contain '@' domain.");
        showToast("Email must contain '@' domain.", "error");
        setLoading(false);
        return;
      }
      if (!/^\d{11}$/.test(doctorForm.phone)) {
        setError("Phone number must be exactly 11 numeric digits.");
        showToast("Phone number must be exactly 11 numeric digits.", "error");
        setLoading(false);
        return;
      }

      let formattedDocName = doctorForm.fullName.trim();
      if (!formattedDocName.toLowerCase().startsWith("dr.")) {
        formattedDocName = `Dr. ${formattedDocName}`;
      }

      // Supabase Sign Up
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: doctorForm.email,
        password: doctorForm.password,
        options: { data: { role: "DOCTOR", fullName: formattedDocName } },
      });

      if (signUpError || !data.user) {
        setError(signUpError?.message ?? "Practitioner registration failed");
        showToast(signUpError?.message ?? "Practitioner registration failed", "error");
        setLoading(false);
        return;
      }

      // Write role into app_metadata via server-side service role key
      await fetch("/api/auth/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: data.user.id, role: "DOCTOR" }),
      });

      // Create Doctor Row (approved defaults to false)
      const res = await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authUserId: data.user.id,
          fullName: formattedDocName,
          specialty: doctorForm.specialty,
          department: doctorForm.department,
          phone: doctorForm.phone,
          email: doctorForm.email,
        }),
      });

      if (!res.ok) {
        setLoading(false);
        const body = await res.json();
        const msg = body.error ?? "Failed to register practitioner application.";
        setError(msg);
        showToast(msg, "error");
        return;
      }

      // Sign in immediately so the session is active for the middleware
      await supabase.auth.signInWithPassword({
        email: doctorForm.email,
        password: doctorForm.password,
      });

      setLoading(false);
      showToast("Application submitted! Your account is pending admin approval.", "success");
      router.push("/staff/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F4F8F7] to-[#E4EFEC] px-4 py-12 selection:bg-[#E1614A]/20">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        
        {/* Brand Header */}
        <div className="bg-[#0B3D3F] px-8 py-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-[#6FCF97]" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">CARECONNECT</h1>
              <p className="text-[10px] tracking-wider text-[#CFE7E3] uppercase font-semibold">Portal Registration & Application Form</p>
            </div>
          </div>
        </div>

        {/* Option Selection Cards */}
        <div className="px-8 pt-6 grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => { setAccountType("patient"); setError(null); }}
            className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
              accountType === "patient"
                ? "border-[#E1614A] bg-[#E1614A]/5"
                : "border-gray-100 bg-white hover:border-gray-200"
            }`}
          >
            <User className={`w-6 h-6 ${accountType === "patient" ? "text-[#E1614A]" : "text-gray-400"}`} />
            <div className="mt-4">
              <span className="font-bold text-sm text-[#0B3D3F] block">Register as Patient</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">Schedule appointments & view records</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => { setAccountType("practitioner"); setError(null); }}
            className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
              accountType === "practitioner"
                ? "border-[#E1614A] bg-[#E1614A]/5"
                : "border-gray-100 bg-white hover:border-gray-200"
            }`}
          >
            <Stethoscope className={`w-6 h-6 ${accountType === "practitioner" ? "text-[#E1614A]" : "text-gray-400"}`} />
            <div className="mt-4">
              <span className="font-bold text-sm text-[#0B3D3F] block">Apply as Practitioner</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">Manage queues & consultation logs</span>
            </div>
          </button>
        </div>

        <form onSubmit={handleRegister} className="p-8 pt-6 space-y-5">
          
          {/* PATIENT SIGNUP FIELDS */}
          {accountType === "patient" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#0E5C57] uppercase tracking-wide mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      required
                      placeholder="e.g. John Doe"
                      value={patientForm.fullName}
                      onChange={(e) => updatePatient("fullName", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E5C57] uppercase tracking-wide mb-1.5">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      type="date"
                      required
                      value={patientForm.dob}
                      onChange={(e) => updatePatient("dob", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F] focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#0E5C57] uppercase tracking-wide mb-1.5">Gender</label>
                  <div className="flex gap-4 py-2">
                    {["MALE", "FEMALE", "OTHER"].map((g) => (
                      <label key={g} className="inline-flex items-center gap-1.5 cursor-pointer text-sm font-semibold text-gray-700">
                        <input
                          type="radio"
                          name="gender"
                          value={g}
                          checked={patientForm.gender === g}
                          onChange={(e) => updatePatient("gender", e.target.value)}
                          className="w-4 h-4 text-[#0E5C57] focus:ring-[#0B3D3F]"
                        />
                        {g.charAt(0) + g.slice(1).toLowerCase()}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E5C57] uppercase tracking-wide mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      required
                      placeholder="e.g. 08012345678"
                      value={patientForm.contactNumber}
                      onChange={(e) => updatePatient("contactNumber", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F] focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#0E5C57] uppercase tracking-wide mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. patient@example.com"
                      value={patientForm.email}
                      onChange={(e) => updatePatient("email", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E5C57] uppercase tracking-wide mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="At least 6 characters"
                      value={patientForm.password}
                      onChange={(e) => updatePatient("password", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F] focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E5C57] uppercase tracking-wide mb-1.5">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea
                    required
                    placeholder="Residential address"
                    value={patientForm.address}
                    onChange={(e) => updatePatient("address", e.target.value)}
                    rows={2}
                    className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F] focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PRACTITIONER SIGNUP FIELDS */}
          {accountType === "practitioner" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#0E5C57] uppercase tracking-wide mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      required
                      placeholder="e.g. Dr. Jane Smith"
                      value={doctorForm.fullName}
                      onChange={(e) => updateDoctor("fullName", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E5C57] uppercase tracking-wide mb-1.5">Specialty Designation</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      required
                      placeholder="e.g. Cardiologist"
                      value={doctorForm.specialty}
                      onChange={(e) => updateDoctor("specialty", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F] focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#0E5C57] uppercase tracking-wide mb-1.5">Department</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setDeptDropdownOpen(!deptDropdownOpen)}
                      className="w-full flex items-center justify-between rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0B3D3F] transition-all text-left"
                    >
                      <span>{doctorForm.department}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                    {deptDropdownOpen && (
                      <div className="absolute left-0 mt-1.5 w-full bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-100">
                        {["Cardiology", "Neurology", "Pediatrics", "Family Medicine", "Emergency", "General Medicine"].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => {
                              updateDoctor("department", val);
                              setDeptDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2 text-sm hover:bg-gray-50 transition-colors ${
                              doctorForm.department === val ? "text-[#E1614A] font-bold" : "text-gray-700"
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E5C57] uppercase tracking-wide mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      required
                      placeholder="e.g. 08012345678"
                      value={doctorForm.phone}
                      onChange={(e) => updateDoctor("phone", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F] focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#0E5C57] uppercase tracking-wide mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. doctor@careconnect.com"
                      value={doctorForm.email}
                      onChange={(e) => updateDoctor("email", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0E5C57] uppercase tracking-wide mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="At least 6 characters"
                      value={doctorForm.password}
                      onChange={(e) => updateDoctor("password", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F] focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Validation Notice Box */}
          <div className="bg-[#F4F8F7] border border-gray-100 rounded-xl p-4 flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-[#0E5C57] uppercase tracking-wider">Validation Rules:</span>
            <ul className="text-xs text-gray-500 list-disc list-inside space-y-0.5">
              <li>Email address must contain a valid <span className="font-semibold text-[#0B3D3F]">@</span> domain.</li>
              <li>Phone number must be exactly <span className="font-semibold text-[#0B3D3F]">11 digits</span> (numeric only).</li>
              {accountType === "practitioner" && (
                <li className="text-[#E1614A] font-semibold">Practitioner applications must be approved by the clinic administrator before logging in.</li>
              )}
            </ul>
          </div>

          {error && (
            <p className="text-sm text-[#E1614A] bg-[#E1614A]/10 border border-[#E1614A]/20 px-4 py-2.5 rounded-xl font-medium">
              {error}
            </p>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-6">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 border border-gray-200 text-[#0E5C57] font-semibold text-sm rounded-xl px-5 py-3 hover:bg-gray-50 hover:text-[#E1614A] transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Form
            </button>

            <button
              type="submit"
              disabled={loading}
              className="bg-[#E1614A] hover:bg-[#E1614A]/90 text-white font-bold text-sm rounded-xl px-8 py-3 transition-all shadow-md shadow-[#E1614A]/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Registering..." : accountType === "patient" ? "Submit Registration" : "Submit Application"}
            </button>
          </div>

        </form>

        {/* Footer Redirect */}
        <div className="bg-gray-50 border-t border-gray-100 py-4 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{" "}
            <a href="/login" className="text-[#0B3D3F] font-bold hover:underline">
              Log in here
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
