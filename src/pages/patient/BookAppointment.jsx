import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiUser, FiCalendar, FiClock, FiCheckCircle } from "react-icons/fi";
import { patientPortalApi } from "../../services/patientPortalApi";

export default function BookAppointment() {
    const navigate = useNavigate();

    const [doctors, setDoctors] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [bookedSlots, setBookedSlots] = useState([]); // dolu saatler

    // Form Steps & State
    const [step, setStep] = useState(1);
    const [selectedSpecialty, setSelectedSpecialty] = useState("");
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");
    const [notes, setNotes] = useState("");
    const [leaveWarning, setLeaveWarning] = useState("");   // izin uyarısı

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const data = await patientPortalApi.getDoctors();
                setDoctors(data);

                // Extract unique specialties (handling both string and object shapes)
                const uniqueSpecs = [];
                const specMap = new Map();
                for (const d of data) {
                    const specName = typeof d.specialty === "object" ? d.specialty?.name : d.specialty;
                    if (specName && !specMap.has(specName)) {
                        specMap.set(specName, true);
                        uniqueSpecs.push(specName);
                    }
                }
                setSpecialties(uniqueSpecs);
            } catch (err) {
                setError("Doktor listesi alınamadı. Lütfen daha sonra tekrar deneyin.");
            } finally {
                setLoading(false);
            }
        };

        fetchDoctors();
    }, []);

    // Filter doctors by selected specialty
    const availableDoctors = doctors.filter(d => {
        const specName = typeof d.specialty === "object" ? d.specialty?.name : d.specialty;
        return specName === selectedSpecialty;
    });

    // İzin + dolu saatler — doktor + tarih seçilince çalışır
    useEffect(() => {
        if (!selectedDoctor || !selectedDate) { setLeaveWarning(""); setBookedSlots([]); return; }
        const check = async () => {
            try {
                const token = localStorage.getItem("patientToken") || localStorage.getItem("token");
                // İzin kontrolü
                const leaveRes = await fetch(`http://localhost:5001/api/leave-requests/check?doctorId=${selectedDoctor._id}&date=${selectedDate}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                if (leaveRes.ok) {
                    const { izinli, baslangic, bitis } = await leaveRes.json();
                    if (izinli) {
                        const bas = new Date(baslangic).toLocaleDateString("tr-TR");
                        const bit = new Date(bitis).toLocaleDateString("tr-TR");
                        setLeaveWarning(`Bu doktor ${bas} - ${bit} tarihleri arasında izinlidir. Lütfen başka bir tarih seçin.`);
                    } else {
                        setLeaveWarning("");
                    }
                }
                // Dolu saatler
                const slotsRes = await fetch(
                    `http://localhost:5001/api/patient-portal/booked-slots?doctorId=${selectedDoctor._id}&date=${selectedDate}`,
                    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
                );
                if (slotsRes.ok) {
                    const data = await slotsRes.json();
                    setBookedSlots(data.bookedSlots || []);
                }
            } catch { setLeaveWarning(""); }
        };
        check();
    }, [selectedDoctor, selectedDate]);

    // Generate Mock Time Slots (09:00 - 16:30)
    const generateTimeSlots = () => {
        const slots = [];
        let curHour = 9;
        let curMin = 0;
        while (curHour < 17) {
            slots.push(`${curHour.toString().padStart(2, '0')}:${curMin.toString().padStart(2, '0')}`);
            curMin += 30;
            if (curMin >= 60) {
                curHour++;
                curMin = 0;
            }
        }
        return slots;
    };

    const handleBooking = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            await patientPortalApi.bookAppointment({
                doctorId: selectedDoctor._id,
                date: selectedDate,
                time: selectedTime,
                type: "Muayene",
                notes
            });
            setStep(5); // Success step
        } catch (err) {
            setError(err.message || "Randevu alınırken bir hata oluştu.");
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
                <div style={{ width: "40px", height: "40px", border: "3px solid rgba(2, 132, 199, 0.2)", borderTopColor: "#0284c7", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
                <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', sans-serif" }}>

            <nav style={{ background: "white", padding: "16px 32px", display: "flex", alignItems: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", position: "sticky", top: 0, zIndex: 10 }}>
                <button onClick={() => navigate("/hasta/portal")} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "#64748b", fontSize: "15px", fontWeight: 600, cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#0f172a"} onMouseLeave={e => e.currentTarget.style.color = "#64748b"}>
                    <FiArrowLeft /> Portala Dön
                </button>
                <div style={{ flex: 1, textAlign: "center", fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>Yeni Randevu Oluştur</div>
                <div style={{ width: "100px" }}></div>
            </nav>

            <main style={{ maxWidth: "600px", margin: "40px auto", padding: "0 24px" }}>

                {error && (
                    <div style={{ padding: "16px", background: "#fef2f2", color: "#dc2626", borderRadius: "12px", marginBottom: "24px", border: "1px solid #fecaca" }}>
                        {error}
                    </div>
                )}

                <div style={{ background: "white", borderRadius: "20px", border: "1px solid #e2e8f0", padding: "32px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>

                    {/* Progress Bar */}
                    {step < 5 && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "40px", position: "relative" }}>
                            <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "2px", background: "#e2e8f0", zIndex: 0 }}></div>
                            {[1, 2, 3, 4].map(s => (
                                <div key={s} style={{ position: "relative", zIndex: 1, width: "32px", height: "32px", borderRadius: "50%", background: step >= s ? "#0ea5e9" : "#f1f5f9", color: step >= s ? "white" : "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, transition: "all 0.3s" }}>
                                    {s}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Step 1: Select Specialty */}
                    {step === 1 && (
                        <div>
                            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>Bölüm Seçiniz</h2>
                            <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "24px" }}>Lütfen randevu almak istediğiniz polikliniği seçin.</p>

                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {specialties.map(specName => (
                                    <button key={specName} onClick={() => { setSelectedSpecialty(specName); setStep(2); }} style={{ padding: "20px", background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", textAlign: "left", fontSize: "16px", fontWeight: 600, color: "#1e293b", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "16px" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "#0ea5e9"; e.currentTarget.style.background = "#f0f9ff"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "white"; }}>
                                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#0ea5e9" }}></div>
                                        {specName}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Select Doctor */}
                    {step === 2 && (
                        <div>
                            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>Doktor Seçiniz</h2>
                            <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "24px" }}>Lütfen muayene olmak istediğiniz doktoru seçin.</p>

                            {availableDoctors.length === 0 ? (
                                <div style={{ padding: "32px", textAlign: "center", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1", color: "#64748b" }}>
                                    Bu bölüme ait uygun doktor bulunamadı.<br />
                                    <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "#0ea5e9", fontWeight: 600, cursor: "pointer", marginTop: "8px" }}>Bölüm Değiştir</button>
                                </div>
                            ) : (
                                <div style={{ display: "grid", gap: "16px" }}>
                                    {availableDoctors.map(doc => (
                                        <button key={doc._id} onClick={() => { setSelectedDoctor(doc); setStep(3); }} style={{ padding: "20px", background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", textAlign: "left", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "16px" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "#0ea5e9"; e.currentTarget.style.background = "#f0f9ff"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "white"; }}>
                                            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#e0f2fe", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                                                <FiUser />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>{doc.title} {doc.name}</div>
                                                <div style={{ fontSize: "13px", color: "#64748b" }}>{typeof doc.specialty === "object" ? doc.specialty?.name : doc.specialty}</div>
                                            </div>
                                        </button>
                                    ))}
                                    <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "#64748b", fontWeight: 600, textAlign: "center", padding: "12px", cursor: "pointer", marginTop: "8px" }}>Geri Dön</button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Select Date & Time */}
                    {step === 3 && (
                        <div>
                            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>Tarih ve Saat</h2>
                            <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "24px" }}>{selectedDoctor?.title} {selectedDoctor?.name} için uygun bir randevu zamanı seçin.</p>

                            <div style={{ marginBottom: "24px" }}>
                                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#334155", marginBottom: "8px" }}>Randevu Tarihi</label>
                                <div style={{ position: "relative" }}>
                                    <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}><FiCalendar /></div>
                                    <input type="date" value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setSelectedTime(""); }} min={new Date().toISOString().split("T")[0]} style={{ width: "100%", padding: "14px 14px 14px 40px", borderRadius: "10px", border: "2px solid #e2e8f0", fontSize: "15px", color: "#0f172a", outline: "none", fontFamily: "'Inter', sans-serif" }} />
                                </div>
                            </div>

                            {selectedDate && (
                                <div style={{ marginBottom: "32px", animation: "fadeIn 0.3s ease" }}>
                                    {/* İzin uyarısı */}
                                    {leaveWarning && (
                                        <div style={{ padding: "12px 16px", background: "#fffbeb", border: "1px solid #fbbf24", borderRadius: 10, marginBottom: 14, display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#92400e", fontWeight: 600 }}>
                                            🏖️ {leaveWarning}
                                        </div>
                                    )}
                                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#334155", marginBottom: "12px" }}>Uygun Saatler</label>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                                        {generateTimeSlots().map(time => {
                                            const isBooked = bookedSlots.includes(time);
                                            return (
                                                <button
                                                    key={time}
                                                    onClick={() => !isBooked && setSelectedTime(time)}
                                                    disabled={isBooked}
                                                    title={isBooked ? "Bu saat dolu" : ""}
                                                    style={{
                                                        padding: "12px 0",
                                                        background: isBooked
                                                            ? "#f1f5f9"
                                                            : selectedTime === time ? "#0ea5e9" : "white",
                                                        color: isBooked
                                                            ? "#cbd5e1"
                                                            : selectedTime === time ? "white" : "#0f172a",
                                                        border: `1px solid ${isBooked ? "#e2e8f0" : selectedTime === time ? "#0ea5e9" : "#e2e8f0"}`,
                                                        borderRadius: "8px", fontSize: "14px", fontWeight: 600,
                                                        cursor: isBooked ? "not-allowed" : "pointer",
                                                        transition: "all 0.2s",
                                                        textDecoration: isBooked ? "line-through" : "none",
                                                        opacity: isBooked ? 0.5 : 1
                                                    }}
                                                    onMouseEnter={e => { if (!isBooked && selectedTime !== time) { e.currentTarget.style.borderColor = "#bae6fd"; e.currentTarget.style.background = "#f0f9ff"; } }}
                                                    onMouseLeave={e => { if (!isBooked && selectedTime !== time) { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "white"; } }}
                                                >
                                                    {time}{isBooked ? " 🔒" : ""}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div style={{ display: "flex", gap: "16px" }}>
                                <button onClick={() => setStep(2)} style={{ flex: 1, padding: "16px", background: "white", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "15px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "white"}>Geri Dön</button>
                                <button disabled={!selectedDate || !selectedTime || !!leaveWarning} onClick={() => setStep(4)} style={{ flex: 1, padding: "16px", background: (!!leaveWarning || !selectedDate || !selectedTime) ? "#94a3b8" : "#0ea5e9", color: "white", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 600, cursor: (!selectedDate || !selectedTime || !!leaveWarning) ? "not-allowed" : "pointer", opacity: (!selectedDate || !selectedTime) ? 0.5 : 1, transition: "all 0.2s" }}>Devam Et</button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Final Confirmation */}
                    {step === 4 && (
                        <div>
                            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", marginBottom: "24px", textAlign: "center" }}>Randevu Özeti</h2>

                            <div style={{ background: "#f8fafc", borderRadius: "16px", padding: "24px", marginBottom: "24px", border: "1px solid #f1f5f9" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px dashed #cbd5e1" }}>
                                    <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "#e0f2fe", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>
                                        <FiUser />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>{selectedDoctor?.title} {selectedDoctor?.name}</div>
                                        <div style={{ fontSize: "14px", color: "#64748b" }}>{(typeof selectedDoctor?.specialty === "object" ? selectedDoctor?.specialty?.name : selectedDoctor?.specialty) || ""} Polikliniği</div>
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                    <div>
                                        <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}><FiCalendar /> Tarih</div>
                                        <div style={{ fontSize: "15px", fontWeight: 600, color: "#0f172a" }}>{new Date(selectedDate).toLocaleDateString("tr-TR")}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}><FiClock /> Saat</div>
                                        <div style={{ fontSize: "15px", fontWeight: 600, color: "#0f172a" }}>{selectedTime}</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: "24px" }}>
                                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#334155", marginBottom: "8px" }}>Doktora İletilmek İstenen Not (İsteğe Bağlı)</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="3" placeholder="Örn: 3 gündür geçmeyen baş ağrısı şikayetim var." style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "2px solid #e2e8f0", fontSize: "14px", color: "#0f172a", outline: "none", resize: "vertical", fontFamily: "'Inter', sans-serif" }}></textarea>
                            </div>

                            <div style={{ display: "flex", gap: "16px" }}>
                                <button disabled={submitting} onClick={() => setStep(3)} style={{ flex: 1, padding: "16px", background: "white", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "15px", fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer" }}>Geri Dön</button>
                                <button disabled={submitting} onClick={handleBooking} style={{ flex: 1, padding: "16px", background: "#10b981", color: "white", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 600, cursor: submitting ? "wait" : "pointer", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                    {submitting ? "Onaylanıyor..." : <><FiCheckCircle /> Randevuyu Onayla</>}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Success */}
                    {step === 5 && (
                        <div style={{ textAlign: "center", padding: "20px 0" }}>
                            <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#dcfce7", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px", margin: "0 auto 24px auto" }}>
                                <FiCheckCircle />
                            </div>
                            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", marginBottom: "12px" }}>Randevunuz Oluşturuldu!</h2>
                            <p style={{ color: "#64748b", fontSize: "15px", lineHeight: 1.6, marginBottom: "32px" }}>
                                {new Date(selectedDate).toLocaleDateString("tr-TR")} tarihi saat {selectedTime} için randevunuz başarıyla onaylandı. Randevu detaylarınızı panelinizden takip edebilirsiniz.
                            </p>
                            <button onClick={() => navigate("/hasta/portal")} style={{ padding: "16px 32px", background: "#0ea5e9", color: "white", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 12px rgba(14, 165, 233, 0.2)" }}>
                                Portala Dön
                            </button>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}
