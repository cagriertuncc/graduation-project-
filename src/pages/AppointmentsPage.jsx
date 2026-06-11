import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { appointmentsApi, patientsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";
import {
    FiCalendar, FiClock, FiUser, FiMapPin, FiCheckCircle,
    FiAlertCircle, FiChevronRight, FiChevronLeft, FiPlus, FiFilter,
    FiSearch, FiTrendingUp, FiActivity, FiTarget, FiStar, FiHeart, FiXCircle
} from "react-icons/fi";
import {
    RiStethoscopeLine, RiCalendarCheckLine, RiPulseLine, RiHospitalLine
} from "react-icons/ri";


/* ═══════════════════════ HOOKS ═══════════════════════ */
function useCounter(end, dur = 1200, delay = 300) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        const to = setTimeout(() => {
            let f; const s = performance.now();
            const tick = n => {
                const p = Math.min((n - s) / dur, 1);
                setVal(Math.round(end * (1 - Math.pow(1 - p, 3))));
                if (p < 1) f = requestAnimationFrame(tick);
            };
            f = requestAnimationFrame(tick);
            return () => cancelAnimationFrame(f);
        }, delay);
        return () => clearTimeout(to);
    }, [end, dur, delay]);
    return val;
}

/* ═══════════════════════ MINI CALENDAR ═══════════════════════ */
function MiniCalendar({ selectedDate, onSelect, appointments }) {
    const [mnt, setMnt] = useState(false);
    useEffect(() => { setTimeout(() => setMnt(true), 400); }, []);

    const sel = new Date(selectedDate + "T00:00:00");
    const year = sel.getFullYear();
    const month = sel.getMonth();
    const today = new Date();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Monday first

    const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
        "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    const dayNames = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];

    const aptDates = new Set(appointments.map(a => a.date));
    const aptCountByDate = {};
    appointments.forEach(a => { aptCountByDate[a.date] = (aptCountByDate[a.date] || 0) + 1; });

    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const prevMonth = () => {
        const prev = new Date(year, month - 1, 1);
        onSelect(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}-01`);
    };
    const nextMonth = () => {
        const next = new Date(year, month + 1, 1);
        onSelect(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`);
    };

    return (
        <div>
            {/* Month nav */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <button onClick={prevMonth} style={{
                    width: 32, height: 32, borderRadius: "8px", border: "1px solid #e5e7eb",
                    background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s",
                }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
                    onMouseLeave={e => e.currentTarget.style.background = "white"}
                >
                    <FiChevronLeft size={14} style={{ color: "#6b7280" }} />
                </button>
                <span style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
                    {monthNames[month]} {year}
                </span>
                <button onClick={nextMonth} style={{
                    width: 32, height: 32, borderRadius: "8px", border: "1px solid #e5e7eb",
                    background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s",
                }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
                    onMouseLeave={e => e.currentTarget.style.background = "white"}
                >
                    <FiChevronRight size={14} style={{ color: "#6b7280" }} />
                </button>
            </div>

            {/* Day headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "6px" }}>
                {dayNames.map((d, di) => (
                    <div key={d} style={{
                        textAlign: "center", fontSize: "10px", fontWeight: 700,
                        color: di === 6 ? "#fca5a5" : di === 5 ? "#f59e0b" : "#9ca3af",
                        textTransform: "uppercase", padding: "4px 0",
                    }}>{d}</div>
                ))}
            </div>

            {/* Date cells */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
                {cells.map((day, i) => {
                    if (day === null) return <div key={i} />;
                    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const dateObj = new Date(dateStr + "T00:00:00");
                    const dayOfWeek = dateObj.getDay(); // 0=Sun, 6=Sat
                    const isSunday = dayOfWeek === 0;
                    const isSaturday = dayOfWeek === 6;
                    const isSelected = dateStr === selectedDate;
                    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
                    const hasApt = aptDates.has(dateStr);
                    const aptCount = aptCountByDate[dateStr] || 0;

                    return (
                        <button key={i} onClick={() => onSelect(dateStr)} style={{
                            width: "100%", aspectRatio: "1", borderRadius: "10px", border: "none",
                            background: isSelected
                                ? "linear-gradient(135deg, #ef4444, #dc2626)"
                                : isSunday ? "#fef2f2"
                                    : isToday ? "#fef2f2" : "transparent",
                            color: isSelected ? "white" : isSunday ? "#fca5a5" : isSaturday ? "#f59e0b" : isToday ? "#ef4444" : "#374151",
                            fontSize: "13px", fontWeight: isSelected || isToday ? 700 : isSunday ? 400 : 500,
                            cursor: "pointer", position: "relative",
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                            gap: "1px",
                            boxShadow: isSelected ? "0 4px 12px rgba(239,68,68,0.3)" : "none",
                            opacity: mnt ? (isSunday && !isSelected ? 0.5 : 1) : 0,
                            transform: mnt ? "scale(1)" : "scale(0.8)",
                            transition: `all 0.3s cubic-bezier(0.22,1,0.36,1) ${i * 15}ms`,
                            textDecoration: isSunday && !isSelected ? "line-through" : "none",
                        }}
                            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#fef2f2"; }}
                            onMouseLeave={e => { if (!isSelected && !isToday && !isSunday) e.currentTarget.style.background = "transparent"; else if ((isToday || isSunday) && !isSelected) e.currentTarget.style.background = "#fef2f2"; }}
                        >
                            {day}
                            {hasApt && (
                                <div style={{
                                    display: "flex", gap: "1px", position: "absolute", bottom: "3px",
                                }}>
                                    {Array.from({ length: Math.min(aptCount, 3) }).map((_, di) => (
                                        <div key={di} style={{
                                            width: 4, height: 4, borderRadius: "50%",
                                            background: isSelected ? "rgba(255,255,255,0.7)" : "#ef4444",
                                        }} />
                                    ))}
                                </div>
                            )}
                            {isSaturday && !isSelected && (
                                <div style={{
                                    position: "absolute", bottom: "2px",
                                    width: 8, height: 2, borderRadius: "1px", background: "#f59e0b",
                                }} />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/* ═══════════════════════ DONUT ═══════════════════════ */
function DonutChart({ segments, size = 130, sw = 14, center, sub }) {
    const [m, setM] = useState(false);
    useEffect(() => { setTimeout(() => setM(true), 700); }, []);
    const r = (size - sw) / 2, circ = 2 * Math.PI * r;
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    let off = 0;
    return (
        <div style={{ position: "relative", width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#fef2f2" strokeWidth={sw} />
                {segments.map((seg, i) => {
                    const dash = (seg.value / total) * circ; const o = off; off += dash;
                    return <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={seg.color}
                        strokeWidth={sw} strokeDasharray={`${dash} ${circ - dash}`}
                        strokeDashoffset={m ? -o : circ} strokeLinecap="round"
                        style={{ transition: `stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1) ${400 + i * 120}ms` }} />;
                })}
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "22px", fontWeight: 800, color: "#111827" }}>{center}</span>
                <span style={{ fontSize: "9px", color: "#9ca3af", fontWeight: 500 }}>{sub}</span>
            </div>
        </div>
    );
}

/* ═══════════════════════ HOURLY BAR CHART ═══════════════════════ */
function HourlyChart({ appointments, halfDay = false, holiday = false }) {
    const [m, setM] = useState(false);
    useEffect(() => { setTimeout(() => setM(true), 800); }, []);

    const hours = halfDay ? ["09", "10", "11", "12"] : ["09", "10", "11", "12", "13", "14", "15", "16"];
    const counts = hours.map(h => appointments.filter(a => a.time.startsWith(h)).length);
    const max = Math.max(...counts, 1);

    if (holiday) {
        return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100px", gap: "6px" }}>
                <span style={{ fontSize: "20px" }}>🏖️</span>
                <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 600 }}>Pazar tatili</span>
            </div>
        );
    }

    return (
        <div>
            {halfDay && (
                <div style={{
                    display: "flex", alignItems: "center", gap: "4px", marginBottom: "8px",
                    padding: "3px 8px", borderRadius: "6px", background: "#fffbeb", width: "fit-content",
                }}>
                    <span style={{ fontSize: "10px" }}>⏰</span>
                    <span style={{ fontSize: "9px", fontWeight: 700, color: "#d97706" }}>Yarım gün (09:00 - 13:00)</span>
                </div>
            )}
            <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "100px", paddingTop: "8px" }}>
                {hours.map((h, i) => {
                    const barH = (counts[i] / max) * 80;
                    const isMax = counts[i] === max && counts[i] > 0;
                    return (
                        <div key={i} style={{
                            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                        }}>
                            {counts[i] > 0 && (
                                <span style={{
                                    fontSize: "10px", fontWeight: 700,
                                    color: isMax ? "#ef4444" : "#9ca3af",
                                    opacity: m ? 1 : 0, transition: `opacity 0.4s ease ${i * 60 + 900}ms`,
                                }}>{counts[i]}</span>
                            )}
                            <div style={{
                                width: "100%", borderRadius: "6px 6px 3px 3px",
                                background: isMax
                                    ? "linear-gradient(180deg, #ef4444 0%, #dc2626 100%)"
                                    : counts[i] > 0
                                        ? "linear-gradient(180deg, #fecaca 0%, #fca5a5 100%)"
                                        : "#f5f5f5",
                                height: m ? (counts[i] > 0 ? Math.max(barH, 6) : 6) : 0,
                                transition: `height 0.8s cubic-bezier(0.22,1,0.36,1) ${i * 60}ms`,
                                boxShadow: isMax ? "0 3px 10px rgba(239,68,68,0.25)" : "none",
                                position: "relative", overflow: "hidden",
                            }}>
                                <div style={{
                                    position: "absolute", inset: 0,
                                    background: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)",
                                }} />
                            </div>
                            <span style={{ fontSize: "9px", color: "#9ca3af", fontWeight: 600 }}>{h}:00</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ═══════════════════════ PROGRESS RING ═══════════════════════ */
function ProgressRing({ value, max, size = 56, sw = 5, color = "#ef4444" }) {
    const [m, setM] = useState(false);
    useEffect(() => { setTimeout(() => setM(true), 600); }, []);
    const r = (size - sw) / 2, circ = 2 * Math.PI * r, pct = max > 0 ? value / max : 0;
    return (
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f5f5f5" strokeWidth={sw} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw}
                strokeDasharray={circ} strokeDashoffset={m ? circ * (1 - pct) : circ}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.22,1,0.36,1) 0.4s", filter: `drop-shadow(0 1px 4px ${color}40)` }}
            />
        </svg>
    );
}

/* ═══════════════════════ WEEKLY OVERVIEW ═══════════════════════ */
function WeeklyOverview({ appointments, selectedDate, onSelect }) {
    const [m, setM] = useState(false);
    useEffect(() => { setTimeout(() => setM(true), 600); }, []);

    const sel = new Date(selectedDate + "T00:00:00");
    const dayOfWeek = sel.getDay() === 0 ? 6 : sel.getDay() - 1;
    const monday = new Date(sel);
    monday.setDate(sel.getDate() - dayOfWeek);

    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
    });

    const dayLabels = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
    const today = new Date();

    return (
        <div style={{ display: "flex", gap: "6px" }}>
            {weekDays.map((d, i) => {
                const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                const isSelected = dateStr === selectedDate;
                const isToday = d.toDateString() === today.toDateString();
                const dayApts = appointments.filter(a => a.date === dateStr);
                const count = dayApts.length;
                const isSunday = i === 6; // Paz
                const isSaturday = i === 5; // Cmt

                return (
                    <button key={i} onClick={() => onSelect(dateStr)} style={{
                        flex: 1, padding: "10px 4px", borderRadius: "14px",
                        border: isSelected ? "2px solid #ef4444"
                            : isSunday ? "1px solid #fee2e2"
                                : isSaturday ? "1px solid #fef3c7"
                                    : "1px solid #f3f4f6",
                        background: isSelected ? "linear-gradient(135deg, #fef2f2, #fee2e2)"
                            : isSunday ? "repeating-linear-gradient(45deg, #fff, #fff 4px, #fef2f2 4px, #fef2f2 8px)"
                                : isSaturday ? "linear-gradient(135deg, #fffbeb, #fef9c3)"
                                    : "white",
                        cursor: "pointer", display: "flex", flexDirection: "column",
                        alignItems: "center", gap: "4px",
                        boxShadow: isSelected ? "0 4px 16px rgba(239,68,68,0.12)" : "0 1px 3px rgba(0,0,0,0.02)",
                        opacity: m ? (isSunday ? 0.65 : 1) : 0,
                        transform: m ? "translateY(0)" : "translateY(12px)",
                        transition: `all 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 60 + 200}ms`,
                    }}>
                        <span style={{
                            fontSize: "10px", fontWeight: 600, textTransform: "uppercase",
                            color: isSunday ? "#fca5a5" : isSaturday ? "#d97706" : "#9ca3af",
                        }}>
                            {dayLabels[i]}
                        </span>
                        <span style={{
                            fontSize: "18px", fontWeight: 800, lineHeight: 1,
                            color: isSelected ? "#ef4444" : isSunday ? "#fca5a5" : isSaturday ? "#b45309" : "#374151",
                            textDecoration: isSunday ? "line-through" : "none",
                        }}>
                            {d.getDate()}
                        </span>
                        {isSunday ? (
                            <span style={{
                                fontSize: "8px", fontWeight: 700, padding: "2px 6px",
                                borderRadius: "4px", background: "#fee2e2", color: "#ef4444",
                                letterSpacing: "0.3px",
                            }}>TATİL</span>
                        ) : isSaturday ? (
                            <span style={{
                                fontSize: "7px", fontWeight: 700, padding: "2px 4px",
                                borderRadius: "4px", background: "#fef3c7", color: "#d97706",
                                letterSpacing: "0.3px", lineHeight: 1.1, textAlign: "center",
                            }}>YARIM<br />GÜN</span>
                        ) : count > 0 ? (
                            <div style={{
                                width: 22, height: 22, borderRadius: "50%",
                                background: isSelected ? "#ef4444" : "#fecaca",
                                color: isSelected ? "white" : "#ef4444",
                                fontSize: "10px", fontWeight: 700,
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>{count}</div>
                        ) : (
                            <div style={{ width: 22, height: 22 }} />
                        )}
                        {isToday && (
                            <div style={{
                                width: 5, height: 5, borderRadius: "50%", background: "#22c55e",
                                boxShadow: "0 0 6px rgba(34,197,94,0.5)",
                            }} />
                        )}
                    </button>
                );
            })}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function AppointmentsPage() {
    const navigate = useNavigate();
    const { user: currentDoctor  } = useAuth();
    const [mounted, setMounted] = useState(false);
    const [selectedDate, setSelectedDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    });
    const [filter, setFilter] = useState("tümü");
    const [search, setSearch] = useState("");
    const [hoveredCard, setHoveredCard] = useState(null);
    const [appointmentsData, setAppointmentsData] = useState([]);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [patientsList, setPatientsList] = useState([]);
    const [newApt, setNewApt] = useState({
        patientId: "", date: "", time: "09:00", duration: 30,
        type: "Kontrol", notes: "", room: "Muayene 1",
    });

    useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

    useEffect(() => {
        appointmentsApi.getAll().then(data => {
            // Normalize: populate might return patient object or just an id
            const normalized = data.map(a => {
                const patient = a.patientId && typeof a.patientId === 'object' ? a.patientId : null;
                return {
                    ...a,
                    id: a._id,
                    patientId: patient ? patient._id : a.patientId,
                    patientName: patient ? patient.name : (a.patientName || 'Bilinmeyen'),
                    age: patient ? patient.age : (a.age || ''),
                    gender: patient ? patient.gender : (a.gender || ''),
                    bloodType: patient ? patient.bloodType : (a.bloodType || ''),
                    date: a.date ? a.date.split('T')[0] : a.date,
                };
            });
            setAppointmentsData(normalized);
            setDataLoaded(true);
        }).catch(err => console.error("Randevu verisi yüklenemedi:", err));
    }, []);

    const fetchAppointments = () => {
        appointmentsApi.getAll().then(data => {
            const normalized = data.map(a => {
                const patient = a.patientId && typeof a.patientId === 'object' ? a.patientId : null;
                return {
                    ...a, id: a._id,
                    patientId: patient ? patient._id : a.patientId,
                    patientName: patient ? patient.name : (a.patientName || 'Bilinmeyen'),
                    age: patient ? patient.age : (a.age || ''),
                    gender: patient ? patient.gender : (a.gender || ''),
                    bloodType: patient ? patient.bloodType : (a.bloodType || ''),
                    date: a.date ? a.date.split('T')[0] : a.date,
                };
            });
            setAppointmentsData(normalized);
        }).catch(err => console.error(err));
    };

    const openCreateModal = () => {
        setNewApt({ patientId: "", date: selectedDate, time: "09:00", duration: 30, type: "Kontrol", notes: "", room: "Muayene 1" });
        patientsApi.getAll().then(setPatientsList).catch(err => console.error(err));
        setIsCreateModalOpen(true);
    };

    const handleCreateApt = async (e) => {
        e.preventDefault();
        try {
            await appointmentsApi.create(newApt);
            setIsCreateModalOpen(false);
            fetchAppointments();
        } catch (err) {
            alert("Randevu oluşturulamadı: " + err.message);
        }
    };

    const handleUpdateStatus = async (e, aptId, newStatus) => {
        e.stopPropagation();
        try {
            await appointmentsApi.update(aptId, { status: newStatus });
            fetchAppointments();
        } catch (err) {
            alert("Durum güncellenemedi: " + err.message);
        }
    };

    const filtered = appointmentsData.filter(a => {
        if (a.date !== selectedDate) return false;
        if (filter !== "tümü" && a.status !== filter) return false;
        if (search && !a.patientName.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    }).sort((a, b) => a.time.localeCompare(b.time));

    const allForDate = appointmentsData.filter(a => a.date === selectedDate);
    const completed = allForDate.filter(a => a.status === "tamamlandı").length;
    const waiting = allForDate.filter(a => a.status === "bekliyor").length;
    const cancelled = allForDate.filter(a => a.status === "iptal").length;

    // Saturday/Sunday detection
    const selDateObj = new Date(selectedDate + "T00:00:00");
    const isSunday = selDateObj.getDay() === 0;
    const isSaturday = selDateObj.getDay() === 6;

    // Type distribution (all time)
    const typeDistR = {};
    appointmentsData.forEach(a => { typeDistR[a.type] = (typeDistR[a.type] || 0) + 1; });
    const typeColors = { "Kontrol": "#3b82f6", "Takip": "#8b5cf6", "İlk Muayene": "#22c55e", "Acil": "#ef4444" };

    const cTotal = useCounter(allForDate.length, 1000, 400);
    const cWaiting = useCounter(waiting, 1000, 500);
    const cCompleted = useCounter(completed, 1000, 600);
    const cCancelled = useCounter(cancelled, 1000, 700);

    const statusC = s => s === "tamamlandı" ? "#22c55e" : s === "bekliyor" ? "#f59e0b" : s === "iptal" ? "#ef4444" : "#6b7280";
    const statusL = s => s === "tamamlandı" ? "Tamamlandı" : s === "bekliyor" ? "Bekliyor" : s === "iptal" ? "İptal Edildi" : s;
    const statusIcon = s => s === "tamamlandı" ? <FiCheckCircle size={11} /> : s === "bekliyor" ? <FiClock size={11} /> : <FiAlertCircle size={11} />;
    const typeC = t => typeColors[t] || "#6b7280";

    const card = (delay = 0, extra = {}) => ({
        background: "white", borderRadius: "20px", padding: "24px",
        border: "1px solid #f3f4f6",
        boxShadow: "0 1px 3px rgba(0,0,0,0.02), 0 8px 24px rgba(0,0,0,0.03)",
        opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(20px)",
        transition: `all 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
        ...extra,
    });

    const formatDateFull = d => {
        const date = new Date(d + "T00:00:00");
        return date.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    };

    // Next appointment from now
    const now = new Date();
    const upcoming = appointmentsData
        .filter(a => a.status === "bekliyor")
        .map(a => ({ ...a, dateObj: new Date(`${a.date}T${a.time}:00`) }))
        .filter(a => a.dateObj > now)
        .sort((a, b) => a.dateObj - b.dateObj);
    const nextApt = upcoming[0] || null;

    return (
        <div style={{
            background: "linear-gradient(180deg, #fef2f2 0%, #fafafa 15%, #f5f5f5 100%)",
            minHeight: "100vh", fontFamily: "'Inter', -apple-system, sans-serif",
            position: "relative", overflow: "hidden",
        }}>
            {/* BG decorations */}
            <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
                <div style={{
                    position: "absolute", top: "-12%", right: "-6%", width: "500px", height: "500px",
                    background: "radial-gradient(circle, rgba(239,68,68,0.05) 0%, transparent 60%)",
                    borderRadius: "50%", animation: "driftOrb 20s ease-in-out infinite",
                }} />
                <div style={{
                    position: "absolute", bottom: "-10%", left: "-8%", width: "400px", height: "400px",
                    background: "radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 60%)",
                    borderRadius: "50%", animation: "driftOrb 25s ease-in-out infinite reverse",
                }} />
                <div style={{
                    position: "absolute", inset: 0,
                    backgroundImage: "radial-gradient(#e5e7eb 1px, transparent 1px)",
                    backgroundSize: "24px 24px", opacity: 0.35,
                }} />
            </div>

            <div style={{ position: "relative", zIndex: 1, maxWidth: "1200px", margin: "0 auto", padding: "0 8px" }}>

                {/* ═══ HERO BANNER ═══ */}
                <div style={{
                    ...card(0, {
                        background: "linear-gradient(135deg, #991b1b 0%, #dc2626 35%, #ef4444 65%, #f87171 100%)",
                        border: "none", color: "white", padding: "28px 32px", marginBottom: "18px",
                        position: "relative", overflow: "hidden",
                    }),
                }}>
                    {/* Animated pulse rings */}
                    <div style={{ position: "absolute", top: "50%", right: "12%", transform: "translateY(-50%)" }}>
                        {[0, 1, 2].map(i => (
                            <div key={i} style={{
                                position: "absolute", width: `${100 + i * 50}px`, height: `${100 + i * 50}px`,
                                borderRadius: "50%", border: "1px solid rgba(255,255,255,0.06)",
                                top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                                animation: `pulseRing 3s ease-out infinite ${i * 0.4}s`,
                            }} />
                        ))}
                    </div>
                    <svg style={{ position: "absolute", bottom: 0, left: 0, right: 0, opacity: 0.06 }} viewBox="0 0 1200 80" preserveAspectRatio="none">
                        <path d="M0,40 C300,10 600,70 900,30 C1050,10 1150,50 1200,40 L1200,80 L0,80 Z" fill="white">
                            <animateTransform attributeName="transform" type="translate" values="0,0; -200,0; 0,0" dur="10s" repeatCount="indefinite" />
                        </path>
                    </svg>
                    <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                                <RiCalendarCheckLine size={18} />
                                <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", opacity: 0.7 }}>Randevu Yönetimi</span>
                            </div>
                            <h1 style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "4px" }}>
                                Randevularım 📋
                            </h1>
                            <p style={{ fontSize: "13px", opacity: 0.65 }}>
                                <FiCalendar size={12} style={{ marginRight: "4px", verticalAlign: "-1px" }} />
                                {formatDateFull(selectedDate)} — <strong>{allForDate.length} randevu</strong>
                                {isSunday && <span style={{ marginLeft: "8px", padding: "2px 8px", borderRadius: "4px", background: "rgba(255,255,255,0.15)", fontSize: "10px", fontWeight: 700 }}>🏖️ TATİL</span>}
                                {isSaturday && <span style={{ marginLeft: "8px", padding: "2px 8px", borderRadius: "4px", background: "rgba(255,255,255,0.15)", fontSize: "10px", fontWeight: 700 }}>⏰ YARIM GÜN (09:00-13:00)</span>}
                            </p>
                        </div>
                        <button onClick={openCreateModal} style={{
                            display: "flex", alignItems: "center", gap: "6px",
                            padding: "10px 20px", borderRadius: "12px",
                            background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)",
                            color: "white", fontSize: "13px", fontWeight: 700, cursor: "pointer",
                            backdropFilter: "blur(8px)", transition: "all 0.2s",
                        }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.3)"}
                            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
                        >
                            <FiPlus size={15} /> Yeni Randevu
                        </button>
                    </div>
                </div>

                {/* ═══ WEEKLY OVERVIEW ═══ */}
                <div style={card(100, { padding: "18px 20px", marginBottom: "18px" })}>
                    <WeeklyOverview appointments={appointmentsData} selectedDate={selectedDate} onSelect={setSelectedDate} />
                </div>

                {/* ═══ ROW: STATS + NEXT APT ═══ */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr) 1.4fr", gap: "14px", marginBottom: "18px" }}>
                    {[
                        { icon: <FiCalendar size={16} />, val: cTotal, label: "Toplam", color: "#6366f1", iconBg: "linear-gradient(135deg, #6366f1, #4f46e5)" },
                        { icon: <FiClock size={16} />, val: cWaiting, label: "Bekleyen", color: "#f59e0b", iconBg: "linear-gradient(135deg, #f59e0b, #d97706)" },
                        { icon: <FiCheckCircle size={16} />, val: cCompleted, label: "Tamamlanan", color: "#22c55e", iconBg: "linear-gradient(135deg, #22c55e, #16a34a)" },
                        { icon: <FiAlertCircle size={16} />, val: cCancelled, label: "İptal", color: "#ef4444", iconBg: "linear-gradient(135deg, #ef4444, #dc2626)" },
                    ].map((c, i) => (
                        <div key={i} style={card(200 + i * 70, { padding: "18px", position: "relative", overflow: "hidden" })}>
                            <div style={{
                                position: "absolute", top: -12, right: -12, width: "50px", height: "50px",
                                borderRadius: "50%", background: `${c.color}06`,
                            }} />
                            <div style={{
                                width: 34, height: 34, borderRadius: "10px", background: c.iconBg,
                                display: "flex", alignItems: "center", justifyContent: "center", color: "white",
                                boxShadow: `0 3px 10px ${c.color}30`, marginBottom: "10px",
                            }}>{c.icon}</div>
                            <div style={{ fontSize: "28px", fontWeight: 900, color: "#111827", lineHeight: 1, fontFeatureSettings: "'tnum'" }}>{c.val}</div>
                            <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500, marginTop: "4px" }}>{c.label}</div>
                        </div>
                    ))}

                    {/* Next Appointment Card */}
                    <div style={card(500, {
                        padding: "18px", position: "relative", overflow: "hidden",
                        background: "linear-gradient(135deg, #fef2f2, #fff)",
                        border: "1px solid #fecaca",
                    })}>
                        <div style={{
                            position: "absolute", top: -20, right: -20, width: "80px", height: "80px",
                            borderRadius: "50%", background: "rgba(239,68,68,0.05)",
                        }} />
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                            <RiPulseLine size={14} style={{ color: "#ef4444" }} />
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.5px" }}>Sonraki Randevu</span>
                        </div>
                        {nextApt ? (
                            <div>
                                <div style={{ fontSize: "15px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>{nextApt.patientName}</div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#6b7280", marginBottom: "3px" }}>
                                    <FiClock size={11} /> <strong style={{ color: "#ef4444" }}>{nextApt.time}</strong> — {nextApt.duration} dk
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#9ca3af" }}>
                                    <FiMapPin size={10} /> {nextApt.room}
                                    <span style={{
                                        padding: "1px 6px", borderRadius: "4px", fontSize: "9px", fontWeight: 700,
                                        background: `${typeC(nextApt.type)}12`, color: typeC(nextApt.type),
                                    }}>{nextApt.type}</span>
                                </div>
                                <div style={{
                                    marginTop: "8px", fontSize: "11px", color: "#6b7280",
                                    padding: "6px 10px", borderRadius: "8px", background: "rgba(239,68,68,0.04)",
                                    borderLeft: "3px solid #ef4444",
                                }}>
                                    {nextApt.notes}
                                </div>
                            </div>
                        ) : (
                            <div style={{ fontSize: "13px", color: "#9ca3af" }}>Bekleyen randevu yok</div>
                        )}
                    </div>
                </div>

                {/* ═══ ROW: CALENDAR + CHARTS + LIST ═══ */}
                <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "14px", marginBottom: "18px" }}>

                    {/* LEFT: Calendar + Donut + Hourly */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        {/* Calendar */}
                        <div style={card(600, { padding: "18px" })}>
                            <MiniCalendar selectedDate={selectedDate} onSelect={setSelectedDate} appointments={appointmentsData} />
                        </div>

                        {/* Donut: Type distribution */}
                        <div style={card(700, { padding: "18px", display: "flex", flexDirection: "column", alignItems: "center" })}>
                            <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#111827", alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
                                <div style={{ width: 20, height: 20, borderRadius: "6px", background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <FiTarget style={{ color: "#6366f1" }} size={10} />
                                </div>
                                Randevu Türleri
                            </h4>
                            <DonutChart
                                segments={Object.entries(typeDistR).map(([t, v]) => ({ value: v, color: typeColors[t] || "#6b7280" }))}
                                center={appointmentsData.length} sub="Toplam"
                            />
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "14px", justifyContent: "center" }}>
                                {Object.entries(typeDistR).map(([t, v]) => (
                                    <div key={t} style={{
                                        padding: "3px 8px", borderRadius: "6px", background: `${typeColors[t] || "#6b7280"}08`,
                                        border: `1px solid ${typeColors[t] || "#6b7280"}15`,
                                        display: "flex", alignItems: "center", gap: "4px",
                                    }}>
                                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: typeColors[t] || "#6b7280" }} />
                                        <span style={{ fontSize: "10px", fontWeight: 600, color: "#374151" }}>{t}</span>
                                        <span style={{ fontSize: "10px", fontWeight: 800, color: typeColors[t] || "#6b7280" }}>{v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Hourly distribution */}
                        <div style={card(800, { padding: "18px" })}>
                            <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                                <div style={{ width: 20, height: 20, borderRadius: "6px", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <FiActivity style={{ color: "#ef4444" }} size={10} />
                                </div>
                                Saatlik Dağılım
                            </h4>
                            <HourlyChart appointments={allForDate} halfDay={isSaturday} holiday={isSunday} />
                        </div>
                    </div>

                    {/* RIGHT: Filter + Appointment list */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        {/* Filter bar */}
                        <div style={card(600, { padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" })}>
                            <div style={{ display: "flex", gap: "5px" }}>
                                {["tümü", "bekliyor", "tamamlandı", "iptal"].map(f => (
                                    <button key={f} onClick={() => setFilter(f)} style={{
                                        padding: "5px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: 600,
                                        border: filter === f ? "none" : "1px solid #e5e7eb", cursor: "pointer",
                                        background: filter === f ? "linear-gradient(135deg, #ef4444, #dc2626)" : "white",
                                        color: filter === f ? "white" : "#6b7280",
                                        boxShadow: filter === f ? "0 2px 8px rgba(239,68,68,0.25)" : "none",
                                        transition: "all 0.2s",
                                    }}>{f === "tümü" ? "Tümü" : statusL(f)}</button>
                                ))}
                            </div>
                            <div style={{
                                display: "flex", alignItems: "center", gap: "6px", padding: "5px 12px",
                                borderRadius: "8px", border: "1px solid #e5e7eb", background: "#f9fafb",
                            }}>
                                <FiSearch size={13} style={{ color: "#9ca3af" }} />
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Hasta ara..."
                                    style={{ border: "none", background: "transparent", fontSize: "12px", outline: "none", color: "#111827", width: "120px" }}
                                />
                            </div>
                        </div>

                        {/* Appointment list */}
                        <div style={card(700, { padding: "16px 18px", flex: 1 })}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                                <div style={{
                                    width: 26, height: 26, borderRadius: "8px",
                                    background: "linear-gradient(135deg, #ef4444, #dc2626)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <RiStethoscopeLine style={{ color: "white" }} size={13} />
                                </div>
                                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>Günlük Program</h3>
                                {isSaturday && (
                                    <span style={{
                                        fontSize: "9px", fontWeight: 700, padding: "3px 8px",
                                        borderRadius: "6px", background: "#fffbeb", color: "#d97706",
                                        border: "1px solid #fef3c7",
                                    }}>⏰ Yarım Gün</span>
                                )}
                                <span style={{ fontSize: "11px", color: "#9ca3af", marginLeft: "auto" }}>{isSunday ? "Tatil" : `${filtered.length} randevu`}</span>
                            </div>

                            {isSunday ? (
                                <div style={{
                                    textAlign: "center", padding: "50px 20px",
                                    background: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(239,68,68,0.02) 10px, rgba(239,68,68,0.02) 20px)",
                                    borderRadius: "16px", border: "2px dashed #fee2e2",
                                }}>
                                    <div style={{ fontSize: "48px", marginBottom: "12px" }}>🏖️</div>
                                    <p style={{ fontSize: "18px", fontWeight: 800, color: "#ef4444", marginBottom: "6px" }}>Pazar Tatili</p>
                                    <p style={{ fontSize: "13px", color: "#9ca3af", lineHeight: 1.5 }}>Bugün randevu alınmamaktadır.<br />İyi dinlenmeler! 😊</p>
                                </div>
                            ) : filtered.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "40px 0", color: "#d1d5db" }}>
                                    <FiCalendar size={36} style={{ marginBottom: "10px", opacity: 0.4 }} />
                                    <p style={{ fontSize: "13px", fontWeight: 500, color: "#9ca3af" }}>Bu tarihte randevu yok</p>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    {filtered.map((apt, i) => {
                                        const ini = (apt.patientName || '').split(" ").map(n => n[0]).join("");
                                        const isHovered = hoveredCard === apt._id;
                                        return (
                                            <div key={apt._id}
                                                onMouseEnter={() => setHoveredCard(apt._id)}
                                                onMouseLeave={() => setHoveredCard(null)}
                                                onClick={() => navigate(`/patients/${apt.patientId}`)}
                                                style={{
                                                    display: "flex", alignItems: "center", gap: "14px",
                                                    padding: "14px 16px", borderRadius: "14px",
                                                    border: `1px solid ${isHovered ? "#fecaca" : "#f3f4f6"}`,
                                                    background: isHovered ? "#fef2f2" : "white",
                                                    cursor: "pointer",
                                                    transform: isHovered ? "translateX(6px) scale(1.005)" : "translateX(0) scale(1)",
                                                    boxShadow: isHovered ? "0 6px 20px rgba(239,68,68,0.08)" : "0 1px 2px rgba(0,0,0,0.02)",
                                                    transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
                                                    opacity: mounted ? 1 : 0,
                                                    animation: mounted ? `slideInRight 0.5s ease ${700 + i * 80}ms both` : "none",
                                                }}
                                            >
                                                {/* Time */}
                                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "50px", flexShrink: 0 }}>
                                                    <span style={{ fontSize: "16px", fontWeight: 800, color: "#111827", fontFeatureSettings: "'tnum'", letterSpacing: "-0.02em" }}>
                                                        {apt.time}
                                                    </span>
                                                    <span style={{ fontSize: "9px", color: "#9ca3af", fontWeight: 500 }}>{apt.duration} dk</span>
                                                </div>

                                                {/* Divider */}
                                                <div style={{
                                                    width: "3px", height: "42px", borderRadius: "2px",
                                                    background: `linear-gradient(180deg, ${typeC(apt.type)}, ${typeC(apt.type)}40)`,
                                                    flexShrink: 0,
                                                }} />

                                                {/* Avatar */}
                                                <div style={{
                                                    width: 42, height: 42, borderRadius: "12px",
                                                    background: `linear-gradient(135deg, ${typeC(apt.type)}, ${typeC(apt.type)}cc)`,
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontSize: "14px", fontWeight: 700, color: "white", flexShrink: 0,
                                                    boxShadow: `0 3px 8px ${typeC(apt.type)}25`,
                                                    transition: "transform 0.2s",
                                                    transform: isHovered ? "scale(1.08)" : "scale(1)",
                                                }}>{ini}</div>

                                                {/* Info */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                                                        <span style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>{apt.patientName}</span>
                                                        <span style={{
                                                            fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "5px",
                                                            background: `${typeC(apt.type)}10`, color: typeC(apt.type),
                                                            border: `1px solid ${typeC(apt.type)}20`,
                                                        }}>{apt.type}</span>
                                                    </div>
                                                    <div style={{ fontSize: "11px", color: "#6b7280" }}>
                                                        {apt.age} yaş • {apt.gender} • {apt.bloodType}
                                                    </div>
                                                    <div style={{
                                                        fontSize: "11px", color: "#9ca3af", marginTop: "2px",
                                                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                                    }}>
                                                        📝 {apt.notes}
                                                    </div>
                                                </div>

                                                {/* Right */}
                                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
                                                    <span style={{
                                                        display: "flex", alignItems: "center", gap: "3px",
                                                        fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "6px",
                                                        background: `${statusC(apt.status)}10`, color: statusC(apt.status),
                                                        border: `1px solid ${statusC(apt.status)}20`,
                                                    }}>
                                                        {statusIcon(apt.status)} {statusL(apt.status)}
                                                    </span>
                                                    {apt.status === "bekliyor" && (
                                                        <div style={{ display: "flex", gap: "4px" }}>
                                                            <button onClick={(e) => handleUpdateStatus(e, apt._id, "tamamlandı")} title="Tamamla" style={{
                                                                width: 24, height: 24, borderRadius: "6px", border: "1px solid #d1fae5",
                                                                background: "#ecfdf5", color: "#22c55e", cursor: "pointer",
                                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                                transition: "all 0.2s",
                                                            }}
                                                                onMouseEnter={e => { e.currentTarget.style.background = "#22c55e"; e.currentTarget.style.color = "white"; }}
                                                                onMouseLeave={e => { e.currentTarget.style.background = "#ecfdf5"; e.currentTarget.style.color = "#22c55e"; }}
                                                            >
                                                                <FiCheckCircle size={12} />
                                                            </button>
                                                            <button onClick={(e) => handleUpdateStatus(e, apt._id, "iptal")} title="İptal Et" style={{
                                                                width: 24, height: 24, borderRadius: "6px", border: "1px solid #fee2e2",
                                                                background: "#fef2f2", color: "#ef4444", cursor: "pointer",
                                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                                transition: "all 0.2s",
                                                            }}
                                                                onMouseEnter={e => { e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.color = "white"; }}
                                                                onMouseLeave={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#ef4444"; }}
                                                            >
                                                                <FiXCircle size={12} />
                                                            </button>
                                                        </div>
                                                    )}
                                                    <div style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: "10px", color: "#b5b5b5" }}>
                                                        <FiMapPin size={9} /> {apt.room}
                                                    </div>
                                                </div>

                                                <FiChevronRight size={14} style={{
                                                    color: isHovered ? "#ef4444" : "#d1d5db", flexShrink: 0,
                                                    transition: "all 0.2s",
                                                    transform: isHovered ? "translateX(2px)" : "translateX(0)",
                                                }} />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ height: "20px" }} />
            </div>

            {/* ═══ CREATE APPOINTMENT MODAL ═══ */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Yeni Randevu Oluştur">
                <form onSubmit={handleCreateApt}>
                    <div className="form-group">
                        <label>Hasta</label>
                        <select className="form-control" value={newApt.patientId}
                            onChange={e => setNewApt({ ...newApt, patientId: e.target.value })} required>
                            <option value="">Hasta seçin...</option>
                            {patientsList.map(p => (
                                <option key={p._id} value={p._id}>{p.name} — {p.age} yaş, {p.gender}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Tarih</label>
                            <input type="date" className="form-control" value={newApt.date}
                                onChange={e => setNewApt({ ...newApt, date: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Saat</label>
                            <select className="form-control" value={newApt.time}
                                onChange={e => setNewApt({ ...newApt, time: e.target.value })}>
                                {["09:00", "09:30", "10:00", "10:15", "10:30", "11:00", "11:30", "12:00", "13:00", "13:30", "14:00", "14:15", "14:30", "15:00", "15:30", "16:00", "16:30"].map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Süre</label>
                            <select className="form-control" value={newApt.duration}
                                onChange={e => setNewApt({ ...newApt, duration: parseInt(e.target.value) })}>
                                <option value={15}>15 dakika</option>
                                <option value={30}>30 dakika</option>
                                <option value={45}>45 dakika</option>
                                <option value={60}>60 dakika</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Tür</label>
                            <select className="form-control" value={newApt.type}
                                onChange={e => setNewApt({ ...newApt, type: e.target.value })}>
                                <option value="Kontrol">Kontrol</option>
                                <option value="Takip">Takip</option>
                                <option value="İlk Muayene">İlk Muayene</option>
                                <option value="Acil">Acil</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Oda</label>
                        <select className="form-control" value={newApt.room}
                            onChange={e => setNewApt({ ...newApt, room: e.target.value })}>
                            <option value="Muayene 1">Muayene 1</option>
                            <option value="Muayene 2">Muayene 2</option>
                            <option value="Muayene 3">Muayene 3</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Notlar</label>
                        <textarea className="form-control" placeholder="Randevu notları..." rows={2}
                            value={newApt.notes} onChange={e => setNewApt({ ...newApt, notes: e.target.value })} />
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>İptal</button>
                        <button type="submit" className="btn btn-primary">Randevu Oluştur</button>
                    </div>
                </form>
            </Modal>

            <style>{`
        @keyframes driftOrb { 0%, 100% { transform: translate(0, 0); } 33% { transform: translate(20px, -18px); } 66% { transform: translate(-18px, 12px); } }
        @keyframes pulseRing {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; }
          100% { transform: translate(-50%, -50%) scale(1.4); opacity: 0; }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
        </div>
    );
}
