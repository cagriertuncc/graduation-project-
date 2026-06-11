import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import NotificationBell from "./components/NotificationBell";
import AdminLayout from "./layouts/AdminLayout";
import LoginPage from "./pages/LoginPage";
import AdminLogin from "./pages/AdminLogin";
import DashboardPage from "./pages/DashboardPage";
import PatientsPage from "./pages/PatientsPage";
import PatientDetailPage from "./pages/PatientDetailPage";
import DiseasesPage from "./pages/DiseasesPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import PrescriptionsPage from "./pages/PrescriptionsPage";
import LabResultsPage from "./pages/LabResultsPage";
import RadiologyPage from "./pages/RadiologyPage";
import MedicalReportsPage from "./pages/MedicalReportsPage";
import ProcedureNotesPage from "./pages/ProcedureNotesPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import RevenuePage from "./pages/RevenuePage";
import ProfilePage from "./pages/ProfilePage";
import AIAssistant from "./pages/AIAssistant";
import AdminDashboard from "./pages/AdminDashboard";
import SpecialtyManagement from "./pages/SpecialtyManagement";
import UserManagement from "./pages/UserManagement";
import SystemSettings from "./pages/SystemSettings";
import AdminNotificationsPage from "./pages/AdminNotificationsPage";
import ITRequests from "./pages/ITRequests";
import LogsPage from "./pages/LogsPage";
import AISystemControl from "./pages/AISystemControl";


import AdminPatientsPage from "./pages/AdminPatientsPage";
import AdminAppointmentsPage from "./pages/AdminAppointmentsPage";
import AutoLogout from "./components/AutoLogout";

import { PatientAuthProvider, usePatientAuth } from "./context/PatientAuthContext";
import PatientLogin from "./pages/patient/PatientLogin";
import PatientRegister from "./pages/patient/PatientRegister";
import PatientDashboard from "./pages/patient/PatientDashboard";
import BookAppointment from "./pages/patient/BookAppointment";
import PatientForgotPassword from "./pages/patient/PatientForgotPassword";
import PatientResetPassword from "./pages/patient/PatientResetPassword";

import { AccountantAuthProvider, useAccountantAuth } from "./context/AccountantAuthContext";
import AccountantLogin from "./pages/AccountantLogin";
import AccountantDashboard from "./pages/AccountantDashboard";

import { IKAuthProvider, useIKAuth } from "./context/IKAuthContext";
import IKLogin from "./pages/IKLogin";
import IKDashboard from "./pages/IKDashboard";

import { TechnicianAuthProvider, useTechnicianAuth } from "./context/TechnicianAuthContext";
import TechnicianLogin from "./pages/TechnicianLogin";
import TechnicianDashboard from "./pages/TechnicianDashboard";

import { PharmacistAuthProvider, usePharmacistAuth } from "./context/PharmacistAuthContext";
import PharmacistLogin from "./pages/PharmacistLogin";
import PharmacistDashboard from "./pages/PharmacistDashboard";

import { ReceptionistAuthProvider, useReceptionistAuth } from "./context/ReceptionistAuthContext";
import ReceptionistLogin from "./pages/ReceptionistLogin";
import ReceptionistDashboard from "./pages/ReceptionistDashboard";
import IdareLogin from "./pages/IdareLogin";
import IdareDashboard from "./pages/IdareDashboard";

import Kariyer from "./pages/Kariyer";

function SystemStatusGuard({ children }) {
  const { user } = useAuth();
  const [status, setStatus] = useState({ maintenanceMode: false, emergencyLockdown: false });
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/system-status");
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
        }
      } catch (err) {
        console.error("Status check failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return null;

  const isAdmin = user?.role === "admin";
  const isLoginPage = location.pathname === "/adminlogin";

  if ((status.emergencyLockdown || status.maintenanceMode) && !isAdmin && !isLoginPage) {
    if (status.emergencyLockdown) {
      return (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "radial-gradient(circle, #2d0606 0%, #050101 100%)",
          color: "white", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", zIndex: 99999,
          fontFamily: "'Inter', sans-serif", padding: "20px", textAlign: "center"
        }}>
          <div style={{
            fontSize: "80px", color: "#ef4444", marginBottom: "20px",
            animation: "pulseLock 1.5s infinite alternate", filter: "drop-shadow(0 0 20px #ef4444)"
          }}>
            ⚠️
          </div>
          <h1 style={{ fontSize: "36px", fontWeight: 800, margin: "0 0 10px 0", letterSpacing: "-1px", color: "#f87171" }}>
            SİSTEM ACİL DURUM KİLİDİ
          </h1>
          <h2 style={{ fontSize: "18px", color: "#94a3b8", fontWeight: 400, maxWidth: "600px", lineHeight: "1.6", margin: "0 auto 30px auto" }}>
            Güvenlik protokolleri gereği {status.hospitalName} veri tabanı ve tüm erişim kanalları geçici olarak kilitlenmiştir.
          </h2>
          <div style={{
            padding: "16px 24px", background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "12px",
            maxWidth: "500px", color: "#fca5a5", fontSize: "14px"
          }}>
            Aktif seanslar sonlandırılmıştır. Lütfen durumun çözülmesi için sistem yöneticilerinden gelecek duyuruları takip ediniz.
          </div>
          <style>{`
            @keyframes pulseLock {
              0% { transform: scale(1); opacity: 0.8; }
              100% { transform: scale(1.08); opacity: 1; filter: drop-shadow(0 0 30px #ef4444); }
            }
          `}</style>
        </div>
      );
    } else if (status.maintenanceMode) {
      return (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "radial-gradient(circle, #0f172a 0%, #020617 100%)",
          color: "white", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", zIndex: 99999,
          fontFamily: "'Inter', sans-serif", padding: "20px", textAlign: "center"
        }}>
          <div style={{
            fontSize: "80px", color: "#f59e0b", marginBottom: "20px",
            animation: "spinGear 4s infinite linear", filter: "drop-shadow(0 0 20px #f59e0b)"
          }}>
            ⚙️
          </div>
          <h1 style={{ fontSize: "36px", fontWeight: 800, margin: "0 0 10px 0", letterSpacing: "-1px", color: "#fbbf24" }}>
            SİSTEM BAKIM MODUNDA
          </h1>
          <h2 style={{ fontSize: "18px", color: "#94a3b8", fontWeight: 400, maxWidth: "600px", lineHeight: "1.6", margin: "0 auto 30px auto" }}>
            {status.hospitalName} altyapı güncellemeleri nedeniyle sistem geçici olarak bakıma alınmıştır.
          </h2>
          <div style={{
            padding: "16px 24px", background: "rgba(245, 158, 11, 0.1)",
            border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "12px",
            maxWidth: "500px", color: "#fde047", fontSize: "14px"
          }}>
            Kısa süre sonra tekrar aktif olacağız. Sabrınız için teşekkür ederiz.
          </div>
          <style>{`
            @keyframes spinGear {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      );
    }
  }

  return children;
}

function TechnicianProtectedRoute({ children }) {
  const { isTechnicianAuthenticated } = useTechnicianAuth();
  if (!isTechnicianAuthenticated) return <Navigate to="/teknisyen/giris" replace />;
  return children;
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const location = useLocation();

  if (user?.role === "admin") {
    // If Admin tries to access user-only routes, send to Admin Control Center
    return <Navigate to="/admin" replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/adminlogin" replace />;
  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

function PatientProtectedRoute({ children }) {
  const { isPatientAuthenticated, loading } = usePatientAuth();
  if (loading) return null;
  if (!isPatientAuthenticated) return <Navigate to="/hasta/giris" replace />;
  return children;
}

function PatientGuestRoute({ children }) {
  const { isPatientAuthenticated, loading } = usePatientAuth();
  if (loading) return null;
  if (isPatientAuthenticated) return <Navigate to="/hasta/portal" replace />;
  return children;
}

function AccountantProtectedRoute({ children }) {
  const { isAccountantAuthenticated } = useAccountantAuth();
  if (!isAccountantAuthenticated) return <Navigate to="/muhasebe/giris" replace />;
  return children;
}

function IdareProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/idare/giris" replace />;
  if (user?.role !== "director" && user?.role !== "staff") return <Navigate to="/dashboard" replace />;
  return children;
}

function IKProtectedRoute({ children }) {
  const { isIKAuthenticated } = useIKAuth();
  if (!isIKAuthenticated) return <Navigate to="/ik/giris" replace />;
  return children;
}

function PharmacistProtectedRoute({ children }) {
  const { isPharmacistAuthenticated } = usePharmacistAuth();
  if (!isPharmacistAuthenticated) return <Navigate to="/eczane/giris" replace />;
  return children;
}

function ReceptionistProtectedRoute({ children }) {
  const { isReceptionistAuthenticated } = useReceptionistAuth();
  if (!isReceptionistAuthenticated) return <Navigate to="/danisma/giris" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <TechnicianAuthProvider>
        <PharmacistAuthProvider>
          <IKAuthProvider>
            <AccountantAuthProvider>
              <PatientAuthProvider>
                <ReceptionistAuthProvider>
                  <AuthProvider>
                  <AutoLogout />
              <SystemStatusGuard>
              <Routes>
                <Route path="/" element={<Navigate to="/hasta/giris" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/adminlogin" element={<AdminLogin />} />

                {/* Admin Section */}
                <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="revenue" element={<RevenuePage />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="patients" element={<AdminPatientsPage />} />
                  <Route path="appointments" element={<AdminAppointmentsPage />} />
                  <Route path="specialties" element={<SpecialtyManagement />} />
                  <Route path="settings" element={<SystemSettings />} />
                  <Route path="it-requests" element={<ITRequests />} />
                  <Route path="notifications" element={<AdminNotificationsPage />} />
                  <Route path="logs" element={<LogsPage />} />
                  <Route path="ai-assistant" element={<AISystemControl />} />
                  <Route path="*" element={<Navigate to="/admin" replace />} />
                </Route>


                {/* Patient Portal Section */}
                <Route path="/hasta" element={<Navigate to="/hasta/portal" replace />} />
                <Route path="/hasta/giris" element={<PatientGuestRoute><PatientLogin /></PatientGuestRoute>} />
                <Route path="/hasta/kayit" element={<PatientGuestRoute><PatientRegister /></PatientGuestRoute>} />
                <Route path="/hasta/sifremi-unuttum" element={<PatientForgotPassword />} />
                <Route path="/hasta/sifre-sifirla" element={<PatientResetPassword />} />

                {/* Placeholder for actual dashboard */}
                <Route path="/hasta/portal" element={<PatientProtectedRoute><PatientDashboard /></PatientProtectedRoute>} />
                <Route path="/hasta/randevu-al" element={<PatientProtectedRoute><BookAppointment /></PatientProtectedRoute>} />

                {/* Doctor Section */}
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                  <Route path="/patients" element={<ProtectedRoute><PatientsPage /></ProtectedRoute>} />
                  <Route path="/patients/:id" element={<ProtectedRoute><PatientDetailPage /></ProtectedRoute>} />
                  <Route path="/diseases" element={<ProtectedRoute><DiseasesPage /></ProtectedRoute>} />
                  <Route path="/appointments" element={<ProtectedRoute><AppointmentsPage /></ProtectedRoute>} />
                  <Route path="/prescriptions" element={<ProtectedRoute><PrescriptionsPage /></ProtectedRoute>} />
                  <Route path="/lab-results" element={<ProtectedRoute><LabResultsPage /></ProtectedRoute>} />
                  <Route path="/radiology" element={<ProtectedRoute><RadiologyPage /></ProtectedRoute>} />
                  <Route path="/medical-reports" element={<ProtectedRoute><MedicalReportsPage /></ProtectedRoute>} />
                  <Route path="/procedure-notes" element={<ProtectedRoute><ProcedureNotesPage /></ProtectedRoute>} />
                  <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
                  <Route path="/revenue" element={<ProtectedRoute><RevenuePage /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                  <Route path="/ai-assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
                </Route>

                {/* Accountant Portal */}
                <Route path="/muhasebe/giris" element={<AccountantLogin />} />
                <Route path="/muhasebe/panel" element={<AccountantProtectedRoute><AccountantDashboard /></AccountantProtectedRoute>} />
                <Route path="/muhasebe" element={<Navigate to="/muhasebe/giris" replace />} />

                {/* İdare Portal */}
                <Route path="/idare/giris" element={<IdareLogin />} />
                <Route path="/idare/panel" element={<IdareProtectedRoute><IdareDashboard /></IdareProtectedRoute>} />
                <Route path="/idare" element={<Navigate to="/idare/giris" replace />} />

                {/* İK Portal */}
                <Route path="/ik/giris" element={<IKLogin />} />
                <Route path="/ik/panel" element={<IKProtectedRoute><IKDashboard /></IKProtectedRoute>} />
                <Route path="/ik" element={<Navigate to="/ik/giris" replace />} />

                {/* Technician Portal */}
                <Route path="/teknisyen/giris" element={<TechnicianLogin />} />
                <Route path="/teknisyen/panel" element={<TechnicianProtectedRoute><TechnicianDashboard /></TechnicianProtectedRoute>} />
                <Route path="/teknisyen" element={<Navigate to="/teknisyen/giris" replace />} />

                {/* Eczane Portal */}
                <Route path="/eczane/giris" element={<PharmacistLogin />} />
                <Route path="/eczane/panel" element={<PharmacistProtectedRoute><PharmacistDashboard /></PharmacistProtectedRoute>} />
                <Route path="/eczane" element={<Navigate to="/eczane/giris" replace />} />

                {/* Danışma / Hasta Kabul Portal */}
                <Route path="/danisma/giris" element={<ReceptionistLogin />} />
                <Route path="/danisma/panel" element={<ReceptionistProtectedRoute><ReceptionistDashboard /></ReceptionistProtectedRoute>} />
                <Route path="/danisma" element={<Navigate to="/danisma/giris" replace />} />

                {/* Kariyer (Public) */}
                <Route path="/kariyer" element={<Kariyer />} />

                <Route path="*" element={<Navigate to="/hasta/giris" replace />} />
              </Routes>
              </SystemStatusGuard>
            </AuthProvider>
            </ReceptionistAuthProvider>
          </PatientAuthProvider>
        </AccountantAuthProvider>
      </IKAuthProvider>
      </PharmacistAuthProvider>
    </TechnicianAuthProvider>
  </BrowserRouter>
  );
}

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = (user?.name || "D")
    .split(" ")
    .filter((_, i, arr) => i === 0 || i === arr.length - 1)
    .map(n => n[0]).join("");

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className="app-layout" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* ── Sticky Topbar ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 200,
        height: 60, padding: "0 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "white",
        borderBottom: "1px solid #f1f5f9",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        marginLeft: "var(--sidebar-width)",
      }}>
        {/* Left: mobile toggle */}
        <button
          className="mobile-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", borderRadius: 8, color: "#64748b", display: "flex", alignItems: "center" }}
        >
          ☰
        </button>

        {/* Right: notifications + profile + logout */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <NotificationBell />

          {/* Profile chip */}
          <div
            onClick={() => navigate("/profile")}
            style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 12px", background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 12, cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
            onMouseLeave={e => e.currentTarget.style.background = "#f8fafc"}
            title="Profil"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#ef4444,#f87171)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "white" }}>{initials}</div>
            )}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", lineHeight: 1.2 }}>Dr. {user?.name?.split(" ").slice(1).join(" ") || user?.name}</div>
              <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.2 }}>{user?.specialty || "Doktor"}</div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 10, color: "#ef4444", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.14)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.07)"}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            Çıkış
          </button>
        </div>
      </header>

      {/* ── Body: sidebar + content ── */}
      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
