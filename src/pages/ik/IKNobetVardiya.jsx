import React, { useState, useEffect } from 'react';
import { DndContext, useDraggable, useDroppable, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { C } from './IKConstants';
import { FiClock, FiUser, FiInfo, FiCheckCircle, FiAlertTriangle, FiTrash2, FiChevronLeft, FiChevronRight, FiDownload } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import html2pdf from 'html2pdf.js';

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const SHIFTS = [
    { id: 'gunduz', label: 'Gündüz (08:00 - 16:00)', icon: '☀️', bg: 'rgba(250,204,21,0.05)', border: 'rgba(250,204,21,0.2)' },
    { id: 'gece', label: 'Gece (16:00 - 08:00)', icon: '🌙', bg: 'rgba(99,102,241,0.05)', border: 'rgba(99,102,241,0.2)' }
];

// --- DRAGGABLE KART (PERSONEL) ---
function StaffCard({ staff, isOverlay }) {
    return (
        <div style={{
            padding: "10px",
            background: "rgba(30,32,50,0.8)",
            border: `1px solid ${staff.color}40`,
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: isOverlay ? "0 10px 25px rgba(0,0,0,0.5)" : "none",
            transform: isOverlay ? "scale(1.05) rotate(2deg)" : "none",
            cursor: "grab",
            transition: isOverlay ? "none" : "all 0.2s",
            opacity: 1
        }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${staff.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                {staff.avatar}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{staff.name}</div>
                <div style={{ fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{staff.role}</div>
            </div>
        </div>
    );
}

// DRAGGABLE WRAPPER
function DraggableStaff({ staff }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `staff-${staff.id}`,
        data: staff
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            <StaffCard staff={staff} />
        </div>
    );
}

// SHIFT SLOT IN CALENDAR (DROPPABLE)
function ShiftSlot({ day, shift, assignments, onRemove, dateStr }) {
    const id = `${day}-${shift.id}`;
    const { isOver, setNodeRef } = useDroppable({ id });

    return (
        <div ref={setNodeRef} style={{
            flex: 1,
            minHeight: "100px",
            background: isOver ? shift.border : shift.bg,
            border: `1px dashed ${isOver ? shift.border.replace('0.2', '0.6') : shift.border}`,
            borderRadius: "8px",
            padding: "8px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            transition: "all 0.2s",
            position: "relative",
            minWidth: "120px"
        }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>{shift.icon} {shift.label.split(' ')[0]}</span>
            </div>

            {assignments.map(a => (
                <div key={a.dbId || a.id} style={{
                    padding: "6px 8px",
                    background: `${a.color}15`,
                    border: `1px solid ${a.color}30`,
                    borderRadius: "6px",
                    fontSize: 12,
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "80%" }}>
                        <span style={{ fontSize: 14 }}>{a.avatar}</span> {a.name}
                    </span>
                    <button
                        onClick={() => onRemove(day, shift.id, a.dbId || a.id)}
                        style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: 2, display: "flex", alignItems: "center", opacity: 0.7 }}
                        onMouseEnter={e => e.currentTarget.style.opacity = 1}
                        onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
                    >
                        <FiTrash2 size={12} />
                    </button>
                </div>
            ))}
            {assignments.length === 0 && (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "rgba(255,255,255,0.15)", fontStyle: "italic", textAlign: "center" }}>
                    Boş
                </div>
            )}
        </div>
    );
}

export default function IKNobetVardiya() {
    const getMonday = (d) => {
        d = new Date(d);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
    };

    const [currentWeekMonday, setCurrentWeekMonday] = useState(getMonday(new Date()));
    const [schedule, setSchedule] = useState({});
    const [staffList, setStaffList] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [loadingStaff, setLoadingStaff] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor)
    );

    // Dynamic dates calculations
    const getWeekDates = (mondayDate) => {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(mondayDate);
            d.setDate(mondayDate.getDate() + i);
            dates.push(d.toISOString().split('T')[0]);
        }
        return dates;
    };

    const weekDates = getWeekDates(currentWeekMonday);

    // Fetch Employees
    useEffect(() => {
        const fetchStaff = async () => {
            try {
                const token = localStorage.getItem("ik_token") || localStorage.getItem("token");
                const res = await fetch("http://localhost:5001/api/hr/employees", {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                if (res.ok) {
                    const emps = await res.json();
                    const mapped = emps
                        .filter(emp => emp.role === "doctor")
                        .map(emp => ({
                            id: emp.id,
                            name: emp.name,
                            role: emp.title + " (" + emp.specialty + ")",
                            type: "doctor",
                            color: "#818cf8",
                            avatar: "👨‍⚕️",
                        }));
                    setStaffList(mapped);
                }
            } catch (err) {
                console.error("Personeller yüklenemedi", err);
                toast.error("Çalışan listesi yüklenemedi.");
            } finally {
                setLoadingStaff(false);
            }
        };
        fetchStaff();
    }, []);

    // Fetch Shifts
    const fetchShifts = async () => {
        try {
            const token = localStorage.getItem("ik_token") || localStorage.getItem("token");
            const res = await fetch("http://localhost:5001/api/hr/duty-shifts", {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (res.ok) {
                const shifts = await res.json();
                
                const newSchedule = {};
                DAYS.forEach(day => {
                    SHIFTS.forEach(shift => {
                        newSchedule[`${day}-${shift.id}`] = [];
                    });
                });

                shifts.forEach(s => {
                    const dayIndex = weekDates.indexOf(s.date);
                    if (dayIndex !== -1) {
                        const dayName = DAYS[dayIndex];
                        const slotId = `${dayName}-${s.note}`;
                        if (newSchedule[slotId]) {
                            const userObj = s.userId;
                            if (userObj) {
                                newSchedule[slotId].push({
                                    id: userObj._id,
                                    dbId: s._id,
                                    name: userObj.profileId?.name || "Bilinmeyen Çalışan",
                                    role: userObj.profileId?.specialty || userObj.role || "Çalışan",
                                    avatar: userObj.role === "doctor" ? "👨‍⚕️" : "👩‍💼",
                                    color: userObj.role === "doctor" ? "#818cf8" : "#34d399",
                                });
                            }
                        }
                    }
                });
                setSchedule(newSchedule);
            }
        } catch (err) {
            console.error("Nöbetler yüklenemedi", err);
        }
    };

    useEffect(() => {
        if (staffList.length > 0) {
            fetchShifts();
        }
    }, [currentWeekMonday, staffList]);

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const staffData = active.data.current;
        const slotId = over.id; // e.g. "Pazartesi-gunduz"
        const [day, shiftId] = slotId.split('-');
        const dateIndex = DAYS.indexOf(day);
        const dateStr = weekDates[dateIndex];

        // Geçmiş Tarih Kontrolü
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        if (dateStr < todayStr) {
            toast.error("Geçmiş tarihlere nöbet ataması yapılamaz!", { icon: '⚠️' });
            return;
        }

        // 1. Çakışma Kontrolü (Aynı vardiyada var mı?)
        const currentSlotAssignments = schedule[slotId] || [];
        const isAlreadyInSlot = currentSlotAssignments.some(s => s.id === staffData.id);

        if (isAlreadyInSlot) {
            toast.error(`${staffData.name} zaten bu nöbete atanmış.`);
            return;
        }

        // 2. Çakışma Kontrolü (Aynı gün diğer vardiyada var mı?)
        const otherShiftId = shiftId === 'gunduz' ? 'gece' : 'gunduz';
        const otherSlotId = `${day}-${otherShiftId}`;
        const otherSlotAssignments = schedule[otherSlotId] || [];
        const isAlreadyInOtherSlot = otherSlotAssignments.some(s => s.id === staffData.id);

        if (isAlreadyInOtherSlot) {
             toast.error(`Çakışma: ${staffData.name} aynı gün iki vardiyada çalışamaz!`, { icon: '⚠️' });
             return;
        }

        // Save to Database
        try {
            const token = localStorage.getItem("ik_token") || localStorage.getItem("token");
            const res = await fetch("http://localhost:5001/api/hr/duty-shifts", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...token ? { Authorization: `Bearer ${token}` } : {} },
                body: JSON.stringify({
                    userId: staffData.id,
                    date: dateStr,
                    note: shiftId
                })
            });

            if (res.ok) {
                const newShift = await res.json();
                setSchedule(prev => ({
                    ...prev,
                    [slotId]: [...(prev[slotId] || []), {
                        id: staffData.id,
                        dbId: newShift._id,
                        name: staffData.name,
                        role: staffData.role,
                        avatar: staffData.avatar,
                        color: staffData.color
                    }]
                }));
                toast.success(`${staffData.name} başarıyla ${day} nöbetine eklendi.`);
            } else {
                const data = await res.json();
                toast.error(data.error || "Nöbet kaydedilemedi.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Sunucu bağlantı hatası.");
        }
    };

    const removeAssignment = async (day, shiftId, dbId) => {
        try {
            const token = localStorage.getItem("ik_token") || localStorage.getItem("token");
            const res = await fetch(`http://localhost:5001/api/hr/duty-shifts/${dbId}`, {
                method: "DELETE",
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            if (res.ok) {
                const slotId = `${day}-${shiftId}`;
                setSchedule(prev => ({
                    ...prev,
                    [slotId]: prev[slotId].filter(s => s.dbId !== dbId)
                }));
                toast.success("Nöbet kaydı silindi.");
            } else {
                toast.error("Nöbet kaydı silinemedi.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Sunucu bağlantı hatası.");
        }
    };

    const handleSave = () => {
        let count = 0;
        Object.values(schedule).forEach(arr => {
            if (Array.isArray(arr)) count += arr.length;
        });
        if (count === 0) {
            toast.error("Kaydedilecek veya yayımlanacak nöbet bulunamadı.");
            return;
        }
        
        toast.promise(
            new Promise(resolve => setTimeout(resolve, 1000)),
            {
                loading: 'Vardiya çizelgesi kesinleştiriliyor...',
                success: <b>Nöbet çizelgesi başarıyla kesinleştirildi ve yayımlandı!</b>,
                error: <b>İşlem sırasında bir hata oluştu.</b>,
            }
        );
    };

    const handleDownloadPDF = () => {
        const element = document.getElementById('nobet-takvimi-container');
        if (!element) {
            toast.error("Takvim bulunamadı.");
            return;
        }

        const pdfName = `MediTrack_Nobet_Cizelgesi_${weekDates[0]}_to_${weekDates[6]}.pdf`;

        const opt = {
            margin: 10,
            filename: pdfName,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2, 
                useCORS: true, 
                backgroundColor: '#0c0e1f'
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };

        const pdfPromise = new Promise((resolve, reject) => {
            try {
                const worker = html2pdf().set(opt).from(element).save();
                if (worker && typeof worker.then === 'function') {
                    worker.then(resolve);
                } else {
                    resolve();
                }
            } catch (err) {
                reject(err);
            }
        });

        toast.promise(
            pdfPromise,
            {
                loading: 'PDF dosyası hazırlanıyor...',
                success: 'PDF başarıyla indirildi!',
                error: 'PDF oluşturulurken bir hata oluştu.'
            }
        );
    };

    const handlePrevWeek = () => {
        const prev = new Date(currentWeekMonday);
        prev.setDate(currentWeekMonday.getDate() - 7);
        setCurrentWeekMonday(prev);
    };

    const handleNextWeek = () => {
        const next = new Date(currentWeekMonday);
        next.setDate(currentWeekMonday.getDate() + 7);
        setCurrentWeekMonday(next);
    };

    const handleCurrentWeek = () => {
        setCurrentWeekMonday(getMonday(new Date()));
    };

    const formatWeekRange = () => {
        const sunday = new Date(currentWeekMonday);
        sunday.setDate(currentWeekMonday.getDate() + 6);
        return `${currentWeekMonday.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - ${sunday.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    };

    const activeStaff = activeId ? staffList.find(s => `staff-${s.id}` === activeId) : null;

    const filteredStaff = staffList.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={{ paddingBottom: 40, animation: "fadeIn 0.4s ease-out" }}>
            <Toaster position="top-right" />
            
            {/* Header / Topbar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 14 }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, color: "white", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                        <FiClock color={C.grad.split(',')[1]} /> Nöbet ve Vardiya Çizelgesi
                    </h2>
                    <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
                        Personeli sol taraftan sürükleyerek haftalık takvime bırakın. Çakışmalar otomatik kontrol edilir.
                    </p>
                </div>
                
                {/* Actions Panel */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {/* PDF Download Button */}
                    <button onClick={handleDownloadPDF} style={{
                        padding: "10px 16px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
                        borderRadius: "10px", color: "#a5b4fc", fontSize: 13, fontWeight: 700, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s", fontFamily: "Inter,sans-serif"
                    }} onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,0.18)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(99,102,241,0.1)"}>
                        <FiDownload size={15} /> PDF İndir
                    </button>

                    {/* Kaydet ve Yayımla Button */}
                    <button onClick={handleSave} style={{
                        padding: "10px 20px", background: C.grad, border: "none",
                        borderRadius: "10px", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 15px rgba(99,102,241,0.4)", fontFamily: "Inter,sans-serif"
                    }}>
                        <FiCheckCircle size={16} /> Kaydet ve Yayımla
                    </button>

                    {/* Week Navigation */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "4px 8px" }}>
                        <button onClick={handlePrevWeek} style={{ background: "transparent", border: "none", color: "white", padding: 8, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center" }} title="Önceki Hafta">
                            <FiChevronLeft size={16} />
                        </button>
                        <button onClick={handleCurrentWeek} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "white", padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "Inter,sans-serif" }}>
                            Bu Hafta
                        </button>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "white", minWidth: 150, textAlign: "center", padding: "0 6px" }}>
                            {formatWeekRange()}
                        </span>
                        <button onClick={handleNextWeek} style={{ background: "transparent", border: "none", color: "white", padding: 8, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center" }} title="Sonraki Hafta">
                            <FiChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div style={{ display: "flex", gap: 24, overflowX: "auto", paddingBottom: "10px" }}>
                    
                    {/* STAFF SIDEBAR */}
                    <div style={{
                        width: "280px",
                        background: "rgba(255,255,255,0.02)",
                        border: `1px solid ${C.border}`,
                        borderRadius: "16px",
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                        flexShrink: 0,
                        position: "sticky",
                        left: 0,
                        zIndex: 10
                    }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "white", display: "flex", alignItems: "center", gap: 8 }}>
                            <FiUser color={C.muted} /> Doktor Listesi
                        </div>
                        
                        {/* Search bar */}
                        <div style={{ position: "relative" }}>
                            <input 
                                type="text"
                                placeholder="Doktor ara..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{
                                    width: "100%", padding: "8px 12px",
                                    background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`,
                                    borderRadius: 8, color: "white", fontSize: 12, outline: "none", boxSizing: "border-box"
                                }}
                            />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", maxHeight: "calc(100vh - 350px)", paddingRight: 4 }}>
                            {loadingStaff ? (
                                <div style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: 10 }}>Yükleniyor...</div>
                            ) : filteredStaff.length === 0 ? (
                                <div style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: 10 }}>Doktor bulunamadı.</div>
                            ) : (
                                filteredStaff.map(staff => (
                                    <DraggableStaff key={staff.id} staff={staff} />
                                ))
                            )}
                        </div>
                        
                        <div style={{ marginTop: "auto", padding: "12px", background: "rgba(250,204,21,0.05)", borderRadius: "10px", border: "1px dashed rgba(250,204,21,0.3)" }}>
                            <div style={{ fontSize: 12, color: "#fbbf24", display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
                                <FiInfo size={14} /> Çakışma Yönetimi
                            </div>
                            <div style={{ fontSize: 11, color: C.muted, marginTop: 4, lineHeight: 1.4 }}>
                                Aynı doktoru aynı gün iki vardiyaya yazamazsınız. Sistem bunu engelleyecektir. Yapılan her sürükle-bırak işlemi anında kaydedilir.
                            </div>
                        </div>
                    </div>

                    {/* CALENDAR GRID */}
                    <div id="nobet-takvimi-container" style={{
                        flex: 1,
                        background: "rgba(6,7,15,0.4)",
                        border: `1px solid ${C.border}`,
                        borderRadius: "16px",
                        overflow: "hidden",
                        minWidth: "950px",
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", padding: "4px 8px" }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>Haftalık Çalışma ve Nöbet Dağılımı</span>
                            <span style={{ fontSize: 11, color: C.muted }}>Hafta: {formatWeekRange()}</span>
                        </div>
                        {/* Header ROW */}
                        <div style={{ display: "grid", gridTemplateColumns: "100px repeat(7, 1fr)", background: "rgba(255,255,255,0.03)", borderBottom: `1px solid ${C.border}` }}>
                             <div style={{ padding: "12px", borderRight: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: C.muted }}>Vardiya</div>
                             {DAYS.map((day, idx) => {
                                 const dayDate = new Date(weekDates[idx]);
                                 const formattedDate = dayDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'numeric' });
                                 return (
                                     <div key={day} style={{ padding: "12px", borderRight: idx === 6 ? 'none' : `1px solid ${C.border}`, textAlign: "center" }}>
                                         <div style={{ fontSize: 13, fontWeight: 600, color: "white" }}>{day}</div>
                                         <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{formattedDate}</div>
                                     </div>
                                 );
                             })}
                        </div>

                        {/* SHIFT ROWS */}
                        {SHIFTS.map(shift => (
                            <div key={shift.id} style={{ display: "grid", gridTemplateColumns: "100px repeat(7, 1fr)", borderBottom: `1px solid ${C.border}` }}>
                                {/* Left Labels */}
                                <div style={{ 
                                    padding: "16px", borderRight: `1px solid ${C.border}`, 
                                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                                    background: "rgba(255,255,255,0.01)"
                                }}>
                                    <span style={{ fontSize: 20 }}>{shift.icon}</span>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: "white", textAlign: "center" }}>{shift.label.split(' ')[0]}</span>
                                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>{shift.label.split('(')[1].replace(')','')}</span>
                                </div>

                                {/* Droppable Slots for each day */}
                                {DAYS.map((day, idx) => (
                                    <div key={`${day}-${shift.id}`} style={{ padding: "8px", borderRight: idx === 6 ? 'none' : `1px solid ${C.border}` }}>
                                        <ShiftSlot 
                                            day={day} 
                                            shift={shift} 
                                            assignments={schedule[`${day}-${shift.id}`] || []} 
                                            onRemove={removeAssignment}
                                            dateStr={weekDates[idx]}
                                        />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                <DragOverlay dropAnimation={{
                    duration: 250,
                    easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
                }}>
                    {activeStaff ? <StaffCard staff={activeStaff} isOverlay /> : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
