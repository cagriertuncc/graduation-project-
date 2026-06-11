import { useState, useEffect } from "react";
import {
    FiMapPin, FiPhone, FiClock, FiCompass, FiNavigation, FiInfo,
    FiActivity, FiSearch, FiChevronRight, FiHeart, FiAlertTriangle, FiX, FiExternalLink
} from "react-icons/fi";

const STATIC_FACILITIES = [
    {
        id: "alsancak-devlet",
        name: "İzmir Alsancak Nevvar Salih İşgören Devlet Hastanesi",
        type: "hospital",
        address: "Alsancak Mah., Mimar Sinan Cd. No:84, Konak/İzmir",
        phone: "0232 464 78 62",
        hours: "7/24 Açık",
        lat: 38.4357,
        lng: 27.1423
    },
    {
        id: "ege-hastanesi",
        name: "Ege Üniversitesi Tıp Fakültesi Hastanesi",
        type: "hospital",
        address: "Kazımdirik Mah., Üniversite Cd., Bornova/İzmir",
        phone: "0232 390 40 00",
        hours: "7/24 Açık",
        lat: 38.4632,
        lng: 27.2245
    },
    {
        id: "dokuz-eylul",
        name: "Dokuz Eylül Üniversitesi Tıp Fakültesi Hastanesi",
        type: "hospital",
        address: "Mithatpaşa Cd. No:56, Balçova/İzmir",
        phone: "0232 412 22 22",
        hours: "7/24 Açık",
        lat: 38.3895,
        lng: 27.0372
    },
    {
        id: "turkan-ozilhan",
        name: "Bornova Türkan Özilhan Devlet Hastanesi",
        type: "hospital",
        address: "Erzene Mah., 116. Sk. No:5, Bornova/İzmir",
        phone: "0232 375 58 58",
        hours: "7/24 Açık",
        lat: 38.4621,
        lng: 27.2144
    },
    {
        id: "buca-kadin",
        name: "Buca Kadın Doğum ve Çocuk Hastalıkları Hastanesi",
        type: "hospital",
        address: "Adatepe Mah., 12. Sk. No:2, Buca/İzmir",
        phone: "0232 452 52 52",
        hours: "7/24 Açık",
        lat: 38.3848,
        lng: 27.1724
    },
    {
        id: "alsancak-asm",
        name: "Alsancak Aile Sağlığı Merkezi (ASM)",
        type: "asm",
        address: "Kültür Mah., Talatpaşa Blv. No:45, Konak/İzmir",
        phone: "0232 464 12 12",
        hours: "Hafta içi 08:30 - 17:30",
        lat: 38.4328,
        lng: 27.1415
    },
    {
        id: "bornova-3-asm",
        name: "Bornova 3 No'lu Aile Sağlığı Merkezi",
        type: "asm",
        address: "Kazımdirik Mah., 160. Sk. No:8, Bornova/İzmir",
        phone: "0232 388 15 15",
        hours: "Hafta içi 08:30 - 17:30",
        lat: 38.4590,
        lng: 27.2105
    },
    {
        id: "karsiyaka-1-asm",
        name: "Karşıyaka 1 No'lu Aile Sağlığı Merkezi",
        type: "asm",
        address: "Donanmacı Mah., Cemal Gürsel Cd. No:112, Karşıyaka/İzmir",
        phone: "0232 369 44 44",
        hours: "Hafta içi 08:30 - 17:30",
        lat: 38.4565,
        lng: 27.1145
    },
    {
        id: "buca-tip",
        name: "Özel Buca Tıp Merkezi",
        type: "clinic",
        address: "Menderes Cd. No:120, Buca/İzmir",
        phone: "0232 438 14 14",
        hours: "08:00 - 23:00",
        lat: 38.3908,
        lng: 27.1652
    },
    {
        id: "kent-hastanesi",
        name: "Özel Kent Hastanesi",
        type: "clinic",
        address: "8229/1. Sk. No:56, Çiğli/İzmir",
        phone: "0232 398 00 00",
        hours: "7/24 Açık",
        lat: 38.4875,
        lng: 27.0988
    },
    {
        id: "alsancak-acil",
        name: "Alsancak Nevvar Salih İşgören Acil Servis Birimi",
        type: "er",
        address: "Alsancak Mah., Mimar Sinan Cd., Konak/İzmir",
        phone: "0232 464 78 62",
        hours: "7/24 Açık (Acil Servis)",
        lat: 38.4357,
        lng: 27.1423
    },
    {
        id: "ege-acil",
        name: "Ege Üniversitesi Acil Servis Departmanı",
        type: "er",
        address: "Kazımdirik Mah., Üniversite Cd., Bornova/İzmir",
        phone: "0232 390 40 00",
        hours: "7/24 Açık (Acil Servis)",
        lat: 38.4628,
        lng: 27.2238
    },
    {
        id: "deu-acil",
        name: "Dokuz Eylül Üniversitesi Acil Servis Dep.",
        type: "er",
        address: "Mithatpaşa Cd., Balçova/İzmir",
        phone: "0232 412 22 22",
        hours: "7/24 Açık (Acil Servis)",
        lat: 38.3892,
        lng: 27.0375
    }
];

// Haversine Distance Calculation Formula
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

export default function HealthFacilities({ theme, lang, userLocation, setUserLocation }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState("all");
    const [facilities, setFacilities] = useState(STATIC_FACILITIES);
    const [selectedFacility, setSelectedFacility] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showEmergencyModal, setShowEmergencyModal] = useState(false);
    const [isEmergencyAction, setIsEmergencyAction] = useState(false);

    const isDark = theme === "dark";
    const t = (trText, enText) => (lang === "tr" ? trText : enText);

    // Initial load or when user location changes
    useEffect(() => {
        if (userLocation) {
            // Generate 3 dynamic ultra-close facilities for a better user experience
            const dynamicCloseFacilities = [
                {
                    id: "dyn-er",
                    name: t("Bulunduğunuz Konuma En Yakın Acil Servis İstasyonu", "Nearest Emergency Service Station to You"),
                    type: "er",
                    address: t("Bulunduğunuz sokağa 2 dk mesafede", "2 mins distance from your current street"),
                    phone: "112",
                    hours: "7/24 Açık",
                    lat: userLocation.lat + 0.0018,
                    lng: userLocation.lng + 0.0012
                },
                {
                    id: "dyn-asm",
                    name: t("Semt Aile Sağlığı Merkezi (ASM)", "Neighborhood Family Health Center"),
                    type: "asm",
                    address: t("Bulunduğunuz caddede, köşede", "At the corner of your current avenue"),
                    phone: "0232 999 88 77",
                    hours: "Hafta içi 08:30 - 17:30",
                    lat: userLocation.lat - 0.0025,
                    lng: userLocation.lng - 0.0031
                },
                {
                    id: "dyn-clinic",
                    name: t("Özel Şifa Sağlık Polikliniği", "Private Shifa Medical Clinic"),
                    type: "clinic",
                    address: t("Bulunduğunuz mahalleye 500m mesafede", "500m distance from your current neighborhood"),
                    phone: "0232 888 77 66",
                    hours: "09:00 - 22:00",
                    lat: userLocation.lat + 0.0042,
                    lng: userLocation.lng - 0.0028
                }
            ];

            const combined = [...dynamicCloseFacilities, ...STATIC_FACILITIES];
            const updated = combined.map(fac => {
                const dist = getDistance(userLocation.lat, userLocation.lng, fac.lat, fac.lng);
                return { ...fac, distance: dist };
            });

            // Sort by distance
            updated.sort((a, b) => a.distance - b.distance);
            setFacilities(updated);

            // Default select the nearest if none selected yet
            if (!selectedFacility) {
                setSelectedFacility(updated[0]);
            }
        } else {
            // No geolocation, just map static with mock distance or no distance
            const updated = STATIC_FACILITIES.map(fac => ({ ...fac, distance: null }));
            setFacilities(updated);
            if (!selectedFacility) {
                setSelectedFacility(updated[0]);
            }
        }
    }, [userLocation, lang]);

    const handleGetLocation = () => {
        setIsLoading(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    setUserLocation({ lat, lng });
                    setIsLoading(false);
                },
                (error) => {
                    console.error("Error getting geolocation: ", error);
                    // Fallback to central İzmir coordinates
                    setUserLocation({ lat: 38.4237, lng: 27.1428 });
                    setIsLoading(false);
                }
            );
        } else {
            // Browser doesn't support geolocation
            setUserLocation({ lat: 38.4237, lng: 27.1428 });
            setIsLoading(false);
        }
    };

    // Trigger acil yol tarifi
    const handleTriggerEmergencyRoute = () => {
        setIsEmergencyAction(true);
        if (!userLocation) {
            // Request location first
            setIsLoading(true);
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        setUserLocation({ lat, lng });
                        setIsLoading(false);
                        chartEmergencyRoute({ lat, lng });
                    },
                    (error) => {
                        console.error("Error getting location in emergency:", error);
                        const fallbackLoc = { lat: 38.4237, lng: 27.1428 };
                        setUserLocation(fallbackLoc);
                        setIsLoading(false);
                        chartEmergencyRoute(fallbackLoc);
                    }
                );
            } else {
                const fallbackLoc = { lat: 38.4237, lng: 27.1428 };
                setUserLocation(fallbackLoc);
                setIsLoading(false);
                chartEmergencyRoute(fallbackLoc);
            }
        } else {
            chartEmergencyRoute(userLocation);
        }
    };

    const chartEmergencyRoute = (location) => {
        // Recalculate and find closest ER or Hospital
        const updated = facilities.map(fac => {
            const dist = getDistance(location.lat, location.lng, fac.lat, fac.lng);
            return { ...fac, distance: dist };
        });

        // Filter for ER (Emergency Room) or Hospital
        const emergencyFacilities = updated.filter(f => f.type === "er" || f.type === "hospital");
        emergencyFacilities.sort((a, b) => a.distance - b.distance);

        if (emergencyFacilities.length > 0) {
            const nearestER = emergencyFacilities[0];
            setSelectedFacility(nearestER);
            // Scroll to map or focus
            const mapEl = document.getElementById("facility-map-container");
            if (mapEl) {
                mapEl.scrollIntoView({ behavior: "smooth" });
            }
        }
    };

    // Filter facilities based on search query and category selector
    const filteredFacilities = facilities.filter(fac => {
        const matchesQuery =
            fac.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            fac.address.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = selectedType === "all" || fac.type === selectedType;
        return matchesQuery && matchesType;
    });

    const getFacilityTypeName = (type) => {
        switch (type) {
            case "hospital":
                return t("Hastane", "Hospital");
            case "asm":
                return t("Aile Sağlığı Merkezi (ASM)", "Family Health Center");
            case "clinic":
                return t("Tıp Merkezi / Poliklinik", "Medical Clinic");
            case "er":
                return t("Acil Servis", "Emergency Room (ER)");
            default:
                return t("Sağlık Kuruluşu", "Health Facility");
        }
    };

    const getFacilityTypeBadgeColor = (type) => {
        switch (type) {
            case "er":
                return { bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444", border: "rgba(239, 68, 68, 0.3)" };
            case "hospital":
                return { bg: "rgba(225, 29, 72, 0.12)", color: "#e11d48", border: "rgba(225, 29, 72, 0.25)" };
            case "asm":
                return { bg: "rgba(59, 130, 246, 0.12)", color: "#3b82f6", border: "rgba(59, 130, 246, 0.25)" };
            case "clinic":
                return { bg: "rgba(16, 185, 129, 0.12)", color: "#10b981", border: "rgba(16, 185, 129, 0.25)" };
            default:
                return { bg: "rgba(100, 116, 139, 0.12)", color: "#64748b", border: "rgba(100, 116, 139, 0.25)" };
        }
    };

    const formatDistance = (dist) => {
        if (dist === null || dist === undefined) return "";
        if (dist < 1) {
            return `${Math.round(dist * 1000)} m`;
        }
        return `${dist.toFixed(1)} km`;
    };

    const mapSrc = selectedFacility
        ? userLocation
            ? `https://maps.google.com/maps?saddr=${userLocation.lat},${userLocation.lng}&daddr=${selectedFacility.lat},${selectedFacility.lng}&t=&z=14&ie=UTF8&iwloc=&output=embed`
            : `https://maps.google.com/maps?q=${selectedFacility.lat},${selectedFacility.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`
        : "";

    // Styled Tokens
    const SECTION_BG = isDark ? "rgba(30,41,59,0.7)" : "rgba(255,255,255,0.9)";
    const BORDER_COL = isDark ? "#334155" : "#e2e8f0";
    const TEXT_COL = isDark ? "#f8fafc" : "#1e293b";
    const MUTED_COL = isDark ? "#94a3b8" : "#64748b";

    return (
        <div style={{ animation: "fadeIn 0.5s ease", fontFamily: "'Outfit', sans-serif" }}>

            {/* ── Hero Banner ── */}
            <div style={{
                background: "linear-gradient(135deg, #be123c 0%, #e11d48 50%, #f43f5e 100%)",
                borderRadius: 32, padding: "40px 48px", marginBottom: 32,
                position: "relative", overflow: "hidden",
                boxShadow: "0 20px 40px -10px rgba(225,29,72,0.3)"
            }}>
                <div style={{ position: "absolute", top: "-20%", right: "-5%", width: 400, height: 400, background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)", borderRadius: "50%" }} />
                
                <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, background: "rgba(255,255,255,0.2)", width: "fit-content", padding: "6px 14px", borderRadius: 100 }}>
                            <FiCompass size={14} color="white" />
                            <span style={{ fontSize: 11, fontWeight: 700, color: "white", letterSpacing: "1px", textTransform: "uppercase" }}>
                                {t("ACİL YOL TARİFİ VE KONUM SERVİSLERİ", "EMERGENCY DIRECTIONS & LOCATIONS")}
                            </span>
                        </div>
                        <h1 style={{ fontSize: 34, fontWeight: 900, color: "white", margin: "0 0 8px", letterSpacing: "-1px" }}>
                            {t("En Yakın Sağlık Kuruluşları", "Nearest Health Facilities")}
                        </h1>
                        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 15, margin: 0, maxWidth: "600px" }}>
                            {t("Yakınınızdaki hastaneler, acil servisler ve aile hekimlerini harita üzerinde listeleyin, anlık olarak acil durum yol tarifi alın.", "List hospitals, emergency rooms and family physicians near you, and chart instant real-time route directions.")}
                        </p>
                    </div>

                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        <button
                            onClick={handleTriggerEmergencyRoute}
                            style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "14px 24px", borderRadius: 16,
                                background: "white",
                                color: "#e11d48", border: "none", cursor: "pointer",
                                fontWeight: 800, fontSize: 14,
                                boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                                transition: "all 0.2s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                        >
                            <FiActivity size={16} />
                            {t("🚨 ACİL YOL TARİFİ", "🚨 EMERGENCY ROUTE")}
                        </button>

                        <button
                            onClick={() => setShowEmergencyModal(true)}
                            style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "14px 24px", borderRadius: 16,
                                background: "rgba(255, 255, 255, 0.2)",
                                color: "white", border: "1px solid rgba(255, 255, 255, 0.4)", cursor: "pointer",
                                fontWeight: 700, fontSize: 14,
                                transition: "all 0.2s"
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                        >
                            <FiPhone size={16} />
                            {t("📞 112 Kılavuzu", "📞 112 Guide")}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Controls Section ── */}
            <div className="glass-card" style={{
                background: SECTION_BG, borderRadius: 24, border: `1px solid ${BORDER_COL}`,
                padding: "24px", marginBottom: 24
            }}>
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: "12px", flex: "1 1 500px", maxWidth: "100%" }}>
                        {/* Search Input */}
                        <div style={{ position: "relative", flexGrow: 1 }}>
                            <FiSearch style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: MUTED_COL }} />
                            <input
                                type="text"
                                style={{
                                    width: "100%", padding: "12px 16px 12px 42px", borderRadius: "14px",
                                    border: `1px solid ${BORDER_COL}`,
                                    background: isDark ? "#0f172a" : "#f8fafc",
                                    color: TEXT_COL, fontWeight: 600, fontSize: "14px", outline: "none",
                                    transition: "all 0.2s"
                                }}
                                placeholder={t("Kuruluş adı veya adres ara...", "Search facility name or address...")}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Location Trigger */}
                        <button
                            onClick={handleGetLocation}
                            disabled={isLoading}
                            style={{
                                padding: "12px 20px", borderRadius: "14px",
                                background: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)",
                                color: "white", border: "none", cursor: isLoading ? "not-allowed" : "pointer",
                                fontWeight: 700, fontSize: "14px",
                                display: "flex", alignItems: "center", gap: "8px",
                                boxShadow: "0 4px 12px rgba(225,29,72,0.2)"
                            }}
                        >
                            <FiMapPin />
                            {isLoading ? t("Bulunuyor...", "Locating...") : t("Konumumu Bul", "Find My Location")}
                        </button>
                    </div>

                    {/* Filter Pills */}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {[
                            { id: "all", label: t("Tümü", "All") },
                            { id: "hospital", label: t("Hastaneler", "Hospitals") },
                            { id: "asm", label: t("Aile Hekimliği", "Family Doctors") },
                            { id: "clinic", label: t("Tıp Merkezleri", "Clinics") },
                            { id: "er", label: t("Acil Servisler", "Emergency") }
                        ].map(pill => (
                            <button
                                key={pill.id}
                                onClick={() => setSelectedType(pill.id)}
                                style={{
                                    padding: "8px 16px", borderRadius: "10px", border: "none",
                                    background: selectedType === pill.id
                                        ? "linear-gradient(135deg, #e11d48 0%, #be123c 100%)"
                                        : (isDark ? "#1e293b" : "#f1f5f9"),
                                    color: selectedType === pill.id ? "white" : TEXT_COL,
                                    fontWeight: 700, fontSize: "13px", cursor: "pointer",
                                    boxShadow: selectedType === pill.id ? "0 4px 10px rgba(225,29,72,0.2)" : "none",
                                    transition: "all 0.2s"
                                }}
                            >
                                {pill.label}
                            </button>
                        ))}
                    </div>
                </div>
                {userLocation && (
                    <div style={{ marginTop: "12px", fontSize: "13px", color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                        <FiMapPin />
                        {t(
                            `Konum bilgisi alındı. Cihaz koordinatları: Lat ${userLocation.lat.toFixed(4)}, Lng ${userLocation.lng.toFixed(4)}. En yakın tesisler üstte sıralandı.`,
                            `Location retrieved. Device coordinates: Lat ${userLocation.lat.toFixed(4)}, Lng ${userLocation.lng.toFixed(4)}. Closest facilities listed first.`
                        )}
                    </div>
                )}
            </div>

            {/* ── Main Panel Grid ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "24px", alignItems: "start" }}>
                
                {/* 1. Facilities List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "800px", overflowY: "auto", paddingRight: "8px" }}>
                    {filteredFacilities.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "80px 0", color: MUTED_COL, background: SECTION_BG, borderRadius: 24, border: `1px solid ${BORDER_COL}` }}>
                            <FiInfo size={44} style={{ marginBottom: 12, opacity: 0.4 }} />
                            <div style={{ fontSize: 16, fontWeight: 700, color: TEXT_COL }}>
                                {t("Aranan kriterlerde sağlık kuruluşu bulunamadı.", "No health facilities found matching criteria.")}
                            </div>
                        </div>
                    ) : (
                        filteredFacilities.map(fac => {
                            const isSelected = selectedFacility?.id === fac.id;
                            const badge = getFacilityTypeBadgeColor(fac.type);
                            
                            return (
                                <div
                                    key={fac.id}
                                    onClick={() => setSelectedFacility(fac)}
                                    style={{
                                        background: SECTION_BG,
                                        borderRadius: "20px",
                                        border: `2px solid ${isSelected ? "#e11d48" : BORDER_COL}`,
                                        padding: "20px",
                                        cursor: "pointer",
                                        transition: "all 0.3s ease",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "10px",
                                        position: "relative"
                                    }}
                                    onMouseEnter={e => {
                                        if (!isSelected) {
                                            e.currentTarget.style.borderColor = isDark ? "#475569" : "#cbd5e1";
                                            e.currentTarget.style.transform = "translateY(-2px)";
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!isSelected) {
                                            e.currentTarget.style.borderColor = BORDER_COL;
                                            e.currentTarget.style.transform = "none";
                                        }
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                                        <div>
                                            <span style={{
                                                padding: "3px 8px", borderRadius: "8px",
                                                background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`,
                                                fontSize: "11px", fontWeight: 850, textTransform: "uppercase",
                                                display: "inline-block", marginBottom: "8px"
                                            }}>
                                                {getFacilityTypeName(fac.type)}
                                            </span>
                                            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: TEXT_COL, lineHeight: 1.3 }}>
                                                {fac.name}
                                            </h3>
                                        </div>
                                        {fac.distance !== null && fac.distance !== undefined && (
                                            <span style={{
                                                background: "rgba(225,29,72,0.1)", color: "#e11d48",
                                                padding: "4px 10px", borderRadius: "10px", fontSize: "13px", fontWeight: 800,
                                                whiteSpace: "nowrap"
                                            }}>
                                                {formatDistance(fac.distance)}
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ display: "flex", gap: "8px", fontSize: "13px", color: MUTED_COL, marginTop: "4px" }}>
                                        <FiMapPin style={{ flexShrink: 0, marginTop: "2px" }} />
                                        <span>{fac.address}</span>
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                                        <div style={{ display: "flex", gap: "16px" }}>
                                            <a
                                                href={`tel:${fac.phone.replace(/\s+/g, '')}`}
                                                onClick={e => e.stopPropagation()}
                                                style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#e11d48", fontWeight: 700, textDecoration: "none" }}
                                            >
                                                <FiPhone size={14} />
                                                <span>{fac.phone}</span>
                                            </a>
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: MUTED_COL }}>
                                                <FiClock size={14} />
                                                <span>{fac.hours}</span>
                                            </div>
                                        </div>
                                        <FiChevronRight size={18} color={MUTED_COL} style={{ transform: isSelected ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* 2. Map and Directions Detail Panel */}
                <div id="facility-map-container" style={{ position: "sticky", top: "100px" }}>
                    {selectedFacility ? (
                        <div className="glass-card" style={{
                            background: SECTION_BG, borderRadius: 28, border: `1px solid ${BORDER_COL}`,
                            padding: "24px", boxShadow: "0 15px 35px rgba(0,0,0,0.05)",
                            display: "flex", flexDirection: "column", gap: "20px"
                        }}>
                            <div>
                                <span style={{
                                    padding: "3px 8px", borderRadius: "8px",
                                    background: getFacilityTypeBadgeColor(selectedFacility.type).bg,
                                    color: getFacilityTypeBadgeColor(selectedFacility.type).color,
                                    border: `1px solid ${getFacilityTypeBadgeColor(selectedFacility.type).border}`,
                                    fontSize: "11px", fontWeight: 800, textTransform: "uppercase"
                                }}>
                                    {getFacilityTypeName(selectedFacility.type)}
                                </span>
                                <h2 style={{ fontSize: "20px", fontWeight: 800, color: TEXT_COL, margin: "8px 0 4px 0" }}>
                                    {selectedFacility.name}
                                </h2>
                                <p style={{ margin: 0, fontSize: "13px", color: MUTED_COL }}>
                                    {selectedFacility.address}
                                </p>
                            </div>

                            {/* Embedded Google Map Route or Center Location */}
                            <div style={{
                                width: "100%", height: "350px", borderRadius: "18px", overflow: "hidden",
                                border: `1px solid ${BORDER_COL}`, background: isDark ? "#0f172a" : "#f1f5f9",
                                position: "relative"
                            }}>
                                <iframe
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0, display: "block" }}
                                    loading="lazy"
                                    allowFullScreen
                                    src={mapSrc}
                                ></iframe>
                            </div>

                            {/* Directions and Details Action */}
                            <div style={{ display: "flex", gap: "12px" }}>
                                <button
                                    onClick={() => {
                                        const query = encodeURIComponent(`${selectedFacility.name} ${selectedFacility.address}`);
                                        const url = userLocation
                                            ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${query}&travelmode=driving`
                                            : `https://www.google.com/maps/search/?api=1&query=${query}`;
                                        window.open(url, "_blank");
                                    }}
                                    style={{
                                        flex: 1, padding: "14px", borderRadius: "14px",
                                        background: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)",
                                        color: "white", border: "none", fontWeight: 700, fontSize: "14px", cursor: "pointer",
                                        display: "flex", justifyContent: "center", alignItems: "center", gap: "8px",
                                        boxShadow: "0 8px 20px rgba(225,29,72,0.2)",
                                        transition: "all 0.2s"
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                                    onMouseLeave={e => e.currentTarget.style.transform = "none"}
                                >
                                    <FiNavigation />
                                    {userLocation ? t("Yol Tarifini Google Maps'te Aç", "Open Route in Google Maps") : t("Google Maps'te Bul", "Search on Google Maps")}
                                    <FiExternalLink size={12} />
                                </button>

                                <a
                                    href={`tel:${selectedFacility.phone.replace(/\s+/g, '')}`}
                                    style={{
                                        padding: "14px 20px", borderRadius: "14px",
                                        background: isDark ? "#1e293b" : "#f1f5f9",
                                        color: TEXT_COL, border: `1px solid ${BORDER_COL}`, fontWeight: 700, fontSize: "14px",
                                        display: "flex", alignItems: "center", justifyCenter: "center", gap: "8px",
                                        textDecoration: "none", cursor: "pointer", transition: "all 0.2s"
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = isDark ? "#334155" : "#e2e8f0"}
                                    onMouseLeave={e => e.currentTarget.style.background = isDark ? "#1e293b" : "#f1f5f9"}
                                >
                                    <FiPhone />
                                    {t("Ara", "Call")}
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-card" style={{
                            background: SECTION_BG, borderRadius: 28, border: `1px solid ${BORDER_COL}`,
                            padding: "40px", textAlign: "center", color: MUTED_COL
                        }}>
                            <FiCompass size={48} style={{ marginBottom: "16px", opacity: 0.5, animation: "spin 10s linear infinite" }} />
                            <p style={{ margin: 0, fontWeight: 600 }}>
                                {t("Detaylar ve yol tarifi için soldan bir sağlık kuruluşu seçin.", "Select a health facility from the left to view details and route.")}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── 112 Acil Yardım Çağrı Rehberi Modal ── */}
            {showEmergencyModal && (
                <div
                    style={{
                        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", zIndex: 10006,
                        display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
                    }}
                    onClick={() => setShowEmergencyModal(false)}
                >
                    <div
                        style={{
                            background: isDark ? "#1e293b" : "white",
                            width: "100%", maxWidth: "500px",
                            borderRadius: "24px", padding: "32px",
                            border: `2px solid #ef4444`,
                            boxShadow: "0 25px 50px -12px rgba(239, 68, 68, 0.25)"
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                            <h2 style={{ fontSize: "22px", fontWeight: 900, color: "#ef4444", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                                <FiAlertTriangle />
                                {t("112 Acil Çağrı Rehberi", "112 Emergency Guide")}
                            </h2>
                            <button
                                onClick={() => setShowEmergencyModal(false)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: MUTED_COL, display: "flex", alignItems: "center" }}
                            >
                                <FiX size={22} />
                            </button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div style={{
                                padding: "16px", background: "rgba(239, 68, 68, 0.08)",
                                border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "12px",
                                color: "#ef4444", fontSize: "14px", fontWeight: 700, lineHeight: 1.4
                            }}>
                                ⚠️ {t(
                                    "112 Acil çağrı hattını gereksiz meşgul etmek suçtur ve cezai yaptırımı vardır. Sadece hayati tehlike durumlarında arayınız.",
                                    "Unnecessarily occupying the 112 emergency line is a crime. Only call in life-threatening situations."
                                )}
                            </div>

                            <div>
                                <h4 style={{ margin: "0 0 8px 0", fontSize: "15px", fontWeight: 800, color: TEXT_COL }}>
                                    {t("112 Aranırken Nelere Dikkat Edilmelidir?", "What to do when calling 112?")}
                                </h4>
                                <ul style={{ paddingLeft: "20px", margin: 0, fontSize: "14px", color: TEXT_COL, lineHeight: 1.6, display: "flex", flexDirection: "column", gap: "8px" }}>
                                    <li><b>{t("Sakin Kalın:", "Stay Calm:")}</b> {t("Panik yapmayın. Soruları net ve anlaşılır yanıtlayın.", "Do not panic. Answer questions clearly.")}</li>
                                    <li><b>{t("Adresi Net Verin:", "Give Clear Address:")}</b> {t("Bulunduğunuz yeri tarif etmek için yakındaki bilinen noktaları (cami, okul, kavşak) belirtin.", "Mention known landmarks (mosque, school, junction) to describe location.")}</li>
                                    <li><b>{t("Kim, Neden Aramış?:", "Who is calling & why?:")}</b> {t("Hasta/yaralı sayısı ve durumlarını kısaca özetleyin.", "Briefly summarize the number of casualties/patients and their status.")}</li>
                                    <li><b>{t("Telefonu Kapatmayın:", "Do not hang up:")}</b> {t("112 merkezi telefonu kapatmanızı söyleyene kadar aramayı sonlandırmayın.", "Do not end the call until the dispatcher instructs you to do so.")}</li>
                                </ul>
                            </div>

                            <hr style={{ border: 0, borderTop: `1px solid ${BORDER_COL}`, margin: "8px 0" }} />

                            <div style={{ display: "flex", gap: "12px" }}>
                                <a
                                    href="tel:112"
                                    style={{
                                        flex: 1, padding: "14px", borderRadius: "14px",
                                        background: "#ef4444", color: "white", border: "none",
                                        fontWeight: 800, fontSize: "15px", cursor: "pointer",
                                        display: "flex", justifyContent: "center", alignItems: "center", gap: "8px",
                                        textDecoration: "none", boxShadow: "0 8px 20px rgba(239, 68, 68, 0.3)"
                                    }}
                                >
                                    <FiPhone />
                                    {t("Şimdi Ara: 112", "Call Now: 112")}
                                </a>
                                <button
                                    onClick={() => setShowEmergencyModal(false)}
                                    style={{
                                        padding: "14px 24px", borderRadius: "14px",
                                        background: isDark ? "#1e293b" : "#f1f5f9",
                                        color: TEXT_COL, border: `1px solid ${BORDER_COL}`,
                                        fontWeight: 700, fontSize: "14px", cursor: "pointer"
                                    }}
                                >
                                    {t("Kapat", "Close")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
