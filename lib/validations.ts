import { z } from "zod";

export const registerPatientSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  dob: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid date"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  contactNumber: z
    .string()
    .regex(/^\d{11}$/, "Phone number must be exactly 11 digits"),
  email: z.string().email("Must be a valid email address"),
  address: z.string().min(5, "Address is required"),
});

export const bookAppointmentSchema = z.object({
  doctorId: z.string().min(1),
  dateTime: z.string().refine((d) => !isNaN(Date.parse(d)), "Invalid date/time"),
  reasonForVisit: z.string().max(500).optional(),
});

export const consultationNoteSchema = z.object({
  appointmentId: z.string().min(1),
  diagnosis: z.string().min(3, "Diagnosis is required"),
  treatmentPlan: z.string().optional(),
  prescription: z.string().optional(),
});

export type RegisterPatientInput = z.infer<typeof registerPatientSchema>;
export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;
export type ConsultationNoteInput = z.infer<typeof consultationNoteSchema>;
