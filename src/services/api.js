const API_BASE = "/api";

function getHeaders() {
  const headers = { "Content-Type": "application/json" };
  const token = localStorage.getItem("token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: getHeaders(),
    ...options,
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
    return Promise.reject(new Error("Oturum süresi doldu"));
  }

  const data = await res.json();

  if (!res.ok) {
    const errorMsg = data.error ? `${data.error}: ${data.message || ""}` : (data.message || "Bir hata oluştu");
    throw new Error(errorMsg);
  }

  return data;
}

// ── Auth ──────────────────────────────────────
export const authApi = {
  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => request("/auth/me"),

  updateProfile: (data) =>
    request("/auth/me", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/auth/avatar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Avatar yüklenemedi");
    return data;
  },
};

// ── Patients ─────────────────────────────────
export const patientsApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/patients${qs ? `?${qs}` : ""}`);
  },

  getById: (id) => request(`/patients/${id}`),

  getStats: () => request("/patients/stats"),

  create: (data) =>
    request("/patients", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    request(`/patients/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    request(`/patients/${id}`, { method: "DELETE" }),

  addDisease: (patientId, data) =>
    request(`/patients/${patientId}/diseases`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateDisease: (patientId, diseaseId, data) =>
    request(`/patients/${patientId}/diseases/${diseaseId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// ── Appointments ─────────────────────────────
export const appointmentsApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/appointments${qs ? `?${qs}` : ""}`);
  },

  getStats: (period = "month") =>
    request(`/appointments/stats?period=${period}`),

  getNext: () => request("/appointments/next"),

  create: (data) =>
    request("/appointments", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    request(`/appointments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    request(`/appointments/${id}`, { method: "DELETE" }),
};

// ── Prescriptions ────────────────────────────
export const prescriptionsApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/prescriptions${qs ? `?${qs}` : ""}`);
  },

  getByPatient: (patientId) =>
    request(`/prescriptions/patient/${patientId}`),

  create: (data) =>
    request("/prescriptions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ── Admin ────────────────────────────────────────
export const adminApi = {
  getSystemStats: () => request("/admin/system-stats"),
  getLogs: () => request("/admin/logs"),
  getSettings: () => request("/admin/settings"),
  updateSettings: (data) =>
    request("/admin/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getUsers: () => request("/admin/users"),
  createUser: (data) =>
    request("/admin/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateUser: (id, data) =>
    request(`/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteUser: (id) =>
    request(`/admin/users/${id}`, {
      method: "DELETE",
    }),
  getDutyShifts: () => request("/admin/duty-shifts"),
  createDutyShift: (data) =>
    request("/admin/duty-shifts", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteDutyShift: (id) =>
    request(`/admin/duty-shifts/${id}`, {
      method: "DELETE",
    }),
  getDoctorPerformance: (id) => request(`/admin/doctors/${id}/performance`),
  getDepartments: () => request("/admin/departments"),
  createDepartment: (data) =>
    request("/admin/departments", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  updateDepartment: (id, data) =>
    request(`/admin/departments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    }),
  deleteDepartment: (id) =>
    request(`/admin/departments/${id}`, {
      method: "DELETE"
    }),
  getAnnouncements: () => request("/admin/announcements"),
  getActiveAnnouncements: () => request("/admin/announcements/active"),
  createAnnouncement: (data) =>
    request("/admin/announcements", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  updateAnnouncement: (id, data) =>
    request(`/admin/announcements/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    }),
  deleteAnnouncement: (id) =>
    request(`/admin/announcements/${id}`, {
      method: "DELETE"
    }),
  getBackup: () => request("/admin/backup"),
  getLeaveRequests: () => request("/leave-requests"),
  updateLeaveRequestStatus: (id, data) =>
    request(`/leave-requests/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    }),
  getFinanceSummary: () => request("/finance/summary"),
  sendNotification: (data) =>
    request("/admin/send-notification", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  sendMessage: (data) =>
    request("/admin/send-message", {
      method: "POST",
      body: JSON.stringify(data)
    })
};

// ── Lab Results ──────────────────────────────────
export const labResultsApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/lab-results${qs ? `?${qs}` : ""}`);
  },

  getByPatient: (patientId) =>
    request(`/lab-results/patient/${patientId}`),

  create: (data) =>
    request("/lab-results", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    request(`/lab-results/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    request(`/lab-results/${id}`, { method: "DELETE" }),
};

// ── Radiology ────────────────────────────────────
export const radiologyApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/radiology${qs ? `?${qs}` : ""}`);
  },

  getByPatient: (patientId) =>
    request(`/radiology/patient/${patientId}`),

  create: (data) =>
    request("/radiology", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    request(`/radiology/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    request(`/radiology/${id}`, { method: "DELETE" }),
};

// ── Medical Reports ──────────────────────────────
export const medicalReportsApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/medical-reports${qs ? `?${qs}` : ""}`);
  },

  getByPatient: (patientId) =>
    request(`/medical-reports/patient/${patientId}`),

  create: (data) =>
    request("/medical-reports", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    request(`/medical-reports/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    request(`/medical-reports/${id}`, { method: "DELETE" }),
};

// ── Procedure Notes ──────────────────────────────
export const procedureNotesApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/procedure-notes${qs ? `?${qs}` : ""}`);
  },

  getByPatient: (patientId) =>
    request(`/procedure-notes/patient/${patientId}`),

  create: (data) =>
    request("/procedure-notes", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    request(`/procedure-notes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    request(`/procedure-notes/${id}`, { method: "DELETE" }),
};

// ── Analytics ────────────────────────────────────
export const analyticsApi = {
  getOverview: () => request("/analytics/overview"),
  getMonthlyPatients: () => request("/analytics/monthly-patients"),
  getTopDiagnoses: () => request("/analytics/top-diagnoses"),
  getMedicationDistribution: () => request("/analytics/medication-distribution"),
  getPatientDemographics: () => request("/analytics/patient-demographics"),
  getRevenue: () => request("/analytics/revenue"),
};

// ── Leave Requests ───────────────────────────────
export const leaveRequestsApi = {
  getMine: () => request("/leave-requests/mine"),
};

// ── Admin Patients ───────────────────────────────
export const adminPatientsApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/patients${qs ? `?${qs}` : ""}`);
  },
  getAppointments: (id) => request(`/admin/patients/${id}/appointments`),
  softDelete: (id) => request(`/admin/patients/${id}`, { method: "DELETE" }),
  updatePenalty: (id, data) => request(`/admin/patients/${id}/penalty`, {
    method: "POST",
    body: JSON.stringify(data)
  })
};

// ── Admin Appointments ───────────────────────────
export const adminAppointmentsApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/appointments${qs ? `?${qs}` : ""}`);
  },
  cancel: (id) => request(`/admin/appointments/${id}/cancel`, { method: "PUT" }),
  getAnalytics: () => request(`/admin/appointments/analytics`),
  getSmartSlots: () => request(`/admin/appointments/smart-slots`),
};

// ── IT Requests ──────────────────────────────
export const itRequestsApi = {
  getAll: () => request("/it-requests"),
  getMy: () => request("/it-requests/my"),
  create: (data) =>
    request("/it-requests", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  update: (id, data) =>
    request(`/it-requests/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    }),
  delete: (id) =>
    request(`/it-requests/${id}`, {
      method: "DELETE"
    })
};
