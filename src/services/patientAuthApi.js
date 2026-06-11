import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

// Create axois instance with dedicated interceptor for PATIENT token
const patientAuthApiAxios = axios.create({
    baseURL: `${API_URL}/patient-auth`,
});

patientAuthApiAxios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("patientToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const patientAuthApi = {
    // Auth Routes
    register: async (patientData) => {
        try {
            const res = await patientAuthApiAxios.post("/register", patientData);
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Kayıt başarısız");
        }
    },
    login: async (tcOrEmail, password) => {
        try {
            const res = await patientAuthApiAxios.post("/login", { tcOrEmail, password });
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Giriş başarısız");
        }
    },
    getMe: async () => {
        try {
            const res = await patientAuthApiAxios.get("/me");
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Profil bilgisi alınamadı");
        }
    },
    checkTC: async (tc) => {
        try {
            const res = await patientAuthApiAxios.get(`/check-tc/${tc}`);
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Sorgulama başarısız");
        }
    },
    forgotPassword: async (tc, email) => {
        try {
            const res = await patientAuthApiAxios.post("/forgot-password", { tc, email });
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Giriş başarısız");
        }
    },
    resetPassword: async (tc, code, newPassword) => {
        try {
            const res = await patientAuthApiAxios.post("/reset-password", { tc, code, newPassword });
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Sıfırlama başarısız");
        }
    },
    updateProfile: async (profileData) => {
        try {
            const res = await patientAuthApiAxios.patch("/profile", profileData);
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Profil güncellenemedi");
        }
    },
    changePassword: async (passwordData) => {
        try {
            const res = await patientAuthApiAxios.post("/change-password", passwordData);
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Şifre değiştirilemedi");
        }
    },
    // Family Routes
    addFamilyMember: async (memberData) => {
        try {
            const res = await patientAuthApiAxios.post("/family", memberData);
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Aile üyesi eklenemedi");
        }
    },
    getFamilyMembers: async () => {
        try {
            const res = await patientAuthApiAxios.get("/family");
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Aile üyeleri getirilemedi");
        }
    },
    deleteFamilyMember: async (id) => {
        try {
            const res = await patientAuthApiAxios.delete(`/family/${id}`);
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Aile üyesi silinemedi");
        }
    },
    updateFamilyMember: async (id, memberData) => {
        try {
            const res = await patientAuthApiAxios.put(`/family/${id}`, memberData);
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Aile üyesi güncellenemedi");
        }
    },
    deleteAccount: async (password) => {
        try {
            const res = await patientAuthApiAxios.delete("/delete-account", { data: { password } });
            return res.data;
        } catch (err) {
            throw err.response?.data || new Error("Hesap silinemedi");
        }
    },
};

export default patientAuthApi;
