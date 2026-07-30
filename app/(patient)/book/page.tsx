"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  Activity, Search, Clock, Calendar, CheckCircle2, 
  ArrowLeft, ArrowRight, Sparkles, Smile, FileText, CheckCircle 
} from "lucide-react";

type Doctor = {
  id: string;
  fullName: string;
  specialty: string;
  department: string | null;
  approved: boolean;
};

const TIME_SLOTS = [
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:45 AM",
  "11:15 AM",
  "01:30 PM",
  "02:00 PM",
  "03:30 PM",
];

export default function BookAppointmentPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [doctorSearch, setDoctorSearch] = useState("");

  // Selections
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  
  // Calendar selection setup (default to today)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  
  const [reason, setReason] = useState("");
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [creatingBooking, setCreatingBooking] = useState(false);

  // Month navigation state
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());

  async function loadDoctors() {
    try {
      const res = await fetch("/api/doctors");
      if (res.ok) {
        // Only show approved doctors for booking
        const list: Doctor[] = await res.json();
        const approvedDocs = list.filter((d) => d.approved);
        setDoctors(approvedDocs);
        if (approvedDocs.length > 0) {
          setSelectedDoctor(approvedDocs[0]);
        }
      }
    } catch (e) {
      console.error("Failed to load doctor lists", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDoctors();
  }, []);

  const filteredDoctors = doctors.filter((doc) =>
    doc.fullName.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    (doc.specialty && doc.specialty.toLowerCase().includes(doctorSearch.toLowerCase()))
  );

  // Calendar dates math for currentMonthDate
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday, etc.
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    // We adjust Sunday (0) to index 6, Monday (1) to index 0, etc., to match M T W T F S S order
    const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const days = [];
    for (let i = 0; i < adjustedFirstDayIndex; i++) {
      days.push(null); // Placeholders for padding days
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const calendarDays = getDaysInMonth(currentMonthDate);

  function handlePrevMonth() {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1));
  }

  function handleNextMonth() {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1));
  }

  async function handleBookConfirm() {
    if (!selectedDoctor || !selectedDate || !selectedTimeSlot) {
      setBookingError("Please complete your doctor and slot selections.");
      return;
    }
    setStep(3); // Move to review step
  }

  async function handleFinalSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDoctor || !selectedDate || !selectedTimeSlot) return;

    setCreatingBooking(true);
    setBookingError(null);

    // Combine Date and Time Slot
    const [time, modifier] = selectedTimeSlot.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    const bookingDateTime = new Date(selectedDate);
    bookingDateTime.setHours(hours, minutes, 0, 0);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          dateTime: bookingDateTime.toISOString(),
          reasonForVisit: reason || "Routine checkup",
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        setBookingError(body.error?.formErrors?.[0] ?? "Failed to save appointment booking.");
        setCreatingBooking(false);
        return;
      }

      setBookingSuccess(true);
    } catch (e) {
      setBookingError("An unexpected scheduling error occurred.");
    } finally {
      setCreatingBooking(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F8F7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Activity className="w-10 h-10 text-[#E1614A] animate-pulse" />
          <p className="text-[#0B3D3F] font-semibold text-sm">Initializing Booking Module...</p>
        </div>
      </div>
    );
  }

  // SUCCESS BANNER SCREEN
  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F4F8F7] to-[#E4EFEC] flex items-center justify-center p-6 selection:bg-[#E1614A]/20">
        <div className="bg-white max-w-md w-full rounded-2xl border border-gray-100 shadow-xl p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-[#E4EFEC] text-[#0B3D3F] border border-[#6FCF97]/20 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#0B3D3F] tracking-tight">Appointment Scheduled!</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Your visit with <span className="font-bold text-[#0B3D3F]">{selectedDoctor?.fullName.toLowerCase().startsWith("dr.") ? selectedDoctor?.fullName : `Dr. ${selectedDoctor?.fullName}`}</span> has been saved. A confirmation summary is sent to your email.
            </p>
          </div>
          <div className="border border-gray-50 bg-[#F4F8F7] rounded-xl p-4 text-xs text-left text-gray-600 space-y-1.5 font-medium">
            <p>Doctor: <span className="font-bold text-[#0B3D3F]">{selectedDoctor?.fullName.toLowerCase().startsWith("dr.") ? selectedDoctor?.fullName : `Dr. ${selectedDoctor?.fullName}`}</span></p>
            <p>Specialty: <span className="italic text-[#0E5C57]">{selectedDoctor?.specialty}</span></p>
            <p>Date: <span className="font-bold text-[#0B3D3F]">{selectedDate.toLocaleDateString(undefined, { dateStyle: "long" })}</span></p>
            <p>Time Slot: <span className="font-bold text-[#0B3D3F]">{selectedTimeSlot}</span></p>
          </div>
          <button
            onClick={() => {
              router.push("/dashboard");
              router.refresh();
            }}
            className="w-full bg-[#0B3D3F] hover:bg-[#0E5C57] text-white font-bold text-sm py-3 rounded-xl transition-all shadow-md"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F8F7] flex flex-col font-sans selection:bg-[#E1614A]/20">
      
      {/* Brand Header */}
      <header className="w-full bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#0B3D3F] text-white p-2.5 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-lg font-black tracking-tight text-[#0B3D3F]">CareConnect</span>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#0B3D3F] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancel & Return
          </button>
        </div>
      </header>

      {/* Main Scheduling Panel */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col gap-6">
        
        {/* Step Stepper Header (Image 1 matched) */}
        <div className="max-w-xl mx-auto w-full flex items-center justify-between relative px-2 mb-4">
          <div className="absolute left-6 right-6 top-[18px] h-[2px] bg-gray-200 -z-10" />
          
          <div className="flex flex-col items-center gap-1.5">
            <span className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
              step >= 1 ? "bg-[#0B3D3F] border-[#0B3D3F] text-white" : "bg-white border-gray-200 text-gray-400"
            }`}>
              1
            </span>
            <span className="text-[10px] font-bold text-[#0B3D3F] uppercase tracking-wide">Select Doctor</span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <span className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
              step >= 2 ? "bg-[#0B3D3F] border-[#0B3D3F] text-white" : "bg-white border-gray-200 text-gray-400"
            }`}>
              2
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Pick Time</span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <span className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
              step >= 3 ? "bg-[#0B3D3F] border-[#0B3D3F] text-white" : "bg-white border-gray-200 text-gray-400"
            }`}>
              3
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Confirm</span>
          </div>
        </div>

        {/* STEP 1 & 2: SELECTION VIEW (IMAGE 1 GRID LAYOUT) */}
        {step < 3 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Doctor Selection (Image 1 sidebar layout) */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  placeholder="Search specialty or name"
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F]"
                />
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {filteredDoctors.map((doc) => {
                  const isChosen = selectedDoctor?.id === doc.id;
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setSelectedDoctor(doc)}
                      className={`w-full p-4 rounded-xl border text-left flex items-center gap-3 transition-all relative ${
                        isChosen
                          ? "border-[#0B3D3F] bg-[#E4EFEC]/30"
                          : "border-gray-100 hover:border-gray-200 bg-white"
                      }`}
                    >
                      {/* Doctor initial representation / avatar with green online/approved dot */}
                      <div className="w-10 h-10 bg-[#E4EFEC] text-[#0B3D3F] border border-[#6FCF97]/20 rounded-full flex items-center justify-center font-bold text-sm relative">
                        {doc.fullName.charAt(0).toUpperCase()}
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-[#0B3D3F]">{doc.fullName.toLowerCase().startsWith("dr.") ? doc.fullName : `Dr. ${doc.fullName}`}</h4>
                        <span className="inline-block text-[9px] font-bold tracking-wider text-gray-400 uppercase mt-0.5">
                          {doc.specialty}
                        </span>
                      </div>
                    </button>
                  );
                })}

                {filteredDoctors.length === 0 && (
                  <p className="text-center py-6 text-xs text-gray-400">No active doctors located.</p>
                )}
              </div>
            </div>

            {/* Right Column: Calendar & Slots picker (Image 1 calendar grid layout) */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
              
              {/* Calendar Widget */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[#0B3D3F] text-sm uppercase tracking-wide">
                    {currentMonthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handlePrevMonth}
                      className="p-1.5 border border-gray-200 hover:bg-gray-50 rounded-lg text-gray-400"
                    >
                      &lt;
                    </button>
                    <button
                      onClick={handleNextMonth}
                      className="p-1.5 border border-gray-200 hover:bg-gray-50 rounded-lg text-gray-400"
                    >
                      &gt;
                    </button>
                  </div>
                </div>

                {/* Weeks headers (with red weekends) */}
                <div className="grid grid-cols-7 text-center text-xs font-bold text-gray-400">
                  <span>M</span>
                  <span>T</span>
                  <span>W</span>
                  <span>T</span>
                  <span>F</span>
                  <span className="text-red-500">S</span>
                  <span className="text-red-500">S</span>
                </div>

                {/* Days numbers */}
                <div className="grid grid-cols-7 gap-y-2 text-center text-xs font-medium text-gray-700">
                  {calendarDays.map((day, idx) => {
                    if (!day) return <span key={`pad-${idx}`} className="py-2"></span>;
                    
                    const isSelected = selectedDate.toDateString() === day.toDateString();
                    const isToday = new Date().toDateString() === day.toDateString();
                    
                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => setSelectedDate(day)}
                        className={`py-2 rounded-lg font-bold transition-all ${
                          isSelected 
                            ? "bg-[#0B3D3F] text-white" 
                            : isToday 
                              ? "bg-amber-50 text-[#E1614A] border border-[#E1614A]/20" 
                              : "hover:bg-gray-50 text-[#0B3D3F]"
                        }`}
                      >
                        {day.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots Grid */}
              <div className="space-y-4 pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#E1614A]" />
                  <h3 className="font-bold text-xs text-[#0B3D3F] uppercase tracking-wide">Available Time Slots</h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = selectedTimeSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTimeSlot(slot)}
                        className={`py-2 text-xs font-bold rounded-xl border text-center transition-all ${
                          isSelected
                            ? "bg-[#0B3D3F] border-[#0B3D3F] text-white"
                            : "border-gray-200 hover:border-gray-300 text-gray-600 bg-white"
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Confirm Booking Bottom Action (Image 1) */}
              <div className="pt-4 border-t border-gray-50 flex justify-end">
                <button
                  onClick={handleBookConfirm}
                  disabled={!selectedDoctor || !selectedTimeSlot}
                  className="bg-[#E1614A] hover:bg-[#E1614A]/90 text-white font-bold text-xs rounded-xl px-8 py-3.5 shadow-md shadow-[#E1614A]/25 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Confirm Booking
                </button>
              </div>

            </div>

          </div>
        ) : (
          /* STEP 3: SUMMARY CONFIRMATION NOTE FORM */
          <div className="max-w-lg mx-auto w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            
            <div>
              <h3 className="font-bold text-[#0B3D3F] text-base leading-none">Confirm Booking Summary</h3>
              <p className="text-xs text-gray-500 mt-1">Review your selections and provide clinical reason for visit.</p>
            </div>

            <div className="border border-gray-100 bg-[#F4F8F7] rounded-xl p-4 text-xs text-gray-600 space-y-2.5 font-semibold">
              <p>Doctor: <span className="font-bold text-[#0B3D3F]">{selectedDoctor?.fullName.toLowerCase().startsWith("dr.") ? selectedDoctor?.fullName : `Dr. ${selectedDoctor?.fullName}`}</span></p>
              <p>Specialty: <span className="italic text-[#0E5C57]">{selectedDoctor?.specialty}</span></p>
              <p>Date: <span className="font-bold text-[#0B3D3F]">{selectedDate.toLocaleDateString(undefined, { dateStyle: "long" })}</span></p>
              <p>Time Slot: <span className="font-bold text-[#0B3D3F]">{selectedTimeSlot}</span></p>
            </div>

            <form onSubmit={handleFinalSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#0E5C57] uppercase tracking-wide mb-1">Reason for Visit</label>
                <textarea
                  required
                  placeholder="Tell the doctor briefly about symptoms or checkup reasons..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3D3F]"
                />
              </div>

              {bookingError && (
                <div className="text-xs font-semibold text-[#E1614A] bg-[#E1614A]/10 border border-[#E1614A]/20 px-3.5 py-2.5 rounded-xl">
                  {bookingError}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="border border-gray-200 text-gray-500 font-semibold text-xs rounded-xl px-4 py-2.5 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={creatingBooking}
                  className="bg-[#E1614A] hover:bg-[#E1614A]/90 text-white font-bold text-xs rounded-xl px-6 py-2.5 shadow-md shadow-[#E1614A]/25 disabled:opacity-40"
                >
                  {creatingBooking ? "Scheduling Visit..." : "Schedule Appointment"}
                </button>
              </div>
            </form>

          </div>
        )}

      </main>

    </div>
  );
}
