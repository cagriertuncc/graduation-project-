import cron from "node-cron";
import Appointment from "../models/Appointment.js";
import { sendPatientNotification } from "./notify.js";

/**
 * Initialize all scheduled tasks
 */
export const initCronJobs = () => {
    // 1. Appointment Reminders (Runs every hour at minute 0)
    // For production, this could be more frequent or use a different logic
    cron.schedule("0 * * * *", async () => {
        console.log("Running Appointment Reminders Cron Job...");
        await sendUpcomingAppointmentReminders();
    });

    console.log("Cron Jobs Initialized.");
};

/**
 * Scan for appointments happening in the next 24 hours or 1 hour
 * and send notifications if not already sent (though we don't track 'already sent' yet, 
 * we'll use a simple threshold for now)
 */
const sendUpcomingAppointmentReminders = async () => {
    try {
        const now = new Date();

        // Find appointments happening between now and 25 hours from now
        // and status is 'bekliyor'
        const upcoming = await Appointment.find({
            status: "bekliyor",
            date: {
                $gte: new Date(now.toISOString().split('T')[0]),
                $lte: new Date(new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString().split('T')[0])
            }
        }).populate("patientId").populate("doctorId");

        for (const appt of upcoming) {
            // Calculate time difference
            const apptDateTime = new Date(appt.date);
            const [hours, minutes] = appt.time.split(':');
            apptDateTime.setHours(hours, minutes, 0, 0);

            const diffMs = apptDateTime.getTime() - now.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);

            // If it's roughly 24 hours (between 23 and 24) or 1 hour (between 0.5 and 1.5) away
            // In a real system, we'd have a 'reminderSent' flag on the Appointment model
            // For this implementation, we'll just send if it's in those windows

            if (diffHours > 23 && diffHours <= 24) {
                await sendPatientNotification({
                    patientId: appt.patientId._id,
                    title: "Randevu Hatırlatması (24 Saat)",
                    message: `Hatırlatma: Yarın saat ${appt.time}'da Dr. ${appt.doctorId.name} ile randevunuz bulunuyor.`,
                    type: "appointment",
                    link: "/dashboard"
                });
            } else if (diffHours > 0.5 && diffHours <= 1.5) {
                await sendPatientNotification({
                    patientId: appt.patientId._id,
                    title: "Randevu Hatırlatması (1 Saat)",
                    message: `Hatırlatma: Randevunuza 1 saat kaldı. Saat ${appt.time}'da bekliyoruz.`,
                    type: "appointment",
                    link: "/dashboard"
                });
            }
        }
    } catch (err) {
        console.error("Cron Job Error:", err);
    }
};
