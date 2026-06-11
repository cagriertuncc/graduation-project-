import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/api";
import {
    FiUser, FiMail, FiPhone, FiStar, FiLock, FiSave,
    FiCheckCircle, FiAlertCircle, FiEdit3, FiCamera
} from "react-icons/fi";
import { RiStethoscopeLine } from "react-icons/ri";

export default function ProfilePage() {
    const { user, updateUser   } = useAuth();
    const [profile, setProfile] = useState({
        name: "", email: "", specialty: "", phone: "", avatar: "",
    });
    const [passwords, setPasswords] = useState({
        currentPassword: "", newPassword: "", confirmPassword: "",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [message, setMessage] = useState(null);
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        authApi.getMe().then(data => {
            setProfile({
                name: data.name || "",
                email: data.email || "",
                specialty: data.specialty || "",
                phone: data.phone || "",
                avatar: data.avatar || "",
            });
            setLoading(false);
        }).catch(err => {
            console.error("Profil yüklenemedi:", err);
            setLoading(false);
        });
    }, []);

    const showMsg = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const result = await authApi.updateProfile({
                name: profile.name,
                phone: profile.phone,
            });
            updateUser({ name: result.name, specialty: result.specialty, phone: result.phone });
            showMsg("success", "Profil başarıyla güncellendi!");
        } catch (err) {
            showMsg("error", err.message || "Profil güncellenemedi");
        }
        setSaving(false);
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate client-side
        if (file.size > 2 * 1024 * 1024) {
            showMsg("error", "Dosya boyutu en fazla 2MB olabilir");
            return;
        }
        if (!/\.(jpe?g|png|webp)$/i.test(file.name)) {
            showMsg("error", "Sadece JPG, PNG veya WebP dosyaları yüklenebilir");
            return;
        }

        setUploadingAvatar(true);
        try {
            const result = await authApi.uploadAvatar(file);
            setProfile(prev => ({ ...prev, avatar: result.avatar }));
            updateUser({ avatar: result.avatar });
            showMsg("success", "Profil fotoğrafı güncellendi!");
        } catch (err) {
            showMsg("error", err.message || "Fotoğraf yüklenemedi");
        }
        setUploadingAvatar(false);
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            showMsg("error", "Yeni şifreler eşleşmiyor");
            return;
        }
        if (passwords.newPassword.length < 6) {
            showMsg("error", "Şifre en az 6 karakter olmalı");
            return;
        }
        setSaving(true);
        try {
            await authApi.updateProfile({
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword,
            });
            setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setShowPasswordSection(false);
            showMsg("success", "Şifre başarıyla değiştirildi!");
        } catch (err) {
            showMsg("error", err.message || "Şifre değiştirilemedi");
        }
        setSaving(false);
    };

    const initials = (profile.name || "D")
        .split(" ")
        .filter((_, i, arr) => i === 0 || i === arr.length - 1)
        .map(n => n[0])
        .join("");

    // Avatar is served via /uploads proxy (vite proxies to backend)
    const avatarUrl = profile.avatar || null;

    const inputStyle = {
        width: "100%", padding: "10px 14px", borderRadius: "10px",
        border: "1px solid #e5e7eb", fontSize: "14px", color: "#111827",
        outline: "none", transition: "all 0.2s",
        background: "#fafafa",
    };

    const disabledInputStyle = {
        ...inputStyle, background: "#f3f4f6", color: "#9ca3af", cursor: "not-allowed",
    };

    const labelStyle = {
        fontSize: "13px", fontWeight: 600, color: "#374151",
        marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px",
    };

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
                <div style={{ fontSize: "16px", color: "#9ca3af" }}>Yükleniyor...</div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h1>Profil Ayarları</h1>
                <p>Hesap bilgilerinizi görüntüleyin ve düzenleyin</p>
            </div>

            {/* Message Banner */}
            {message && (
                <div style={{
                    padding: "12px 18px", borderRadius: "12px", marginBottom: "20px",
                    display: "flex", alignItems: "center", gap: "8px",
                    background: message.type === "success" ? "#ecfdf5" : "#fef2f2",
                    border: `1px solid ${message.type === "success" ? "#d1fae5" : "#fecaca"}`,
                    color: message.type === "success" ? "#059669" : "#ef4444",
                    fontSize: "13px", fontWeight: 600,
                    animation: "fadeIn 0.3s ease",
                }}>
                    {message.type === "success" ? <FiCheckCircle size={16} /> : <FiAlertCircle size={16} />}
                    {message.text}
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "20px", alignItems: "start" }}>

                {/* Left: Profile Card */}
                <div className="glass-card animate-fade-in" style={{ padding: "30px 24px", textAlign: "center" }}>
                    {/* Avatar with upload overlay */}
                    <div
                        style={{
                            width: 90, height: 90, borderRadius: "50%",
                            margin: "0 auto 16px", position: "relative", cursor: "pointer",
                        }}
                        onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
                        title="Fotoğraf değiştir"
                    >
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt="Profil"
                                style={{
                                    width: 90, height: 90, borderRadius: "50%",
                                    objectFit: "cover",
                                    border: "3px solid #ef4444",
                                    boxShadow: "0 6px 20px rgba(239,68,68,0.3)",
                                }}
                            />
                        ) : (
                            <div style={{
                                width: 90, height: 90, borderRadius: "50%",
                                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: "white", fontSize: "30px", fontWeight: 800,
                                boxShadow: "0 6px 20px rgba(239,68,68,0.3)",
                            }}>
                                {initials}
                            </div>
                        )}
                        {/* Hover overlay */}
                        <div style={{
                            position: "absolute", inset: 0, borderRadius: "50%",
                            background: "rgba(0,0,0,0.45)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            opacity: uploadingAvatar ? 1 : 0,
                            transition: "opacity 0.2s",
                            color: "white", fontSize: "13px", fontWeight: 600,
                        }}
                            className="avatar-overlay"
                        >
                            {uploadingAvatar ? (
                                <div style={{ fontSize: "11px" }}>Yükleniyor...</div>
                            ) : (
                                <FiCamera size={20} />
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            style={{ display: "none" }}
                            onChange={handleAvatarChange}
                        />
                    </div>
                    <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#111827", marginBottom: "4px" }}>
                        {profile.name}
                    </h2>
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: "4px",
                        padding: "4px 12px", borderRadius: "8px", background: "#fef2f2",
                        color: "#ef4444", fontSize: "12px", fontWeight: 600, marginBottom: "16px",
                    }}>
                        <RiStethoscopeLine size={12} />
                        {profile.specialty}
                    </div>
                    <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", fontSize: "13px", color: "#6b7280", marginBottom: "8px" }}>
                            <FiMail size={13} /> {profile.email}
                        </div>
                        {profile.phone && (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", fontSize: "13px", color: "#6b7280" }}>
                                <FiPhone size={13} /> {profile.phone}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Edit Forms */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                    {/* Profile Info Form */}
                    <div className="glass-card animate-fade-in" style={{ padding: "24px", animationDelay: "100ms" }}>
                        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: "8px",
                                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                                display: "flex", alignItems: "center", justifyContent: "center", color: "white",
                            }}>
                                <FiEdit3 size={13} />
                            </div>
                            Kişisel Bilgiler
                        </h3>
                        <form onSubmit={handleSaveProfile}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                                <div>
                                    <div style={labelStyle}><FiUser size={12} /> Ad Soyad</div>
                                    <input style={inputStyle} value={profile.name}
                                        onChange={e => setProfile({ ...profile, name: e.target.value })} required
                                        onFocus={e => e.target.style.borderColor = "#ef4444"}
                                        onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                                    />
                                </div>
                                <div>
                                    <div style={labelStyle}><FiMail size={12} /> E-posta</div>
                                    <input style={disabledInputStyle}
                                        value={profile.email} disabled title="E-posta değiştirilemez" />
                                </div>
                                <div>
                                    <div style={labelStyle}><FiStar size={12} /> Uzmanlık</div>
                                    <input style={disabledInputStyle}
                                        value={profile.specialty} disabled title="Uzmanlık alanı değiştirilemez" />
                                </div>
                                <div>
                                    <div style={labelStyle}><FiPhone size={12} /> Telefon</div>
                                    <input style={inputStyle} value={profile.phone}
                                        onChange={e => setProfile({ ...profile, phone: e.target.value })}
                                        placeholder="0532 123 4567"
                                        onFocus={e => e.target.style.borderColor = "#ef4444"}
                                        onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={saving}
                                style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <FiSave size={14} /> {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                            </button>
                        </form>
                    </div>

                    {/* Password Form */}
                    <div className="glass-card animate-fade-in" style={{ padding: "24px", animationDelay: "200ms" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showPasswordSection ? "20px" : 0 }}>
                            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: "8px",
                                    background: "#f3f4f6",
                                    display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280",
                                }}>
                                    <FiLock size={13} />
                                </div>
                                Şifre Değiştir
                            </h3>
                            <button type="button" onClick={() => setShowPasswordSection(!showPasswordSection)}
                                style={{
                                    padding: "6px 14px", borderRadius: "8px", border: "1px solid #e5e7eb",
                                    background: "white", fontSize: "12px", fontWeight: 600,
                                    color: "#6b7280", cursor: "pointer", transition: "all 0.2s",
                                }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = "#ef4444"}
                                onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e7eb"}
                            >
                                {showPasswordSection ? "Kapat" : "Şifreyi Değiştir"}
                            </button>
                        </div>

                        {showPasswordSection && (
                            <form onSubmit={handleChangePassword}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
                                    <div>
                                        <div style={labelStyle}>Mevcut Şifre</div>
                                        <input type="password" style={inputStyle} value={passwords.currentPassword}
                                            onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                            required placeholder="••••••"
                                            onFocus={e => e.target.style.borderColor = "#ef4444"}
                                            onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                                        />
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                        <div>
                                            <div style={labelStyle}>Yeni Şifre</div>
                                            <input type="password" style={inputStyle} value={passwords.newPassword}
                                                onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                                                required placeholder="En az 6 karakter"
                                                onFocus={e => e.target.style.borderColor = "#ef4444"}
                                                onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                                            />
                                        </div>
                                        <div>
                                            <div style={labelStyle}>Yeni Şifre (Tekrar)</div>
                                            <input type="password" style={inputStyle} value={passwords.confirmPassword}
                                                onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                                required placeholder="Aynı şifreyi tekrar girin"
                                                onFocus={e => e.target.style.borderColor = "#ef4444"}
                                                onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" className="btn" disabled={saving}
                                    style={{
                                        display: "flex", alignItems: "center", gap: "6px",
                                        padding: "8px 18px", borderRadius: "10px",
                                        background: "#374151", color: "white", border: "none",
                                        fontWeight: 600, fontSize: "13px", cursor: "pointer",
                                    }}>
                                    <FiLock size={13} /> {saving ? "Kaydediliyor..." : "Şifreyi Güncelle"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {/* Avatar overlay hover CSS */}
            <style>{`
                .avatar-overlay {
                    pointer-events: none;
                }
                div:hover > .avatar-overlay {
                    opacity: 1 !important;
                }
            `}</style>
        </div>
    );
}
