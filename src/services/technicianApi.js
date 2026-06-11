const API_BASE = "/api";

function getHeaders() {
    const headers = { "Content-Type": "application/json" };
    const token = localStorage.getItem("technician_token");
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
        localStorage.removeItem("technician_token");
        localStorage.removeItem("technician_user");
        window.location.href = "/teknisyen/giris";
        return Promise.reject(new Error("Oturum süresi doldu"));
    }

    const data = await res.json();

    if (!res.ok) {
        const errorMsg = data.error 
            ? `${data.error}${data.message ? `: ${data.message}` : ""}` 
            : (data.message || "Bir hata oluştu");
        throw new Error(errorMsg);
    }

    return data;
}

export const technicianApi = {
    // 🧪 Lab Results
    getLabResults: () => request("/technician/lab-results"),
    updateLabResult: (id, data) => 
        request(`/technician/lab-results/${id}`, {
            method: "PUT",
            body: JSON.stringify(data)
        }),

    // 🩻 Radiology Scans
    getRadiology: () => request("/technician/radiology"),
    updateRadiology: (id, data) => 
        request(`/technician/radiology/${id}`, {
            method: "PUT",
            body: JSON.stringify(data)
        })
};
