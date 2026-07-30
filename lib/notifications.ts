import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "CareConnect <onboarding@resend.dev>"; // swap for your verified domain later

export async function sendBookingConfirmation(params: {
  to: string;
  patientName: string;
  doctorName: string;
  dateTime: Date;
}) {
  const { to, patientName, doctorName, dateTime } = params;

  return resend.emails.send({
    from: FROM,
    to,
    subject: "Your CareConnect appointment is confirmed",
    html: `
      <p>Hi ${patientName},</p>
      <p>Your appointment with <strong>Dr. ${doctorName}</strong> is confirmed for:</p>
      <p><strong>${dateTime.toLocaleString()}</strong></p>
      <p>We'll send you a reminder 24 hours before. See you then!</p>
      <p>— CareConnect</p>
    `,
  });
}

export async function sendAppointmentReminder(params: {
  to: string;
  patientName: string;
  doctorName: string;
  dateTime: Date;
}) {
  const { to, patientName, doctorName, dateTime } = params;

  return resend.emails.send({
    from: FROM,
    to,
    subject: "Reminder: your appointment is tomorrow",
    html: `
      <p>Hi ${patientName},</p>
      <p>Just a reminder — your appointment with <strong>Dr. ${doctorName}</strong> is coming up:</p>
      <p><strong>${dateTime.toLocaleString()}</strong></p>
      <p>— CareConnect</p>
    `,
  });
}
