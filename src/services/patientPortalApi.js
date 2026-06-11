import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

// Create axois instance with dedicated interceptor for PATIENT token
const patientPortalApiAxios = axios.create({
    baseURL: `${API_URL}/patient-portal`,
});

patientPortalApiAxios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("patientToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const patientPortalApi = {
    getDoctors: async () => {
        try {
            const res = await patientPortalApiAxios.get("/doctors");
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Doktorlar listelenemedi");
        }
    },
    myAppointments: async () => {
        try {
            const res = await patientPortalApiAxios.get("/my-appointments");
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Randevular alınamadı");
        }
    },
    bookAppointment: async (appointmentData) => {
        try {
            const res = await patientPortalApiAxios.post("/book", appointmentData);
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Randevu oluşturulamadı");
        }
    },
    cancelAppointment: async (id) => {
        try {
            const res = await patientPortalApiAxios.put(`/cancel/${id}`);
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Randevu iptal edilemedi");
        }
    },
    submitAppointmentReview: async (id, reviewData) => {
        try {
            const res = await patientPortalApiAxios.post(`/appointments/${id}/review`, reviewData);
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Değerlendirme kaydedilemedi");
        }
    },
    getDoctorSlots: async (doctorId, date) => {
        try {
            const res = await patientPortalApiAxios.get(`/doctor-slots?doctorId=${doctorId}&date=${date}`);
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Saatler getirilemedi");
        }
    },
    myLabResults: async () => {
        try {
            const res = await patientPortalApiAxios.get("/my-lab-results");
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Lab sonuçları alınamadı");
        }
    },
    myPrescriptions: async () => {
        try {
            const res = await patientPortalApiAxios.get("/my-prescriptions");
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Reçeteler alınamadı");
        }
    },
    myMessages: async () => {
        try {
            const res = await patientPortalApiAxios.get("/my-messages");
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Mesajlar alınamadı");
        }
    },
    getSmartRecommendations: async () => {
        try {
            const res = await patientPortalApiAxios.get("/smart-recommendations");
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Öneriler alınamadı");
        }
    },
    sendMessage: async (messageData) => {
        try {
            const res = await patientPortalApiAxios.post("/send-message", messageData);
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Mesaj gönderilemedi");
        }
    },
    uploadFile: async (formData) => {
        try {
            const res = await patientPortalApiAxios.post("/upload-file", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Dosya yüklenemedi");
        }
    },
    myFiles: async () => {
        try {
            const res = await patientPortalApiAxios.get("/my-files");
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Dosyalar alınamadı");
        }
    },
    myNotifications: async () => {
        try {
            const res = await patientPortalApiAxios.get("/my-notifications");
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Bildirimler alınamadı");
        }
    },
    markNotificationAsRead: async (id) => {
        try {
            const res = await patientPortalApiAxios.patch(`/notifications/${id}/read`);
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Bildirim okundu işaretlenemedi");
        }
    },
    // AI Support
    aiChat: async (message, history, patientInfo) => {
        try {
            const res = await axios.post(`${API_URL}/ai/chat`,
                { message, history, patientInfo },
                { headers: { Authorization: `Bearer ${localStorage.getItem("patientToken")}` } }
            );
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("AI Yanıt veremedi");
        }
    },
    aiDietPlan: async (patientInfo, target, activityLevel, dietaryPreferences) => {
        try {
            const res = await axios.post(`${API_URL}/ai/diet-plan`,
                { patientInfo, target, activityLevel, dietaryPreferences },
                { headers: { Authorization: `Bearer ${localStorage.getItem("patientToken")}` } }
            );
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Diyet planı oluşturulamadı");
        }
    },
    aiSwapMeal: async (patientInfo, currentMeal, dietaryPreferences, targetCalories) => {
        try {
            const res = await axios.post(`${API_URL}/ai/swap-meal`,
                { patientInfo, currentMeal, dietaryPreferences, targetCalories },
                { headers: { Authorization: `Bearer ${localStorage.getItem("patientToken")}` } }
            );
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Öğün değiştirilemedi");
        }
    },
    aiShoppingList: async (meals) => {
        try {
            const res = await axios.post(`${API_URL}/ai/shopping-list`,
                { meals },
                { headers: { Authorization: `Bearer ${localStorage.getItem("patientToken")}` } }
            );
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Alışveriş listesi oluşturulamadı");
        }
    },
    aiDietChat: async (message, history, currentPlan, patientInfo) => {
        try {
            const res = await axios.post(`${API_URL}/ai/diet-chat`,
                { message, history, currentPlan, patientInfo },
                { headers: { Authorization: `Bearer ${localStorage.getItem("patientToken")}` } }
            );
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Diyet asistanı yanıt veremedi");
        }
    },
    aiExplainResults: async (results, patientInfo) => {
        try {
            const res = await axios.post(`${API_URL}/ai/explain-results`,
                { results, patientInfo },
                { headers: { Authorization: `Bearer ${localStorage.getItem("patientToken")}` } }
            );
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("AI Analiz yapılamadı");
        }
    },
    aiHealthSummary: async (patientInfo, labs, meds) => {
        try {
            const res = await axios.post(`${API_URL}/ai/health-summary`,
                { patientInfo, labs, meds },
                { headers: { Authorization: `Bearer ${localStorage.getItem("patientToken")}` } }
            );
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Sağlık özeti alınamadı");
        }
    },
    aiTriage: async (symptoms, patientInfo) => {
        try {
            const res = await axios.post(`${API_URL}/ai/triage`,
                { symptoms, patientInfo },
                { headers: { Authorization: `Bearer ${localStorage.getItem("patientToken")}` } }
            );
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Triaş analizi yapılamadı");
        }
    },
    getMyVitals: async () => {
        try {
            const res = await patientPortalApiAxios.get("/my-vitals");
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Sağlık verileri alınamadı");
        }
    },
    addVital: async (vitalData) => {
        try {
            const res = await patientPortalApiAxios.post("/vitals", vitalData);
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Veri kaydedilemedi");
        }
    },
    aiAnalyzeVitals: async (vitals, patientInfo) => {
        try {
            const res = await axios.post(`${API_URL}/ai/analyze-vitals`,
                { vitals, patientInfo },
                { headers: { Authorization: `Bearer ${localStorage.getItem("patientToken")}` } }
            );
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("AI Analiz yapılamadı");
        }
    },
    updateVital: async (id, data) => {
        try {
            const res = await patientPortalApiAxios.put(`/vitals/${id}`, data);
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Güncelleme başarısız");
        }
    },
    deleteVital: async (id) => {
        try {
            const res = await patientPortalApiAxios.delete(`/vitals/${id}`);
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Silme işlemi başarısız");
        }
    },
    processPayment: async (data) => {
        try {
            const res = await patientPortalApiAxios.post("/pay", data);
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Ödeme işlemi başarısız");
        }
    },
    getPaymentHistory: async () => {
        try {
            const res = await patientPortalApiAxios.get("/payments");
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Ödeme geçmişi alınamadı");
        }
    },
    // Medication Tracker
    getTodayMedications: async () => {
        try {
            const res = await patientPortalApiAxios.get("/medication-today");
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("İlaç listesi alınamadı");
        }
    },
    toggleMedicationStatus: async (data) => {
        try {
            const res = await patientPortalApiAxios.post("/medication-log/toggle", data);
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("İşlem başarısız");
        }
    },
    // Sent Messages
    mySentMessages: async () => {
        try {
            const res = await patientPortalApiAxios.get("/my-sent-messages");
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Gönderilen mesajlar alınamadı");
        }
    },
    // Radiology Results
    myRadiology: async () => {
        try {
            const res = await patientPortalApiAxios.get("/my-radiology");
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Radyoloji sonuçları alınamadı");
        }
    },
    // Medical Reports
    myMedicalReports: async () => {
        try {
            const res = await patientPortalApiAxios.get("/my-medical-reports");
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Tıbbi raporlar alınamadı");
        }
    },
    // Mark All Notifications as Read
    markAllNotificationsRead: async () => {
        try {
            const res = await patientPortalApiAxios.patch("/notifications/read-all");
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("İşlem başarısız");
        }
    },
    // Procedure Notes
    myProcedures: async () => {
        try {
            const res = await patientPortalApiAxios.get("/my-procedures");
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Prosedür notları alınamadı");
        }
    },
    // Active Announcements
    getAnnouncements: async () => {
        try {
            const res = await patientPortalApiAxios.get("/announcements");
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Duyurular alınamadı");
        }
    },
    // Penalty Status
    myPenalty: async () => {
        try {
            const res = await patientPortalApiAxios.get("/my-penalty");
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Ceza bilgisi alınamadı");
        }
    },
    // Goals Methods
    getGoals: async () => {
        try {
            const res = await patientPortalApiAxios.get("/goals");
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Hedefler alınamadı");
        }
    },
    addGoal: async (goalData) => {
        try {
            const res = await patientPortalApiAxios.post("/goals", goalData);
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Hedef eklenemedi");
        }
    },
    updateGoal: async (id, goalData) => {
        try {
            const res = await patientPortalApiAxios.put(`/goals/${id}`, goalData);
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Hedef güncellenemedi");
        }
    },
    deleteGoal: async (id) => {
        try {
            const res = await patientPortalApiAxios.delete(`/goals/${id}`);
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Hedef silinemedi");
        }
    },
    // Self Medication Methods
    getSelfMedications: async () => {
        try {
            const res = await patientPortalApiAxios.get("/self-medications");
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Kişisel ilaçlar alınamadı");
        }
    },
    addSelfMedication: async (medData) => {
        try {
            const res = await patientPortalApiAxios.post("/self-medications", medData);
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Kişisel ilaç eklenemedi");
        }
    },
    deleteSelfMedication: async (id) => {
        try {
            const res = await patientPortalApiAxios.delete(`/self-medications/${id}`);
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Kişisel ilaç silinemedi");
        }
    },
};

// ── Journal API (ayrı endpoint: /api/journal) ────────────────────────────────
const journalApiAxios = axios.create({
    baseURL: `${API_URL}/journal`,
});

journalApiAxios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("patientToken");
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

export const journalApi = {
    getAll: async () => {
        try {
            const res = await journalApiAxios.get("/");
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Günlük kayıtları alınamadı");
        }
    },
    create: async (data) => {
        try {
            const res = await journalApiAxios.post("/", data);
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Günlük kaydı oluşturulamadı");
        }
    },
    update: async (id, data) => {
        try {
            const res = await journalApiAxios.put(`/${id}`, data);
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Güncelleme başarısız");
        }
    },
    remove: async (id) => {
        try {
            const res = await journalApiAxios.delete(`/${id}`);
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Silme işlemi başarısız");
        }
    },
};
