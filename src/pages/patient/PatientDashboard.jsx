import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiHome, FiCalendar, FiLogOut, FiActivity, FiUser, FiClock, FiPlusCircle,
    FiXCircle, FiTrendingUp, FiHeart, FiDroplet, FiSave, FiEdit2, FiSun,
    FiMoon, FiSettings, FiUserCheck, FiLock, FiMessageSquare, FiDownload,
    FiPieChart, FiAlertTriangle, FiCheckCircle, FiInfo, FiAward, FiCreditCard, FiFileText,
    FiPlus, FiArrowRight, FiSearch, FiBell, FiChevronRight, FiTrash2, FiUsers, FiUserPlus, FiVideo, FiMapPin, FiX, FiCoffee, FiPhone,
    FiNavigation
} from "react-icons/fi";
import { RiHospitalLine } from "react-icons/ri";
import { usePatientAuth } from "../../context/PatientAuthContext";
import { patientPortalApi, journalApi } from "../../services/patientPortalApi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { tr } from "date-fns/locale";
import { patientAuthApi } from "../../services/patientAuthApi";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";
import AIAssistant from "../../components/patient/AIAssistant";
import DietAssistant from "../../components/patient/DietAssistant";
import HealthAnalytics from "../../components/patient/HealthAnalytics";
import HealthTimeline from "../../components/patient/HealthTimeline";
import HealthGoals from "../../components/patient/HealthGoals";
import HealthFacilities from "../../components/patient/HealthFacilities";

const translations = {
    tr: {
        title: "MediTrack",
        subtitle: "Portal",
        notifications: "Bildirimler",
        messages: "Mesajlarım",
        files: "Dosyalarım",
        allFiles: "Tüm Dosyalar",
        allMessages: "Tüm Mesajlar",
        composeMessage: "Mesaj Gönder",
        uploadFile: "Dosya Yükle",
        noFiles: "Henüz dosya yüklemediniz.",
        noNotifications: "Bildiriminiz bulunmuyor.",
        selectDoctor: "Doktor Seçin",
        messageContent: "Mesajınız...",
        send: "Gönder",
        fileName: "Dosya Adı",
        selectFile: "Dosya Seç",
        reply: "Yanıtla",
        askDoctor: "Doktora Soru Sor",
        settings: "Hesap Ayarları",
        settingsTitle: "Hesap Ayarları",
        themeDark: "Koyu Mod",
        themeLight: "Açık Mod",
        logout: "Çıkış Yap",
        welcome: "Hoş Geldiniz",
        welcomeDesc: "MediTrack akıllı sağlık portalı ile tüm randevularınızı, tıbbi geçmişinizi ve güncel sağlık verilerinizi tek noktadan kolayca takip edin.",
        dashboardSummary: "Panel Özeti",
        healthSummary: "Sağlık Özetiniz",
        upcomingAppt: "Yaklaşan Randevunuz",
        noUpcoming: "Yaklaşan randevunuz bulunmuyor.",
        bookNow: "Hemen Randevu Alın",
        personal: "KİŞİSEL",
        height: "Boy (cm)",
        weight: "Kilo (kg)",
        bmi: "Vücut Kitle İndeksi",
        bmiNormal: "Normal",
        bmiOver: "Fazla Kilolu",
        bmiUnder: "Zayıf",
        bmiObese: "Obez",
        edit: "Düzenle",
        save: "Kaydet",
        saveChanges: "Değişiklikleri Kaydet",
        cancel: "İptal",
        bloodType: "Kan Grubu",
        bloodTypeSection: "KAN GRUBU",
        bloodInfo: "Kan Bilgisi",
        bloodNotSet: "Belirtilmemiş",
        notSelected: "Seçilmedi",
        noPendingAppt: "Henüz bekleyen bir randevunuz bulunmuyor.",
        pastTransactions: "Geçmiş İşlemler",
        noPastAppt: "Geçmiş randevunuz bulunmuyor.",
        newAppointment: "Yeni Randevu",
        selectDocTime: "Lütfen uygun bir doktor ve zaman seçin.",
        specialtySelection: "Branş (Uzmanlık) Seçimi",
        pleaseSelectSpecialty: "Lütfen branş seçiniz",
        doctorSelection: "Doktor Seçimi",
        pleaseSelectDoctor: "Lütfen doktor seçiniz",
        selectSpecialtyFirst: "Önce branş seçiniz",
        dateLabel: "Tarih",
        selectDate: "Tarih seçiniz",
        timeLabel: "Saat",
        chooseTime: "Seçiniz",
        noAvailableTime: "Uygun saat yok",
        selectDateFirst: "Önce tarih seçin",
        appointmentNote: "Randevu Notu (Opsiyonel)",
        notePlaceholder: "Şikayetinizi veya eklemek istediklerinizi kısaca belirtebilirsiniz.",
        heightWeightInfo: "Boy / Kilo Bilgisi",
        creatingAppointment: "Randevu Oluşturuluyor...",
        confirmAppointment: "Randevuyu Onayla",
        bookingSuccessTitle: "Randevunuz Oluşturuldu!",
        bookingSuccessDesc: "Randevu bilgileriniz başarıyla sisteme kaydedildi. Yaklaşan randevularınız bölümünden detayları takip edebilirsiniz.",
        closeWindow: "Pencereyi Kapat",
        nameLabel: "Ad Soyad",
        fullName: "Ad Soyad",
        email: "E-posta Adresi",
        phone: "Telefon Numarası",
        tcIdentity: "T.C. Kimlik No",
        profileInfo: "Profil Bilgileri",
        medicalInfo: "Tıbbi Bilgiler",
        security: "Güvenlik",
        currentPass: "Mevcut Şifre",
        newPass: "Yeni Şifre",
        confirmPass: "Yeni Şifre (Tekrar)",
        passPlaceholder: "Yeni şifrenizi girin",
        confirmPassPlaceholder: "Yeni şifrenizi tekrar girin",
        updatePass: "Şifreyi Güncelle",
        loading: "Yükleniyor...",
        chronicDiseases: "Kronik Hastalıklar",
        allergies: "Alerjiler",
        smokingAlcohol: "Sigara / Alkol Durumu",
        emergencyContact: "Acil İletişim",
        emergencyName: "Yakın Adı",
        emergencyPhone: "Yakın Telefonu",
        lastLabResults: "Son Tahlil Sonuçları",
        lastPrescriptions: "Son Reçeteler",
        doctorMessages: "Doktor Mesajları",
        noLabResults: "Henüz tahlil sonucu bulunmuyor.",
        noPrescriptions: "Henüz reçete bulunmuyor.",
        noMessages: "Henüz doktor mesajınız yok.",
        viewAll: "Tümünü Gör",
        testName: "Test Adı",
        diagnosis: "Tanı",
        sender: "Gönderen",
        smartSuggestions: "MediTrack Akıllı Öneriler",
        suggestedSpecialty: "Önerilen Branş",
        lessBusyDoctor: "Daha Az Yoğun Doktor",
        optimalTime: "En Uygun Saat",
        useSuggestion: "Öneriyi Uygula",
        basedOnHistory: "Sağlık geçmişinize göre öneriliyor",
        highlyRecommended: "Yüksek Müsaitlik",
        downloadPDF: "PDF İndir",
        viewTrends: "Grafik Görümü",
        labTrends: "Laboratuvar Trendleri",
        compareWithPast: "Geçmiş Testlerle Karşılaştırma",
        noNumericData: "Grafik için sayısal veri bulunamadı.",
        backToDashboard: "Panele Geri Dön",
        areYouSure: "Emin misiniz?",
        cancelWarning: "Bu randevuyu iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz.",
        giveUp: "Vazgeç",
        yesCancel: "Evet, İptal Et",
        cancelAppt: "Randevuyu İptal Et",
        clinicVisit: "Poliklinik Muayenesi",
        vitalUpdateSuccess: "Sağlık verileri güncellendi",
        profileUpdateSuccess: "Profil başarıyla güncellendi",
        passUpdateSuccess: "Şifreniz başarıyla güncellendi",
        passMismatch: "Yeni şifreler eşleşmiyor.",
        cancelSuccess: "Randevunuz iptal edildi.",
        cancelFail: "İptal başarısız oldu.",
        patientAccount: "Hasta Hesabı",
        active: "AKTİF",
        accountSummary: "Hesap Özeti",
        accountStatus: "Hesap Durumu",
        activeAndVerified: "Aktif & Onaylı",
        emailVerification: "E-posta Doğrulama",
        verified: "Doğrulandı",
        age: "Yaş",
        activeAppt: "Aktif Randevu",
        bookNew: "Yeni Randevu Al",
        bookNewDesc: "Hemen yeni bir randevu oluşturun",
        clickToBook: "Randevu Almak İçin Tıklayın",
        vitalsTitle: "Kişisel Sağlık Verileri",
        smartCalendar: "Akıllı Takvim",
        calendarTitle: "Sağlık Takvimim",
        calendarDesc: "Tüm randevu, tahlil ve ilaç programınızı tek bir yerden takip edin.",
        mon: "Pzt", tue: "Sal", wed: "Çar", thu: "Per", fri: "Cum", sat: "Cmt", sun: "Paz",
        jan: "Ocak", feb: "Şubat", mar: "Mart", apr: "Nisan", may: "Mayıs", jun: "Haziran", jul: "Temmuz", aug: "Ağustos", sep: "Eylül", oct: "Ekim", nov: "Kasım", dec: "Aralık",
        dayDetails: "Günlük Detaylar",
        noEvents: "Bu gün için kayıtlı bir etkinlik bulunmuyor.",
        medicationTracker: "İlaç Takibi",
        todayMedications: "Bugünkü İlaçlarınız",
        medTaskTaken: "Aldım",
        medTaskSkip: "Bekliyor",
        medProgress: "Günlük İlerleme",
        noMedications: "Bugün için planlanmış bir ilacınız bulunmuyor.",
        dosage: "Doz:",
        time: "Saat:",
        prescribedBy: "Reçete Eden:",
        emergencyCard: "Acil Kartı",
        downloadCard: "Kartı İndir",
        scanForDetails: "Detaylar için tarayın",
        rateDoctor: "Değerlendir",
        writeReview: "Yorum Yazın",
        reviewPlaceholder: "Doktorunuz hakkındaki düşüncelerinizi paylaşın...",
        submitReview: "Gönder",
        today: "Bugün",
        tomorrow: "Yarın",
        daysLater: "Gün Sonra",
        addToCalendar: "Takvime Ekle",
        joinVideo: "Videoya Katıl",
        atClinic: "Klinikte",
        journal: "Sağlık Günlüğü",
        journalTitle: "Sağlık Günlüğüm",
        journalDesc: "Günlük belirtilerinizi, hissettiklerinizi ve notlarınızı kaydedin.",
        newEntry: "Yeni Kayıt",
        entryTitle: "Başlık",
        entryContent: "Notunuz",
        entryMood: "Ruh Hali",
        saveEntry: "Kaydet",
        deleteEntry: "Sil",
        editEntry: "Düzenle",
        noEntries: "Henüz günlük kaydı yok. İlk notunuzu ekleyin!",
        entryTitlePlaceholder: "Bugün nasıl hissettiniz?",
        entryContentPlaceholder: "Belirtilerinizi, şikayetlerinizi veya genel durumunuzu yazın...",
        wellnessScore: "Sağlık Skoru",
        wellnessDesc: "Genel sağlık durumunuz",
        wellnessExcellent: "Mükemmel",
        wellnessGood: "İyi",
        wellnessFair: "Orta",
        wellnessPoor: "Zayıf",
        addChip: "+ Ekle",
        chipPlaceholder: "Yeni ekle ve Enter'a bas",
        close: "Kapat",
        addPersonalMedication: "Kişisel İlaç Ekle",
        personalMedication: "Kişisel İlaç",
        medName: "İlaç Adı",
        dosageVal: "Doz / Miktar (ör. 1 tablet, 5 ml)",
        medFrequency: "Sıklık / Günlük Adet",
        timeSlots: "Saat Dilimleri",
        addTimeSlot: "+ Saat Ekle",
        saveMed: "İlacı Ekle",
        myPersonalMeds: "Benim Kişisel İlaçlarım",
        deleteMedConfirm: "Bu ilacı silmek istediğinize emin misiniz?",
        medNamePlaceholder: "ör. C Vitamini, Omega 3, Ağrı Kesici"
    },
    en: {
        title: "MediTrack",
        subtitle: "Portal",
        notifications: "Notifications",
        messages: "Messages",
        files: "My Files",
        allFiles: "All Files",
        allMessages: "All Messages",
        composeMessage: "Compose Message",
        uploadFile: "Upload File",
        noFiles: "No files uploaded yet.",
        noNotifications: "No notifications.",
        selectDoctor: "Select Doctor",
        messageContent: "Your message...",
        send: "Send",
        fileName: "File Name",
        selectFile: "Select File",
        reply: "Reply",
        askDoctor: "Ask Doctor",
        settings: "Account Settings",
        settingsTitle: "Account Settings",
        themeDark: "Dark Mode",
        themeLight: "Light Mode",
        logout: "Logout",
        welcome: "Welcome",
        welcomeDesc: "Easily track all your appointments, medical history, and up-to-date health data from a single point with the MediTrack smart health portal.",
        dashboardSummary: "Dashboard Summary",
        healthSummary: "Your Health Summary",
        upcomingAppt: "Your Upcoming Appointment",
        noUpcoming: "No upcoming appointments.",
        bookNow: "Book Now",
        personal: "PERSONAL",
        height: "Height (cm)",
        weight: "Weight (kg)",
        bmi: "Body Mass Index",
        bmiNormal: "Normal",
        bmiOver: "Overweight",
        bmiUnder: "Underweight",
        bmiObese: "Obese",
        edit: "Edit",
        save: "Save",
        saveChanges: "Save Changes",
        cancel: "Cancel",
        bloodType: "Blood Type",
        bloodTypeSection: "BLOOD TYPE",
        bloodInfo: "Blood Info",
        bloodNotSet: "Not specified",
        notSelected: "Not Selected",
        noPendingAppt: "You don't have any pending appointments.",
        pastTransactions: "Past Transactions",
        noPastAppt: "No past appointments found.",
        newAppointment: "New Appointment",
        selectDocTime: "Please select a suitable doctor and time.",
        specialtySelection: "Specialty Selection",
        pleaseSelectSpecialty: "Please select a specialty",
        doctorSelection: "Doctor Selection",
        pleaseSelectDoctor: "Please select a doctor",
        selectSpecialtyFirst: "Select specialty first",
        dateLabel: "Date",
        selectDate: "Select date",
        timeLabel: "Time",
        chooseTime: "Select",
        noAvailableTime: "No available time",
        selectDateFirst: "Select date first",
        appointmentNote: "Appointment Note (Optional)",
        notePlaceholder: "You can briefly describe your symptoms or anything else you'd like to add.",
        heightWeightInfo: "Height / Weight Info",
        creatingAppointment: "Creating Appointment...",
        confirmAppointment: "Confirm Appointment",
        bookingSuccessTitle: "Appointment Created!",
        bookingSuccessDesc: "Your appointment details have been successfully saved to the system. You can track the details in your upcoming appointments section.",
        closeWindow: "Close Window",
        nameLabel: "Full Name",
        fullName: "Full Name",
        email: "Email Address",
        phone: "Phone Number",
        tcIdentity: "National ID",
        profileInfo: "Profile Info",
        medicalInfo: "Medical Info",
        security: "Security",
        currentPass: "Current Password",
        newPass: "New Password",
        confirmPass: "Confirm New Password",
        passPlaceholder: "Enter new password",
        confirmPassPlaceholder: "Confirm new password",
        updatePass: "Update Password",
        loading: "Loading...",
        chronicDiseases: "Chronic Diseases",
        allergies: "Allergies",
        smokingAlcohol: "Smoking / Alcohol Status",
        emergencyContact: "Emergency Contact",
        emergencyName: "Contact Name",
        emergencyPhone: "Contact Phone",
        lastLabResults: "Last Lab Results",
        lastPrescriptions: "Last Prescriptions",
        doctorMessages: "Doctor Messages",
        noLabResults: "No lab results found.",
        noPrescriptions: "No prescriptions found.",
        noMessages: "No messages from doctors yet.",
        viewAll: "View All",
        testName: "Test Name",
        diagnosis: "Diagnosis",
        sender: "Sender",
        smartSuggestions: "MediTrack Smart Suggestions",
        suggestedSpecialty: "Suggested Specialty",
        lessBusyDoctor: "Less Busy Doctor",
        optimalTime: "Optimal Time",
        useSuggestion: "Use Suggestion",
        basedOnHistory: "Suggested based on your health history",
        highlyRecommended: "High Availability",
        downloadPDF: "Download PDF",
        viewTrends: "View Trends",
        labTrends: "Lab Trends",
        compareWithPast: "Compare with Past Tests",
        noNumericData: "No numeric data found for chart.",
        backToDashboard: "Back to Dashboard",
        areYouSure: "Are you sure?",
        cancelWarning: "Are you sure you want to cancel this appointment? This action cannot be undone.",
        giveUp: "Give Up",
        yesCancel: "Yes, Cancel",
        cancelAppt: "Cancel Appointment",
        clinicVisit: "Clinic Visit",
        vitalUpdateSuccess: "Health data updated",
        profileUpdateSuccess: "Profile successfully updated",
        passUpdateSuccess: "Password successfully updated",
        passMismatch: "New passwords do not match.",
        cancelSuccess: "Appointment cancelled.",
        cancelFail: "Cancellation failed.",
        patientAccount: "Patient Account",
        active: "ACTIVE",
        accountSummary: "Account Summary",
        accountStatus: "Account Status",
        activeAndVerified: "Active & Verified",
        emailVerification: "Email Verification",
        verified: "Verified",
        age: "Age",
        activeAppt: "Active Appointments",
        bookNew: "Book New Appointment",
        bookNewDesc: "Create a new appointment now",
        clickToBook: "Click to Book an Appointment",
        vitalsTitle: "Personal Health Data",
        smartCalendar: "Smart Calendar",
        calendarTitle: "My Health Calendar",
        calendarDesc: "Track all your appointments, lab results, and medications in one place.",
        mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
        jan: "Jan", feb: "Feb", mar: "Mar", apr: "Apr", may: "May", jun: "Jun", jul: "Jul", aug: "Aug", sep: "Sep", oct: "Oct", nov: "Nov", dec: "Dec",
        dayDetails: "Day Details",
        noEvents: "No events recorded for this day.",
        medicationTracker: "Medication Tracker",
        todayMedications: "Your Medications for Today",
        medTaskTaken: "Taken",
        medTaskSkip: "Pending",
        medProgress: "Daily Progress",
        noMedications: "No medications scheduled for today.",
        dosage: "Dosage:",
        time: "Time:",
        prescribedBy: "Prescribed By:",
        emergencyCard: "Emergency ID",
        downloadCard: "Download Card",
        scanForDetails: "Scan for details",
        rateDoctor: "Rate Doctor",
        writeReview: "Write Review",
        reviewPlaceholder: "Share your thoughts about your doctor...",
        submitReview: "Submit",
        today: "Today",
        tomorrow: "Tomorrow",
        daysLater: "Days Later",
        addToCalendar: "Add to Calendar",
        joinVideo: "Join Video",
        atClinic: "At Clinic",
        journal: "Health Journal",
        journalTitle: "My Health Journal",
        journalDesc: "Record your daily symptoms, feelings, and notes.",
        newEntry: "New Entry",
        entryTitle: "Title",
        entryContent: "Your Note",
        entryMood: "Mood",
        saveEntry: "Save",
        deleteEntry: "Delete",
        editEntry: "Edit",
        noEntries: "No journal entries yet. Add your first note!",
        entryTitlePlaceholder: "How are you feeling today?",
        entryContentPlaceholder: "Write your symptoms, complaints, or general condition...",
        wellnessScore: "Wellness Score",
        wellnessDesc: "Your overall health status",
        wellnessExcellent: "Excellent",
        wellnessGood: "Good",
        wellnessFair: "Fair",
        wellnessPoor: "Poor",
        addChip: "+ Add",
        chipPlaceholder: "Add new and press Enter",
        close: "Close",
        addPersonalMedication: "Add Personal Medication",
        personalMedication: "Personal Medication",
        medName: "Medication Name",
        dosageVal: "Dosage (e.g. 1 tablet, 5 ml)",
        medFrequency: "Frequency / Times per Day",
        timeSlots: "Time Slots",
        addTimeSlot: "+ Add Time",
        saveMed: "Add Medication",
        myPersonalMeds: "My Personal Medications",
        deleteMedConfirm: "Are you sure you want to delete this medication?",
        medNamePlaceholder: "e.g., Vitamin C, Omega 3, Painkiller"
    }
};

export default function PatientDashboard() {
    const navigate = useNavigate();
    const { patientUser, logoutPatient, refreshUser } = usePatientAuth();
    const [appointments, setAppointments] = useState([]);
    const [labResults, setLabResults] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });
    const [mounted, setMounted] = useState(false);

    // Theme & Language State
    const [theme, setTheme] = useState(localStorage.getItem("portalTheme") || "light");
    const [lang, setLang] = useState(localStorage.getItem("portalLang") || "tr");

    const t = (key) => translations[lang][key] || key;

    // Modal & Settings State
    const [showSettings, setShowSettings] = useState(false);
    const [settingsTab, setSettingsTab] = useState("profile"); // profile | security

    // Profile Settings Form
    const [profileForm, setProfileForm] = useState({
        name: patientUser?.name || "",
        email: patientUser?.email || "",
        phone: patientUser?.phone || "",
        bloodType: patientUser?.bloodType || "",
        chronicDiseases: patientUser?.chronicDiseases || "",
        allergies: patientUser?.allergies || "",
        smokingAlcoholStatus: patientUser?.smokingAlcoholStatus || "",
        emergencyContact: {
            name: patientUser?.emergencyContact?.name || "",
            phone: patientUser?.emergencyContact?.phone || ""
        }
    });

    // Password Form
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [updatingProfile, setUpdatingProfile] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    // Booking Modal State
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [bookingError, setBookingError] = useState("");
    const [cancelModal, setCancelModal] = useState({ show: false, appointmentId: null });
    const [doctors, setDoctors] = useState([]);
    const [bookingForm, setBookingForm] = useState({
        specialtyId: "",
        doctorId: "",
        date: "",
        time: "",
        notes: ""
    });
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookedSlots, setBookedSlots] = useState([]);
    const [smartRecs, setSmartRecs] = useState(null);
    const [symptoms, setSymptoms] = useState("");
    const [isTriageLoading, setIsTriageLoading] = useState(false);
    const [showLabTrends, setShowLabTrends] = useState({ show: false, parameter: "" });
    const [notifications, setNotifications] = useState([]);
    const [files, setFiles] = useState([]);
    const [showComposeModal, setShowComposeModal] = useState({ show: false, receiverId: "", receiverName: "" });
    const [newMessage, setNewMessage] = useState({ title: "", content: "" });
    const [showFileUpload, setShowFileUpload] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [sendMessageLoading, setSendMessageLoading] = useState(false);
    const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
    const [explanationModal, setExplanationModal] = useState({ show: false, content: "", title: "" });
    const [explainingId, setExplainingId] = useState(null);
    const [aiSummary, setAiSummary] = useState({ text: "", loading: false });
    const [historicalVitals, setHistoricalVitals] = useState([]);
    const [showVitalModal, setShowVitalModal] = useState(false);
    const [vitalForm, setVitalForm] = useState({ type: "blood_pressure", value: "", unit: "mmHg", date: new Date(), notes: "" });
    const [vitalAnalysis, setVitalAnalysis] = useState(null);
    const [isAnalyzingVitals, setIsAnalyzingVitals] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [editingVitalId, setEditingVitalId] = useState(null);
    const [activeTab, setActiveTab] = useState("dashboard");
    
    // Nöbetçi Eczane Geolocation State
    const [userLocation, setUserLocation] = useState(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [nearbyPharmacies, setNearbyPharmacies] = useState([]);
    const [selectedDistrict, setSelectedDistrict] = useState("");

    const handleDistrictChange = (e) => {
        const dist = e.target.value;
        setSelectedDistrict(dist);
        if (dist === "") {
            fetchLocationAndPharmacies();
        }
    };

    const fetchLocationAndPharmacies = () => {
        setSelectedDistrict("");
        setIsLoadingLocation(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    setUserLocation({ lat, lng });
                    setNearbyPharmacies([
                        { id: 1, name: "Merkez Nöbetçi Eczanesi", address: "Bulunduğunuz konuma çok yakın", phone: "0555 123 45 67", distance: "0.2 km", lat: lat + 0.002, lng: lng + 0.001 },
                        { id: 2, name: "Sağlık Eczanesi", address: "Merkez Cad. No: 15", phone: "0555 987 65 43", distance: "0.6 km", lat: lat - 0.003, lng: lng - 0.002 },
                        { id: 3, name: "Şifa Eczanesi", address: "Hastane Sok. No: 3", phone: "0555 456 78 90", distance: "1.1 km", lat: lat + 0.005, lng: lng - 0.004 }
                    ]);
                    setIsLoadingLocation(false);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    // Fallback to Izmir
                    setUserLocation({ lat: 38.4237, lng: 27.1428 });
                    setNearbyPharmacies([
                        { id: 1, name: "Alsancak Eczanesi", address: "Alsancak Mah. Kıbrıs Şehitleri Cad. No: 50", phone: "0232 444 33 22", distance: "1.5 km", lat: 38.4382, lng: 27.1421 },
                        { id: 2, name: "Kordon Eczanesi", address: "Kültür Mah. Atatürk Cad. No: 120", phone: "0232 464 12 34", distance: "2.1 km", lat: 38.4300, lng: 27.1400 },
                    ]);
                    setIsLoadingLocation(false);
                }
            );
        } else {
            setIsLoadingLocation(false);
        }
    };

    useEffect(() => {
        if (activeTab === "pharmacy" && !userLocation && !isLoadingLocation) {
            fetchLocationAndPharmacies();
        }
    }, [activeTab]);

    const [payments, setPayments] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [paymentForm, setPaymentForm] = useState({ cardNumber: "", expiry: "", cvc: "" });
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    // New state: radiology, medical reports, sent messages, account delete
    const [radiology, setRadiology] = useState([]);
    const [medicalReports, setMedicalReports] = useState([]);
    const [sentMessages, setSentMessages] = useState([]);
    const [messageTab, setMessageTab] = useState("inbox"); // inbox | sent
    const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
    const [deleteAccountPassword, setDeleteAccountPassword] = useState("");
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);

    // New state: procedures, announcements, penalty, notifications modal
    const [procedures, setProcedures] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [penaltyInfo, setPenaltyInfo] = useState({ penaltyPoints: 0, isBlacklisted: false });
    const [showAllNotifications, setShowAllNotifications] = useState(false);

    // Family State
    const [familyMembers, setFamilyMembers] = useState([]);
    const [showFamilyModal, setShowFamilyModal] = useState(false);
    const [familyForm, setFamilyForm] = useState({
        tc: "", name: "", age: "", gender: "Erkek", bloodType: "A+", phone: "", chronicDiseases: "", allergies: "", relationship: "Child"
    });
    const [isAddingFamily, setIsAddingFamily] = useState(false);
    const [editingFamilyId, setEditingFamilyId] = useState(null);
    const [bookingFor, setBookingFor] = useState(null); // null means self, otherwise patient ID
    const [showEmergencyCard, setShowEmergencyCard] = useState(false);

    // Review System State
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedAppointmentForReview, setSelectedAppointmentForReview] = useState(null);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewComment, setReviewComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);

    // --- Reports Tab State ---
    const [selectedRecord, setSelectedRecord] = useState(null); // { type: "radiology"|"report"|"procedure", data: {...} }
    const [reportsFilter, setReportsFilter] = useState("all"); // "all"|"radiology"|"report"|"procedure"
    const [reportsSearch, setReportsSearch] = useState("");

    // --- Journal State ---
    const [journalEntries, setJournalEntries] = useState([]);
    const [journalLoading, setJournalLoading] = useState(false);
    const [showJournalForm, setShowJournalForm] = useState(false);
    const [journalForm, setJournalForm] = useState({ title: '', content: '', mood: '😊' });
    const [editingJournalId, setEditingJournalId] = useState(null);

    const MOODS = ['😊', '😐', '😔', '😤', '🤒', '😴', '💪', '😰'];

    const fetchJournalEntries = async () => {
        setJournalLoading(true);
        try {
            const data = await journalApi.getAll();
            setJournalEntries(data);
        } catch (err) {
            console.error("Journal fetch error:", err);
        } finally {
            setJournalLoading(false);
        }
    };

    const handleSaveJournalEntry = async () => {
        if (!journalForm.title.trim() || !journalForm.content.trim()) return;
        try {
            if (editingJournalId) {
                const res = await journalApi.update(editingJournalId, journalForm);
                setJournalEntries(prev => prev.map(e => e._id === editingJournalId ? res.data : e));
                showToast(lang === 'tr' ? 'Günlük kaydı güncellendi.' : 'Journal entry updated.', 'success');
            } else {
                const res = await journalApi.create(journalForm);
                setJournalEntries(prev => [res.data, ...prev]);
                showToast(lang === 'tr' ? 'Günlük kaydı eklendi.' : 'Journal entry added.', 'success');
            }
            setJournalForm({ title: '', content: '', mood: '😊' });
            setEditingJournalId(null);
            setShowJournalForm(false);
        } catch (err) {
            showToast(err.error || 'İşlem başarısız.', 'error');
        }
    };

    const handleDeleteJournalEntry = async (id) => {
        if (!window.confirm(lang === 'tr' ? 'Bu kaydı silmek istediğinize emin misiniz?' : 'Are you sure you want to delete this entry?')) return;
        try {
            await journalApi.remove(id);
            setJournalEntries(prev => prev.filter(e => e._id !== id));
            showToast(lang === 'tr' ? 'Günlük kaydı silindi.' : 'Entry deleted.', 'success');
        } catch (err) {
            showToast(err.error || 'Silme başarısız.', 'error');
        }
    };

    const handleEditJournalEntry = (entry) => {
        setJournalForm({ title: entry.title, content: entry.content, mood: entry.mood });
        setEditingJournalId(entry._id);
        setShowJournalForm(true);
    };

    // --- Wellness Score Calculation ---
    const calculateWellnessScore = () => {
        let score = 0;
        // BMI component (max 30)
        if (height && weight) {
            const bmi = weight / ((height / 100) ** 2);
            if (bmi >= 18.5 && bmi <= 24.9) score += 30;
            else if (bmi >= 17 && bmi < 18.5) score += 18;
            else if (bmi >= 25 && bmi < 30) score += 20;
            else score += 10;
        }
        // Medication adherence (max 30)
        if (todayDoses.length > 0) {
            const adherence = todayDoses.filter(d => d.taken).length / todayDoses.length;
            score += Math.round(adherence * 30);
        } else {
            score += 15; // neutral if no meds
        }
        // Appointment regularity (max 20) — completed appts in last 3 months
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const recentCompleted = appointments.filter(a => a.status === 'tamamlandı' && new Date(a.date) >= threeMonthsAgo).length;
        score += Math.min(recentCompleted * 5, 20);
        // Vital tracking frequency (max 20)
        const recentVitals = historicalVitals.filter(v => new Date(v.date) >= threeMonthsAgo).length;
        score += Math.min(recentVitals * 4, 20);
        return Math.min(score, 100);
    };

    // --- Allergy & Chronic Disease Chip State ---
    const [allergyChips, setAllergyChips] = useState([]);
    const [diseaseChips, setDiseaseChips] = useState([]);
    const [newAllergyInput, setNewAllergyInput] = useState('');
    const [newDiseaseInput, setNewDiseaseInput] = useState('');

    // Sync chips when profileForm changes (e.g., on open)
    const initChipsFromProfile = () => {
        setAllergyChips(profileForm.allergies ? profileForm.allergies.split(',').map(s => s.trim()).filter(Boolean) : []);
        setDiseaseChips(profileForm.chronicDiseases ? profileForm.chronicDiseases.split(',').map(s => s.trim()).filter(Boolean) : []);
    };

    // --- Helper Functions for Appointments ---
    const getTimeBadgeLabel = (dateStr) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const apptDate = new Date(dateStr);
        apptDate.setHours(0, 0, 0, 0);

        const diffTime = apptDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return { label: t('today'), color: "#eab308", bg: "#fef9c3" };
        if (diffDays === 1) return { label: t('tomorrow'), color: "#3b82f6", bg: "#dbeafe" };
        return { label: `${diffDays} ${t('daysLater')}`, color: "#10b981", bg: "#d1fae5" };
    };

    const generateCalendarEvent = (appt) => {
        const startDate = new Date(appt.date);
        const [hours, minutes] = appt.time.split(':');
        startDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);

        const endDate = new Date(startDate.getTime() + 30 * 60000); // Assume 30 min duration

        const formatDate = (date) => date.toISOString().replace(/-|:|\.\d+/g, '');

        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//GP2//Patient Portal//TR
BEGIN:VEVENT
UID:${appt._id}@gp2.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${appt.doctorId?.name?.startsWith('Dr') ? '' : 'Dr. '}${appt.doctorId?.name} - ${appt.type} Randevusu
DESCRIPTION:Uzmanlık: ${appt.doctorId?.specialty}\\nRandevu Türü: ${appt.type}
LOCATION:${appt.type === 'Online' ? 'GP2 Online Görüşme' : 'GP2 Merkez Klinik'}
END:VEVENT
END:VCALENDAR`;

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', `Randevu_Dr_${appt.doctorId?.name.replace(/\\s+/g, '_')}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        if (showBookingModal) {
            handleGetSmartRecs();
        } else {
            setSmartRecs(null);
            setSymptoms("");
        }
    }, [showBookingModal]);

    const handleGetSmartRecs = (syms = "") => {
        setIsTriageLoading(true);
        patientPortalApi.getSmartRecommendations(syms)
            .then(res => setSmartRecs(res))
            .catch(err => console.error("Smart recs error:", err))
            .finally(() => setIsTriageLoading(false));
    };

    useEffect(() => {
        if (bookingForm.doctorId && bookingForm.date) {
            patientPortalApi.getDoctorSlots(bookingForm.doctorId, bookingForm.date)
                .then(res => setBookedSlots(res.bookedTimes || []))
                .catch(err => console.error("Error fetching slots:", err));
        } else {
            setBookedSlots([]);
        }
    }, [bookingForm.doctorId, bookingForm.date]);

    // Height & Weight State
    const [height, setHeight] = useState(patientUser?.height || "");
    const [weight, setWeight] = useState(patientUser?.weight || "");
    const [isEditingVitals, setIsEditingVitals] = useState(!patientUser?.height || !patientUser?.weight);
    const [updatingVitals, setUpdatingVitals] = useState(false);
    const [todayDoses, setTodayDoses] = useState([]);
    const [selfMedsList, setSelfMedsList] = useState([]);
    const [showAddMedModal, setShowAddMedModal] = useState(false);
    const [submittingSelfMed, setSubmittingSelfMed] = useState(false);
    const [newMedForm, setNewMedForm] = useState({
        name: "",
        dosage: "",
        frequency: "Günde 1 kez",
        timeSlots: ["09:00"],
        startDate: new Date().toISOString().split("T")[0],
        endDate: ""
    });
    const [activeMedReminder, setActiveMedReminder] = useState(null);
    const [notifiedDoses, setNotifiedDoses] = useState({});
    const [loadingMedications, setLoadingMedications] = useState(false);
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(null);

    // Sidebar TABS
    const sidebarTabs = [
        { id: "dashboard", icon: <FiHome />, label: t('dashboardSummary') },
        { id: "calendar", icon: <FiCalendar />, label: t('smartCalendar') },
        { id: "medications", icon: <FiClock />, label: t('medicationTracker') },
        { id: "family", icon: <FiUsers />, label: lang === "tr" ? "Aile Yönetimi" : "Family Management" },
    ];
    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
    };

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem("portalTheme", newTheme);
    };

    const toggleLanguage = () => {
        const newLang = lang === "tr" ? "en" : "tr";
        setLang(newLang);
        localStorage.setItem("portalLang", newLang);
    };

    const fetchDashboardData = async () => {
        try {
            const [appts, docs, labs, rx, msgs, fileList, notifs, meds, sent, radio, medReps, procs, anns, penalty, pays, selfMeds] = await Promise.all([
                patientPortalApi.myAppointments(),
                patientPortalApi.getDoctors(),
                patientPortalApi.myLabResults(),
                patientPortalApi.myPrescriptions(),
                patientPortalApi.myMessages(),
                patientPortalApi.myFiles(),
                patientPortalApi.myNotifications(),
                patientPortalApi.getTodayMedications(),
                patientPortalApi.mySentMessages(),
                patientPortalApi.myRadiology(),
                patientPortalApi.myMedicalReports(),
                patientPortalApi.myProcedures(),
                patientPortalApi.getAnnouncements(),
                patientPortalApi.myPenalty(),
                patientPortalApi.getPaymentHistory(),
                patientPortalApi.getSelfMedications()
            ]);
            setAppointments(appts);
            setDoctors(docs);
            setLabResults(labs);
            setPrescriptions(rx);
            setMessages(msgs);
            setFiles(fileList);
            setNotifications(notifs);
            setTodayDoses(meds);
            setSentMessages(sent);
            setRadiology(radio);
            setMedicalReports(medReps);
            setProcedures(procs);
            setAnnouncements(anns);
            setPenaltyInfo(penalty);
            setPayments(pays);
            setSelfMedsList(selfMeds);

            // Fetch Historical Vitals
            const vitalsData = await patientPortalApi.getMyVitals();
            setHistoricalVitals(vitalsData);

            // Fetch AI Health Summary if there's data to analyze
            if (appts.length > 0 || labs.length > 0) {
                setAiSummary(prev => ({ ...prev, loading: true }));
                patientPortalApi.aiHealthSummary(
                    {
                        age: patientUser?.age,
                        chronicDiseases: patientUser?.chronicDiseases,
                        height: patientUser?.height,
                        weight: patientUser?.weight
                    },
                    labs.slice(0, 5),
                    rx.slice(0, 3)
                ).then(res => {
                    setAiSummary({ text: res.summary, loading: false });
                }).catch((err) => {
                    console.error("AI Summary error:", err);
                    setAiSummary(prev => ({ ...prev, loading: false }));
                });
            }
        } catch (err) {
            setError(err.message || "Veriler yüklenirken hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const handleFetchFamily = async () => {
        try {
            const data = await patientAuthApi.getFamilyMembers();
            setFamilyMembers(data);
        } catch (err) {
            console.error("Fetch family error:", err);
        }
    };

    const handleAddFamilyMember = async (e) => {
        e.preventDefault();
        setIsAddingFamily(true);
        try {
            if (editingFamilyId) {
                await patientAuthApi.updateFamilyMember(editingFamilyId, familyForm);
                showToast(lang === "tr" ? "Aile üyesi güncellendi." : "Family member updated.", "success");
            } else {
                await patientAuthApi.addFamilyMember(familyForm);
                showToast(lang === "tr" ? "Aile üyesi başarıyla eklendi." : "Family member added successfully.", "success");
            }
            setShowFamilyModal(false);
            setEditingFamilyId(null);
            setFamilyForm({ tc: "", name: "", age: "", gender: "Erkek", bloodType: "A+", phone: "", chronicDiseases: "", allergies: "", relationship: "Child" });
            handleFetchFamily();
        } catch (err) {
            showToast(err.error || "Hata oluştu.", "error");
        } finally {
            setIsAddingFamily(false);
        }
    };

    const handleEditFamilyMember = (member) => {
        setEditingFamilyId(member._id);
        setFamilyForm({
            tc: member.tc,
            name: member.name,
            age: member.age,
            gender: member.gender,
            bloodType: member.bloodType,
            phone: member.phone || "",
            chronicDiseases: member.chronicDiseases || "",
            allergies: member.allergies || "",
            relationship: member.relationship || "Child"
        });
        setShowFamilyModal(true);
    };

    const openReviewModal = (appointment) => {
        setSelectedAppointmentForReview(appointment);
        setRating(0);
        setHoverRating(0);
        setReviewComment("");
        setReviewModalOpen(true);
    };

    const handleReviewSubmit = async () => {
        if (rating < 1) {
            showToast(lang === 'tr' ? 'Lütfen bir yıldız puanı verin.' : 'Please select a star rating.', 'error');
            return;
        }

        setSubmittingReview(true);
        try {
            await patientPortalApi.submitAppointmentReview(selectedAppointmentForReview._id, {
                rating,
                comment: reviewComment
            });
            showToast(lang === 'tr' ? 'Değerlendirmeniz kaydedildi.' : 'Your review was submitted.', 'success');
            setReviewModalOpen(false);
            fetchDashboardData();
        } catch (err) {
            showToast(err.error || err.message, 'error');
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleOpenFamilyModal = () => {
        setEditingFamilyId(null);
        setFamilyForm({ tc: "", name: "", age: "", gender: "Erkek", bloodType: "A+", phone: "", chronicDiseases: "", allergies: "", relationship: "Child" });
        setShowFamilyModal(true);
    };

    const fetchTodayMedications = async () => {
        setLoadingMedications(true);
        try {
            const [data, selfMeds] = await Promise.all([
                patientPortalApi.getTodayMedications(),
                patientPortalApi.getSelfMedications()
            ]);
            setTodayDoses(data);
            setSelfMedsList(selfMeds);
        } catch (err) {
            console.error("Medication fetch error:", err);
        } finally {
            setLoadingMedications(false);
        }
    };

    const handleFrequencyChange = (freq) => {
        let slots = ["09:00"];
        if (freq === "Günde 2 kez") {
            slots = ["09:00", "21:00"];
        } else if (freq === "Günde 3 kez") {
            slots = ["09:00", "14:00", "21:00"];
        } else if (freq === "Günde 4 kez") {
            slots = ["08:00", "12:00", "16:00", "20:00"];
        }
        setNewMedForm(prev => ({
            ...prev,
            frequency: freq,
            timeSlots: slots
        }));
    };

    const handleTimeSlotChange = (index, value) => {
        const updated = [...newMedForm.timeSlots];
        updated[index] = value;
        setNewMedForm(prev => ({ ...prev, timeSlots: updated }));
    };

    const addTimeSlotInput = () => {
        setNewMedForm(prev => ({
            ...prev,
            timeSlots: [...prev.timeSlots, "12:00"]
        }));
    };

    const removeTimeSlotInput = (index) => {
        if (newMedForm.timeSlots.length <= 1) return;
        setNewMedForm(prev => ({
            ...prev,
            timeSlots: prev.timeSlots.filter((_, i) => i !== index)
        }));
    };

    const handleAddSelfMedication = async (e) => {
        e.preventDefault();
        if (!newMedForm.name || !newMedForm.dosage) {
            showToast(lang === "tr" ? "Lütfen tüm zorunlu alanları doldurun." : "Please fill in all required fields.", "error");
            return;
        }
        setSubmittingSelfMed(true);
        try {
            await patientPortalApi.addSelfMedication(newMedForm);
            showToast(lang === "tr" ? "Kişisel ilaç başarıyla eklendi." : "Personal medication added successfully.", "success");
            setShowAddMedModal(false);
            setNewMedForm({
                name: "",
                dosage: "",
                frequency: "Günde 1 kez",
                timeSlots: ["09:00"],
                startDate: new Date().toISOString().split("T")[0],
                endDate: ""
            });
            fetchTodayMedications();
        } catch (err) {
            showToast(err.error || "İşlem başarısız.", "error");
        } finally {
            setSubmittingSelfMed(false);
        }
    };

    const handleDeleteSelfMedication = async (id) => {
        if (!window.confirm(lang === "tr" ? "Bu ilacı silmek istediğinize emin misiniz?" : "Are you sure you want to delete this medication?")) return;
        try {
            await patientPortalApi.deleteSelfMedication(id);
            showToast(lang === "tr" ? "Kişisel ilaç silindi." : "Personal medication deleted.", "success");
            fetchTodayMedications();
        } catch (err) {
            showToast(err.error || "Silme işlemi başarısız.", "error");
        }
    };

    const handleToggleMedication = async (dose) => {
        try {
            // Optimistic update
            const newStatus = !dose.taken;
            setTodayDoses(prev => prev.map(d =>
                (d.prescriptionId === dose.prescriptionId && d.medicationName === dose.medicationName && d.timeSlot === dose.timeSlot)
                    ? { ...d, taken: newStatus }
                    : d
            ));

            await patientPortalApi.toggleMedicationStatus({
                prescriptionId: dose.prescriptionId,
                medicationName: dose.medicationName,
                timeSlot: dose.timeSlot,
                taken: newStatus
            });

            showToast(newStatus ? (lang === "tr" ? "İlaç alındı olarak işaretlendi." : "Medication marked as taken.") : (lang === "tr" ? "İlaç beklemeye alındı." : "Medication moved to pending."));
        } catch (err) {
            // Rollback on error
            fetchTodayMedications();
            showToast(err.error || "İşlem başarısız.", "error");
        }
    };

    const handleDeleteFamilyMember = async (id) => {
        if (!window.confirm(lang === "tr" ? "Bu aile üyesini silmek istediğinize emin misiniz?" : "Are you sure you want to delete this family member?")) return;
        try {
            await patientAuthApi.deleteFamilyMember(id);
            handleFetchFamily();
        } catch (err) {
            alert(err.error || "Silme başarısız.");
        }
    };

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const getCalendarEvents = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const eventsByDay = {};

        // 1. Map Appointments
        appointments.forEach(app => {
            const appDate = new Date(app.date);
            if (appDate.getFullYear() === year && appDate.getMonth() === month) {
                const day = appDate.getDate();
                if (!eventsByDay[day]) eventsByDay[day] = [];
                eventsByDay[day].push({ type: 'appointment', data: app });
            }
        });

        // 2. Map Lab Results
        labResults.forEach(lab => {
            const labDate = new Date(lab.date);
            if (labDate.getFullYear() === year && labDate.getMonth() === month) {
                const day = labDate.getDate();
                if (!eventsByDay[day]) eventsByDay[day] = [];
                eventsByDay[day].push({ type: 'lab', data: lab });
            }
        });

        // 3. Project Medications
        prescriptions.forEach(p => {
            p.medications.forEach(m => {
                const startDate = new Date(p.date || Date.now());
                const durationDays = parseInt(m.duration) || 30;

                for (let i = 0; i < durationDays; i++) {
                    const current = new Date(startDate);
                    current.setDate(startDate.getDate() + i);

                    if (current.getFullYear() === year && current.getMonth() === month) {
                        const day = current.getDate();
                        if (!eventsByDay[day]) eventsByDay[day] = [];
                        if (!eventsByDay[day].some(e => e.type === 'med' && e.name === m.name)) {
                            eventsByDay[day].push({ type: 'med', name: m.name, freq: m.frequency, isPersonal: false });
                        }
                    }
                }
            });
        });

        // 4. Project Personal Medications (Self Medications)
        selfMedsList.forEach(med => {
            const startDate = med.startDate ? new Date(med.startDate) : (med.createdAt ? new Date(med.createdAt) : new Date());
            const endDate = med.endDate ? new Date(med.endDate) : null;
            
            const startYear = startDate.getFullYear();
            const startMonth = startDate.getMonth();
            const startDay = startDate.getDate();
            const compareStart = new Date(startYear, startMonth, startDay);

            let compareEnd = null;
            if (endDate) {
                const endYear = endDate.getFullYear();
                const endMonth = endDate.getMonth();
                const endDay = endDate.getDate();
                compareEnd = new Date(endYear, endMonth, endDay);
            }

            const daysInMonth = getDaysInMonth(year, month);
            for (let day = 1; day <= daysInMonth; day++) {
                const currentDayDate = new Date(year, month, day);

                const afterStart = currentDayDate >= compareStart;
                const beforeEnd = !compareEnd || currentDayDate <= compareEnd;

                if (afterStart && beforeEnd) {
                    if (!eventsByDay[day]) eventsByDay[day] = [];
                    if (!eventsByDay[day].some(e => e.type === 'med' && e.name === med.name)) {
                        eventsByDay[day].push({ type: 'med', name: med.name, freq: med.frequency, isPersonal: true });
                    }
                }
            }
        });

        return eventsByDay;
    };

    const handlePrevMonth = () => {
        setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    useEffect(() => {
        setMounted(true);
        fetchDashboardData();
        handleFetchFamily();
        fetchJournalEntries();
    }, []);

    useEffect(() => {
        if (patientUser) {
            setHeight(patientUser.height || "");
            setWeight(patientUser.weight || "");
            setIsEditingVitals(!patientUser.height || !patientUser.weight);
            setProfileForm({
                name: patientUser.name || "",
                email: patientUser.email || "",
                phone: patientUser.phone || "",
                bloodType: patientUser.bloodType || "",
                chronicDiseases: patientUser.chronicDiseases || "",
                allergies: patientUser.allergies || "",
                smokingAlcoholStatus: patientUser.smokingAlcoholStatus || "",
                emergencyContact: {
                    name: patientUser.emergencyContact?.name || "",
                    phone: patientUser.emergencyContact?.phone || ""
                }
            });
        }
    }, [patientUser]);

    // Medication Reminders Checker
    useEffect(() => {
        // Request Browser Notification Permission on mount
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        if (!todayDoses || todayDoses.length === 0) return;

        const checkTimeSlots = () => {
            const now = new Date();
            const currentHour = String(now.getHours()).padStart(2, "0");
            const currentMin = String(now.getMinutes()).padStart(2, "0");
            const currentTimeStr = `${currentHour}:${currentMin}`; // e.g. "09:00"
            const todayStr = now.toISOString().split("T")[0];

            todayDoses.forEach(dose => {
                // Check if timeSlot matches current time and is not taken
                if (dose.timeSlot === currentTimeStr && !dose.taken) {
                    const notifiedKey = `${dose.prescriptionId}-${dose.medicationName}-${dose.timeSlot}-${todayStr}`;
                    
                    if (!notifiedDoses[notifiedKey]) {
                        // Mark as notified
                        setNotifiedDoses(prev => ({ ...prev, [notifiedKey]: true }));

                        // Play synthesized chime
                        try {
                            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                            const osc = audioCtx.createOscillator();
                            const gain = audioCtx.createGain();
                            osc.connect(gain);
                            gain.connect(audioCtx.destination);
                            osc.type = "sine";
                            
                            // High-pitch double chime
                            osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
                            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                            osc.start();
                            osc.stop(audioCtx.currentTime + 0.15);

                            setTimeout(() => {
                                const osc2 = audioCtx.createOscillator();
                                const gain2 = audioCtx.createGain();
                                osc2.connect(gain2);
                                gain2.connect(audioCtx.destination);
                                osc2.frequency.setValueAtTime(1200, audioCtx.currentTime);
                                gain2.gain.setValueAtTime(0.15, audioCtx.currentTime);
                                osc2.start();
                                osc2.stop(audioCtx.currentTime + 0.25);
                            }, 200);
                        } catch (e) {
                            console.error("Audio context error", e);
                        }

                        // Trigger Browser Notification
                        if ("Notification" in window && Notification.permission === "granted") {
                            new Notification(lang === "tr" ? "MediTrack İlaç Hatırlatıcısı" : "MediTrack Medication Reminder", {
                                body: `${dose.medicationName} (${dose.dosage}) zamanı geldi. Yazan: ${dose.doctorName}`,
                                icon: "/favicon.ico"
                            });
                        }

                        // Trigger Global Popup Modal
                        setActiveMedReminder(dose);
                    }
                }
            });
        };

        // Run immediately on change, and setup 10-second interval
        checkTimeSlots();
        const intervalId = setInterval(checkTimeSlots, 10000);

        return () => clearInterval(intervalId);
    }, [todayDoses, notifiedDoses, lang]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setUpdatingProfile(true);
        try {
            await patientAuthApi.updateProfile(profileForm);
            await refreshUser();
            showToast("Profil başarıyla güncellendi", "success");
            setShowSettings(false);
        } catch (err) {
            showToast(err.error || "Güncelleme sırasında bir hata oluştu", "error");
        } finally {
            setUpdatingProfile(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            showToast("Yeni şifreler eşleşmiyor", "error");
            return;
        }
        setChangingPassword(true);
        try {
            await patientAuthApi.changePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });
            showToast("Şifreniz başarıyla değiştirildi", "success");
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setShowSettings(false);
        } catch (err) {
            showToast(err.error || "Şifre değiştirme sırasında bir hata oluştu", "error");
        } finally {
            setChangingPassword(false);
        }
    };

    const handleLogout = () => {
        logoutPatient();
        navigate("/hasta/giris");
    };

    const handleSaveVitals = async () => {
        if (!height || !weight) {
            showToast("Lütfen boy ve kilo bilgilerini eksiksiz giriniz.", "error");
            return;
        }
        setUpdatingVitals(true);
        try {
            await patientAuthApi.updateProfile({ height: Number(height), weight: Number(weight) });
            await refreshUser();
            setIsEditingVitals(false);
            showToast("Boy ve kilo başarıyla kaydedildi.", "success");
        } catch (err) {
            showToast(err.message || "Güncelleme başarısız.", "error");
        } finally {
            setUpdatingVitals(false);
        }
    };

    const handleBookAppointment = async (e) => {
        e.preventDefault();
        setBookingLoading(true);
        setBookingError("");
        const appointmentData = {
            doctorId: bookingForm.doctorId,
            date: bookingForm.date,
            time: bookingForm.time,
            type: bookingForm.type,
            notes: symptoms,
            patientId: bookingFor // Pass chosen family member ID or null for self
        };

        try {
            await patientPortalApi.bookAppointment(appointmentData);
            setBookingSuccess(true);
            setBookingForm({ specialtyId: "", doctorId: "", date: "", time: "", type: "Kontrol" });
            setSymptoms("");
            setBookingFor(null); // Reset
            fetchDashboardData(); // Refresh list
        } catch (err) {
            setBookingError(err.error || err.message || "Randevu oluşturulamadı.");
        } finally {
            setBookingLoading(false);
        }
    };

    const handleCancel = (id) => {
        setCancelModal({ show: true, appointmentId: id });
    };

    const handleDownloadPDF = (rx) => {
        try {
            const doc = new jsPDF();
            const dateStr = new Date(rx.date).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US');

            // Header - MediTrack Branding
            doc.setFillColor(190, 18, 60); // Primary Red
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(24);
            doc.text("MediTrack", 20, 25);
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(t('subtitle'), 20, 32);

            // Right Header - Date and ID
            doc.setFontSize(10);
            doc.text(`${t('dateLabel')}: ${dateStr}`, 150, 25);
            doc.text(`ID: #${rx._id.substring(rx._id.length - 6).toUpperCase()}`, 150, 32);

            // Patient & Doctor Info
            doc.setTextColor(30, 41, 59);
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text(t('profileInfo'), 20, 55);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(`${t('nameLabel')}: ${patientUser?.name}`, 20, 65);
            doc.text(`${t('doctorSelection')}: ${rx.doctorId?.title || ""} ${rx.doctorId?.name || ""}`, 20, 72);
            doc.text(`${rx.doctorId?.specialty || ""}`, 20, 79);

            // Diagnosis
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.text(t('diagnosis'), 20, 95);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(rx.diagnosis, 20, 105);

            // Medications Table
            const columns = [
                { title: "Medication", dataKey: "name" },
                { title: "Dosage", dataKey: "dosage" },
                { title: "Frequency", dataKey: "frequency" },
                { title: "Duration", dataKey: "duration" }
            ];

            const data = rx.medications.map(m => ({
                name: m.name,
                dosage: m.dosage,
                frequency: m.frequency,
                duration: m.duration || "-"
            }));

            doc.autoTable({
                columns,
                body: data,
                startY: 115,
                theme: 'grid',
                headStyles: { fillColor: [190, 18, 60], textColor: [255, 255, 255], fontStyle: 'bold' },
                margin: { left: 20, right: 20 }
            });

            // Footer / Notes
            if (rx.notes) {
                const finalY = doc.autoTable.previous.finalY;
                doc.setFont("helvetica", "bold");
                doc.text("Notes", 20, finalY + 20);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(9);
                doc.text(rx.notes, 20, finalY + 30, { maxWidth: 170 });
            }

            // Save the PDF
            doc.save(`Recete_${dateStr}_${patientUser?.name.replace(/\s+/g, '_')}.pdf`);
            showToast("PDF başarıyla oluşturuldu.", "success");
        } catch (err) {
            console.error("PDF Error:", err);
            showToast("PDF oluşturulurken hata oluştu.", "error");
        }
    };

    const getParameterChartData = (parameterName) => {
        const trendData = labResults
            .filter(lr => lr.status === "tamamlandı")
            .map(lr => {
                const item = lr.results.find(r => r.parameter === parameterName);
                if (!item) return null;
                const numericValue = parseFloat(item.value.replace(',', '.'));
                if (isNaN(numericValue)) return null;

                return {
                    date: new Date(lr.date).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: '2-digit', month: '2-digit' }),
                    value: numericValue,
                    fullDate: new Date(lr.date).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US'),
                    unit: item.unit
                };
            })
            .filter(d => d !== null)
            .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));

        return trendData;
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!showComposeModal.receiverId || !newMessage.content) {
            showToast("Lütfen tüm alanları doldurun.", "error");
            return;
        }

        setSendMessageLoading(true);
        try {
            await patientPortalApi.sendMessage({
                receiverId: showComposeModal.receiverId,
                title: newMessage.title,
                content: newMessage.content
            });
            showToast("Mesaj gönderildi.", "success");
            setShowComposeModal({ show: false, receiverId: "", receiverName: "" });
            setNewMessage({ title: "", content: "" });
            fetchDashboardData();
        } catch (err) {
            showToast(err.message || "Mesaj gönderilemedi.", "error");
        } finally {
            setSendMessageLoading(false);
        }
    };

    const handleFileUpload = async () => {
        if (!selectedFile) return;

        setUploadingFile(true);
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("name", selectedFile.name);

        try {
            await patientPortalApi.uploadFile(formData);
            showToast("Dosya yüklendi.", "success");
            setShowFileUpload(false);
            setSelectedFile(null);
            fetchDashboardData();
        } catch (err) {
            showToast(err.message || "Yükleme hatası.", "error");
        } finally {
            setUploadingFile(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await patientPortalApi.markNotificationAsRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error("Scale mark notification error:", err);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await patientPortalApi.markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error("Mark all read error:", err);
        }
    };

    const handleDeleteAccount = async () => {
        if (!deleteAccountPassword) {
            showToast(lang === 'tr' ? 'Lütfen şifrenizi girin.' : 'Please enter your password.', 'error');
            return;
        }
        setIsDeletingAccount(true);
        try {
            await patientAuthApi.deleteAccount(deleteAccountPassword);
            showToast(lang === 'tr' ? 'Hesabınız silindi.' : 'Account deleted.', 'success');
            setTimeout(() => logoutPatient(), 1500);
        } catch (err) {
            showToast(err.error || (lang === 'tr' ? 'Silme işlemi başarısız.' : 'Deletion failed.'), 'error');
        } finally {
            setIsDeletingAccount(false);
        }
    };

    const confirmCancel = async () => {
        const id = cancelModal.appointmentId;
        if (!id) return;

        try {
            await patientPortalApi.cancelAppointment(id);
            setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: "iptal" } : a));
            showToast("Randevunuz iptal edildi.", "success");
        } catch (err) {
            showToast(err.message || "İptal başarısız oldu.", "error");
        } finally {
            setCancelModal({ show: false, appointmentId: null });
        }
    };

    const handleExplainResults = async (lab) => {
        setExplainingId(lab._id);
        try {
            const res = await patientPortalApi.aiExplainResults(lab.results, {
                age: patientUser?.age,
                chronicDiseases: patientUser?.chronicDiseases
            });
            setExplanationModal({
                show: true,
                title: lab.testName,
                content: res.explanation
            });
        } catch (err) {
            showToast("AI analizi şu an yapılamıyor.", "error");
        } finally {
            setExplainingId(null);
        }
    };

    const handleSaveVitalEntry = async (e) => {
        e.preventDefault();
        try {
            if (editingVitalId) {
                await patientPortalApi.updateVital(editingVitalId, vitalForm);
                showToast("Sağlık verisi güncellendi.", "success");
            } else {
                await patientPortalApi.addVital(vitalForm);
                showToast("Sağlık verisi başarıyla kaydedildi.", "success");
            }
            setShowVitalModal(false);
            setEditingVitalId(null);
            setVitalForm({ type: "blood_pressure", value: "", unit: "mmHg", date: new Date(), notes: "" });
            const vitalsData = await patientPortalApi.getMyVitals();
            setHistoricalVitals(vitalsData);
        } catch (err) {
            showToast(err.message || "İşlem başarısız.", "error");
        }
    };

    const handleDeleteVital = async (id) => {
        if (!window.confirm("Bu veriyi silmek istediğinize emin misiniz?")) return;
        try {
            await patientPortalApi.deleteVital(id);
            showToast("Veri silindi.", "success");
            const vitalsData = await patientPortalApi.getMyVitals();
            setHistoricalVitals(vitalsData);
        } catch (err) {
            showToast("Silme işlemi başarısız.", "error");
        }
    };

    const handleEditVitalClick = (vital) => {
        setEditingVitalId(vital._id);
        setVitalForm({
            type: vital.type,
            value: vital.value,
            unit: vital.unit,
            date: new Date(vital.date),
            notes: vital.notes || ""
        });
        setShowVitalModal(true);
    };

    const handleAnalyzeVitals = async () => {
        if (historicalVitals.length === 0) {
            showToast("Analiz için veri girmeniz gerekmektedir.", "info");
            return;
        }
        setIsAnalyzingVitals(true);
        console.log("Analyzing vitals...", historicalVitals);
        try {
            const res = await patientPortalApi.aiAnalyzeVitals(historicalVitals, {
                age: patientUser?.age,
                chronicDiseases: patientUser?.chronicDiseases
            });
            console.log("Analysis Result:", res);
            setVitalAnalysis(res);
            showToast("Sağlık analizi tamamlandı.", "success");
        } catch (err) {
            console.error("Analysis Error:", err);
            showToast(err.message || "AI analizi şu an yapılamıyor.", "error");
        } finally {
            setIsAnalyzingVitals(false);
        }
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        if (!selectedAppointment) return;

        setIsProcessingPayment(true);
        try {
            await patientPortalApi.processPayment({
                appointmentId: selectedAppointment._id,
                amount: selectedAppointment.fee || 500,
                ...paymentForm
            });
            showToast("Ödeme başarıyla gerçekleşti.", "success");
            setShowPaymentModal(false);
            setPaymentForm({ cardNumber: "", expiry: "", cvc: "" });

            // Refresh data
            const appointmentsRes = await patientPortalApi.getMyAppointments();
            setAppointments(appointmentsRes);
            const paymentsRes = await patientPortalApi.getPaymentHistory();
            setPayments(paymentsRes);
        } catch (err) {
            showToast(err.message || "Ödeme başarısız.", "error");
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const generateInvoicePDF = (payment) => {
        const doc = new jsPDF();

        // Hospital Logo Area
        doc.setFillColor(190, 18, 60);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text("MediTrack HOSPITAL", 20, 25);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Resmi Sağlık Portalı Faturası", 20, 32);

        // Invoice Details
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(12);
        doc.text(`Fatura No: ${payment.transactionId}`, 130, 55);
        doc.text(`Tarih: ${new Date(payment.date).toLocaleDateString()}`, 130, 62);

        doc.setFontSize(16);
        doc.text("Hizmet Alıcısı:", 20, 55);
        doc.setFontSize(12);
        doc.text(`${patientUser?.name}`, 20, 65);
        doc.text(`Email: ${patientUser?.email}`, 20, 72);

        // Table Header
        doc.setFillColor(248, 250, 252);
        doc.rect(20, 85, 170, 10, 'F');
        doc.text("Açıklama", 25, 92);
        doc.text("Miktar", 150, 92);

        // Table Content
        doc.text(`${payment.appointmentId?.type || 'Muayene'} Randevu Ücreti`, 25, 105);
        doc.text(`${payment.amount} TRY`, 150, 105);

        doc.setLineWidth(0.1);
        doc.line(20, 110, 190, 110);

        doc.setFont("helvetica", "bold");
        doc.text("TOPLAM:", 120, 120);
        doc.text(`${payment.amount} TRY`, 150, 120);

        // Footer
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text("Bu belge elektronik olarak oluşturulmuştur ve mali değeri vardır.", 20, 280);

        doc.save(`Fatura_${payment.transactionId}.pdf`);
    };

    const getVitalChartData = (type) => {
        const data = historicalVitals.filter(v => v.type === type);
        if (type === "blood_pressure") {
            return data.map(v => {
                const parts = v.value.split('/');
                const systolic = parseFloat(parts[0]?.trim());
                const diastolic = parseFloat(parts[1]?.trim());
                return {
                    date: new Date(v.date).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: '2-digit', month: '2-digit' }),
                    systolic: systolic || 0,
                    diastolic: diastolic || 0,
                    fullDate: new Date(v.date).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US'),
                };
            }).sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
        }
        return data.map(v => ({
            date: new Date(v.date).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: '2-digit', month: '2-digit' }),
            value: parseFloat(v.value.toString().replace(',', '.')),
            fullDate: new Date(v.date).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US'),
        })).sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
    };

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff1f2" }}>
                <div style={{ width: "48px", height: "48px", border: "4px solid rgba(190, 18, 60, 0.1)", borderTopColor: "#be123c", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
                <style>{"@keyframes spin {to {transform: rotate(360deg); } }"}</style>
            </div>
        );
    }

    const activeAppointments = appointments.filter(a => a.status === "bekliyor");
    const pastAppointments = appointments.filter(a => a.status !== "bekliyor");

    return (
        <div style={{ minHeight: "100vh", background: theme === "light" ? "#fcfaff" : "#0f172a", color: theme === "light" ? "#1e293b" : "#f8fafc", fontFamily: "'Outfit', sans-serif", transition: "all 0.4s ease" }}>
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes slideInRight { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
                    .dashboard-anim { animation: fadeIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
                    
                    .glass-card { 
                        background: ${theme === "light" ? "rgba(255, 255, 255, 0.8)" : "rgba(30, 41, 59, 0.7)"}; 
                        backdrop-filter: blur(12px); 
                        border: 1px solid ${theme === "light" ? "rgba(255, 255, 255, 0.6)" : "rgba(255, 255, 255, 0.05)"}; 
                        box-shadow: ${theme === "light" ? "0 10px 30px -5px rgba(0,0,0,0.03)" : "0 10px 30px -5px rgba(0,0,0,0.25)"};
                        transition: all 0.4s ease;
                    }
                    
                    .nav-blur { 
                        background: ${theme === "light" ? "rgba(255, 255, 255, 0.7)" : "rgba(15, 23, 42, 0.8)"}; 
                        backdrop-filter: blur(20px); 
                        border-bottom: 1px solid ${theme === "light" ? "rgba(190, 18, 60, 0.05)" : "rgba(255, 255, 255, 0.05)"}; 
                        transition: all 0.4s ease;
                    }
                    
                    .vital-input { 
                        background: ${theme === "light" ? "#f8fafc" : "#1e293b"}; 
                        border: 1px solid ${theme === "light" ? "#e2e8f0" : "#334155"}; 
                        color: ${theme === "light" ? "#1e293b" : "#f8fafc"};
                        padding: 8px 12px; borderRadius: 10px; width: 100%; font-family: 'Outfit'; font-weight: 600; outline: none; transition: all 0.2s; 
                    }
                    .vital-input:focus { border-color: #be123c; box-shadow: 0 0 0 3px rgba(190, 18, 60, 0.1); }
                    
                    .theme-toggle {
                        width: 40px; height: 40px; border-radius: 12px; border: 1px solid ${theme === "light" ? "#e2e8f0" : "#334155"};
                        background: ${theme === "light" ? "white" : "#1e293b"}; color: ${theme === "light" ? "#64748b" : "#f1f5f9"};
                        display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                    .theme-toggle:hover { 
                        border-color: #be123c; color: #be123c; transform: rotate(15deg) scale(1.1);
                        box-shadow: 0 0 20px rgba(190, 18, 60, 0.2);
                    }
                `}
            </style>

            {/* Global Toast Notification */}
            {toast.show && (
                <div style={{
                    position: "fixed", bottom: "30px", right: "30px", zIndex: 9999,
                    background: toast.type === "success" ? "linear-gradient(135deg, #16a34a 0%, #15803d 100%)" : "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                    color: "white", padding: "16px 24px", borderRadius: "12px",
                    display: "flex", alignItems: "center", gap: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)",
                    animation: "slideInRight 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards"
                }}>
                    {toast.type === "success" ? <FiUserCheck size={24} /> : <FiXCircle size={24} />}
                    <span style={{ fontWeight: 600, fontSize: "15px" }}>{toast.message}</span>
                </div>
            )}

            {/* HEADER NAV */}
            <nav style={{ padding: "20px 40px", position: "sticky", top: 0, zIndex: 100 }}>
                <div className="nav-blur" style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 24px", borderRadius: "24px",
                    boxShadow: theme === "light" ? "0 10px 40px -10px rgba(0,0,0,0.08)" : "0 10px 40px -10px rgba(0,0,0,0.4)",
                    border: theme === "light" ? "1px solid rgba(255,255,255,0.7)" : "1px solid rgba(255,255,255,0.05)",
                    background: theme === "light" ? "rgba(255, 255, 255, 0.85)" : "rgba(15, 23, 42, 0.85)"
                }}>
                    {/* Brand */}
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{
                            width: "48px", height: "48px", background: "linear-gradient(135deg, #f43f5e 0%, #9f1239 100%)",
                            borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 10px 20px -5px rgba(225, 29, 72, 0.4)", transform: "scale(1)", transition: "transform 0.3s"
                        }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                            <RiHospitalLine style={{ color: "white", fontSize: "24px" }} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "22px", fontWeight: 900, color: theme === "light" ? "#0f172a" : "white", letterSpacing: "-0.5px", lineHeight: "1" }}>
                                Medi<span style={{ color: "#e11d48" }}>Track</span>
                            </span>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", letterSpacing: "1px", textTransform: "uppercase", marginTop: "2px" }}>
                                {lang === 'tr' ? 'Hasta Portalı' : 'Patient Portal'}
                            </span>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", background: theme === "light" ? "rgba(241,245,249,0.5)" : "rgba(30,41,59,0.5)", padding: "6px", borderRadius: "16px", overflowX: "auto", maxWidth: "100%", scrollbarWidth: "none" }}>
                        {[
                            { id: "dashboard", icon: FiActivity, label: "Dashboard" },
                            { id: "analytics", icon: FiPieChart, label: lang === 'tr' ? 'Sağlık Analitik' : 'Health Analytics' },
                            { id: "timeline", icon: FiHeart, label: lang === 'tr' ? 'Sağlık Geçmişi' : 'Health Timeline' },
                            { id: "goals", icon: FiAward, label: lang === 'tr' ? 'Sağlık Hedefleri' : 'Health Goals' },
                            { id: "payments", icon: FiCreditCard, label: lang === 'tr' ? 'Ödemeler' : 'Payments' },
                            { id: "family", icon: FiUsers, label: lang === 'tr' ? 'Ailem' : 'Family' },
                            { id: "calendar", icon: FiCalendar, label: t('smartCalendar') },
                            { id: "medications", icon: FiClock, label: t('medicationTracker') },
                            { id: "diet", icon: FiCoffee, label: lang === 'tr' ? 'Diyet Asistanı' : 'Diet Assistant' },
                            { id: "journal", icon: FiEdit2, label: t('journal') },
                            { id: "pharmacy", icon: FiMapPin, label: lang === 'tr' ? 'Nöbetçi Eczane' : 'Duty Pharmacy' },
                            { id: "health_facilities", icon: FiNavigation, label: lang === 'tr' ? 'En Yakın Sağlık' : 'Nearest Health' },
                            { id: "reports", icon: FiFileText, label: lang === 'tr' ? 'Raporlarım' : 'My Reports' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    padding: "10px 16px", borderRadius: "12px", border: "none",
                                    background: activeTab === tab.id ? "white" : "transparent",
                                    color: activeTab === tab.id ? "#e11d48" : "#64748b",
                                    fontWeight: activeTab === tab.id ? 800 : 600, fontSize: "13px", cursor: "pointer",
                                    boxShadow: activeTab === tab.id ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
                                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", display: "flex", alignItems: "center", gap: activeTab === tab.id ? "8px" : "0px", flexShrink: 0
                                }}
                                onMouseEnter={e => { if(activeTab !== tab.id) e.currentTarget.style.color = theme === "light" ? "#0f172a" : "white" }}
                                onMouseLeave={e => { if(activeTab !== tab.id) e.currentTarget.style.color = "#64748b" }}
                            >
                                <tab.icon size={16} style={{ flexShrink: 0 }} /> 
                                <span style={{ 
                                    maxWidth: activeTab === tab.id ? "150px" : "0px", 
                                    opacity: activeTab === tab.id ? 1 : 0, 
                                    overflow: "hidden", 
                                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                    whiteSpace: "nowrap"
                                }}>
                                    {tab.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Actions & Profile */}
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                            {/* Emergency Card Button */}
                            <button
                                onClick={() => setShowEmergencyCard(true)}
                                className="theme-toggle"
                                style={{ background: "rgba(225, 29, 72, 0.1)", color: "#e11d48", borderColor: "rgba(225, 29, 72, 0.2)" }}
                                title={t('emergencyCard')}
                            >
                                <FiHeart size={18} />
                            </button>

                            {/* Notification Bell */}
                            <div style={{ position: "relative" }}>
                                <button
                                    onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                                    className="theme-toggle"
                                >
                                    <FiBell size={18} />
                                    {notifications.filter(n => !n.isRead).length > 0 && (
                                        <span style={{ position: "absolute", top: "-4px", right: "-4px", width: "16px", height: "16px", background: "#e11d48", color: "white", borderRadius: "50%", fontSize: "9px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${theme === "light" ? "white" : "#1e293b"}` }}>
                                            {notifications.filter(n => !n.isRead).length}
                                        </span>
                                    )}
                                </button>
                                {showNotificationsDropdown && (
                                    <div style={{ position: "absolute", top: "50px", right: 0, width: "320px", background: theme === "light" ? "white" : "#1e293b", borderRadius: "16px", boxShadow: "0 20px 40px -10px rgba(0,0,0,0.2)", border: `1px solid ${theme === "light" ? "#e2e8f0" : "#334155"}`, padding: "16px", zIndex: 1000 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                            <h3 style={{ fontSize: "14px", fontWeight: 800, margin: 0, color: theme === "light" ? "#0f172a" : "white" }}>{t('notifications')}</h3>
                                            {notifications.some(n => !n.isRead) && (
                                                <button
                                                    onClick={handleMarkAllRead}
                                                    style={{ fontSize: "11px", fontWeight: 700, color: "#e11d48", background: "rgba(225,29,72,0.1)", border: "none", borderRadius: "8px", padding: "4px 10px", cursor: "pointer" }}
                                                >
                                                    {lang === 'tr' ? 'Tümünü Okundu İşaretle' : 'Mark All Read'}
                                                </button>
                                            )}
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                            {notifications.length === 0 ? (
                                                <p style={{ fontSize: "12px", color: "#94a3b8", textAlign: "center", padding: "20px 0" }}>{t('noNotifications')}</p>
                                            ) : (
                                                notifications.slice(0, 6).map(n => (
                                                    <div key={n._id} onClick={() => handleMarkAsRead(n._id)} style={{ padding: "12px", borderRadius: "12px", background: n.isRead ? "transparent" : (theme === "light" ? "#fff1f2" : "rgba(225,29,72,0.1)"), cursor: "pointer", borderLeft: n.isRead ? "2px solid transparent" : "2px solid #e11d48", transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = theme === "light" ? "#f8fafc" : "#334155"} onMouseLeave={e => e.currentTarget.style.background = n.isRead ? "transparent" : (theme === "light" ? "#fff1f2" : "rgba(225,29,72,0.1)")}>
                                                        <div style={{ fontSize: "13px", fontWeight: 700, color: theme === "light" ? "#1e293b" : "white", marginBottom: "4px" }}>{n.title}</div>
                                                        <div style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>{n.message}</div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Settings Button */}
                            <button onClick={() => setShowSettings(true)} className="theme-toggle" title={t('settings')}>
                                <FiSettings size={18} />
                            </button>

                            <button onClick={toggleLanguage} className="theme-toggle" title="Dil / Language" style={{ fontWeight: 800, fontSize: "12px" }}>
                                {lang.toUpperCase()}
                            </button>

                            <button onClick={toggleTheme} className="theme-toggle" title={theme === "light" ? t('themeDark') : t('themeLight')}>
                                {theme === "light" ? <FiMoon size={18} /> : <FiSun size={18} />}
                            </button>
                        </div>

                        {/* Profile Pill */}
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "6px 16px 6px 6px", background: theme === "light" ? "rgba(241,245,249,0.8)" : "rgba(30,41,59,0.8)", borderRadius: "100px", border: `1px solid ${theme === "light" ? "#e2e8f0" : "#334155"}` }}>
                            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #f43f5e 0%, #9f1239 100%)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "15px", boxShadow: "0 4px 10px rgba(225, 29, 72, 0.3)" }}>
                                {patientUser?.name?.charAt(0) || "?"}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontSize: "13px", fontWeight: 800, color: theme === "light" ? "#0f172a" : "white", lineHeight: "1.2" }}>{patientUser?.name?.split(" ")[0]}</span>
                                <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{t('patientAccount')}</span>
                            </div>
                        </div>

                        {/* Logout */}
                        <button onClick={handleLogout} style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(226, 232, 240, 0.3)", color: "#64748b", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.3s" }} onMouseEnter={e => { e.currentTarget.style.background = "#fff1f2"; e.currentTarget.style.color = "#e11d48"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(226, 232, 240, 0.3)"; e.currentTarget.style.color = "#64748b"; }} title={t('logout')}>
                            <FiLogOut size={18} />
                        </button>
                    </div>
                </div>
            </nav>

            <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "40px 40px" }}>


                {/* HEALTH ANALYTICS TAB */}
                {activeTab === "analytics" && (
                    <HealthAnalytics
                        historicalVitals={historicalVitals}
                        labResults={labResults}
                        appointments={appointments}
                        prescriptions={prescriptions}
                        patientUser={patientUser}
                        theme={theme}
                        lang={lang}
                        onRefreshVitals={async () => {
                            const vitalsData = await patientPortalApi.getMyVitals();
                            setHistoricalVitals(vitalsData);
                        }}
                    />
                )}

                {/* HEALTH TIMELINE TAB */}
                {activeTab === "timeline" && (
                    <HealthTimeline
                        appointments={appointments}
                        prescriptions={prescriptions}
                        labResults={labResults}
                        radiology={radiology}
                        medicalReports={medicalReports}
                        procedures={procedures}
                        historicalVitals={historicalVitals}
                        theme={theme}
                        lang={lang}
                    />
                )}
                {/* HEALTH GOALS TAB */}
                {activeTab === "goals" && (
                    <HealthGoals
                        theme={theme}
                        lang={lang}
                    />
                )}
                {activeTab === "calendar" && (() => {

                    const daysInMonth = getDaysInMonth(calendarDate.getFullYear(), calendarDate.getMonth());
                    const firstDay = getFirstDayOfMonth(calendarDate.getFullYear(), calendarDate.getMonth());
                    const events = getCalendarEvents(calendarDate);

                    const dayLabels = [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')];
                    const monthLabel = t(Object.keys(translations.en).find(k => k === ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'][calendarDate.getMonth()]));
                    const isTodayMonth = new Date().getFullYear() === calendarDate.getFullYear() && new Date().getMonth() === calendarDate.getMonth();

                    return (
                        <div className="tab-content" style={{ animation: "fadeIn 0.5s ease" }}>
                            <div style={{
                                padding: "40px", borderRadius: "32px", background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                                color: "white", marginBottom: "32px", position: "relative", overflow: "hidden",
                                boxShadow: "0 20px 40px -10px rgba(15, 23, 42, 0.3)"
                            }}>
                                <div style={{ position: "absolute", top: "-20%", right: "-10%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(225,29,72,0.1) 0%, transparent 70%)", borderRadius: "50%" }}></div>
                                <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", background: "rgba(255,255,255,0.1)", width: "fit-content", padding: "6px 14px", borderRadius: "100px" }}>
                                            <FiCalendar size={14} /> <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>{t('smartCalendar')}</span>
                                        </div>
                                        <h1 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "8px" }}>{t('calendarTitle')}</h1>
                                        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px" }}>{t('calendarDesc')}</p>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "20px", background: "rgba(255,255,255,0.05)", padding: "12px 24px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)" }}>
                                        <button onClick={handlePrevMonth} style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "20px" }}><FiChevronRight style={{ transform: "rotate(180deg)" }} /></button>
                                        <span style={{ fontSize: "20px", fontWeight: 800, minWidth: "140px", textAlign: "center" }}>{monthLabel} {calendarDate.getFullYear()}</span>
                                        <button onClick={handleNextMonth} style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "20px" }}><FiChevronRight /></button>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "20px", marginTop: "24px", padding: "16px 24px", background: "rgba(255,255,255,0.05)", borderRadius: "16px", width: "fit-content", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.05)", zIndex: 1, position: "relative" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600 }}>
                                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#be123c", boxShadow: "0 0 10px rgba(190, 18, 60, 0.4)" }}></div>
                                        {lang === 'tr' ? 'Randevular' : 'Appointments'}
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600 }}>
                                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#2563eb", boxShadow: "0 0 10px rgba(37, 99, 235, 0.4)" }}></div>
                                        {lang === 'tr' ? 'Laboratuvar' : 'Labs'}
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600 }}>
                                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 10px rgba(16, 185, 129, 0.4)" }}></div>
                                        {lang === 'tr' ? 'İlaçlar' : 'Medications'}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "32px", alignItems: "start" }}>
                                {/* CALENDAR GRID */}
                                <div className="glass-card" style={{ padding: "32px", borderRadius: "32px", background: theme === "light" ? "white" : "rgba(255,255,255,0.02)" }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "10px", marginBottom: "20px" }}>
                                        {dayLabels.map(label => (
                                            <div key={label} style={{ textAlign: "center", fontSize: "12px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", paddingBottom: "10px" }}>{label}</div>
                                        ))}
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "10px" }}>
                                        {Array.from({ length: firstDay }).map((_, i) => (
                                            <div key={`empty-${i}`} style={{ height: "100px" }}></div>
                                        ))}
                                        {Array.from({ length: daysInMonth }).map((_, i) => {
                                            const day = i + 1;
                                            const dayEvents = events[day] || [];
                                            const isToday = new Date().toDateString() === new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day).toDateString();
                                            const isSelected = selectedDay === day;

                                            return (
                                                <div
                                                    key={day}
                                                    title={dayEvents.length > 0 ? `${dayEvents.length} ${lang === 'tr' ? 'etkinlik' : 'events'}` : ''}
                                                    onClick={() => setSelectedDay(day)}
                                                    style={{
                                                        height: "100px", padding: "12px", borderRadius: "20px", cursor: "pointer",
                                                        border: `2px solid ${isSelected ? "#be123c" : (isToday ? "rgba(190, 18, 60, 0.2)" : "transparent")}`,
                                                        background: isToday ? "rgba(190, 18, 60, 0.05)" : (theme === "light" ? "#f8fafc" : "rgba(255,255,255,0.03)"),
                                                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                                        position: "relative"
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
                                                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                                                >
                                                    <span style={{ fontSize: "16px", fontWeight: 800, color: isToday ? "#be123c" : (theme === "light" ? "#1e293b" : "white") }}>{day}</span>
                                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "8px" }}>
                                                        {dayEvents.map((ev, idx) => (
                                                            <div
                                                                key={idx}
                                                                style={{
                                                                    width: "8px", height: "8px", borderRadius: "50%",
                                                                    background: ev.type === 'appointment' ? '#be123c' : (ev.type === 'lab' ? '#2563eb' : '#10b981'),
                                                                    boxShadow: `0 0 10px ${ev.type === 'appointment' ? 'rgba(190, 18, 60, 0.4)' : (ev.type === 'lab' ? 'rgba(37, 99, 235, 0.4)' : 'rgba(16, 185, 129, 0.4)')}`
                                                                }}
                                                            ></div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* DAY DETAILS SIDEBAR */}
                                <div style={{ position: "sticky", top: "100px" }}>
                                    <div className="glass-card" style={{ padding: "32px", borderRadius: "32px", border: "1px solid #e11d48", boxShadow: "0 20px 40px -10px rgba(190, 18, 60, 0.1)" }}>
                                        <h3 style={{ fontSize: "20px", fontWeight: 800, color: theme === "light" ? "#1e293b" : "white", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
                                            <FiActivity style={{ color: "#be123c" }} /> {t('dayDetails')}
                                        </h3>
                                        {selectedDay || (isTodayMonth ? new Date().getDate() : null) ? (() => {
                                            const activeDay = selectedDay || (isTodayMonth ? new Date().getDate() : null);
                                            const activeEvents = events[activeDay] || [];
                                            const isDefaultToday = !selectedDay && isTodayMonth;

                                            return (
                                                <div style={{ display: "flex", flexDirection: "column", gap: "16px", animation: "fadeIn 0.3s ease" }}>
                                                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#be123c", textTransform: "uppercase", marginBottom: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                        <span>{activeDay} {monthLabel}</span>
                                                        {isDefaultToday && <span style={{ background: "rgba(190,18,60,0.1)", padding: "4px 8px", borderRadius: "8px", fontSize: "11px" }}>{t('today')}</span>}
                                                    </div>
                                                    {activeEvents.length > 0 ? (
                                                        activeEvents.map((ev, idx) => (
                                                            <div key={idx} style={{ padding: "16px", borderRadius: "16px", background: theme === "light" ? "#f8fafc" : "rgba(255,255,255,0.03)", border: "1px solid rgba(0,0,0,0.05)", transition: "transform 0.2s", cursor: "default" }} onMouseEnter={e => e.currentTarget.style.transform = "translateX(5px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateX(0)"}>
                                                                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                                                                    {ev.type === 'appointment' ? <FiCalendar color="#be123c" /> : (ev.type === 'lab' ? <FiActivity color="#2563eb" /> : <FiClock color="#10b981" />)}
                                                                    <span style={{ fontSize: "13px", fontWeight: 800, color: theme === "light" ? "#1e293b" : "white" }}>
                                                                        {ev.type === 'appointment' ? (lang === 'tr' ? 'Randevu' : 'Appointment') : (ev.type === 'lab' ? (lang === 'tr' ? 'Laboratuvar' : 'Lab Result') : (lang === 'tr' ? 'İlaç' : 'Medication'))}
                                                                    </span>
                                                                </div>
                                                                <div style={{ fontSize: "14px", color: "#64748b", fontWeight: 600 }}>{ev.type === 'med' ? ev.name : (ev.type === 'appointment' ? ev.data.doctorId?.name : ev.data.testName)}</div>
                                                                {ev.type === 'appointment' && <div style={{ fontSize: "12px", color: "#be123c", fontWeight: 700, marginTop: "4px" }}>{ev.data.time}</div>}
                                                                {ev.type === 'med' && (
                                                                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
                                                                        <span style={{ fontSize: "12px", color: "#10b981", fontWeight: 700 }}>{ev.freq}</span>
                                                                        {ev.isPersonal && (
                                                                            <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", fontWeight: 800 }}>
                                                                                {lang === 'tr' ? 'Kişisel' : 'Personal'}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div style={{ textAlign: "center", padding: "30px 0" }}>
                                                            <FiCalendar size={32} color={theme === "light" ? "#cbd5e1" : "#334155"} style={{ marginBottom: "12px" }} />
                                                            <p style={{ color: "#64748b", fontSize: "14px", fontWeight: 600 }}>{t('noEvents')}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })() : (
                                            <div style={{ textAlign: "center", padding: "40px 0" }}>
                                                <FiActivity size={40} color={theme === "light" ? "#cbd5e1" : "#334155"} style={{ marginBottom: "16px", opacity: 0.5 }} />
                                                <p style={{ color: "#64748b", fontSize: "14px", fontStyle: "italic", lineHeight: "1.6" }}>
                                                    {lang === 'tr' ? 'Detayları görmek için takvimden bir gün seçin.' : 'Select a day from the calendar to see details.'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {activeTab === "medications" && (
                    <div className="tab-content" style={{ animation: "fadeIn 0.5s ease" }}>
                        <div style={{
                            padding: "40px", borderRadius: "32px", background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                            color: "white", marginBottom: "32px", position: "relative", overflow: "hidden",
                            boxShadow: "0 20px 40px -10px rgba(15, 23, 42, 0.3)"
                        }}>
                            <div style={{ position: "absolute", top: "-20%", right: "-10%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(225,29,72,0.1) 0%, transparent 70%)", borderRadius: "50%" }}></div>
                            <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", background: "rgba(255,255,255,0.1)", width: "fit-content", padding: "6px 14px", borderRadius: "100px" }}>
                                        <FiClock size={14} /> <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>{t('medicationTracker')}</span>
                                    </div>
                                    <h1 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "8px" }}>{t('todayMedications')}</h1>
                                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px" }}>{new Date().toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: "48px", fontWeight: 800, color: "#fb7185", lineHeight: 1 }}>
                                        {todayDoses.length > 0 ? Math.round((todayDoses.filter(d => d.taken).length / todayDoses.length) * 100) : 0}%
                                    </div>
                                    <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", marginTop: "4px" }}>{t('medProgress')}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                            <h2 style={{ fontSize: "20px", fontWeight: 800, color: theme === "light" ? "#1e293b" : "white", margin: 0 }}>
                                {lang === "tr" ? "Bugünkü İlaç Programı" : "Today's Medication Program"}
                            </h2>
                            <button
                                onClick={() => setShowAddMedModal(true)}
                                style={{
                                    padding: "12px 24px",
                                    borderRadius: "14px",
                                    border: "none",
                                    background: "linear-gradient(135deg, #fb7185 0%, #be123c 100%)",
                                    color: "white",
                                    fontWeight: 700,
                                    fontSize: "14px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    boxShadow: "0 10px 20px -5px rgba(225, 29, 72, 0.4)",
                                    transition: "all 0.3s ease"
                                }}
                            >
                                <FiPlus size={16} /> {t('addPersonalMedication')}
                            </button>
                        </div>

                        {loadingMedications ? (
                            <div style={{ textAlign: "center", padding: "100px" }}>
                                <div className="spinner" style={{ margin: "0 auto 20px" }}></div>
                                <p style={{ color: "#64748b" }}>{t('loading')}</p>
                            </div>
                        ) : todayDoses.length === 0 ? (
                            <div className="glass-card" style={{ padding: "80px", textAlign: "center", borderRadius: "32px" }}>
                                <div style={{ width: "80px", height: "80px", background: "#f1f5f9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                                    <FiCheckCircle size={40} color="#94a3b8" />
                                </div>
                                <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#1e293b", marginBottom: "8px" }}>{t('noMedications')}</h3>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                {todayDoses.map((dose, idx) => (
                                    <div key={idx} className="glass-card medicine-card" style={{
                                        padding: "24px 32px", borderRadius: "24px", display: "flex", alignItems: "center", justifyContent: "space-between",
                                        background: dose.taken ? "rgba(16, 185, 129, 0.05)" : (theme === "light" ? "white" : "rgba(255,255,255,0.03)"),
                                        border: `1px solid ${dose.taken ? "#10b981" : (theme === "light" ? "#f1f5f9" : "rgba(255,255,255,0.05)")}`,
                                        transition: "all 0.3s ease"
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                                            <div style={{
                                                width: "56px", height: "56px", borderRadius: "16px",
                                                background: dose.taken ? "#10b981" : "#f1f5f9",
                                                color: dose.taken ? "white" : "#64748b",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: "20px", fontWeight: 800, boxShadow: dose.taken ? "0 8px 16px rgba(16, 185, 129, 0.2)" : "none"
                                            }}>
                                                {dose.timeSlot}
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: "18px", fontWeight: 800, color: theme === "light" ? "#1e293b" : "white", marginBottom: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
                                                    {dose.medicationName}
                                                    {dose.isSelfEntered && (
                                                        <span style={{
                                                            fontSize: "11px",
                                                            fontWeight: 700,
                                                            padding: "3px 8px",
                                                            borderRadius: "6px",
                                                            background: "rgba(251, 113, 133, 0.15)",
                                                            color: "#fb7185",
                                                            textTransform: "uppercase",
                                                            letterSpacing: "0.5px"
                                                        }}>
                                                            {t('personalMedication')}
                                                        </span>
                                                    )}
                                                </h3>
                                                <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "#64748b", fontWeight: 500 }}>
                                                    <span><strong style={{ color: "#be123c" }}>{t('dosage')}</strong> {dose.dosage}</span>
                                                    <span><strong style={{ color: "#be123c" }}>{t('prescribedBy')}</strong> {dose.isSelfEntered ? (lang === "tr" ? "Kendi Eklemeniz" : "Self-entered") : dose.doctorName}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleToggleMedication(dose)}
                                            style={{
                                                padding: "12px 24px", borderRadius: "12px", border: "none",
                                                background: dose.taken ? "#10b981" : "#f1f5f9",
                                                color: dose.taken ? "white" : "#1e293b",
                                                fontWeight: 800, fontSize: "14px", cursor: "pointer",
                                                display: "flex", alignItems: "center", gap: "10px",
                                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                                            }}
                                        >
                                            {dose.taken ? <><FiCheckCircle /> {t('medTaskTaken')}</> : <><FiClock /> {t('medTaskSkip')}</>}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Personal Medications Management Section */}
                        {selfMedsList.length > 0 && (
                            <div style={{ marginTop: "48px" }}>
                                <div style={{ borderBottom: `1px solid ${theme === "light" ? "#f1f5f9" : "rgba(255,255,255,0.05)"}`, paddingBottom: "16px", marginBottom: "24px" }}>
                                    <h2 style={{ fontSize: "20px", fontWeight: 800, color: theme === "light" ? "#1e293b" : "white", display: "flex", alignItems: "center", gap: "10px" }}>
                                        <FiClock /> {t('myPersonalMeds')}
                                    </h2>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
                                    {selfMedsList.map((med) => (
                                        <div key={med._id} className="glass-card" style={{
                                            padding: "24px",
                                            borderRadius: "24px",
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "space-between",
                                            background: theme === "light" ? "white" : "rgba(255,255,255,0.02)",
                                            border: `1px solid ${theme === "light" ? "#f1f5f9" : "rgba(255,255,255,0.05)"}`
                                        }}>
                                            <div>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                                    <h3 style={{ fontSize: "18px", fontWeight: 800, color: theme === "light" ? "#1e293b" : "white" }}>{med.name}</h3>
                                                    <button
                                                        onClick={() => handleDeleteSelfMedication(med._id)}
                                                        style={{
                                                            border: "none",
                                                            background: "none",
                                                            color: "#ef4444",
                                                            cursor: "pointer",
                                                            padding: "6px",
                                                            borderRadius: "8px",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            transition: "all 0.2s ease"
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                                                    >
                                                        <FiTrash2 size={16} />
                                                    </button>
                                                </div>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#64748b" }}>
                                                    <div><strong>{t('dosage')}</strong> {med.dosage}</div>
                                                    <div><strong>{t('medFrequency')}:</strong> {med.frequency}</div>
                                                    <div>
                                                        <strong>{lang === "tr" ? "Süreç:" : "Duration:"}</strong>{" "}
                                                        {new Date(med.startDate || med.createdAt).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US")}{" "}
                                                        -{" "}
                                                        {med.endDate 
                                                            ? new Date(med.endDate).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US") 
                                                            : (lang === "tr" ? "Süresiz" : "Indefinite")}
                                                    </div>
                                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                                                        {med.timeSlots.map((ts, idx) => (
                                                            <span key={idx} style={{
                                                                fontSize: "11px",
                                                                fontWeight: 700,
                                                                padding: "3px 8px",
                                                                borderRadius: "6px",
                                                                background: theme === "light" ? "#f1f5f9" : "rgba(255,255,255,0.05)",
                                                                color: theme === "light" ? "#475569" : "#94a3b8"
                                                            }}>
                                                                {ts}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "payments" && (
                    <div className="dashboard-anim">
                        <div style={{ marginBottom: "32px" }}>
                            <h1 style={{ fontSize: "32px", fontWeight: 800, color: theme === "light" ? "#1e293b" : "white", marginBottom: "8px" }}>{lang === 'tr' ? 'Ödeme Yönetimi' : 'Payment Management'}</h1>
                            <p style={{ color: "#64748b" }}>{lang === 'tr' ? 'Randevu ödemelerinizi yapın ve geçmiş faturalarınızı yönetin.' : 'Make appointment payments and manage your past invoices.'}</p>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
                            {/* Pending Payments */}
                            <div className="glass-card" style={{ padding: "32px", borderRadius: "32px" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "24px", color: "#be123c", display: "flex", alignItems: "center", gap: "10px" }}>
                                    <FiClock /> {lang === 'tr' ? 'Bekleyen Ödemeler' : 'Pending Payments'}
                                </h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                    {appointments.filter(a => a.paymentStatus === "unpaid" && a.status !== "iptal").length === 0 ? (
                                        <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                                            <FiCheckCircle size={40} style={{ marginBottom: "12px", opacity: 0.3 }} />
                                            <p>{lang === 'tr' ? 'Ödenmemiş randevunuz bulunmuyor.' : 'No unpaid appointments found.'}</p>
                                        </div>
                                    ) : (
                                        appointments.filter(a => a.paymentStatus === "unpaid" && a.status !== "iptal").map(appt => (
                                            <div key={appt._id} style={{ padding: "20px", borderRadius: "20px", background: theme === "light" ? "#f8fafc" : "rgba(255,255,255,0.03)", border: "1px solid rgba(0,0,0,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: "15px" }}>{appt.type} Randevusu</div>
                                                    <div style={{ fontSize: "13px", color: "#64748b" }}>{new Date(appt.date).toLocaleDateString()} - {appt.time}</div>
                                                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#be123c", marginTop: "4px" }}>{appt.fee || 500} TRY</div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setSelectedAppointment(appt);
                                                        setShowPaymentModal(true);
                                                    }}
                                                    style={{ padding: "10px 20px", borderRadius: "12px", background: "#be123c", color: "white", border: "none", fontWeight: 700, cursor: "pointer" }}
                                                >
                                                    {lang === 'tr' ? 'Öde' : 'Pay'}
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Payment History */}
                            <div className="glass-card" style={{ padding: "32px", borderRadius: "32px" }}>
                                <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "24px", color: "#1e293b", display: "flex", alignItems: "center", gap: "10px" }}>
                                    <FiFileText /> {lang === 'tr' ? 'Ödeme Geçmişi' : 'Payment History'}
                                </h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                    {payments.length === 0 ? (
                                        <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                                            <p>{lang === 'tr' ? 'Henüz ödeme kaydınız bulunmuyor.' : 'No payment records yet.'}</p>
                                        </div>
                                    ) : (
                                        payments.map(pay => (
                                            <div key={pay._id} style={{ padding: "20px", borderRadius: "20px", background: theme === "light" ? "white" : "rgba(255,255,255,0.02)", border: "1px solid rgba(0,0,0,0.03)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: "14px" }}>{pay.transactionId}</div>
                                                    <div style={{ fontSize: "12px", color: "#94a3b8" }}>{new Date(pay.date).toLocaleDateString()} • {pay.paymentMethod}</div>
                                                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#16a34a" }}>{pay.amount} TRY - Başarılı</div>
                                                </div>
                                                <button
                                                    onClick={() => generateInvoicePDF(pay)}
                                                    style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#f1f5f9", border: "none", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                                                    title="Fatura İndir"
                                                >
                                                    <FiDownload size={18} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "family" && (
                    <div style={{ padding: "32px", animation: "fadeIn 0.5s ease" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                            <div>
                                <h1 style={{ fontSize: "32px", fontWeight: 800, color: theme === "light" ? "#0f172a" : "white", marginBottom: "8px", letterSpacing: "-1px" }}>{lang === "tr" ? "Aile Portalı" : "Family Portal"}</h1>
                                <p style={{ color: "#64748b", fontSize: "16px" }}>{lang === "tr" ? "Sevdiklerinizin sağlığını tek merkezden yönetin." : "Manage your loved ones' health from a single center."}</p>
                            </div>
                            <button
                                onClick={handleOpenFamilyModal}
                                style={{ padding: "14px 28px", background: "linear-gradient(135deg, #fb7185 0%, #e11d48 100%)", color: "white", borderRadius: "16px", border: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", boxShadow: "0 10px 25px -5px rgba(225, 29, 72, 0.4)", transition: "all 0.3s" }}
                                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                            >
                                <FiUserPlus size={20} /> {lang === "tr" ? "Yeni Üye Ekle" : "Add New Member"}
                            </button>
                        </div>

                        {/* FAMILY HEALTH SUMMARY */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "40px" }}>
                            <div className="glass-card" style={{ padding: "24px", borderRadius: "24px", background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", border: "1px solid #bbf7d0" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                                    <div style={{ width: "40px", height: "40px", background: "#16a34a", color: "white", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}><FiUsers size={20} /></div>
                                    <span style={{ fontWeight: 800, color: "#166534", fontSize: "14px", textTransform: "uppercase" }}>{lang === "tr" ? "TOPLAM ÜYE" : "TOTAL MEMBERS"}</span>
                                </div>
                                <div style={{ fontSize: "32px", fontWeight: 800, color: "#166534" }}>{familyMembers.length + 1}</div>
                                <div style={{ fontSize: "13px", color: "#16a34a", fontWeight: 600, marginTop: "4px" }}>{lang === "tr" ? "Siz dahil" : "Including you"}</div>
                            </div>
                            <div className="glass-card" style={{ padding: "24px", borderRadius: "24px", background: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)", border: "1px solid #fecdd3" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                                    <div style={{ width: "40px", height: "40px", background: "#e11d48", color: "white", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}><FiCalendar size={20} /></div>
                                    <span style={{ fontWeight: 800, color: "#9f1239", fontSize: "14px", textTransform: "uppercase" }}>{lang === "tr" ? "RANDEVULAR" : "APPOINTMENTS"}</span>
                                </div>
                                <div style={{ fontSize: "32px", fontWeight: 800, color: "#9f1239" }}>{appointments.length}</div>
                                <div style={{ fontSize: "13px", color: "#e11d48", fontWeight: 600, marginTop: "4px" }}>{lang === "tr" ? "Tüm aile için" : "For whole family"}</div>
                            </div>
                            <div className="glass-card" style={{ padding: "24px", borderRadius: "24px", background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", border: "1px solid #bfdbfe" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                                    <div style={{ width: "40px", height: "40px", background: "#2563eb", color: "white", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}><FiActivity size={20} /></div>
                                    <span style={{ fontWeight: 800, color: "#1e40af", fontSize: "14px", textTransform: "uppercase" }}>{lang === "tr" ? "SAĞLIK PUANI" : "HEALTH SCORE"}</span>
                                </div>
                                <div style={{ fontSize: "32px", fontWeight: 800, color: "#1e40af" }}>88/100</div>
                                <div style={{ fontSize: "13px", color: "#2563eb", fontWeight: 600, marginTop: "4px" }}>{lang === "tr" ? "Aile ortalaması" : "Family average"}</div>
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
                            {/* SELF CARD */}
                            <div className="glass-card dashboard-anim" style={{ background: theme === "light" ? "white" : "#1e293b", padding: "28px", borderRadius: "28px", border: "1px solid #be123c", boxShadow: "0 10px 30px rgba(190, 18, 60, 0.05)", position: "relative" }}>
                                <div style={{ position: "absolute", top: "20px", right: "20px", display: "flex", gap: "8px" }}>
                                    <span style={{ padding: "4px 12px", background: "#be123c", color: "white", borderRadius: "100px", fontSize: "11px", fontWeight: 800 }}>{lang === "tr" ? "SİZ" : "YOU"}</span>
                                </div>
                                <div style={{ width: "70px", height: "70px", background: "linear-gradient(135deg, #4c0519 0%, #be123c 100%)", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", color: "white", fontWeight: 800, marginBottom: "20px", boxShadow: "0 8px 16px rgba(190, 18, 60, 0.2)" }}>
                                    {patientUser?.name?.charAt(0)}
                                </div>
                                <h3 style={{ fontSize: "20px", fontWeight: 800, color: theme === "light" ? "#0f172a" : "white", marginBottom: "4px" }}>{patientUser?.name}</h3>
                                <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>{patientUser?.email}</p>
                                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "24px" }}>
                                    <div style={{ padding: "6px 14px", background: "#f8fafc", borderRadius: "10px", fontSize: "12px", fontWeight: 700, color: "#475569", border: "1px solid #f1f5f9" }}>{patientUser?.age} {lang === "tr" ? "Yaş" : "Years"}</div>
                                    <div style={{ padding: "6px 14px", background: "#f8fafc", borderRadius: "10px", fontSize: "12px", fontWeight: 700, color: "#475569", border: "1px solid #f1f5f9" }}>{patientUser?.bloodType}</div>
                                </div>
                                <button
                                    onClick={() => setShowSettings(true)}
                                    style={{ width: "100%", padding: "12px", borderRadius: "14px", border: "2px solid #be123c", background: "none", color: "#be123c", fontWeight: 800, fontSize: "14px", cursor: "pointer", transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                                >
                                    <FiEdit2 size={16} /> {lang === "tr" ? "Profilimi Düzenle" : "Edit My Profile"}
                                </button>
                            </div>

                            {familyMembers.length === 0 ? (
                                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "80px", background: "rgba(190, 18, 60, 0.02)", borderRadius: "32px", border: "2px dashed #fecdd3" }}>
                                    <div style={{ width: "100px", height: "100px", background: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: "0 15px 35px rgba(0,0,0,0.05)" }}>
                                        <FiUsers style={{ fontSize: "40px", color: "#be123c", opacity: 0.3 }} />
                                    </div>
                                    <h3 style={{ fontSize: "20px", color: "#1e293b", fontWeight: 800, marginBottom: "12px" }}>{lang === "tr" ? "Henüz aile üyesi yok" : "No family members yet"}</h3>
                                    <p style={{ color: "#64748b", maxWidth: "350px", margin: "0 auto 32px", lineHeight: "1.6" }}>{lang === "tr" ? "Çocuklarınızı, eşinizi veya diğer aile bireylerini ekleyerek onların sağlık süreçlerini de takip edebilirsiniz." : "You can track their health processes by adding your children, spouse or other family members."}</p>
                                    <button onClick={handleOpenFamilyModal} style={{ padding: "12px 32px", background: "#be123c", color: "white", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "pointer" }}>{lang === "tr" ? "İlk Üyeyi Ekle" : "Add First Member"}</button>
                                </div>
                            ) : (
                                familyMembers.map(member => (
                                    <div key={member._id} className="glass-card dashboard-anim" style={{ background: theme === "light" ? "white" : "#1e293b", padding: "28px", borderRadius: "28px", border: "1px solid rgba(0,0,0,0.05)", position: "relative", transition: "all 0.3s" }}>
                                        <div style={{ position: "absolute", top: "20px", right: "20px", display: "flex", gap: "8px" }}>
                                            <span style={{ padding: "4px 12px", background: "#f1f5f9", color: "#475569", borderRadius: "100px", fontSize: "11px", fontWeight: 800, textTransform: "uppercase" }}>{member.relationship || "Other"}</span>
                                        </div>
                                        <div style={{ width: "70px", height: "70px", background: "#fff1f2", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", color: "#be123c", fontWeight: 800, marginBottom: "20px" }}>
                                            {member.name.charAt(0)}
                                        </div>
                                        <h3 style={{ fontSize: "20px", fontWeight: 800, color: theme === "light" ? "#0f172a" : "white", marginBottom: "4px" }}>{member.name}</h3>
                                        <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "16px" }}>TC: {member.tc}</p>
                                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "24px" }}>
                                            <div style={{ padding: "6px 14px", background: "#f8fafc", borderRadius: "10px", fontSize: "12px", fontWeight: 700, color: "#475569", border: "1px solid #f1f5f9" }}>{member.age} {lang === "tr" ? "Yaş" : "Years"}</div>
                                            <div style={{ padding: "6px 14px", background: "#f8fafc", borderRadius: "10px", fontSize: "12px", fontWeight: 700, color: "#475569", border: "1px solid #f1f5f9" }}>{member.gender}</div>
                                            <div style={{ padding: "6px 14px", background: "#f8fafc", borderRadius: "10px", fontSize: "12px", fontWeight: 700, color: "#475569", border: "1px solid #f1f5f9" }}>{member.bloodType}</div>
                                        </div>
                                        <div style={{ display: "flex", gap: "12px" }}>
                                            <button
                                                onClick={() => handleEditFamilyMember(member)}
                                                style={{ flex: 1, padding: "10px", borderRadius: "12px", background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0", fontWeight: 700, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                                            >
                                                <FiEdit2 size={14} /> {lang === "tr" ? "Düzenle" : "Edit"}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteFamilyMember(member._id)}
                                                style={{ padding: "10px", borderRadius: "12px", background: "#fff1f2", color: "#e11d48", border: "1px solid #fecdd3", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                                            >
                                                <FiTrash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* ===== REPORTS TAB ===== */}
                {activeTab === "reports" && (
                    <div style={{ animation: "fadeIn 0.5s ease" }}>
                        {/* Hero Header */}
                        <div style={{ padding: "40px", borderRadius: "28px", background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", color: "white", marginBottom: "32px", position: "relative", overflow: "hidden", boxShadow: "0 20px 40px -10px rgba(15,23,42,0.3)" }}>
                            <div style={{ position: "absolute", top: "-20%", right: "-5%", width: "350px", height: "350px", background: "radial-gradient(circle, rgba(190,18,60,0.12) 0%, transparent 70%)", borderRadius: "50%" }} />
                            <div style={{ position: "relative", zIndex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", background: "rgba(255,255,255,0.1)", width: "fit-content", padding: "6px 16px", borderRadius: "100px" }}>
                                    <FiFileText size={14} /><span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase" }}>{lang === "tr" ? "Tıbbi Belgeler" : "Medical Documents"}</span>
                                </div>
                                <h1 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "8px" }}>{lang === "tr" ? "Raporlarım" : "My Reports"}</h1>
                                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px" }}>{lang === "tr" ? "Doktorlarınız tarafından oluşturulan radyoloji sonuçları ve tıbbi raporlarınız." : "Radiology results and medical reports created by your doctors."}</p>
                                <div style={{ display: "flex", gap: "16px", marginTop: "20px" }}>
                                    <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "14px", padding: "10px 20px", display: "flex", alignItems: "center", gap: "10px", border: "1px solid rgba(255,255,255,0.1)" }}>
                                        <FiActivity size={18} color="#be123c" />
                                        <div><div style={{ fontSize: "20px", fontWeight: 800 }}>{radiology.length}</div><div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>{lang === "tr" ? "RADYOLOJİ" : "RADIOLOGY"}</div></div>
                                    </div>
                                    <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "14px", padding: "10px 20px", display: "flex", alignItems: "center", gap: "10px", border: "1px solid rgba(255,255,255,0.1)" }}>
                                        <FiFileText size={18} color="#3b82f6" />
                                        <div><div style={{ fontSize: "20px", fontWeight: 800 }}>{medicalReports.length}</div><div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>{lang === "tr" ? "TIBBİ RAPOR" : "MED. REPORTS"}</div></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Radiology Results */}
                        <div className="glass-card" style={{ padding: "32px", borderRadius: "24px", marginBottom: "32px" }}>
                            <h2 style={{ fontSize: "20px", fontWeight: 800, color: theme === "light" ? "#1e293b" : "white", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #fecdd3, #fee2e2)", display: "flex", alignItems: "center", justifyContent: "center" }}><FiActivity size={18} color="#be123c" /></span>
                                {lang === "tr" ? "Radyoloji Sonuçları" : "Radiology Results"}
                                <span style={{ marginLeft: "auto", fontSize: "13px", fontWeight: 700, color: "#be123c", background: "rgba(190,18,60,0.08)", padding: "4px 12px", borderRadius: "100px" }}>{radiology.length} {lang === "tr" ? "kayıt" : "records"}</span>
                            </h2>
                            {radiology.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>
                                    <FiActivity size={40} style={{ marginBottom: "16px", opacity: 0.3 }} />
                                    <p style={{ fontSize: "15px", fontWeight: 600 }}>{lang === "tr" ? "Henüz radyoloji kaydı bulunmuyor." : "No radiology records yet."}</p>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                    {radiology.map(r => (
                                        <div key={r._id} style={{ padding: "20px 24px", borderRadius: "16px", background: theme === "light" ? "#f8fafc" : "rgba(255,255,255,0.03)", border: `1px solid ${r.status === "anormal" ? "rgba(220,38,38,0.2)" : "rgba(0,0,0,0.05)"}`, display: "grid", gridTemplateColumns: "1fr auto", gap: "16px", alignItems: "center", transition: "transform 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform = "translateX(4px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateX(0)"}>
                                            <div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                                                    <span style={{ fontSize: "13px", fontWeight: 800, color: theme === "light" ? "#1e293b" : "white" }}>{r.imagingType} — {r.bodyPart}</span>
                                                    <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "100px", background: r.status === "tamamlandı" ? "rgba(16,185,129,0.1)" : r.status === "anormal" ? "rgba(220,38,38,0.1)" : "rgba(234,179,8,0.1)", color: r.status === "tamamlandı" ? "#059669" : r.status === "anormal" ? "#dc2626" : "#b45309" }}>
                                                        {r.status === "tamamlandı" ? "✓ " : r.status === "anormal" ? "⚠ " : "⏳ "}{r.status}
                                                    </span>
                                                </div>
                                                {r.findings && <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}><strong>{lang === "tr" ? "Bulgular:" : "Findings:"}</strong> {r.findings}</p>}
                                                {r.impression && <p style={{ fontSize: "13px", color: "#64748b" }}><strong>{lang === "tr" ? "Yorum:" : "Impression:"}</strong> {r.impression}</p>}
                                                <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "8px" }}>
                                                    Dr. {r.doctorId?.name} · {r.doctorId?.specialty} · {new Date(r.date).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US")}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Medical Reports */}
                        <div className="glass-card" style={{ padding: "32px", borderRadius: "24px" }}>
                            <h2 style={{ fontSize: "20px", fontWeight: 800, color: theme === "light" ? "#1e293b" : "white", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #dbeafe, #bfdbfe)", display: "flex", alignItems: "center", justifyContent: "center" }}><FiFileText size={18} color="#2563eb" /></span>
                                {lang === "tr" ? "Tıbbi Raporlar" : "Medical Reports"}
                                <span style={{ marginLeft: "auto", fontSize: "13px", fontWeight: 700, color: "#2563eb", background: "rgba(37,99,235,0.08)", padding: "4px 12px", borderRadius: "100px" }}>{medicalReports.length} {lang === "tr" ? "kayıt" : "records"}</span>
                            </h2>
                            {medicalReports.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>
                                    <FiFileText size={40} style={{ marginBottom: "16px", opacity: 0.3 }} />
                                    <p style={{ fontSize: "15px", fontWeight: 600 }}>{lang === "tr" ? "Henüz tıbbi rapor bulunmuyor." : "No medical reports yet."}</p>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                    {medicalReports.map(rep => (
                                        <div key={rep._id} style={{ padding: "20px 24px", borderRadius: "16px", background: theme === "light" ? "#f8fafc" : "rgba(255,255,255,0.03)", border: "1px solid rgba(0,0,0,0.05)", transition: "transform 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform = "translateX(4px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateX(0)"}>
                                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
                                                <div>
                                                    <div style={{ fontSize: "15px", fontWeight: 800, color: theme === "light" ? "#1e293b" : "white", marginBottom: "4px" }}>{rep.title}</div>
                                                    <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "100px", background: "rgba(37,99,235,0.1)", color: "#2563eb" }}>{rep.reportType}</span>
                                                </div>
                                                <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "100px", background: rep.status === "onaylandı" ? "rgba(16,185,129,0.1)" : rep.status === "tamamlandı" ? "rgba(37,99,235,0.1)" : "rgba(234,179,8,0.1)", color: rep.status === "onaylandı" ? "#059669" : rep.status === "tamamlandı" ? "#2563eb" : "#b45309" }}>
                                                    {rep.status}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6, marginBottom: "8px" }}>{rep.content}</p>
                                            {rep.diagnosis && <p style={{ fontSize: "12px", color: "#be123c", fontWeight: 700 }}>{lang === "tr" ? "Tanı:" : "Diagnosis:"} {rep.diagnosis}</p>}
                                            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "10px" }}>
                                                Dr. {rep.doctorId?.name} · {rep.doctorId?.specialty} · {new Date(rep.date).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US")}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ===== JOURNAL TAB ===== */}
                {activeTab === "journal" && (() => {
                    const wellnessScore = calculateWellnessScore();
                    const wellnessColor = wellnessScore >= 75 ? '#10b981' : wellnessScore >= 50 ? '#f59e0b' : wellnessScore >= 30 ? '#f97316' : '#ef4444';
                    const wellnessGradient = wellnessScore >= 75 ? 'linear-gradient(135deg,#059669,#10b981)' : wellnessScore >= 50 ? 'linear-gradient(135deg,#d97706,#f59e0b)' : wellnessScore >= 30 ? 'linear-gradient(135deg,#ea580c,#f97316)' : 'linear-gradient(135deg,#dc2626,#ef4444)';
                    const wellnessLabel = wellnessScore >= 75 ? t('wellnessExcellent') : wellnessScore >= 50 ? t('wellnessGood') : wellnessScore >= 30 ? t('wellnessFair') : t('wellnessPoor');
                    const circumference = 2 * Math.PI * 52;
                    const strokeDashoffset = circumference - (wellnessScore / 100) * circumference;
                    const moodAccents = { '😊': '#10b981', '😐': '#64748b', '😔': '#6366f1', '😤': '#f97316', '🤒': '#ef4444', '😴': '#8b5cf6', '💪': '#3b82f6', '😰': '#f59e0b' };
                    return (
                        <div style={{ animation: 'fadeIn 0.5s ease', padding: '4px 0' }}>
                            {/* ── Premium Hero Header ── */}
                            <div style={{ borderRadius: '28px', background: 'linear-gradient(135deg, #0b1120 0%, #0f172a 40%, #1a0a2e 100%)', color: 'white', marginBottom: '28px', position: 'relative', overflow: 'hidden', boxShadow: '0 32px 64px -16px rgba(8,8,20,0.55)' }}>
                                {/* Mesh orbs */}
                                <div style={{ position: 'absolute', top: '-30%', left: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 65%)', borderRadius: '50%', pointerEvents: 'none' }} />
                                <div style={{ position: 'absolute', bottom: '-20%', right: '20%', width: '320px', height: '320px', background: 'radial-gradient(circle, rgba(190,18,60,0.18) 0%, transparent 65%)', borderRadius: '50%', pointerEvents: 'none' }} />
                                <div style={{ position: 'absolute', top: '10%', right: '-5%', width: '280px', height: '280px', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 65%)', borderRadius: '50%', pointerEvents: 'none' }} />
                                <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px', padding: '40px 44px' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', width: 'fit-content', padding: '6px 16px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.12)' }}>
                                            <FiEdit2 size={13} /><span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase' }}>{t('journal')}</span>
                                        </div>
                                        <h1 style={{ fontSize: '34px', fontWeight: 900, marginBottom: '10px', letterSpacing: '-0.5px', lineHeight: 1.1 }}>{t('journalTitle')}</h1>
                                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', maxWidth: '360px', lineHeight: 1.6 }}>{t('journalDesc')}</p>
                                        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '18px' }}>📝</span>
                                                <div>
                                                    <div style={{ fontSize: '18px', fontWeight: 800, lineHeight: 1 }}>{journalEntries.length}</div>
                                                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', fontWeight: 600, letterSpacing: '0.5px' }}>{lang === 'tr' ? 'KAYIT' : 'ENTRIES'}</div>
                                                </div>
                                            </div>
                                            {journalEntries.length > 0 && (
                                                <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '18px' }}>{journalEntries[0].mood}</span>
                                                    <div>
                                                        <div style={{ fontSize: '11px', fontWeight: 800, lineHeight: 1, color: 'rgba(255,255,255,0.9)' }}>{lang === 'tr' ? 'Son Ruh Hali' : 'Last Mood'}</div>
                                                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{new Date(journalEntries[0].createdAt).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' })}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* Wellness Score Panel */}
                                    <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '28px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', minWidth: '220px' }}>
                                        <div style={{ fontsize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: '11px' }}>{t('wellnessScore')}</div>
                                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <svg width="130" height="130" style={{ transform: 'rotate(-90deg)', filter: `drop-shadow(0 0 12px ${wellnessColor}44)` }}>
                                                <circle cx="65" cy="65" r="52" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="11" />
                                                <circle cx="65" cy="65" r="52" fill="none" stroke={wellnessColor} strokeWidth="11"
                                                    strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                                                    style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)', strokeLinecap: 'round' }} />
                                            </svg>
                                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                <div style={{ fontSize: '32px', fontWeight: 900, color: wellnessColor, lineHeight: 1 }}>{wellnessScore}</div>
                                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>/100</div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '16px', fontWeight: 800, color: wellnessColor }}>{wellnessLabel}</div>
                                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{t('wellnessDesc')}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── New Entry Button / Form ── */}
                            <div style={{ marginBottom: '28px' }}>
                                {!showJournalForm ? (
                                    <button onClick={() => { setJournalForm({ title: '', content: '', mood: '😊' }); setEditingJournalId(null); setShowJournalForm(true); }}
                                        style={{ padding: '15px 32px', background: 'linear-gradient(135deg,#fb7185,#be123c)', color: 'white', border: 'none', borderRadius: '18px', fontWeight: 800, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 14px 30px -6px rgba(190,18,60,0.40)', transition: 'all 0.25s' }}
                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 20px 40px -8px rgba(190,18,60,0.50)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 14px 30px -6px rgba(190,18,60,0.40)'; }}
                                    >
                                        <FiPlusCircle size={20} /> {t('newEntry')}
                                    </button>
                                ) : (
                                    <div style={{ borderRadius: '28px', padding: '36px', border: `1px solid ${theme === 'light' ? 'rgba(190,18,60,0.12)' : 'rgba(190,18,60,0.2)'}`, background: theme === 'light' ? 'white' : 'rgba(15,23,42,0.7)', backdropFilter: 'blur(20px)', boxShadow: `0 24px 48px -12px rgba(190,18,60,0.12)`, animation: 'fadeIn 0.3s ease' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'linear-gradient(135deg,#fb7185,#be123c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {editingJournalId ? <FiEdit2 size={18} color="white" /> : <FiPlusCircle size={18} color="white" />}
                                                </div>
                                                <h3 style={{ fontSize: '19px', fontWeight: 900, color: theme === 'light' ? '#0f172a' : 'white', letterSpacing: '-0.3px' }}>{editingJournalId ? t('editEntry') : t('newEntry')}</h3>
                                            </div>
                                            <button onClick={() => setShowJournalForm(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '6px' }}><FiX size={18} /></button>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                                            <div>
                                                <label style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{t('entryTitle')}</label>
                                                <input type="text" value={journalForm.title} onChange={e => setJournalForm({ ...journalForm, title: e.target.value })}
                                                    placeholder={t('entryTitlePlaceholder')} className="vital-input"
                                                    style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', fontSize: '15px', fontWeight: 600, color: theme === 'light' ? '#1e293b' : 'white' }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{t('entryMood')}</label>
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    {MOODS.map(mood => (
                                                        <button key={mood} onClick={() => setJournalForm({ ...journalForm, mood })}
                                                            title={mood}
                                                            style={{ fontSize: '22px', width: '52px', height: '52px', borderRadius: '16px', border: `2px solid ${journalForm.mood === mood ? (moodAccents[mood] || '#be123c') : 'transparent'}`, background: journalForm.mood === mood ? `${(moodAccents[mood] || '#be123c')}18` : (theme === 'light' ? '#f8fafc' : 'rgba(255,255,255,0.04)'), cursor: 'pointer', transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)', transform: journalForm.mood === mood ? 'scale(1.2)' : 'scale(1)', boxShadow: journalForm.mood === mood ? `0 4px 16px ${(moodAccents[mood] || '#be123c')}44` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                        >{mood}</button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{t('entryContent')}</label>
                                                <textarea value={journalForm.content} onChange={e => setJournalForm({ ...journalForm, content: e.target.value })}
                                                    placeholder={t('entryContentPlaceholder')} rows={5} className="vital-input"
                                                    style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', resize: 'vertical', fontSize: '14px', color: theme === 'light' ? '#1e293b' : 'white', fontFamily: 'Outfit,sans-serif', lineHeight: 1.7 }} />
                                            </div>
                                            <div style={{ display: 'flex', gap: '12px', paddingTop: '4px' }}>
                                                <button onClick={handleSaveJournalEntry}
                                                    style={{ padding: '14px 28px', background: 'linear-gradient(135deg,#fb7185,#be123c)', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 800, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 20px -4px rgba(190,18,60,0.35)', transition: 'all 0.2s' }}
                                                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                                                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                                >
                                                    <FiSave size={16} /> {t('saveEntry')}
                                                </button>
                                                <button onClick={() => setShowJournalForm(false)}
                                                    style={{ padding: '14px 24px', background: theme === 'light' ? '#f1f5f9' : 'rgba(255,255,255,0.05)', color: '#64748b', border: 'none', borderRadius: '14px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = theme === 'light' ? '#e2e8f0' : 'rgba(255,255,255,0.1)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = theme === 'light' ? '#f1f5f9' : 'rgba(255,255,255,0.05)'}
                                                >
                                                    {t('cancel')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ── Entries List ── */}
                            {journalEntries.length === 0 ? (
                                <div style={{ borderRadius: '28px', padding: '72px 40px', textAlign: 'center', background: theme === 'light' ? 'linear-gradient(135deg,#f8fafc,#f1f5f9)' : 'linear-gradient(135deg,rgba(15,23,42,0.6),rgba(30,41,59,0.4))', border: `1px solid ${theme === 'light' ? '#e2e8f0' : 'rgba(255,255,255,0.06)'}`, backdropFilter: 'blur(12px)' }}>
                                    <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg,#fb7185,#be123c)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '36px', boxShadow: '0 16px 32px -8px rgba(190,18,60,0.35)' }}>📔</div>
                                    <h3 style={{ fontSize: '20px', fontWeight: 900, color: theme === 'light' ? '#0f172a' : 'white', marginBottom: '8px', letterSpacing: '-0.3px' }}>{t('noEntries')}</h3>
                                    <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px', maxWidth: '320px', margin: '0 auto 24px' }}>{lang === 'tr' ? 'Günlük notlarınızı, belirtilerinizi ve ruh halinizi buraya ekleyin.' : 'Add your daily notes, symptoms and moods here.'}</p>
                                    <button onClick={() => { setJournalForm({ title: '', content: '', mood: '😊' }); setEditingJournalId(null); setShowJournalForm(true); }}
                                        style={{ padding: '13px 28px', background: 'linear-gradient(135deg,#fb7185,#be123c)', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 800, fontSize: '14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 24px -6px rgba(190,18,60,0.35)' }}>
                                        <FiPlusCircle size={17} /> {t('newEntry')}
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {journalEntries.map((entry, idx) => {
                                        const accent = moodAccents[entry.mood] || '#be123c';
                                        return (
                                            <div key={entry.id}
                                                style={{ borderRadius: '22px', background: theme === 'light' ? 'white' : 'rgba(15,23,42,0.7)', backdropFilter: 'blur(12px)', border: `1px solid ${theme === 'light' ? '#f1f5f9' : 'rgba(255,255,255,0.06)'}`, borderLeft: `4px solid ${accent}`, padding: '22px 26px', transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)', animation: `fadeIn 0.4s ease ${idx * 0.06}s both` }}
                                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 16px 40px -8px ${accent}22, 0 4px 12px rgba(0,0,0,0.06)`; }}
                                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1 }}>
                                                        <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: `${accent}18`, border: `1.5px solid ${accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0, marginTop: '2px' }}>{entry.mood}</div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                                                <h3 style={{ fontSize: '16px', fontWeight: 800, color: theme === 'light' ? '#0f172a' : 'white', letterSpacing: '-0.2px' }}>{entry.title}</h3>
                                                            </div>
                                                            <p style={{ fontSize: '14px', color: theme === 'light' ? '#475569' : '#94a3b8', lineHeight: 1.65, marginBottom: '10px' }}>{entry.content}</p>
                                                            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                                <FiCalendar size={11} />
                                                                {new Date(entry.createdAt).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                                        <button onClick={() => handleEditJournalEntry(entry)}
                                                            style={{ padding: '8px 14px', borderRadius: '11px', background: theme === 'light' ? '#f8fafc' : 'rgba(255,255,255,0.05)', border: `1px solid ${theme === 'light' ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`, color: '#64748b', fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s' }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = accent + '18'; e.currentTarget.style.color = accent; e.currentTarget.style.borderColor = accent + '44'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = theme === 'light' ? '#f8fafc' : 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = theme === 'light' ? '#e2e8f0' : 'rgba(255,255,255,0.08)'; }}
                                                        >
                                                            <FiEdit2 size={12} /> {t('editEntry')}
                                                        </button>
                                                        <button onClick={() => handleDeleteJournalEntry(entry.id)}
                                                            style={{ padding: '8px 10px', borderRadius: '11px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444'; }}
                                                        >
                                                            <FiTrash2 size={13} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* DIET TAB */}
                {activeTab === "diet" && (
                    <DietAssistant patientUser={patientUser} theme={theme} lang={lang} />
                )}

                {/* PHARMACY TAB */}
                {activeTab === "pharmacy" && (
                    <div className="dashboard-anim" style={{ animation: "fadeIn 0.5s ease-out" }}>
                        <div style={{
                            padding: "32px", borderRadius: "24px", marginBottom: "32px",
                            background: theme === "light" ? "linear-gradient(135deg, #10b981 0%, #047857 100%)" : "linear-gradient(135deg, #064e3b 0%, #022c22 100%)",
                            color: "white", display: "flex", justifyContent: "space-between", alignItems: "center",
                            boxShadow: "0 20px 40px -10px rgba(16, 185, 129, 0.4)"
                        }}>
                            <div>
                                <h2 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 8px 0" }}>
                                    {lang === 'tr' ? 'Nöbetçi Eczaneler' : 'On-Duty Pharmacies'}
                                </h2>
                                <p style={{ margin: 0, opacity: 0.9, fontSize: "15px" }}>
                                    {lang === 'tr' ? 'Size en yakın nöbetçi eczaneleri harita üzerinde bulun.' : 'Find the nearest on-duty pharmacies.'}
                                </p>
                            </div>
                            <div style={{ padding: "16px", background: "rgba(255,255,255,0.2)", borderRadius: "50%", backdropFilter: "blur(10px)" }}>
                                <FiMapPin size={40} color="white" />
                            </div>
                        </div>

                        {/* District Selection Card (Top) */}
                        <div style={{
                            background: theme === "light" ? "white" : "#1e293b",
                            padding: "24px", borderRadius: "24px",
                            boxShadow: theme === "light" ? "0 10px 30px rgba(0,0,0,0.05)" : "0 10px 30px rgba(0,0,0,0.2)",
                            marginBottom: "24px", border: theme === "light" ? "1px solid #f1f5f9" : "1px solid #334155"
                        }}>
                            <div style={{ display: "flex", gap: "20px", alignItems: "flex-end", flexWrap: "wrap" }}>
                                <div style={{ flex: "1 1 200px" }}>
                                    <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: theme === "light" ? "#64748b" : "#94a3b8" }}>{lang === 'tr' ? 'İl' : 'City'}</label>
                                    <select
                                        style={{
                                            width: "100%", padding: "14px 16px", borderRadius: "12px",
                                            border: theme === "light" ? "1px solid #e2e8f0" : "1px solid #475569",
                                            background: theme === "light" ? "#f8fafc" : "#0f172a",
                                            color: theme === "light" ? "#0f172a" : "white",
                                            outline: "none", fontSize: "15px", opacity: 0.7, cursor: "not-allowed"
                                        }}
                                        disabled
                                    >
                                        <option>İzmir</option>
                                    </select>
                                </div>
                                <div style={{ flex: "1 1 200px" }}>
                                    <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 600, color: theme === "light" ? "#64748b" : "#94a3b8" }}>{lang === 'tr' ? 'İlçe' : 'District'}</label>
                                    <select
                                        value={selectedDistrict}
                                        onChange={handleDistrictChange}
                                        style={{
                                            width: "100%", padding: "14px 16px", borderRadius: "12px",
                                            border: theme === "light" ? "1px solid #e2e8f0" : "1px solid #475569",
                                            background: theme === "light" ? "#f8fafc" : "#0f172a",
                                            color: theme === "light" ? "#0f172a" : "white",
                                            outline: "none", fontSize: "15px", cursor: "pointer"
                                        }}
                                    >
                                        <option value="">{lang === 'tr' ? '📍 Yakınımdakiler (Konum)' : '📍 Nearest to Me (Location)'}</option>
                                        {["Aliağa", "Balçova", "Bayındır", "Bayraklı", "Bergama", "Beydağ", "Bornova", "Buca", "Çeşme", "Çiğli", "Dikili", "Foça", "Gaziemir", "Güzelbahçe", "Karabağlar", "Karaburun", "Karşıyaka", "Kemalpaşa", "Kınık", "Kiraz", "Konak", "Menderes", "Menemen", "Narlıdere", "Ödemiş", "Seferihisar", "Selçuk", "Tire", "Torbalı", "Urla"].map(dist => (
                                            <option key={dist} value={dist}>{dist}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ flex: "1 1 200px", display: "flex" }}>
                                    <button
                                        onClick={fetchLocationAndPharmacies}
                                        disabled={isLoadingLocation}
                                        style={{
                                            flex: 1, padding: "14px 24px", borderRadius: "12px", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                            color: "white", border: "none",
                                            fontWeight: 700, fontSize: "15px", cursor: isLoadingLocation ? "not-allowed" : "pointer",
                                            display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", transition: "all 0.2s",
                                            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)"
                                        }}
                                    >
                                        <FiMapPin />
                                        {isLoadingLocation ? (lang === 'tr' ? 'Aranıyor...' : 'Searching...') : (lang === 'tr' ? 'Konumumu Bul' : 'Find My Location')}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* District Pharmacies Card (Middle) */}
                        {selectedDistrict && (
                            <div style={{
                                background: theme === "light" ? "white" : "#1e293b",
                                padding: "24px", borderRadius: "24px",
                                boxShadow: theme === "light" ? "0 10px 30px rgba(0,0,0,0.05)" : "0 10px 30px rgba(0,0,0,0.2)",
                                marginBottom: "24px", border: theme === "light" ? "1px solid #f1f5f9" : "1px solid #334155"
                            }}>
                                <h3 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: 700, color: theme === "light" ? "#0f172a" : "white" }}>
                                    {lang === 'tr' ? `${selectedDistrict} Nöbetçi Eczaneleri` : `${selectedDistrict} Pharmacies`}
                                </h3>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
                                    {[
                                        { id: `dist-1`, name: `${selectedDistrict} Merkez Eczanesi`, address: `${selectedDistrict} Merkez Mah. Ana Cadde No: 1`, phone: "0232 444 00 01", distance: "-" },
                                        { id: `dist-2`, name: `${selectedDistrict} Şifa Eczanesi`, address: `${selectedDistrict} Yeni Mah. Sağlık Sok. No: 2`, phone: "0232 444 00 02", distance: "-" }
                                    ].map(pharmacy => (
                                        <div key={pharmacy.id} style={{
                                            padding: "20px", borderRadius: "16px",
                                            background: theme === "light" ? "#f8fafc" : "#0f172a",
                                            border: theme === "light" ? "1px solid #e2e8f0" : "1px solid #334155",
                                            transition: "all 0.3s ease",
                                            cursor: "pointer",
                                            display: "flex", flexDirection: "column"
                                        }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = "translateY(-4px)";
                                                e.currentTarget.style.boxShadow = theme === "light" ? "0 10px 25px rgba(16, 185, 129, 0.15)" : "0 10px 25px rgba(0,0,0,0.3)";
                                                e.currentTarget.style.borderColor = "#10b981";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = "none";
                                                e.currentTarget.style.boxShadow = "none";
                                                e.currentTarget.style.borderColor = theme === "light" ? "#e2e8f0" : "#334155";
                                            }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: theme === "light" ? "#0f172a" : "white" }}>
                                                    {pharmacy.name}
                                                </h3>
                                                <span style={{
                                                    padding: "4px 8px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.1)",
                                                    color: "#10b981", fontSize: "12px", fontWeight: 700
                                                }}>
                                                    {pharmacy.distance}
                                                </span>
                                            </div>
                                            <div style={{ display: "flex", gap: "8px", marginBottom: "8px", color: theme === "light" ? "#64748b" : "#94a3b8", fontSize: "14px" }}>
                                                <FiMapPin style={{ flexShrink: 0, marginTop: "2px" }} />
                                                <span style={{ lineHeight: 1.4 }}>{pharmacy.address}</span>
                                            </div>
                                            <div style={{ display: "flex", gap: "8px", marginBottom: "20px", color: theme === "light" ? "#64748b" : "#94a3b8", fontSize: "14px", flexGrow: 1 }}>
                                                <FiPhone style={{ flexShrink: 0, marginTop: "2px" }} />
                                                <span>{pharmacy.phone}</span>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pharmacy.name + ' ' + pharmacy.address)}`, '_blank'); }}
                                                style={{
                                                    width: "100%", padding: "10px", borderRadius: "10px",
                                                    background: theme === "light" ? "white" : "#1e293b",
                                                    color: "#10b981", border: "1px solid #10b981",
                                                    fontWeight: 600, fontSize: "14px", cursor: "pointer",
                                                    display: "flex", justifyContent: "center", alignItems: "center", gap: "8px",
                                                    transition: "all 0.2s"
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = "#10b981"; e.currentTarget.style.color = "white"; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = theme === "light" ? "white" : "#1e293b"; e.currentTarget.style.color = "#10b981"; }}
                                            >
                                                <FiMapPin />
                                                {lang === 'tr' ? 'Yol Tarifi Al' : 'Get Directions'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Map & List Card (Bottom) */}
                        <div style={{
                            background: theme === "light" ? "white" : "#1e293b",
                            padding: "24px", borderRadius: "24px",
                            boxShadow: theme === "light" ? "0 10px 30px rgba(0,0,0,0.05)" : "0 10px 30px rgba(0,0,0,0.2)",
                            marginBottom: "32px", border: theme === "light" ? "1px solid #f1f5f9" : "1px solid #334155"
                        }}>
                            <h3 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: 700, color: theme === "light" ? "#0f172a" : "white" }}>
                                {lang === 'tr' ? 'Konumunuza En Yakın Eczaneler' : 'Nearest Pharmacies to Your Location'}
                            </h3>

                            {userLocation ? (
                                <div style={{ marginBottom: "24px", borderRadius: "16px", overflow: "hidden", border: theme === "light" ? "1px solid #e2e8f0" : "1px solid #334155" }}>
                                    <iframe 
                                        width="100%" 
                                        height="350" 
                                        style={{ border: 0, display: "block" }} 
                                        loading="lazy" 
                                        allowFullScreen 
                                        src={`https://maps.google.com/maps?q=${userLocation.lat},${userLocation.lng}&z=15&output=embed`}
                                    ></iframe>
                                </div>
                            ) : (
                                <div style={{ height: "350px", background: theme === "light" ? "#f1f5f9" : "#0f172a", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px", color: theme === "light" ? "#64748b" : "#94a3b8" }}>
                                    <div style={{ textAlign: "center" }}>
                                        <FiMapPin size={40} style={{ opacity: 0.5, marginBottom: "16px" }} />
                                        <p style={{ margin: 0, fontWeight: 600 }}>{lang === 'tr' ? 'Konum bilgisi bekleniyor...' : 'Waiting for location...'}</p>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
                                {nearbyPharmacies.length > 0 ? nearbyPharmacies.map(pharmacy => (
                                    <div key={pharmacy.id} style={{
                                        padding: "20px", borderRadius: "16px",
                                        background: theme === "light" ? "#f8fafc" : "#0f172a",
                                        border: theme === "light" ? "1px solid #e2e8f0" : "1px solid #334155",
                                        transition: "all 0.3s ease",
                                        cursor: "pointer",
                                        display: "flex", flexDirection: "column"
                                    }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = "translateY(-4px)";
                                            e.currentTarget.style.boxShadow = theme === "light" ? "0 10px 25px rgba(16, 185, 129, 0.15)" : "0 10px 25px rgba(0,0,0,0.3)";
                                            e.currentTarget.style.borderColor = "#10b981";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = "none";
                                            e.currentTarget.style.boxShadow = "none";
                                            e.currentTarget.style.borderColor = theme === "light" ? "#e2e8f0" : "#334155";
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: theme === "light" ? "#0f172a" : "white" }}>
                                                {pharmacy.name}
                                            </h3>
                                            <span style={{
                                                padding: "4px 8px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.1)",
                                                color: "#10b981", fontSize: "12px", fontWeight: 700
                                            }}>
                                                {pharmacy.distance}
                                            </span>
                                        </div>
                                        <div style={{ display: "flex", gap: "8px", marginBottom: "8px", color: theme === "light" ? "#64748b" : "#94a3b8", fontSize: "14px" }}>
                                            <FiMapPin style={{ flexShrink: 0, marginTop: "2px" }} />
                                            <span style={{ lineHeight: 1.4 }}>{pharmacy.address}</span>
                                        </div>
                                        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", color: theme === "light" ? "#64748b" : "#94a3b8", fontSize: "14px", flexGrow: 1 }}>
                                            <FiPhone style={{ flexShrink: 0, marginTop: "2px" }} />
                                            <span>{pharmacy.phone}</span>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pharmacy.name + ' ' + pharmacy.address)}`, '_blank'); }}
                                            style={{
                                                width: "100%", padding: "10px", borderRadius: "10px",
                                                background: theme === "light" ? "white" : "#1e293b",
                                                color: "#10b981", border: "1px solid #10b981",
                                                fontWeight: 600, fontSize: "14px", cursor: "pointer",
                                                display: "flex", justifyContent: "center", alignItems: "center", gap: "8px",
                                                transition: "all 0.2s"
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = "#10b981"; e.currentTarget.style.color = "white"; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = theme === "light" ? "white" : "#1e293b"; e.currentTarget.style.color = "#10b981"; }}
                                        >
                                            <FiMapPin />
                                            {lang === 'tr' ? 'Yol Tarifi Al' : 'Get Directions'}
                                        </button>
                                    </div>
                                )) : (
                                    <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: theme === "light" ? "#64748b" : "#94a3b8" }}>
                                        <FiInfo size={48} style={{ marginBottom: "16px", opacity: 0.5, margin: "0 auto" }} />
                                        <p style={{ margin: 0, fontSize: "16px" }}>{lang === 'tr' ? 'Bu bölgede nöbetçi eczane bulunamadı.' : 'No on-duty pharmacy found in this area.'}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* HEALTH FACILITIES TAB */}
                {activeTab === "health_facilities" && (
                    <HealthFacilities
                        theme={theme}
                        lang={lang}
                        userLocation={userLocation}
                        setUserLocation={setUserLocation}
                    />
                )}

                {activeTab === "dashboard" && (
                    <>
                        {/* CEZA / KARA LİSTE UYARISI */}
                        {(penaltyInfo.isBlacklisted || penaltyInfo.penaltyPoints > 0) && (
                            <div style={{
                                marginBottom: "24px", padding: "16px 24px", borderRadius: "16px",
                                background: penaltyInfo.isBlacklisted
                                    ? "linear-gradient(135deg, #7f1d1d, #991b1b)"
                                    : "linear-gradient(135deg, #78350f, #92400e)",
                                color: "white", display: "flex", alignItems: "center", gap: "16px",
                                boxShadow: penaltyInfo.isBlacklisted
                                    ? "0 8px 24px rgba(127,29,29,0.4)"
                                    : "0 8px 24px rgba(120,53,15,0.4)",
                                animation: "fadeIn 0.5s ease"
                            }}>
                                <FiAlertTriangle size={28} style={{ flexShrink: 0 }} />
                                <div>
                                    {penaltyInfo.isBlacklisted ? (
                                        <>
                                            <div style={{ fontWeight: 800, fontSize: "16px", marginBottom: "4px" }}>
                                                ⚠️ {lang === 'tr' ? 'Hesabınız Kara Listeye Alındı' : 'Your Account is Blacklisted'}
                                            </div>
                                            <div style={{ fontSize: "13px", opacity: 0.9 }}>
                                                {lang === 'tr'
                                                    ? 'Çok fazla randevu iptali nedeniyle yeni randevu alamazsınız. Klinikle iletişime geçin.'
                                                    : 'Due to too many cancellations, you cannot book new appointments. Please contact the clinic.'}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ fontWeight: 800, fontSize: "16px", marginBottom: "4px" }}>
                                                ⚠️ {lang === 'tr' ? `Ceza Puanı: ${penaltyInfo.penaltyPoints}/3` : `Penalty Points: ${penaltyInfo.penaltyPoints}/3`}
                                            </div>
                                            <div style={{ fontSize: "13px", opacity: 0.9 }}>
                                                {lang === 'tr'
                                                    ? '3 puana ulaşırsanız yeni randevu alamazsınız. Randevularınızı iptal etmekten kaçının.'
                                                    : 'Reaching 3 points will prevent new bookings. Avoid cancelling appointments.'}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                        {/* PREMIUM HERO SECTION */}
                        <div className="dashboard-anim" style={{
                            padding: "56px 48px", borderRadius: "32px",
                            background: theme === "light" ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" : "linear-gradient(135deg, #0f172a 0%, #020617 100%)",
                            color: "white", marginBottom: "40px", position: "relative", overflow: "hidden",
                            boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.5)",
                            display: "flex", alignItems: "center", justifyContent: "space-between"
                        }}>
                            {/* Decorative background elements */}
                            <div style={{ position: "absolute", top: "-50%", right: "-10%", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(225,29,72,0.15) 0%, transparent 70%)", borderRadius: "50%" }}></div>
                            <div style={{ position: "absolute", bottom: "-30%", left: "20%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(56,189,248,0.1) 0%, transparent 70%)", borderRadius: "50%" }}></div>
                            <div style={{ position: "absolute", top: "0", right: "0", bottom: "0", width: "50%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.03))", zIndex: 0 }}></div>

                            <div style={{ position: "relative", zIndex: 1, maxWidth: "600px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                                    <span style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase", color: "#38bdf8", background: "rgba(56,189,248,0.1)", padding: "6px 14px", borderRadius: "100px", border: "1px solid rgba(56,189,248,0.2)" }}>
                                        {lang === 'tr' ? 'Akıllı Sağlık Asistanı' : 'Smart Health Assistant'}
                                    </span>
                                </div>
                                <h1 style={{ fontSize: "48px", fontWeight: 900, marginBottom: "16px", letterSpacing: "-1px", lineHeight: "1.1" }}>
                                    {t('welcome')}, <br/><span style={{ background: "linear-gradient(90deg, #f43f5e, #fb923c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{patientUser?.name ? patientUser.name.split(" ")[0] : ""}</span>!
                                </h1>
                                <p style={{ fontSize: "16px", color: "#cbd5e1", lineHeight: "1.7", marginBottom: "32px", fontWeight: 400 }}>
                                    {t('welcomeDesc')}
                                </p>
                                <div style={{ display: "flex", gap: "16px" }}>
                                    <button
                                        onClick={() => setShowBookingModal(true)}
                                        style={{
                                            padding: "16px 32px", borderRadius: "16px", background: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)",
                                            color: "white", fontWeight: 800, fontSize: "15px", border: "none", cursor: "pointer",
                                            display: "flex", alignItems: "center", gap: "12px",
                                            boxShadow: "0 10px 25px -5px rgba(225, 29, 72, 0.5)", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 15px 30px -5px rgba(225, 29, 72, 0.6)"; }}
                                        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 25px -5px rgba(225, 29, 72, 0.5)"; }}
                                    >
                                        <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: "50%", padding: "4px" }}><FiPlusCircle size={20} /></div>
                                        {t('bookNew')}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("calendar")}
                                        style={{
                                            padding: "16px 32px", borderRadius: "16px", background: "rgba(255,255,255,0.05)",
                                            color: "white", fontWeight: 700, fontSize: "15px", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer",
                                            display: "flex", alignItems: "center", gap: "10px", transition: "all 0.3s", backdropFilter: "blur(10px)"
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                                    >
                                        <FiCalendar size={18} />
                                        {t('smartCalendar')}
                                    </button>
                                </div>
                            </div>
                            
                            {/* Right side stats graphic */}
                            <div style={{ position: "relative", zIndex: 1, display: "flex", gap: "16px", flexShrink: 0 }} className="dashboard-hero-stats">
                                <div style={{ display: "flex", flexDirection: "column", gap: "16px", transform: "translateY(20px)" }}>
                                    <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", padding: "20px", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.1)", width: "160px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", flexShrink: 0 }}>
                                        <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(16,185,129,0.2)", color: "#34d399", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}><FiCheckCircle size={20} /></div>
                                        <div style={{ fontSize: "28px", fontWeight: 800, color: "white", marginBottom: "4px" }}>{appointments.filter(a => a.status === 'tamamlandı').length}</div>
                                        <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>{lang === 'tr' ? 'Tamamlanan' : 'Completed'}</div>
                                    </div>
                                    <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", padding: "20px", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.1)", width: "160px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", flexShrink: 0 }}>
                                        <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "rgba(56,189,248,0.2)", color: "#38bdf8", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}><FiActivity size={20} /></div>
                                        <div style={{ fontSize: "28px", fontWeight: 800, color: "white", marginBottom: "4px" }}>{labResults.length}</div>
                                        <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>{lang === 'tr' ? 'Laboratuvar' : 'Lab Results'}</div>
                                    </div>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "16px", transform: "translateY(-10px)" }}>
                                    <div style={{ background: "linear-gradient(135deg, rgba(225,29,72,0.2) 0%, rgba(225,29,72,0.05) 100%)", backdropFilter: "blur(20px)", padding: "24px", borderRadius: "24px", border: "1px solid rgba(225,29,72,0.3)", width: "180px", boxShadow: "0 20px 40px rgba(225,29,72,0.15)", flexShrink: 0 }}>
                                        <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: "#e11d48", color: "white", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", boxShadow: "0 10px 20px rgba(225,29,72,0.4)" }}><FiClock size={24} /></div>
                                        <div style={{ fontSize: "36px", fontWeight: 900, color: "white", marginBottom: "4px", letterSpacing: "-1px" }}>{appointments.filter(a => a.status === 'bekliyor').length}</div>
                                        <div style={{ fontSize: "13px", color: "#fda4af", fontWeight: 700 }}>{lang === 'tr' ? 'Yaklaşan Randevu' : 'Upcoming Appts'}</div>
                                    </div>
                                </div>
                            </div>
                            <style>{`@media (max-width: 1024px) { .dashboard-hero-stats { display: none !important; } }`}</style>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: "32px" }}>

                            {/* LEFT COLUMN */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

                                <div className="glass-card dashboard-anim" style={{
                                    padding: "24px 32px", borderRadius: "32px", marginBottom: "32px",
                                    background: "linear-gradient(135deg, rgba(190, 18, 60, 0.05) 0%, rgba(190, 18, 60, 0.02) 100%)",
                                    border: "1px solid rgba(190, 18, 60, 0.1)",
                                    display: "flex", alignItems: "center", gap: "24px",
                                    animationDelay: "0.1s"
                                }}>
                                    <div style={{
                                        width: "60px", height: "60px", background: "#be123c", color: "white",
                                        borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center",
                                        boxShadow: "0 10px 15px -3px rgba(190, 18, 60, 0.3)"
                                    }}>
                                        <FiActivity size={30} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                                            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#be123c" }}>{lang === 'tr' ? 'AI Sağlık Özeti' : 'AI Health Summary'}</h3>
                                            <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", background: "white", borderRadius: "100px", color: "#64748b", border: "1px solid #e2e8f0" }}>BETA</span>
                                        </div>
                                        {aiSummary.loading ? (
                                            <div style={{ display: "flex", gap: "4px" }}>
                                                <div style={{ width: "4px", height: "4px", background: "#be123c", borderRadius: "50%", animation: "bounce 0.6s infinite" }} />
                                                <div style={{ width: "4px", height: "4px", background: "#be123c", borderRadius: "50%", animation: "bounce 0.6s 0.2s infinite" }} />
                                                <div style={{ width: "4px", height: "4px", background: "#be123c", borderRadius: "50%", animation: "bounce 0.6s 0.4s infinite" }} />
                                            </div>
                                        ) : (
                                            <p style={{ margin: 0, fontSize: "14px", color: "#475569", lineHeight: "1.6", fontWeight: 500 }}>
                                                {aiSummary.text || (lang === 'tr' ? "Sağlık verileriniz analiz ediliyor..." : "Analyzing your health data...")}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* VITALS GRID */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
                                    <div className="glass-card dashboard-anim" style={{ padding: "24px", borderRadius: "24px", animationDelay: "0.2s" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                                            <div style={{ width: "40px", height: "40px", background: "#fef2f2", color: "#be123c", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <FiActivity size={20} />
                                            </div>
                                            {!isEditingVitals && (
                                                <button onClick={() => setIsEditingVitals(true)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }} title="Düzenle">
                                                    <FiEdit2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                        {isEditingVitals ? (
                                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                                <div style={{ display: "flex", gap: "8px" }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, marginBottom: "4px" }}>BOY (CM)</div>
                                                        <input type="number" value={height} onChange={e => setHeight(e.target.value)} className="vital-input" placeholder="175" />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, marginBottom: "4px" }}>KİLO (KG)</div>
                                                        <input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="vital-input" placeholder="70" />
                                                    </div>
                                                </div>
                                                <button onClick={handleSaveVitals} disabled={updatingVitals} style={{ background: "#be123c", color: "white", border: "none", padding: "8px", borderRadius: "10px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                                    <FiSave size={14} /> {updatingVitals ? "..." : "Kaydet"}
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div style={{ fontSize: "14px", color: "#64748b", fontWeight: 500 }}>{t('heightWeightInfo')}</div>
                                                <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
                                                    <span style={{ fontSize: "32px", fontWeight: 800, color: theme === "light" ? "#1e293b" : "white" }}>{height}</span>
                                                    <span style={{ fontSize: "14px", color: theme === "light" ? "#94a3b8" : "#94a3b8", fontWeight: 600 }}>cm</span>
                                                    <span style={{ fontSize: "24px", fontWeight: 400, color: theme === "light" ? "#cbd5e1" : "#475569" }}>/</span>
                                                    <span style={{ fontSize: "32px", fontWeight: 800, color: theme === "light" ? "#1e293b" : "white" }}>{weight}</span>
                                                    <span style={{ fontSize: "14px", color: theme === "light" ? "#94a3b8" : "#94a3b8", fontWeight: 600 }}>kg</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="glass-card dashboard-anim" style={{ padding: "24px", borderRadius: "24px", animationDelay: "0.3s" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                                            <div style={{ width: "40px", height: "40px", background: "#fff1f2", color: "#be123c", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <FiDroplet size={20} />
                                            </div>
                                            <div style={{ fontSize: "11px", fontWeight: 700, color: "#be123c", background: "#fff1f2", padding: "4px 8px", borderRadius: "6px", height: "fit-content" }}>{t('bloodTypeSection')}</div>
                                        </div>
                                        <div style={{ fontSize: "14px", color: theme === "light" ? "#64748b" : "#94a3b8", fontWeight: 500 }}>{t('bloodInfo')}</div>
                                        <div style={{ fontSize: "32px", fontWeight: 800, color: theme === "light" ? "#1e293b" : "white" }}>{patientUser?.bloodType || t('notSelected')}</div>
                                    </div>
                                    <div className="glass-card dashboard-anim" style={{ padding: "24px", borderRadius: "24px", animationDelay: "0.4s" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                                            <div style={{ width: "40px", height: "40px", background: "rgba(190, 18, 60, 0.05)", color: "#1e293b", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <FiUser size={20} />
                                            </div>
                                            <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", background: "#f1f5f9", padding: "4px 8px", borderRadius: "6px", height: "fit-content" }}>{t('personal')}</div>
                                        </div>
                                        <div style={{ fontSize: "14px", color: theme === "light" ? "#64748b" : "#94a3b8", fontWeight: 500 }}>{t('age')}</div>
                                        <div style={{ fontSize: "32px", fontWeight: 800, color: theme === "light" ? "#1e293b" : "white" }}>{patientUser?.age ? `${patientUser.age}` : "-"}</div>
                                    </div>
                                </div>

                                {/* WELLNESS SCORE CARD */}
                                {(() => {
                                    const ws = calculateWellnessScore();
                                    const wsColor = ws >= 75 ? '#10b981' : ws >= 50 ? '#f59e0b' : ws >= 30 ? '#f97316' : '#ef4444';
                                    const wsGradient = ws >= 75 ? 'linear-gradient(135deg,#059669,#10b981)' : ws >= 50 ? 'linear-gradient(135deg,#d97706,#f59e0b)' : ws >= 30 ? 'linear-gradient(135deg,#ea580c,#f97316)' : 'linear-gradient(135deg,#dc2626,#ef4444)';
                                    const wsLabel = ws >= 75 ? t('wellnessExcellent') : ws >= 50 ? t('wellnessGood') : ws >= 30 ? t('wellnessFair') : t('wellnessPoor');
                                    const circ = 2 * Math.PI * 44;
                                    const offset = circ - (ws / 100) * circ;
                                    // 4 sub-scores for breakdown bars (safe null checks)
                                    const safeAppts = Array.isArray(appointments) ? appointments : [];
                                    const safeMeds = Array.isArray(todayDoses) ? todayDoses : [];
                                    const safeVitals = Array.isArray(historicalVitals) ? historicalVitals : [];
                                    const bmiBest = profileForm.height && profileForm.weight ? (() => { const bmi = profileForm.weight / ((profileForm.height / 100) ** 2); return bmi >= 18.5 && bmi <= 24.9 ? 30 : bmi >= 17 && bmi <= 27.5 ? 18 : 8; })() : 0;
                                    const medScore = safeMeds.length > 0 ? Math.min(30, Math.round((safeMeds.filter(m => m.taken).length / safeMeds.length) * 30)) : 0;
                                    const apptScore = safeAppts.filter(a => a.status === 'tamamlandı' && new Date(a.date) > new Date(Date.now() - 90 * 24 * 3600 * 1000)).length > 0 ? 20 : 0;
                                    const vitalScore = safeVitals.filter(v => new Date(v.date) > new Date(Date.now() - 90 * 24 * 3600 * 1000)).length >= 3 ? 20 : Math.min(20, safeVitals.filter(v => new Date(v.date) > new Date(Date.now() - 90 * 24 * 3600 * 1000)).length * 7);
                                    const bars = [
                                        { label: lang === 'tr' ? 'VKİ' : 'BMI', val: bmiBest, max: 30, icon: '⚖️' },
                                        { label: lang === 'tr' ? 'İlaç' : 'Meds', val: medScore, max: 30, icon: '💊' },
                                        { label: lang === 'tr' ? 'Randevu' : 'Appt', val: apptScore, max: 20, icon: '📅' },
                                        { label: lang === 'tr' ? 'Vital' : 'Vital', val: vitalScore, max: 20, icon: '❤️' },
                                    ];
                                    return (
                                        <div className="dashboard-anim" style={{ borderRadius: '24px', overflow: 'hidden', animationDelay: '0.5s', border: `1px solid ${wsColor}28`, background: theme === 'light' ? 'white' : 'rgba(15,23,42,0.8)', backdropFilter: 'blur(12px)', boxShadow: `0 8px 32px -8px ${wsColor}20` }}>
                                            {/* Top gradient accent bar */}
                                            <div style={{ height: '4px', background: wsGradient }} />
                                            <div style={{ padding: '22px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                                    {/* Ring */}
                                                    <div style={{ position: 'relative', flexShrink: 0 }}>
                                                        <svg width="96" height="96" style={{ transform: 'rotate(-90deg)', filter: `drop-shadow(0 0 8px ${wsColor}44)` }}>
                                                            <circle cx="48" cy="48" r="44" fill="none" stroke={theme === 'light' ? '#f1f5f9' : 'rgba(255,255,255,0.06)'} strokeWidth="8" />
                                                            <circle cx="48" cy="48" r="44" fill="none" stroke={wsColor} strokeWidth="8"
                                                                strokeDasharray={circ} strokeDashoffset={offset}
                                                                style={{ transition: 'stroke-dashoffset 1.3s cubic-bezier(0.4,0,0.2,1)', strokeLinecap: 'round' }} />
                                                        </svg>
                                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                            <span style={{ fontSize: '20px', fontWeight: 900, color: wsColor, lineHeight: 1 }}>{ws}</span>
                                                            <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700 }}>/100</span>
                                                        </div>
                                                    </div>
                                                    {/* Label + bars */}
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                                            <FiHeart size={13} color={wsColor} />
                                                            <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{t('wellnessScore')}</span>
                                                        </div>
                                                        <div style={{ fontSize: '18px', fontWeight: 900, color: wsColor, marginBottom: '12px', letterSpacing: '-0.3px' }}>{wsLabel}</div>
                                                        {/* Mini breakdown bars */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                                                            {bars.map(bar => (
                                                                <div key={bar.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <span style={{ fontSize: '11px' }}>{bar.icon}</span>
                                                                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', width: '36px', flexShrink: 0 }}>{bar.label}</span>
                                                                    <div style={{ flex: 1, height: '5px', borderRadius: '99px', background: theme === 'light' ? '#f1f5f9' : 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                                                                        <div style={{ height: '100%', width: `${(bar.val / bar.max) * 100}%`, background: wsGradient, borderRadius: '99px', transition: 'width 1s cubic-bezier(0.4,0,0.2,1)' }} />
                                                                    </div>
                                                                    <span style={{ fontSize: '10px', fontWeight: 800, color: wsColor, width: '24px', textAlign: 'right', flexShrink: 0 }}>{bar.val}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button onClick={() => setActiveTab('journal')}
                                                    style={{ marginTop: '16px', width: '100%', padding: '9px', borderRadius: '12px', background: `${wsColor}12`, border: `1px solid ${wsColor}30`, color: wsColor, fontWeight: 800, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.3px' }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = wsGradient; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'transparent'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = `${wsColor}12`; e.currentTarget.style.color = wsColor; e.currentTarget.style.borderColor = `${wsColor}30`; }}
                                                >
                                                    {t('journal')} →
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* HEALTH TRACKING SECTION (Charts & Manual Entry) */}
                                <div className="glass-card dashboard-anim" style={{ padding: "32px", borderRadius: "32px", animationDelay: "0.45s" }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <div style={{ width: "36px", height: "36px", background: "#fff1f2", color: "#be123c", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <FiTrendingUp size={20} />
                                            </div>
                                            <h2 style={{ fontSize: "20px", fontWeight: 800, color: theme === "light" ? "#1e293b" : "white" }}>{lang === 'tr' ? 'Sağlık Takibi' : 'Health Tracking'}</h2>
                                        </div>
                                        <div style={{ display: "flex", gap: "12px" }}>
                                            <button
                                                onClick={handleAnalyzeVitals}
                                                disabled={isAnalyzingVitals || historicalVitals.length === 0}
                                                style={{ padding: "10px 18px", background: "rgba(190, 18, 60, 0.05)", color: "#be123c", border: "1px solid rgba(190, 18, 60, 0.1)", borderRadius: "12px", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                                            >
                                                <FiActivity /> {isAnalyzingVitals ? "..." : (lang === 'tr' ? 'Trend Analizi' : 'Trend Analysis')}
                                            </button>
                                            <button
                                                onClick={() => setShowHistoryModal(true)}
                                                style={{ padding: "10px 18px", background: "rgba(15, 23, 42, 0.05)", color: "#1e293b", border: "1px solid rgba(15, 23, 42, 0.1)", borderRadius: "12px", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                                            >
                                                <FiCalendar /> {lang === 'tr' ? 'Geçmiş' : 'History'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingVitalId(null);
                                                    setVitalForm({ type: "blood_pressure", value: "", unit: "mmHg", date: new Date(), notes: "" });
                                                    setShowVitalModal(true);
                                                }}
                                                style={{ padding: "10px 18px", background: "#be123c", color: "white", border: "none", borderRadius: "12px", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                                            >
                                                <FiPlusCircle /> {lang === 'tr' ? 'Veri Ekle' : 'Add Data'}
                                            </button>
                                        </div>
                                    </div>

                                    {vitalAnalysis && (
                                        <div style={{ marginBottom: "24px", padding: "20px", background: vitalAnalysis.status === 'Riskli' ? '#fef2f2' : '#f8fafc', borderRadius: "20px", border: `1px solid ${vitalAnalysis.status === 'Riskli' ? '#fee2e2' : '#e2e8f0'}` }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                                                <FiInfo style={{ color: "#be123c" }} />
                                                <span style={{ fontWeight: 700, fontSize: "14px", color: "#1e293b" }}>Yapay Zeka Analizi: <span style={{ color: vitalAnalysis.status === 'Riskli' ? '#ef4444' : '#10b981' }}>{vitalAnalysis.status}</span></span>
                                            </div>
                                            <p style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#475569", lineHeight: "1.5" }}>{vitalAnalysis.analysis}</p>
                                            {vitalAnalysis.risks?.length > 0 && (
                                                <div style={{ marginBottom: "12px" }}>
                                                    <div style={{ fontSize: "12px", fontWeight: 800, color: "#ef4444", marginBottom: "4px" }}>RİSKLER</div>
                                                    {vitalAnalysis.risks.map((r, i) => <div key={i} style={{ fontSize: "13px", color: "#b91c1c", display: "flex", alignItems: "center", gap: "6px" }}><FiAlertTriangle size={12} /> {r}</div>)}
                                                </div>
                                            )}
                                            {vitalAnalysis.recommendations?.length > 0 && (
                                                <div>
                                                    <div style={{ fontSize: "12px", fontWeight: 800, color: "#0ea5e9", marginBottom: "4px" }}>ÖNERİLER</div>
                                                    {vitalAnalysis.recommendations.map((rec, i) => <div key={i} style={{ fontSize: "13px", color: "#0369a1", display: "flex", alignItems: "center", gap: "6px" }}><FiCheckCircle size={12} /> {rec}</div>)}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                                        {/* Tansiyon Grafiği */}
                                        <div style={{ height: "200px" }}>
                                            <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "10px", textAlign: "center" }}>TANSİYON (mmHg)</div>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={getVitalChartData("blood_pressure")}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} />
                                                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                                                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }} />
                                                    <Legend iconType="circle" />
                                                    <Line type="monotone" dataKey="systolic" name="Sistolik" stroke="#be123c" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                                    <Line type="monotone" dataKey="diastolic" name="Diastolik" stroke="#fb7185" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Şeker Grafiği */}
                                        <div style={{ height: "200px" }}>
                                            <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "10px", textAlign: "center" }}>KAN ŞEKERİ (mg/dL)</div>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={getVitalChartData("blood_sugar")}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} />
                                                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                                                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }} />
                                                    <Line type="monotone" dataKey="value" name="Şeker" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Nabız Grafiği */}
                                        <div style={{ height: "200px" }}>
                                            <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "10px", textAlign: "center" }}>NABIZ (bpm)</div>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={getVitalChartData("pulse")}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} />
                                                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                                                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }} />
                                                    <Line type="monotone" dataKey="value" name="Nabız" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Kilo Grafiği */}
                                        <div style={{ height: "200px" }}>
                                            <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "10px", textAlign: "center" }}>KİLO (kg)</div>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={getVitalChartData("weight")}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} />
                                                    <YAxis fontSize={10} axisLine={false} tickLine={false} />
                                                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }} />
                                                    <Line type="monotone" dataKey="value" name="Kilo" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                {/* APPOINTMENTS SECTION */}
                                <div className="glass-card dashboard-anim" style={{ padding: "32px", borderRadius: "32px", animationDelay: "0.5s" }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                            <div style={{ width: "36px", height: "36px", background: "#fff1f2", color: "#be123c", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <FiCalendar size={20} />
                                            </div>
                                            <h2 style={{ fontSize: "22px", fontWeight: 800, color: theme === "light" ? "#1e293b" : "white", letterSpacing: "-0.5px" }}>{t('upcomingAppt')}</h2>
                                        </div>
                                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#be123c", padding: "6px 14px", background: "#fff1f2", borderRadius: "100px" }}>{activeAppointments.length} {t('active')}</div>
                                    </div>

                                    {activeAppointments.length === 0 ? (
                                        <div style={{ textAlign: "center", padding: "60px 0", background: "rgba(190,18,60,0.02)", borderRadius: "24px", border: "2px dashed #f1f5f9" }}>
                                            <div style={{ width: "80px", height: "80px", background: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 10px 20px rgba(0,0,0,0.03)" }}>
                                                <FiCalendar style={{ fontSize: "32px", color: "#cbd5e1" }} />
                                            </div>
                                            <p style={{ fontSize: "16px", color: "#94a3b8", fontWeight: 500 }}>{t('noPendingAppt')}</p>
                                            <button onClick={() => setShowBookingModal(true)} style={{ marginTop: "20px", color: "#be123c", background: "none", border: "none", fontWeight: 700, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", margin: "20px auto" }}>
                                                <FiPlusCircle /> {t('bookNow')}
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                            {activeAppointments.map(appt => {
                                                const timeBadge = getTimeBadgeLabel(appt.date);
                                                return (
                                                    <div key={appt._id} className="glass-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", borderRadius: "20px", border: "1px solid rgba(190, 18, 60, 0.1)" }}>
                                                        <div style={{ display: "flex", alignItems: "flex-start", gap: "20px" }}>
                                                            {/* Date & Time Block */}
                                                            <div style={{ width: "64px", minWidth: "64px", padding: "10px 4px", borderRadius: "16px", background: timeBadge.bg, color: timeBadge.color, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 6px rgba(0,0,0,0.02)", textAlign: "center" }}>
                                                                <div style={{ fontSize: "22px", fontWeight: 800, lineHeight: 1 }}>{new Date(appt.date).getDate()}</div>
                                                                <div style={{ fontSize: "12px", fontWeight: 700, marginTop: "4px" }}>{new Date(appt.date).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { month: 'short' }).toUpperCase()}</div>
                                                            </div>

                                                            {/* Details Block */}
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                                                                    <div>
                                                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                                                            <span style={{ fontSize: "16px", fontWeight: 800, color: theme === "light" ? "#1e293b" : "#f8fafc" }}>{appt.doctorId?.name?.startsWith('Dr') ? appt.doctorId?.name : `Dr. ${appt.doctorId?.name}`}</span>
                                                                            <span style={{ fontSize: "11px", fontWeight: 800, padding: "2px 8px", borderRadius: "100px", background: timeBadge.bg, color: timeBadge.color }}>
                                                                                {timeBadge.label} • {appt.time}
                                                                            </span>
                                                                        </div>
                                                                        <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                                                                            {appt.doctorId?.specialty} <span style={{ opacity: 0.5 }}>|</span>
                                                                            {appt.type === 'Online' ? <FiVideo size={14} color="#0ea5e9" /> : <FiMapPin size={14} color="#10b981" />}
                                                                            {appt.type}
                                                                        </div>
                                                                    </div>
                                                                    <div style={{ display: "flex", gap: "8px" }}>
                                                                        <button onClick={() => generateCalendarEvent(appt)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", padding: "6px", borderRadius: "8px", transition: "background 0.2s" }} title={t('addToCalendar')} onMouseEnter={e => e.currentTarget.style.background = theme === "light" ? "#f1f5f9" : "rgba(255,255,255,0.05)"} onMouseLeave={e => e.currentTarget.style.background = "none"}>
                                                                            <FiCalendar size={18} />
                                                                        </button>
                                                                        <button onClick={() => handleCancel(appt._id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", padding: "6px", borderRadius: "8px", transition: "background 0.2s" }} title={t('giveUp')} onMouseEnter={e => e.currentTarget.style.background = theme === "light" ? "#fee2e2" : "rgba(239, 68, 68, 0.1)"} onMouseLeave={e => e.currentTarget.style.background = "none"}>
                                                                            <FiTrash2 size={18} />
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* Patient Name context if it's for a family member */}
                                                                {appt.patientId?._id !== patientUser?._id && appt.patientId?.name && (
                                                                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 700, color: "#be123c", background: "#fef2f2", padding: "4px 10px", borderRadius: "8px", marginTop: "4px" }}>
                                                                        <FiUser size={12} /> {appt.patientId.name}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Action Footer */}
                                                        <div style={{ display: "flex", gap: "10px", marginTop: "4px", borderTop: `1px solid ${theme === "light" ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)"}`, paddingTop: "12px" }}>
                                                            {appt.type === 'Online' ? (
                                                                <button style={{ flex: 1, padding: "10px", borderRadius: "12px", background: timeBadge.label === t('today') ? "#0ea5e9" : (theme === "light" ? "#f0f9ff" : "rgba(14, 165, 233, 0.1)"), color: timeBadge.label === t('today') ? "white" : "#0ea5e9", border: "none", fontWeight: 700, fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: timeBadge.label === t('today') ? "pointer" : "not-allowed", opacity: timeBadge.label === t('today') ? 1 : 0.7, transition: "all 0.2s" }} disabled={timeBadge.label !== t('today')}>
                                                                    <FiVideo size={16} /> {t('joinVideo')}
                                                                </button>
                                                            ) : (
                                                                <div style={{ flex: 1, padding: "10px", borderRadius: "12px", background: theme === "light" ? "#f0fdf4" : "rgba(16, 185, 129, 0.1)", color: "#10b981", border: "none", fontWeight: 700, fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                                                    <FiMapPin size={16} /> {t('atClinic')}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* NEW SECTIONS: Lab Results, Prescriptions, Messages */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                                    {/* LAST LAB RESULTS */}
                                    <div className="glass-card dashboard-anim" style={{ padding: "28px", borderRadius: "32px", animationDelay: "0.6s" }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                <div style={{ width: "36px", height: "36px", background: "#f0f9ff", color: "#0ea5e9", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <FiActivity size={20} />
                                                </div>
                                                <h2 style={{ fontSize: "18px", fontWeight: 800, color: theme === "light" ? "#1e293b" : "white" }}>{t('lastLabResults')}</h2>
                                            </div>
                                            <button style={{ background: "none", border: "none", color: "#be123c", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>{t('viewAll')}</button>
                                        </div>
                                        {labResults.length === 0 ? (
                                            <p style={{ fontSize: "14px", color: "#94a3b8", textAlign: "center", padding: "20px" }}>{t('noLabResults')}</p>
                                        ) : (
                                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                                {labResults.slice(0, 3).map(lab => (
                                                    <div key={lab._id} style={{ padding: "12px", borderRadius: "16px", background: theme === "light" ? "#f8fafc" : "rgba(255,255,255,0.03)", border: `1px solid ${theme === "light" ? "#f1f5f9" : "#334155"}` }}>
                                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                                            <span style={{ fontSize: "14px", fontWeight: 700, color: theme === "light" ? "#334155" : "#f1f5f9" }}>{lab.testName}</span>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                                <span style={{ fontSize: "11px", fontWeight: 700, color: lab.status === 'anormal' ? '#ef4444' : '#22c55e' }}>{lab.status?.toUpperCase()}</span>
                                                                {lab.status === 'tamamlandı' && lab.results?.length > 0 && (
                                                                    <button
                                                                        onClick={() => setShowLabTrends({ show: true, parameter: lab.results[0].parameter })}
                                                                        style={{ background: "none", border: "none", color: "#0ea5e9", cursor: "pointer", display: "flex", alignItems: "center" }}
                                                                        title={t('viewTrends')}
                                                                    >
                                                                        <FiTrendingUp size={14} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div style={{ fontSize: "12px", color: "#94a3b8" }}>{new Date(lab.date).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}</div>
                                                        {lab.status === 'tamamlandı' && (
                                                            <button
                                                                onClick={() => handleExplainResults(lab)}
                                                                disabled={explainingId === lab._id}
                                                                style={{
                                                                    marginTop: "8px", background: "rgba(190, 18, 60, 0.05)",
                                                                    color: "#be123c", border: "none", padding: "6px 10px",
                                                                    borderRadius: "8px", fontSize: "11px", fontWeight: 700,
                                                                    cursor: explainingId === lab._id ? "default" : "pointer",
                                                                    display: "flex", alignItems: "center", gap: "6px", width: "100%", justifyContent: "center"
                                                                }}
                                                            >
                                                                {explainingId === lab._id ? (
                                                                    <div style={{ width: "10px", height: "10px", border: "2px solid #be123c", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                                                                ) : (
                                                                    <FiInfo size={14} />
                                                                )}
                                                                {lang === 'tr' ? 'AI İle Analiz Et' : 'Analyze with AI'}
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* LAST PRESCRIPTIONS */}
                                    <div className="glass-card dashboard-anim" style={{ padding: "28px", borderRadius: "32px", animationDelay: "0.7s" }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                <div style={{ width: "36px", height: "36px", background: "#f0fdf4", color: "#22c55e", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <FiDroplet size={20} />
                                                </div>
                                                <h2 style={{ fontSize: "18px", fontWeight: 800, color: theme === "light" ? "#1e293b" : "white" }}>{t('lastPrescriptions')}</h2>
                                            </div>
                                            <button style={{ background: "none", border: "none", color: "#be123c", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>{t('viewAll')}</button>
                                        </div>
                                        {prescriptions.length === 0 ? (
                                            <p style={{ fontSize: "14px", color: "#94a3b8", textAlign: "center", padding: "20px" }}>{t('noPrescriptions')}</p>
                                        ) : (
                                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                                {prescriptions.slice(0, 3).map(rx => (
                                                    <div key={rx._id} style={{ padding: "12px", borderRadius: "16px", background: theme === "light" ? "#f8fafc" : "rgba(255,255,255,0.03)", border: `1px solid ${theme === "light" ? "#f1f5f9" : "#334155"}` }}>
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "4px" }}>
                                                            <div style={{ fontSize: "14px", fontWeight: 700, color: theme === "light" ? "#334155" : "#f1f5f9" }}>{rx.diagnosis}</div>
                                                            <button
                                                                onClick={() => handleDownloadPDF(rx)}
                                                                style={{ background: "none", border: "none", color: "#be123c", cursor: "pointer", display: "flex", alignItems: "center", padding: "2px" }}
                                                                title={t('downloadPDF')}
                                                            >
                                                                <FiDownload size={14} />
                                                            </button>
                                                        </div>
                                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                            <span style={{ fontSize: "12px", color: "#94a3b8" }}>{new Date(rx.date).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}</span>
                                                            <span style={{ fontSize: "12px", color: "#be123c", fontWeight: 600 }}>{rx.medications?.length} {lang === 'tr' ? 'İlaç' : 'Meds'}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* DOCTOR MESSAGES */}
                                    <div className="glass-card dashboard-anim" style={{ padding: "28px", borderRadius: "32px", animationDelay: "0.8s" }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                <div style={{ width: "36px", height: "36px", background: "#fdf2f8", color: "#db2777", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <FiMessageSquare size={20} />
                                                </div>
                                                <h2 style={{ fontSize: "18px", fontWeight: 800, color: theme === "light" ? "#1e293b" : "white" }}>{t('doctorMessages')}</h2>
                                            </div>
                                            <button
                                                onClick={() => setShowComposeModal({ show: true, receiverId: "", receiverName: "" })}
                                                style={{ background: "#fff1f2", color: "#db2777", border: "none", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                                            >
                                                <FiPlusCircle size={14} /> {t('composeMessage')}
                                            </button>
                                        </div>
                                        {/* Inbox / Sent Toggle */}
                                        <div style={{ display: "flex", gap: "6px", background: theme === "light" ? "#f1f5f9" : "rgba(255,255,255,0.05)", padding: "4px", borderRadius: "10px", marginBottom: "16px", width: "fit-content" }}>
                                            <button onClick={() => setMessageTab("inbox")} style={{ padding: "6px 14px", borderRadius: "7px", border: "none", background: messageTab === "inbox" ? "white" : "transparent", color: messageTab === "inbox" ? "#db2777" : "#64748b", fontWeight: 700, fontSize: "12px", cursor: "pointer", boxShadow: messageTab === "inbox" ? "0 2px 4px rgba(0,0,0,0.08)" : "none" }}>
                                                <FiMessageSquare size={12} style={{ marginRight: "5px" }} /> {lang === "tr" ? "Gelen" : "Inbox"} ({messages.length})
                                            </button>
                                            <button onClick={() => setMessageTab("sent")} style={{ padding: "6px 14px", borderRadius: "7px", border: "none", background: messageTab === "sent" ? "white" : "transparent", color: messageTab === "sent" ? "#db2777" : "#64748b", fontWeight: 700, fontSize: "12px", cursor: "pointer", boxShadow: messageTab === "sent" ? "0 2px 4px rgba(0,0,0,0.08)" : "none" }}>
                                                <FiArrowRight size={12} style={{ marginRight: "5px" }} /> {lang === "tr" ? "Gönderilen" : "Sent"} ({sentMessages.length})
                                            </button>
                                        </div>
                                        {/* Inbox */}
                                        {messageTab === "inbox" && (
                                            messages.length === 0 ? (
                                                <p style={{ fontSize: "14px", color: "#94a3b8", textAlign: "center", padding: "20px" }}>{t('noMessages')}</p>
                                            ) : (
                                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                                    {messages.slice(0, 3).map(msg => (
                                                        <div key={msg._id} style={{ padding: "12px", borderRadius: "16px", background: theme === "light" ? "white" : "#1e293b", border: `1px solid ${theme === "light" ? "#f1f5f9" : "#334155"}` }}>
                                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                                    <div style={{ width: "24px", height: "24px", background: "#db2777", color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700 }}>
                                                                        {msg.senderId?.name?.charAt(0) || "?"}
                                                                    </div>
                                                                    <span style={{ fontSize: "13px", fontWeight: 700 }}>{msg.senderId?.name}</span>
                                                                </div>
                                                                <span style={{ fontSize: "11px", color: "#94a3b8" }}>{new Date(msg.date).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}</span>
                                                            </div>
                                                            <div style={{ fontSize: "12px", fontWeight: 700, marginBottom: "2px" }}>{msg.title}</div>
                                                            <p style={{ fontSize: "12px", color: "#64748b", margin: 0, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{msg.content}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )
                                        )}
                                        {/* Sent */}
                                        {messageTab === "sent" && (
                                            sentMessages.length === 0 ? (
                                                <p style={{ fontSize: "14px", color: "#94a3b8", textAlign: "center", padding: "20px" }}>{lang === "tr" ? "Henüz mesaj göndermediniz." : "No sent messages yet."}</p>
                                            ) : (
                                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                                    {sentMessages.slice(0, 3).map(msg => (
                                                        <div key={msg._id} style={{ padding: "12px", borderRadius: "16px", background: theme === "light" ? "white" : "#1e293b", border: `1px solid ${theme === "light" ? "#e0f2fe" : "#1e40af"}`, borderLeft: "3px solid #db2777" }}>
                                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                                    <FiArrowRight size={14} color="#db2777" />
                                                                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#64748b" }}>{lang === "tr" ? "Alıcı:" : "To:"} {msg.receiverId?.name || "—"}</span>
                                                                </div>
                                                                <span style={{ fontSize: "11px", color: "#94a3b8" }}>{new Date(msg.date).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}</span>
                                                            </div>
                                                            <div style={{ fontSize: "12px", fontWeight: 700, marginBottom: "2px" }}>{msg.title}</div>
                                                            <p style={{ fontSize: "12px", color: "#64748b", margin: 0, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{msg.content}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )
                                        )}
                                    </div>

                                    {/* MY FILES */}
                                    <div className="glass-card dashboard-anim" style={{ padding: "28px", borderRadius: "32px", animationDelay: "0.9s" }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                <div style={{ width: "36px", height: "36px", background: "#f1f5f9", color: "#64748b", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <FiActivity size={20} />
                                                </div>
                                                <h2 style={{ fontSize: "18px", fontWeight: 800, color: theme === "light" ? "#1e293b" : "white" }}>{t('files')}</h2>
                                            </div>
                                            <button
                                                onClick={() => setShowFileUpload(true)}
                                                style={{ background: "#f1f5f9", color: "#64748b", border: "none", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                                            >
                                                <FiPlusCircle size={14} /> {t('uploadFile')}
                                            </button>
                                        </div>
                                        {files.length === 0 ? (
                                            <p style={{ fontSize: "14px", color: "#94a3b8", textAlign: "center", padding: "20px" }}>{t('noFiles')}</p>
                                        ) : (
                                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                                {files.slice(0, 3).map(file => (
                                                    <div key={file._id} style={{ padding: "12px", borderRadius: "16px", background: theme === "light" ? "white" : "#1e293b", border: `1px solid ${theme === "light" ? "#f1f5f9" : "#334155"}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                            <div style={{ color: "#64748b" }}><FiActivity size={16} /></div>
                                                            <div>
                                                                <div style={{ fontSize: "13px", fontWeight: 600 }}>{file.name}</div>
                                                                <div style={{ fontSize: "11px", color: "#94a3b8" }}>{new Date(file.date).toLocaleDateString()}</div>
                                                            </div>
                                                        </div>
                                                        <a href={`${import.meta.env.VITE_API_URL || ""}/${file.url}`} target="_blank" rel="noreferrer" style={{ color: "#be123c", padding: "8px", borderRadius: "8px", background: "#fff1f2" }}>
                                                            <FiDownload size={14} />
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

                                {/* QUICK STATS */}
                                <div className="glass-card dashboard-anim" style={{ padding: "28px", borderRadius: "32px", background: "white", animationDelay: "0.6s" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
                                        <div style={{ width: "32px", height: "32px", background: "#f8fafc", color: "#64748b", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <FiTrendingUp size={18} />
                                        </div>
                                        <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>{t('accountSummary')}</h2>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                        <div style={{ paddingBottom: "16px", borderBottom: "1px solid #f1f5f9" }}>
                                            <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600, marginBottom: "4px" }}>{t('accountStatus')}</div>
                                            <div style={{ fontSize: "14px", fontWeight: 700, color: "#22c55e", display: "flex", alignItems: "center", gap: "6px" }}>
                                                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 10px #22c55e" }}></div>
                                                {t('activeAndVerified')}
                                            </div>
                                        </div>
                                        <div style={{ paddingBottom: "16px", borderBottom: `1px solid ${theme === "light" ? "#f1f5f9" : "#334155"}` }}>
                                            <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600, marginBottom: "4px" }}>{t('emailVerification')}</div>
                                            <div style={{ fontSize: "14px", fontWeight: 700, color: theme === "light" ? "#1e293b" : "#f1f5f9" }}>{t('verified')}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600, marginBottom: "4px" }}>{t('tcIdentity')}</div>
                                            <div style={{ fontSize: "14px", fontWeight: 700, color: theme === "light" ? "#1e293b" : "#f1f5f9" }}>{patientUser?.tc}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* ON-CALL DOCTORS */}
                                <div className="glass-card dashboard-anim" style={{ padding: "28px", borderRadius: "32px", background: "linear-gradient(135deg, white, #fef2f2)", animationDelay: "0.65s", border: "1px solid rgba(190, 18, 60, 0.1)" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                                        <div style={{ width: "32px", height: "32px", background: "#be123c", color: "white", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <FiClock size={16} />
                                        </div>
                                        <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>{lang === 'tr' ? 'Bugün Nöbetçi Doktorlar' : 'On-Call Doctors'}</h2>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                        {doctors.length > 0 ? doctors.slice(0, 3).map((doc, i) => (
                                            <div key={doc._id || i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px", borderBottom: i < 2 ? "1px solid rgba(190, 18, 60, 0.1)" : "none" }}>
                                                <div>
                                                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>{doc.name}</div>
                                                    <div style={{ fontSize: "11px", color: "#64748b" }}>{doc.specialty || "Pratisyen Hekim"}</div>
                                                </div>
                                                <div style={{ fontSize: "11px", fontWeight: 800, color: "#be123c", background: "#fff1f2", padding: "4px 8px", borderRadius: "6px" }}>
                                                    {i === 1 ? "16:00 - 08:00" : "08:00 - 16:00"}
                                                </div>
                                            </div>
                                        )) : (
                                            <div style={{ fontSize: "13px", color: "#64748b", textAlign: "center", padding: "10px" }}>{lang === 'tr' ? 'Nöbetçi doktor bilgisi alınamıyor.' : 'No on-call doctors available.'}</div>
                                        )}
                                    </div>
                                    <button onClick={() => setShowBookingModal(true)} style={{ marginTop: "16px", width: "100%", padding: "10px", background: "transparent", color: "#be123c", border: "1px solid rgba(190, 18, 60, 0.2)", borderRadius: "12px", fontWeight: 700, fontSize: "12px", cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.background = "#fff1f2"; e.currentTarget.style.borderColor = "#be123c"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(190, 18, 60, 0.2)"; }}>
                                        {lang === 'tr' ? 'Hemen Randevu Al' : 'Book Now'}
                                    </button>
                                </div>

                                {/* HISTORY */}
                                <div className="glass-card dashboard-anim" style={{ padding: "28px", borderRadius: "32px", background: "white", animationDelay: "0.7s", flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
                                        <div style={{ width: "32px", height: "32px", background: "#f8fafc", color: "#64748b", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <FiActivity size={18} />
                                        </div>
                                        <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>{t('pastTransactions')}</h2>
                                    </div>

                                    {pastAppointments.length === 0 ? (
                                        <p style={{ fontSize: "14px", color: "#94a3b8", fontWeight: 500, textAlign: "center", padding: "20px" }}>{t('noPastAppt')}</p>
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                            {pastAppointments.map(appt => (
                                                <div key={appt._id} style={{ padding: "14px", borderRadius: "16px", border: theme === "light" ? "1px solid #f8fafc" : "1px solid #334155", background: theme === "light" ? "#fcfcfc" : "rgba(255,255,255,0.02)" }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                                        <span style={{ fontSize: "13px", fontWeight: 700, color: theme === "light" ? "#334155" : "#f1f5f9" }}>{appt.doctorId?.name}</span>
                                                        <span style={{ fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "100px", background: appt.status === "tamamlandı" ? "#dcfce7" : "#fee2e2", color: appt.status === "tamamlandı" ? "#16a34a" : "#dc2626" }}>
                                                            {appt.status.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                        <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>{new Date(appt.date).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}</div>
                                                        {appt.status === "tamamlandı" && (
                                                            <div style={{ display: "flex", gap: "8px" }}>
                                                                <button
                                                                    onClick={() => setShowComposeModal({ show: true, receiverId: appt.doctorId?._id, receiverName: appt.doctorId?.name })}
                                                                    style={{ background: "none", border: "none", color: "#64748b", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                                                                >
                                                                    <FiMessageSquare size={12} /> {t('askDoctor')}
                                                                </button>
                                                                {appt.review?.rating ? (
                                                                    <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
                                                                        {[...Array(5)].map((_, i) => (
                                                                            <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i < appt.review.rating ? "#fbbf24" : "none"} stroke={i < appt.review.rating ? "#fbbf24" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                                                            </svg>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => openReviewModal(appt)}
                                                                        style={{ background: "none", border: "none", color: "#fbbf24", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                                                                    >
                                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                                                        </svg> {t('rateDoctor')}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>

            {/* AI Explanation Modal */}
            {explanationModal.show && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(8px)",
                    zIndex: 10001, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
                }} onClick={() => setExplanationModal({ ...explanationModal, show: false })}>
                    <div style={{
                        background: "white", width: "100%", maxWidth: "600px",
                        borderRadius: "24px", padding: "32px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        position: "relative"
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#1e293b", margin: 0 }}>
                                {explanationModal.title} - {lang === 'tr' ? 'AI Analizi' : 'AI Analysis'}
                            </h2>
                            <button onClick={() => setExplanationModal({ ...explanationModal, show: false })} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                                <FiXCircle size={24} />
                            </button>
                        </div>
                        <div style={{
                            fontSize: "15px", color: "#475569", lineHeight: "1.7",
                            background: "#f8fafc", padding: "20px", borderRadius: "16px",
                            maxHeight: "400px", overflowY: "auto", whiteSpace: "pre-wrap"
                        }}>
                            {explanationModal.content}
                        </div>
                        <div style={{ marginTop: "24px", textAlign: "right" }}>
                            <button
                                onClick={() => setExplanationModal({ ...explanationModal, show: false })}
                                style={{ padding: "12px 24px", background: "#be123c", color: "white", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "pointer" }}
                            >
                                {lang === 'tr' ? 'Anladım' : 'Got it'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Medication Modal */}
            {showAddMedModal && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: theme === "dark" ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.5)",
                    backdropFilter: "blur(8px)",
                    zIndex: 10006,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px"
                }} onClick={() => setShowAddMedModal(false)}>
                    <div style={{
                        background: theme === "dark" ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" : "white",
                        width: "100%",
                        maxWidth: "550px",
                        borderRadius: "28px",
                        padding: "36px",
                        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                        border: theme === "dark" ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
                        color: theme === "dark" ? "white" : "#0f172a"
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
                            <h2 style={{ fontSize: "22px", fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>
                                {t('addPersonalMedication')}
                            </h2>
                            <button onClick={() => setShowAddMedModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <FiX size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddSelfMedication} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "6px", textTransform: "uppercase" }}>{t('medName')}</label>
                                <input
                                    type="text"
                                    className="vital-input"
                                    placeholder={t('medNamePlaceholder')}
                                    value={newMedForm.name}
                                    onChange={e => setNewMedForm({ ...newMedForm, name: e.target.value })}
                                    required
                                    style={{
                                        background: theme === "dark" ? "rgba(255,255,255,0.03)" : "#f8fafc",
                                        border: theme === "dark" ? "1px solid rgba(255,255,255,0.05)" : "1px solid #e2e8f0",
                                        color: theme === "dark" ? "white" : "#0f172a",
                                        width: "100%",
                                        padding: "12px 16px",
                                        borderRadius: "12px",
                                        fontSize: "14px"
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "6px", textTransform: "uppercase" }}>{t('dosageVal')}</label>
                                <input
                                    type="text"
                                    className="vital-input"
                                    placeholder="ör. 1 tablet, 1 ölçek, 5 ml"
                                    value={newMedForm.dosage}
                                    onChange={e => setNewMedForm({ ...newMedForm, dosage: e.target.value })}
                                    required
                                    style={{
                                        background: theme === "dark" ? "rgba(255,255,255,0.03)" : "#f8fafc",
                                        border: theme === "dark" ? "1px solid rgba(255,255,255,0.05)" : "1px solid #e2e8f0",
                                        color: theme === "dark" ? "white" : "#0f172a",
                                        width: "100%",
                                        padding: "12px 16px",
                                        borderRadius: "12px",
                                        fontSize: "14px"
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "6px", textTransform: "uppercase" }}>{t('medFrequency')}</label>
                                <select
                                    className="vital-input"
                                    value={newMedForm.frequency}
                                    onChange={e => handleFrequencyChange(e.target.value)}
                                    style={{
                                        background: theme === "dark" ? "rgba(255,255,255,0.03)" : "#f8fafc",
                                        border: theme === "dark" ? "1px solid rgba(255,255,255,0.05)" : "1px solid #e2e8f0",
                                        color: theme === "dark" ? "white" : "#0f172a",
                                        width: "100%",
                                        padding: "12px 16px",
                                        borderRadius: "12px",
                                        fontSize: "14px"
                                    }}
                                >
                                    <option value="Günde 1 kez">{lang === "tr" ? "Günde 1 kez" : "1 time a day"}</option>
                                    <option value="Günde 2 kez">{lang === "tr" ? "Günde 2 kez" : "2 times a day"}</option>
                                    <option value="Günde 3 kez">{lang === "tr" ? "Günde 3 kez" : "3 times a day"}</option>
                                    <option value="Günde 4 kez">{lang === "tr" ? "Günde 4 kez" : "4 times a day"}</option>
                                    <option value="Özel">{lang === "tr" ? "Özel Saat Tanımla" : "Custom Schedule"}</option>
                                </select>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "6px", textTransform: "uppercase" }}>
                                        {lang === "tr" ? "Başlama Tarihi" : "Start Date"}
                                     </label>
                                     <input
                                         type="date"
                                         className="vital-input"
                                         value={newMedForm.startDate}
                                         onChange={e => setNewMedForm({ ...newMedForm, startDate: e.target.value })}
                                         required
                                         style={{
                                             background: theme === "dark" ? "rgba(255,255,255,0.03)" : "#f8fafc",
                                             border: theme === "dark" ? "1px solid rgba(255,255,255,0.05)" : "1px solid #e2e8f0",
                                             color: theme === "dark" ? "white" : "#0f172a",
                                             width: "100%",
                                             padding: "12px 16px",
                                             borderRadius: "12px",
                                             fontSize: "14px"
                                         }}
                                     />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "6px", textTransform: "uppercase" }}>
                                        {lang === "tr" ? "Bitiş Tarihi (Opsiyonel)" : "End Date (Optional)"}
                                     </label>
                                     <input
                                         type="date"
                                         className="vital-input"
                                         value={newMedForm.endDate}
                                         onChange={e => setNewMedForm({ ...newMedForm, endDate: e.target.value })}
                                         style={{
                                             background: theme === "dark" ? "rgba(255,255,255,0.03)" : "#f8fafc",
                                             border: theme === "dark" ? "1px solid rgba(255,255,255,0.05)" : "1px solid #e2e8f0",
                                             color: theme === "dark" ? "white" : "#0f172a",
                                             width: "100%",
                                             padding: "12px 16px",
                                             borderRadius: "12px",
                                             fontSize: "14px"
                                         }}
                                     />
                                </div>
                            </div>

                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", margin: 0, textTransform: "uppercase" }}>{t('timeSlots')}</label>
                                    {newMedForm.frequency === "Özel" && (
                                        <button
                                            type="button"
                                            onClick={addTimeSlotInput}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                color: "#fb7185",
                                                fontSize: "12px",
                                                fontWeight: 700,
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "4px"
                                            }}
                                        >
                                            <FiPlus size={14} /> {t('addTimeSlot')}
                                        </button>
                                    )}
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                                    {newMedForm.timeSlots.map((ts, idx) => (
                                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                            <input
                                                type="time"
                                                value={ts}
                                                onChange={e => handleTimeSlotChange(idx, e.target.value)}
                                                required
                                                style={{
                                                    background: theme === "dark" ? "rgba(255,255,255,0.03)" : "#f8fafc",
                                                    border: theme === "dark" ? "1px solid rgba(255,255,255,0.05)" : "1px solid #e2e8f0",
                                                    color: theme === "dark" ? "white" : "#0f172a",
                                                    padding: "10px 14px",
                                                    borderRadius: "10px",
                                                    fontSize: "14px"
                                                }}
                                            />
                                            {newMedForm.frequency === "Özel" && newMedForm.timeSlots.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeTimeSlotInput(idx)}
                                                    style={{
                                                        background: "none",
                                                        border: "none",
                                                        color: "#ef4444",
                                                        cursor: "pointer",
                                                        padding: "4px"
                                                    }}
                                                >
                                                    <FiX size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submittingSelfMed}
                                style={{
                                    marginTop: "12px",
                                    padding: "14px",
                                    borderRadius: "14px",
                                    border: "none",
                                    background: "linear-gradient(135deg, #fb7185 0%, #be123c 100%)",
                                    color: "white",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    fontSize: "16px",
                                    boxShadow: "0 10px 20px -5px rgba(225, 29, 72, 0.4)",
                                    transition: "all 0.3s ease"
                                }}
                            >
                                {submittingSelfMed ? (lang === "tr" ? "Kaydediliyor..." : "Saving...") : t('saveMed')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Family Modal */}
            {showFamilyModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", zIndex: 10005, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setShowFamilyModal(false)}>
                    <div style={{ background: "white", width: "100%", maxWidth: "550px", borderRadius: "24px", padding: "32px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
                            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#1e293b", margin: 0 }}>{editingFamilyId ? (lang === "tr" ? "Üye Bilgilerini Güncelle" : "Update Member Info") : (lang === "tr" ? "Yeni Aile Üyesi Ekle" : "Add New Family Member")}</h2>
                            <button onClick={() => setShowFamilyModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><FiXCircle size={24} /></button>
                        </div>
                        <form onSubmit={handleAddFamilyMember} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                            <div style={{ gridColumn: "span 2" }}>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "6px" }}>{lang === "tr" ? "YAKINLIK DERECESİ" : "RELATIONSHIP"}</label>
                                <select className="vital-input" value={familyForm.relationship} onChange={e => setFamilyForm({ ...familyForm, relationship: e.target.value })}>
                                    <option value="Child">{lang === "tr" ? "Çocuk" : "Child"}</option>
                                    <option value="Spouse">{lang === "tr" ? "Eş" : "Spouse"}</option>
                                    <option value="Parent">{lang === "tr" ? "Ebeveyn" : "Parent"}</option>
                                    <option value="Other">{lang === "tr" ? "Diğer" : "Other"}</option>
                                </select>
                            </div>
                            <div style={{ gridColumn: "span 2" }}>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "6px" }}>{lang === "tr" ? "T.C. KİMLİK NO" : "T.C. IDENTITY NO"}</label>
                                <input type="text" maxLength="11" className="vital-input" value={familyForm.tc} onChange={e => setFamilyForm({ ...familyForm, tc: e.target.value })} required disabled={editingFamilyId} style={{ background: editingFamilyId ? "#f8fafc" : "white" }} />
                            </div>
                            <div style={{ gridColumn: "span 2" }}>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "6px" }}>{lang === "tr" ? "AD SOYAD" : "FULL NAME"}</label>
                                <input type="text" className="vital-input" value={familyForm.name} onChange={e => setFamilyForm({ ...familyForm, name: e.target.value })} required />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "6px" }}>{lang === "tr" ? "YAŞ" : "AGE"}</label>
                                <input type="number" className="vital-input" value={familyForm.age} onChange={e => setFamilyForm({ ...familyForm, age: e.target.value })} required />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "6px" }}>{lang === "tr" ? "CİNSİYET" : "GENDER"}</label>
                                <select className="vital-input" value={familyForm.gender} onChange={e => setFamilyForm({ ...familyForm, gender: e.target.value })}>
                                    <option value="Erkek">{lang === "tr" ? "Erkek" : "Male"}</option>
                                    <option value="Kadın">{lang === "tr" ? "Kadın" : "Female"}</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "6px" }}>{lang === "tr" ? "KAN GRUBU" : "BLOOD TYPE"}</label>
                                <select className="vital-input" value={familyForm.bloodType} onChange={e => setFamilyForm({ ...familyForm, bloodType: e.target.value })}>
                                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bt => <option key={bt} value={bt}>{bt}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "6px" }}>{lang === "tr" ? "TELEFON" : "PHONE"}</label>
                                <input
                                    type="text"
                                    className="vital-input"
                                    value={familyForm.phone}
                                    onChange={(e) => {
                                        let val = e.target.value;
                                        let raw = val.replace(/[^\d]/g, "");
                                        if (raw.startsWith("90")) val = "+" + raw.slice(0, 12);
                                        else if (raw.length > 0) val = "+90" + raw.slice(0, 10);
                                        else val = "";
                                        setFamilyForm({ ...familyForm, phone: val });
                                    }}
                                />
                            </div>
                            <div style={{ gridColumn: "span 2" }}>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "6px" }}>{lang === "tr" ? "KRONİK HASTALIKLAR" : "CHRONIC DISEASES"}</label>
                                <input type="text" className="vital-input" value={familyForm.chronicDiseases} onChange={e => setFamilyForm({ ...familyForm, chronicDiseases: e.target.value })} placeholder={lang === "tr" ? "Varsa belirtin" : "Mention if any"} />
                            </div>
                            <div style={{ gridColumn: "span 2" }}>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "6px" }}>{lang === "tr" ? "ALERJİLER" : "ALLERGIES"}</label>
                                <input type="text" className="vital-input" value={familyForm.allergies} onChange={e => setFamilyForm({ ...familyForm, allergies: e.target.value })} placeholder={lang === "tr" ? "Varsa belirtin" : "Mention if any"} />
                            </div>
                            <button type="submit" disabled={isAddingFamily} style={{ gridColumn: "span 2", padding: "14px", borderRadius: "12px", background: "#be123c", color: "white", border: "none", fontWeight: 700, cursor: "pointer", marginTop: "10px" }}>
                                {isAddingFamily ? "..." : (editingFamilyId ? (lang === "tr" ? "Bilgileri Kaydet" : "Save Changes") : (lang === "tr" ? "Aile Üyesini Kaydet" : "Save Family Member"))}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <AIAssistant patientUser={patientUser} />

            {/* Vital History Modal */}
            {showHistoryModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", zIndex: 10002, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setShowHistoryModal(false)}>
                    <div style={{ background: "white", width: "100%", maxWidth: "600px", borderRadius: "24px", padding: "32px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
                            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#1e293b", margin: 0 }}>Sağlık Verisi Geçmişi</h2>
                            <button onClick={() => setShowHistoryModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><FiXCircle size={24} /></button>
                        </div>
                        <div style={{ maxHeight: "400px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
                            {historicalVitals.length === 0 ? (
                                <p style={{ textAlign: "center", color: "#64748b" }}>Henüz veri girişi yapılmamış.</p>
                            ) : (
                                historicalVitals.map(v => (
                                    <div key={v._id} style={{ padding: "16px", background: "#f8fafc", borderRadius: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e2e8f0" }}>
                                        <div>
                                            <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
                                                {v.type === 'blood_pressure' ? 'Tansiyon' : v.type === 'blood_sugar' ? 'Şeker' : v.type === 'weight' ? 'Kilo' : 'Nabız'}: {v.value} {v.unit}
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#64748b" }}>{new Date(v.date).toLocaleString()}</div>
                                            {v.notes && <div style={{ fontSize: "11px", color: "#be123c", marginTop: "4px" }}>Not: {v.notes}</div>}
                                        </div>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <button onClick={() => handleEditVitalClick(v)} style={{ background: "none", border: "none", color: "#0ea5e9", cursor: "pointer" }} title="Düzenle"><FiEdit2 size={18} /></button>
                                            <button onClick={() => handleDeleteVital(v._id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }} title="Sil"><FiXCircle size={18} /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Vital Entry Modal */}
            {showVitalModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", zIndex: 10003, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => { setShowVitalModal(false); setEditingVitalId(null); }}>
                    <div style={{ background: "white", width: "100%", maxWidth: "450px", borderRadius: "24px", padding: "32px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
                            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#1e293b", margin: 0 }}>{editingVitalId ? 'Veriyi Düzenle' : 'Sağlık Verisi Ekle'}</h2>
                            <button onClick={() => { setShowVitalModal(false); setEditingVitalId(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><FiXCircle size={24} /></button>
                        </div>
                        <form onSubmit={handleSaveVitalEntry} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            {!editingVitalId && (
                                <div>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#64748b", marginBottom: "8px" }}>VERİ TÜRÜ</label>
                                    <select
                                        className="vital-input"
                                        value={vitalForm.type}
                                        onChange={e => {
                                            const type = e.target.value;
                                            let unit = "mmHg";
                                            if (type === "blood_sugar") unit = "mg/dL";
                                            if (type === "weight") unit = "kg";
                                            if (type === "pulse") unit = "bpm";
                                            setVitalForm({ ...vitalForm, type, unit });
                                        }}
                                    >
                                        <option value="blood_pressure">Tansiyon</option>
                                        <option value="blood_sugar">Kan Şekeri</option>
                                        <option value="weight">Kilo</option>
                                        <option value="pulse">Nabız</option>
                                    </select>
                                </div>
                            )}
                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#64748b", marginBottom: "8px" }}>DEĞER ({vitalForm.unit})</label>
                                <input
                                    type="text"
                                    className="vital-input"
                                    placeholder={vitalForm.type === "blood_pressure" ? "120/80" : "Değer girin"}
                                    value={vitalForm.value}
                                    onChange={e => setVitalForm({ ...vitalForm, value: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#64748b", marginBottom: "8px" }}>NOTLAR</label>
                                <input
                                    type="text"
                                    className="vital-input"
                                    placeholder="Açlık/Tokluk vb."
                                    value={vitalForm.notes}
                                    onChange={e => setVitalForm({ ...vitalForm, notes: e.target.value })}
                                />
                            </div>
                            <button type="submit" style={{ width: "100%", padding: "14px", borderRadius: "12px", background: "#be123c", color: "white", border: "none", fontWeight: 700, cursor: "pointer", marginTop: "10px" }}>{editingVitalId ? 'Güncelle' : 'Kaydet'}</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", zIndex: 10004, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setShowPaymentModal(false)}>
                    <div style={{ background: "white", width: "100%", maxWidth: "450px", borderRadius: "24px", padding: "32px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
                            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#1e293b", margin: 0 }}>Ödeme Yap</h2>
                            <button onClick={() => setShowPaymentModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><FiXCircle size={24} /></button>
                        </div>

                        <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)", borderRadius: "16px", padding: "24px", color: "white", marginBottom: "24px", position: "relative", overflow: "hidden" }}>
                            <div style={{ fontSize: "12px", opacity: 0.7, marginBottom: "4px" }}>Toplam Tutar</div>
                            <div style={{ fontSize: "24px", fontWeight: 800 }}>{selectedAppointment?.fee || 500} TRY</div>
                            <div style={{ marginTop: "20px", fontSize: "14px", letterSpacing: "2px" }}>
                                {paymentForm.cardNumber ? paymentForm.cardNumber.replace(/\d{4}(?=.)/g, '$& ') : '**** **** **** ****'}
                            </div>
                            <FiCreditCard style={{ position: "absolute", top: "20px", right: "20px", fontSize: "32px", opacity: 0.2 }} />
                        </div>

                        <form onSubmit={handlePaymentSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "4px" }}>KART NUMARASI</label>
                                <input
                                    type="text"
                                    maxLength="16"
                                    placeholder="0000 0000 0000 0000"
                                    className="vital-input"
                                    value={paymentForm.cardNumber}
                                    onChange={e => setPaymentForm({ ...paymentForm, cardNumber: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "4px" }}>S.K.T</label>
                                    <input
                                        type="text"
                                        placeholder="MM/YY"
                                        className="vital-input"
                                        value={paymentForm.expiry}
                                        onChange={e => setPaymentForm({ ...paymentForm, expiry: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "4px" }}>CVC</label>
                                    <input
                                        type="text"
                                        maxLength="3"
                                        placeholder="123"
                                        className="vital-input"
                                        value={paymentForm.cvc}
                                        onChange={e => setPaymentForm({ ...paymentForm, cvc: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isProcessingPayment}
                                style={{ width: "100%", padding: "14px", borderRadius: "12px", background: "#be123c", color: "white", border: "none", fontWeight: 700, cursor: "pointer", marginTop: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                            >
                                {isProcessingPayment ? "İşleniyor..." : "Güvenli Ödeme Yap"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Global Medication Reminder Popup Modal ── */}
            {activeMedReminder && (
                <div 
                    style={{ 
                        position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
                        background: theme === "dark" ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.5)", 
                        backdropFilter: "blur(12px)", zIndex: 10008, 
                        display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" 
                    }} 
                    onClick={() => setActiveMedReminder(null)}
                >
                    <div 
                        style={{ 
                            background: theme === "dark" ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" : "white", 
                            width: "100%", maxWidth: "420px", 
                            borderRadius: "28px", padding: "36px", 
                            border: theme === "dark" ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
                            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)",
                            textAlign: "center",
                            position: "relative",
                            animation: "scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
                        }} 
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Glowing bell ring icon */}
                        <div style={{
                            width: "72px", height: "72px", borderRadius: "50%",
                            background: "rgba(244,63,94,0.12)", border: "2px solid #f43f5e",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            margin: "0 auto 24px", color: "#f43f5e",
                            boxShadow: "0 0 20px rgba(244,63,94,0.25)",
                            animation: "pulse 2s infinite"
                        }}>
                            <FiBell size={32} style={{ animation: "shake 0.5s infinite" }} />
                        </div>

                        <h2 style={{ fontSize: "22px", fontWeight: 900, color: theme === "dark" ? "white" : "#0f172a", margin: "0 0 8px", letterSpacing: "-0.5px" }}>
                            {lang === "tr" ? "İlaç Vakti Geldi!" : "Medication Time!"}
                        </h2>
                        
                        <p style={{ color: theme === "dark" ? "#94a3b8" : "#64748b", fontSize: "14px", margin: "0 0 24px" }}>
                            {lang === "tr" ? "Aşağıdaki ilacı alma saatiniz gelmiştir:" : "It is time to take the following medication:"}
                        </p>
 
                        {/* Medicine details block */}
                        <div style={{
                            background: theme === "dark" ? "rgba(255,255,255,0.03)" : "#f8fafc",
                            border: theme === "dark" ? "1px solid rgba(255,255,255,0.05)" : "1px solid #f1f5f9",
                            borderRadius: "20px", padding: "20px", marginBottom: "28px",
                            textAlign: "left"
                        }}>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: "#f43f5e", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
                                {activeMedReminder.timeSlot} - {lang === "tr" ? "BUGÜNKÜ DOZ" : "TODAY'S DOSE"}
                            </div>
                            <div style={{ fontSize: "18px", fontWeight: 800, color: theme === "dark" ? "white" : "#1e293b", marginBottom: "4px" }}>
                                {activeMedReminder.medicationName}
                            </div>
                            <div style={{ fontSize: "13px", fontWeight: 600, color: theme === "dark" ? "#94a3b8" : "#64748b" }}>
                                {lang === "tr" ? "Dozaj:" : "Dosage:"} <span style={{ color: theme === "dark" ? "#f8fafc" : "#1e293b" }}>{activeMedReminder.dosage}</span>
                            </div>
                            <div style={{ fontSize: "12px", color: theme === "dark" ? "#94a3b8" : "#64748b", marginTop: "8px", borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: "8px" }}>
                                {lang === "tr" ? "Yazan:" : "Prescribed by:"} <span style={{ fontWeight: 600 }}>{activeMedReminder.doctorName}</span>
                            </div>
                        </div>
 
                        {/* Actions */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            <button 
                                onClick={async () => {
                                    await handleToggleMedication(activeMedReminder);
                                    setActiveMedReminder(null);
                                }}
                                style={{ 
                                    width: "100%", padding: "14px", borderRadius: "14px", 
                                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", 
                                    color: "white", border: "none", fontWeight: 700, fontSize: "15px",
                                    cursor: "pointer", boxShadow: "0 8px 20px rgba(16,185,129,0.3)",
                                    transition: "all 0.2s"
                                }}
                            >
                                {lang === "tr" ? "İçtim / Aldım" : "I Have Taken It"}
                            </button>
                            <button 
                                onClick={() => setActiveMedReminder(null)}
                                style={{ 
                                    width: "100%", padding: "12px", borderRadius: "14px", 
                                    background: "transparent", 
                                    color: theme === "dark" ? "#94a3b8" : "#64748b", border: theme === "dark" ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0", fontWeight: 700, fontSize: "14px",
                                    cursor: "pointer", transition: "all 0.2s"
                                }}
                            >
                                {lang === "tr" ? "Daha Sonra / Kapat" : "Snooze / Dismiss"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Settings Modal */}
            {
                showSettings && (
                    <div style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0, 0, 0, 0.5)",
                        backdropFilter: "blur(8px)",
                        zIndex: 1000,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px"
                    }} onClick={() => setShowSettings(false)}>
                        {/* ... (Settings Modal Content - unchanged) ... */}
                        <div style={{
                            background: theme === "light" ? "white" : "#1e293b",
                            width: "100%",
                            maxWidth: "500px",
                            borderRadius: "24px",
                            padding: "32px",
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                            position: "relative"
                        }} onClick={e => e.stopPropagation()}>
                            {/* Header */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                <h2 style={{ fontSize: "24px", fontWeight: 800, color: theme === "light" ? "#1e293b" : "#f8fafc", margin: 0 }}>{t('settingsTitle')}</h2>
                                <button onClick={() => setShowSettings(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                                    <FiXCircle size={24} />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div style={{ display: "flex", gap: "12px", marginBottom: "24px", background: theme === "light" ? "#f1f5f9" : "rgba(15, 23, 42, 0.5)", padding: "4px", borderRadius: "12px" }}>
                                <button
                                    onClick={() => setSettingsTab("profile")}
                                    style={{
                                        flex: 1,
                                        padding: "10px",
                                        borderRadius: "8px",
                                        border: "none",
                                        background: settingsTab === "profile" ? (theme === "light" ? "white" : "#334155") : "transparent",
                                        color: settingsTab === "profile" ? (theme === "light" ? "#dc2626" : "white") : "#64748b",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "8px"
                                    }}
                                >
                                    <FiUser size={18} /> {t('profileInfo')}
                                </button>
                                <button
                                    onClick={() => setSettingsTab("security")}
                                    style={{
                                        flex: 1,
                                        padding: "10px",
                                        borderRadius: "8px",
                                        border: "none",
                                        background: settingsTab === "security" ? (theme === "light" ? "white" : "#334155") : "transparent",
                                        color: settingsTab === "security" ? (theme === "light" ? "#dc2626" : "white") : "#64748b",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "8px"
                                    }}
                                >
                                    <FiLock size={18} /> {t('security')}
                                </button>
                            </div>

                            {/* Tab Content */}
                            {settingsTab === "profile" ? (
                                <form onSubmit={handleUpdateProfile}>
                                    <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: "8px", display: "flex", flexDirection: "column", gap: "20px" }}>
                                        {/* Basic Info */}
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                            <div style={{ gridColumn: "span 2" }}>
                                                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: theme === "light" ? "#64748b" : "#94a3b8", marginBottom: "8px", textTransform: "uppercase" }}>{t('fullName')}</label>
                                                <input type="text" className="vital-input" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "10px", color: theme === "light" ? "#1e293b" : "white" }} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: theme === "light" ? "#64748b" : "#94a3b8", marginBottom: "8px", textTransform: "uppercase" }}>{t('email')}</label>
                                                <input type="email" className="vital-input" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "10px", color: theme === "light" ? "#1e293b" : "white" }} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: theme === "light" ? "#64748b" : "#94a3b8", marginBottom: "8px", textTransform: "uppercase" }}>{t('phone')}</label>
                                                <input
                                                    type="text"
                                                    className="vital-input"
                                                    value={profileForm.phone}
                                                    onChange={(e) => {
                                                        let val = e.target.value;
                                                        let raw = val.replace(/[^\d]/g, "");
                                                        if (raw.startsWith("90")) val = "+" + raw.slice(0, 12);
                                                        else if (raw.length > 0) val = "+90" + raw.slice(0, 10);
                                                        else val = "";
                                                        setProfileForm({ ...profileForm, phone: val });
                                                    }}
                                                    style={{ width: "100%", padding: "12px", borderRadius: "10px", color: theme === "light" ? "#1e293b" : "white" }}
                                                />
                                            </div>
                                            <div style={{ gridColumn: "span 2" }}>
                                                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: theme === "light" ? "#64748b" : "#94a3b8", marginBottom: "8px", textTransform: "uppercase" }}>{t('bloodType')}</label>
                                                <select className="vital-input" value={profileForm.bloodType} onChange={e => setProfileForm({ ...profileForm, bloodType: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "10px", color: theme === "light" ? "#1e293b" : "white", background: theme === "light" ? "white" : "#1e293b" }}>
                                                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bt => <option key={bt} value={bt}>{bt}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Medical Info */}
                                        <div style={{ borderTop: `1px dashed ${theme === "light" ? "#e2e8f0" : "rgba(255,255,255,0.1)"}`, paddingTop: "20px" }}>
                                            <h4 style={{ fontSize: "12px", fontWeight: 800, color: "#be123c", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "1px" }}>{t('medicalInfo')}</h4>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                                {/* Kronik Hastalıklar — Chip Editörü */}
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: theme === 'light' ? '#64748b' : '#94a3b8', marginBottom: '8px' }}>{t('chronicDiseases')}</label>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '10px', borderRadius: '12px', background: theme === 'light' ? '#f8fafc' : '#1e293b', border: `1px solid ${theme === 'light' ? '#e2e8f0' : '#334155'}`, minHeight: '48px' }}>
                                                        {(profileForm.chronicDiseases ? profileForm.chronicDiseases.split(',').map(s => s.trim()).filter(Boolean) : []).map((chip, idx) => (
                                                            <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', color: '#1e40af', borderRadius: '100px', fontSize: '12px', fontWeight: 700 }}>
                                                                {chip}
                                                                <button onClick={() => {
                                                                    const chips = profileForm.chronicDiseases.split(',').map(s => s.trim()).filter(Boolean);
                                                                    chips.splice(idx, 1);
                                                                    setProfileForm({ ...profileForm, chronicDiseases: chips.join(', ') });
                                                                }} style={{ background: 'none', border: 'none', color: '#1e40af', cursor: 'pointer', padding: 0, fontSize: '14px', lineHeight: 1, display: 'flex' }}>×</button>
                                                            </span>
                                                        ))}
                                                        <input
                                                            type="text"
                                                            placeholder={t('chipPlaceholder')}
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter' && e.target.value.trim()) {
                                                                    e.preventDefault();
                                                                    const chips = profileForm.chronicDiseases ? profileForm.chronicDiseases.split(',').map(s => s.trim()).filter(Boolean) : [];
                                                                    chips.push(e.target.value.trim());
                                                                    setProfileForm({ ...profileForm, chronicDiseases: chips.join(', ') });
                                                                    e.target.value = '';
                                                                }
                                                            }}
                                                            style={{ border: 'none', background: 'none', outline: 'none', fontSize: '13px', fontWeight: 600, color: theme === 'light' ? '#1e293b' : 'white', minWidth: '120px', padding: '4px' }}
                                                        />
                                                    </div>
                                                </div>
                                                {/* Alerjiler — Chip Editörü */}
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: theme === 'light' ? '#64748b' : '#94a3b8', marginBottom: '8px' }}>{t('allergies')}</label>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '10px', borderRadius: '12px', background: theme === 'light' ? '#f8fafc' : '#1e293b', border: `1px solid ${theme === 'light' ? '#e2e8f0' : '#334155'}`, minHeight: '48px' }}>
                                                        {(profileForm.allergies ? profileForm.allergies.split(',').map(s => s.trim()).filter(Boolean) : []).map((chip, idx) => (
                                                            <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: 'linear-gradient(135deg, #fff1f2, #fecdd3)', color: '#be123c', borderRadius: '100px', fontSize: '12px', fontWeight: 700 }}>
                                                                {chip}
                                                                <button onClick={() => {
                                                                    const chips = profileForm.allergies.split(',').map(s => s.trim()).filter(Boolean);
                                                                    chips.splice(idx, 1);
                                                                    setProfileForm({ ...profileForm, allergies: chips.join(', ') });
                                                                }} style={{ background: 'none', border: 'none', color: '#be123c', cursor: 'pointer', padding: 0, fontSize: '14px', lineHeight: 1, display: 'flex' }}>×</button>
                                                            </span>
                                                        ))}
                                                        <input
                                                            type="text"
                                                            placeholder={t('chipPlaceholder')}
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter' && e.target.value.trim()) {
                                                                    e.preventDefault();
                                                                    const chips = profileForm.allergies ? profileForm.allergies.split(',').map(s => s.trim()).filter(Boolean) : [];
                                                                    chips.push(e.target.value.trim());
                                                                    setProfileForm({ ...profileForm, allergies: chips.join(', ') });
                                                                    e.target.value = '';
                                                                }
                                                            }}
                                                            style={{ border: 'none', background: 'none', outline: 'none', fontSize: '13px', fontWeight: 600, color: theme === 'light' ? '#1e293b' : 'white', minWidth: '120px', padding: '4px' }}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: theme === "light" ? "#64748b" : "#94a3b8", marginBottom: "8px" }}>{t('smokingAlcohol')}</label>
                                                    <input type="text" className="vital-input" value={profileForm.smokingAlcoholStatus} onChange={e => setProfileForm({ ...profileForm, smokingAlcoholStatus: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "10px", color: theme === "light" ? "#1e293b" : "white" }} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Emergency Contact */}
                                        <div style={{ borderTop: `1px dashed ${theme === "light" ? "#e2e8f0" : "rgba(255,255,255,0.1)"}`, paddingTop: "20px" }}>
                                            <h4 style={{ fontSize: "12px", fontWeight: 800, color: "#be123c", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "1px" }}>{t('emergencyContact')}</h4>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                                <div>
                                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: theme === "light" ? "#64748b" : "#94a3b8", marginBottom: "8px" }}>{t('emergencyName')}</label>
                                                    <input type="text" className="vital-input" value={profileForm.emergencyContact.name} onChange={e => setProfileForm({ ...profileForm, emergencyContact: { ...profileForm.emergencyContact, name: e.target.value } })} style={{ width: "100%", padding: "12px", borderRadius: "10px", color: theme === "light" ? "#1e293b" : "white" }} />
                                                </div>
                                                <div>
                                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: theme === "light" ? "#64748b" : "#94a3b8", marginBottom: "8px" }}>{t('emergencyPhone')}</label>
                                                    <input
                                                        type="text"
                                                        className="vital-input"
                                                        value={profileForm.emergencyContact.phone}
                                                        onChange={(e) => {
                                                            let val = e.target.value;
                                                            let raw = val.replace(/[^\d]/g, "");
                                                            if (raw.startsWith("90")) val = "+" + raw.slice(0, 12);
                                                            else if (raw.length > 0) val = "+90" + raw.slice(0, 10);
                                                            else val = "";
                                                            setProfileForm({ ...profileForm, emergencyContact: { ...profileForm.emergencyContact, phone: val } });
                                                        }}
                                                        style={{ width: "100%", padding: "12px", borderRadius: "10px", color: theme === "light" ? "#1e293b" : "white" }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={updatingProfile}
                                        style={{
                                            width: "100%",
                                            marginTop: "24px",
                                            padding: "14px",
                                            borderRadius: "12px",
                                            background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
                                            color: "white",
                                            border: "none",
                                            fontWeight: 700,
                                            cursor: updatingProfile ? "not-allowed" : "pointer",
                                            opacity: updatingProfile ? 0.7 : 1,
                                            transition: "all 0.3s ease",
                                            boxShadow: "0 10px 15px -3px rgba(220, 38, 38, 0.3)"
                                        }}
                                    >
                                        {updatingProfile ? t('loading') : t('saveChanges')}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleChangePassword}>
                                    <div style={{ display: "grid", gap: "16px" }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: theme === "light" ? "#64748b" : "#94a3b8" }}>{t('currentPass')}</label>
                                            <input
                                                type="password"
                                                className="vital-input"
                                                value={passwordForm.currentPassword}
                                                onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                                style={{ width: "100%", padding: "12px", borderRadius: "10px", color: theme === "light" ? "#1e293b" : "white" }}
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <div style={{ borderTop: `1px solid ${theme === "light" ? "#f1f5f9" : "rgba(255,255,255,0.05)"}`, paddingTop: "16px" }}>
                                            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: theme === "light" ? "#64748b" : "#94a3b8" }}>{t('newPass')}</label>
                                            <input
                                                type="password"
                                                className="vital-input"
                                                value={passwordForm.newPassword}
                                                onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                style={{ width: "100%", padding: "12px", borderRadius: "10px", color: theme === "light" ? "#1e293b" : "white" }}
                                                placeholder={t('passPlaceholder')}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: theme === "light" ? "#64748b" : "#94a3b8" }}>{t('confirmPass')}</label>
                                            <input
                                                type="password"
                                                className="vital-input"
                                                value={passwordForm.confirmPassword}
                                                onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                style={{ width: "100%", padding: "12px", borderRadius: "10px", color: theme === "light" ? "#1e293b" : "white" }}
                                                placeholder={t('confirmPassPlaceholder')}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={changingPassword}
                                        style={{
                                            width: "100%",
                                            marginTop: "24px",
                                            padding: "14px",
                                            borderRadius: "12px",
                                            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                                            color: "white",
                                            border: "none",
                                            fontWeight: 700,
                                            cursor: changingPassword ? "not-allowed" : "pointer",
                                            opacity: changingPassword ? 0.7 : 1,
                                            transition: "all 0.3s ease"
                                        }}
                                    >
                                        {changingPassword ? t('loading') : t('updatePass')}
                                    </button>

                                    {/* Danger Zone: Delete Account */}
                                    <div style={{ marginTop: "32px", padding: "20px", borderRadius: "16px", border: "1px solid rgba(220,38,38,0.2)", background: "rgba(220,38,38,0.03)" }}>
                                        <h4 style={{ fontSize: "12px", fontWeight: 800, color: "#dc2626", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                                            <FiAlertTriangle size={14} /> {lang === 'tr' ? 'Tehlikeli Bölge' : 'Danger Zone'}
                                        </h4>
                                        <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "14px", lineHeight: 1.6 }}>
                                            {lang === 'tr' ? 'Hesabınızı kalıcı olarak silmek için aşağıdaki butona tıklayın. Bu işlem geri alınamaz.' : 'Click below to permanently delete your account. This action cannot be undone.'}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setShowDeleteAccountModal(true)}
                                            style={{ padding: "10px 20px", borderRadius: "10px", background: "rgba(220,38,38,0.08)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.2)", fontWeight: 700, fontSize: "13px", cursor: "pointer", transition: "all 0.2s", width: "100%" }}
                                            onMouseEnter={e => { e.currentTarget.style.background = "#dc2626"; e.currentTarget.style.color = "white"; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = "rgba(220,38,38,0.08)"; e.currentTarget.style.color = "#dc2626"; }}
                                        >
                                            <FiTrash2 style={{ marginRight: "8px" }} />
                                            {lang === 'tr' ? 'Hesabımı Sil' : 'Delete My Account'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div >
                    </div >
                )
            }

            {/* Delete Account Confirmation Modal */}
            {showDeleteAccountModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setShowDeleteAccountModal(false)}>
                    <div style={{ background: theme === "light" ? "white" : "#1e293b", width: "100%", maxWidth: "420px", borderRadius: "24px", padding: "32px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4)", animation: "fadeIn 0.3s ease" }} onClick={e => e.stopPropagation()}>
                        <div style={{ width: "64px", height: "64px", background: "linear-gradient(135deg, #fee2e2, #fecaca)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                            <FiTrash2 size={28} color="#dc2626" />
                        </div>
                        <h2 style={{ fontSize: "22px", fontWeight: 800, color: theme === "light" ? "#1e293b" : "white", textAlign: "center", marginBottom: "10px" }}>
                            {lang === 'tr' ? 'Hesabı Sil' : 'Delete Account'}
                        </h2>
                        <p style={{ fontSize: "14px", color: "#64748b", textAlign: "center", marginBottom: "24px", lineHeight: 1.6 }}>
                            {lang === 'tr' ? 'Bu işlem geri alınamaz. Devam etmek için şifrenizi girin.' : 'This cannot be undone. Enter your password to confirm.'}
                        </p>
                        <input
                            type="password"
                            className="vital-input"
                            placeholder={lang === 'tr' ? 'Şifrenizi girin...' : 'Enter your password...'}
                            value={deleteAccountPassword}
                            onChange={e => setDeleteAccountPassword(e.target.value)}
                            style={{ width: "100%", padding: "12px", borderRadius: "10px", marginBottom: "16px", border: "1px solid rgba(220,38,38,0.3)", color: theme === "light" ? "#1e293b" : "white", background: theme === "light" ? "white" : "#1e293b" }}
                        />
                        <div style={{ display: "flex", gap: "12px" }}>
                            <button onClick={() => { setShowDeleteAccountModal(false); setDeleteAccountPassword(""); }} style={{ flex: 1, padding: "12px", borderRadius: "12px", background: theme === "light" ? "#f1f5f9" : "rgba(255,255,255,0.05)", color: "#64748b", border: "none", fontWeight: 700, cursor: "pointer" }}>
                                {t('cancel')}
                            </button>
                            <button onClick={handleDeleteAccount} disabled={isDeletingAccount} style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "linear-gradient(135deg, #dc2626, #991b1b)", color: "white", border: "none", fontWeight: 700, cursor: isDeletingAccount ? "not-allowed" : "pointer", opacity: isDeletingAccount ? 0.7 : 1 }}>
                                {isDeletingAccount ? t('loading') : (lang === 'tr' ? 'Evet, Sil' : 'Yes, Delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Cancel Confirmation Modal */}
            {
                cancelModal.show && (
                    <div style={{
                        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                        background: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(8px)",
                        zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "20px", animation: "fadeIn 0.3s ease"
                    }} onClick={() => setCancelModal({ show: false, appointmentId: null })}>
                        <div className="dashboard-anim" style={{
                            background: theme === "light" ? "white" : "#1e293b",
                            width: "100%", maxWidth: "400px", borderRadius: "24px", padding: "32px",
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                            textAlign: "center"
                        }} onClick={e => e.stopPropagation()}>
                            <div style={{ width: "64px", height: "64px", background: "#fee2e2", color: "#dc2626", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                                <FiXCircle size={32} />
                            </div>
                            <h2 style={{ fontSize: "22px", fontWeight: 800, color: theme === "light" ? "#1e293b" : "white", marginBottom: "12px" }}>{t('areYouSure')}</h2>
                            <p style={{ fontSize: "15px", color: theme === "light" ? "#64748b" : "#94a3b8", marginBottom: "28px", lineHeight: "1.5" }}>
                                {t('cancelWarning')}
                            </p>
                            <div style={{ display: "flex", gap: "12px" }}>
                                <button
                                    onClick={() => setCancelModal({ show: false, appointmentId: null })}
                                    style={{
                                        flex: 1, padding: "12px", borderRadius: "12px",
                                        background: theme === "light" ? "#f1f5f9" : "rgba(255,255,255,0.05)",
                                        color: theme === "light" ? "#64748b" : "#cbd5e1",
                                        border: "none", fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
                                    }}
                                >
                                    {t('giveUp')}
                                </button>
                                <button
                                    onClick={confirmCancel}
                                    style={{
                                        flex: 1, padding: "12px", borderRadius: "12px",
                                        background: "#dc2626", color: "white",
                                        border: "none", fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                                        boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)"
                                    }}
                                >
                                    {t('yesCancel')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Booking Modal */}
            {
                showBookingModal && (
                    <div style={{
                        position: "fixed",
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: "rgba(0, 0, 0, 0.5)",
                        backdropFilter: "blur(8px)",
                        zIndex: 1000,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "20px"
                    }} onClick={() => { setShowBookingModal(false); setBookingError(""); }}>
                        <div style={{
                            background: theme === "light" ? "white" : "#1e293b",
                            width: "100%", maxWidth: "550px",
                            borderRadius: "24px", padding: "32px",
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        }} onClick={e => e.stopPropagation()}>
                            {bookingSuccess ? (
                                <div className="dashboard-anim" style={{ textAlign: "center", padding: "40px 20px" }}>
                                    <div style={{ width: "80px", height: "80px", background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)", color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: "0 10px 25px -5px rgba(22, 163, 74, 0.4)" }}>
                                        <FiUserCheck size={40} />
                                    </div>
                                    <h2 style={{ fontSize: "28px", fontWeight: 800, color: theme === "light" ? "#1e293b" : "white", marginBottom: "16px" }}>{t('bookingSuccessTitle')}</h2>
                                    <p style={{ fontSize: "16px", color: theme === "light" ? "#64748b" : "#94a3b8", marginBottom: "32px", lineHeight: "1.6" }}>
                                        {t('bookingSuccessDesc')}
                                    </p>
                                    <button
                                        onClick={() => { setShowBookingModal(false); setBookingSuccess(false); setBookingError(""); }}
                                        style={{
                                            padding: "14px 32px", borderRadius: "100px", background: "#be123c",
                                            color: "white", fontWeight: 700, border: "none", cursor: "pointer",
                                            boxShadow: "0 10px 20px -5px rgba(190, 18, 60, 0.4)", transition: "all 0.3s"
                                        }}
                                    >
                                        {t('closeWindow')}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                                        <div>
                                            <h2 style={{ fontSize: "24px", fontWeight: 800, color: theme === "light" ? "#1e293b" : "#f8fafc", margin: 0 }}>{t('newAppointment')}</h2>
                                            <p style={{ fontSize: "14px", color: "#64748b", margin: "4px 0 0 0" }}>{t('selectDocTime')}</p>
                                        </div>
                                        <button onClick={() => { setShowBookingModal(false); setBookingError(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                                            <FiXCircle size={24} />
                                        </button>
                                    </div>

                                    <form onSubmit={handleBookAppointment}>
                                        {bookingError && (
                                            <div className="dashboard-anim" style={{
                                                padding: "16px", background: "#fff1f2", borderLeft: "4px solid #be123c",
                                                borderRadius: "8px", marginBottom: "20px", color: "#be123c", fontSize: "14px", fontWeight: 600,
                                                display: "flex", alignItems: "center", gap: "10px"
                                            }}>
                                                <FiXCircle size={20} style={{ minWidth: "20px" }} />
                                                <span>{bookingError}</span>
                                            </div>
                                        )}

                                        {/* WHO IS THIS FOR */}
                                        <div style={{ marginBottom: "20px" }}>
                                            <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#64748b", marginBottom: "8px", textTransform: "uppercase" }}>{lang === 'tr' ? 'RANDEVU KİMİN İÇİN?' : 'WHO IS THIS FOR?'}</label>
                                            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                                <button
                                                    type="button"
                                                    onClick={() => setBookingFor(null)}
                                                    style={{
                                                        padding: "10px 16px", borderRadius: "12px", fontSize: "13px", fontWeight: 700,
                                                        background: bookingFor === null ? "#be123c" : "#f1f5f9",
                                                        color: bookingFor === null ? "white" : "#475569",
                                                        border: "none", cursor: "pointer", transition: "all 0.2s"
                                                    }}
                                                >
                                                    {lang === 'tr' ? 'Kendim' : 'Myself'}
                                                </button>
                                                {familyMembers.map(member => (
                                                    <button
                                                        key={member._id}
                                                        type="button"
                                                        onClick={() => setBookingFor(member._id)}
                                                        style={{
                                                            padding: "10px 16px", borderRadius: "12px", fontSize: "13px", fontWeight: 700,
                                                            background: bookingFor === member._id ? "#be123c" : "#f1f5f9",
                                                            color: bookingFor === member._id ? "white" : "#475569",
                                                            border: "none", cursor: "pointer", transition: "all 0.2s",
                                                            display: "flex", flexDirection: "column", alignItems: "center", gap: "2px"
                                                        }}
                                                    >
                                                        <span>{member.name}</span>
                                                        <span style={{ fontSize: "10px", opacity: 0.8, fontWeight: 600 }}>({member.relationship || "Other"})</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Symptom Input for Triage */}
                                        <div style={{ marginBottom: "20px" }}>
                                            <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#64748b", marginBottom: "8px", textTransform: "uppercase" }}>{lang === 'tr' ? 'ŞİKAYETİNİZİ BELİRTİN (AI ANALİZİ İÇİN)' : 'DESCRIBE SYMPTOMS (FOR AI ANALYSIS)'}</label>
                                            <div style={{ position: "relative" }}>
                                                <textarea
                                                    value={symptoms}
                                                    onChange={e => setSymptoms(e.target.value)}
                                                    placeholder={lang === 'tr' ? "Örn: Şiddetli baş ağrısı ve halsizlik..." : "e.g. Severe headache and fatigue..."}
                                                    style={{
                                                        width: "100%", padding: "12px 16px", borderRadius: "16px",
                                                        border: "2px solid #e2e8f0", fontSize: "14px", minHeight: "80px",
                                                        resize: "none", transition: "all 0.3s", outline: "none"
                                                    }}
                                                    onFocus={e => e.target.style.borderColor = "#be123c"}
                                                    onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleGetSmartRecs(symptoms)}
                                                    disabled={isTriageLoading}
                                                    style={{
                                                        position: "absolute", bottom: "10px", right: "10px",
                                                        padding: "6px 12px", background: "#be123c", color: "white",
                                                        border: "none", borderRadius: "10px", fontSize: "11px", fontWeight: 700,
                                                        cursor: "pointer", display: "flex", alignItems: "center", gap: "6px"
                                                    }}
                                                >
                                                    {isTriageLoading ? (
                                                        <div style={{ width: "10px", height: "10px", border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                                                    ) : <FiActivity size={12} />}
                                                    {lang === 'tr' ? 'Analiz Et' : 'Analyze'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* SMART SUGGESTIONS BOX */}
                                        {smartRecs && (
                                            <div className="dashboard-anim" style={{
                                                padding: "16px", background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                                                borderRadius: "20px", marginBottom: "24px", border: "1px solid #bae6fd",
                                                display: "flex", flexDirection: "column", gap: "12px"
                                            }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <div style={{ width: "24px", height: "24px", background: "#0ea5e9", color: "white", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        <FiTrendingUp size={14} />
                                                    </div>
                                                    <span style={{ fontSize: "13px", fontWeight: 800, color: "#0369a1", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t('smartSuggestions')}</span>
                                                </div>

                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                                    {smartRecs.suggestedSpecialty && !bookingForm.specialtyId && (
                                                        <div style={{ background: "white", padding: "12px", borderRadius: "14px", border: "1px solid #e0f2fe" }}>
                                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                                                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>{t('suggestedSpecialty')}</div>
                                                                {smartRecs.triage?.urgency && (
                                                                    <span style={{
                                                                        fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px",
                                                                        background: smartRecs.triage.urgency === 'Yüksek' ? '#fee2e2' : '#fef9c3',
                                                                        color: smartRecs.triage.urgency === 'Yüksek' ? '#dc2626' : '#854d0e'
                                                                    }}>
                                                                        {smartRecs.triage.urgency}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                                <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{smartRecs.suggestedSpecialty}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setBookingForm({ ...bookingForm, specialtyId: smartRecs.suggestedSpecialty })}
                                                                    style={{ padding: "4px 8px", background: "#e0f2fe", color: "#0369a1", border: "none", borderRadius: "6px", fontSize: "10px", fontWeight: 800, cursor: "pointer" }}
                                                                >
                                                                    {t('useSuggestion')}
                                                                </button>
                                                            </div>
                                                            {smartRecs.triage?.predictedCondition && (
                                                                <div style={{ fontSize: "10px", color: "#0ea5e9", marginTop: "4px", fontWeight: 500, fontStyle: "italic" }}>
                                                                    Olası: {smartRecs.triage.predictedCondition}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {bookingForm.specialtyId && smartRecs.recommendedDoctors[bookingForm.specialtyId] && bookingForm.doctorId !== smartRecs.recommendedDoctors[bookingForm.specialtyId] && (
                                                        <div style={{ background: "white", padding: "12px", borderRadius: "14px", border: "1px solid #e0f2fe" }}>
                                                            <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, marginBottom: "4px" }}>{t('lessBusyDoctor')}</div>
                                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                                <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                                                                    {doctors.find(d => d._id === smartRecs.recommendedDoctors[bookingForm.specialtyId])?.name}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setBookingForm({ ...bookingForm, doctorId: smartRecs.recommendedDoctors[bookingForm.specialtyId] })}
                                                                    style={{ padding: "4px 8px", background: "#dcfce7", color: "#16a34a", border: "none", borderRadius: "6px", fontSize: "10px", fontWeight: 800, cursor: "pointer" }}
                                                                >
                                                                    {t('useSuggestion')}
                                                                </button>
                                                            </div>
                                                            <div style={{ fontSize: "10px", color: "#22c55e", marginTop: "4px", fontWeight: 500 }}>{t('highlyRecommended')}</div>
                                                        </div>
                                                    )}

                                                    {bookingForm.date && (
                                                        <div style={{ background: "white", padding: "12px", borderRadius: "14px", border: "1px solid #e0f2fe", gridColumn: "span 2" }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                                <FiClock size={12} color="#0ea5e9" />
                                                                <span style={{ fontSize: "12px", color: "#0369a1", fontWeight: 700 }}>{t('optimalTime')}: {smartRecs.optimalSlotRule}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        <div style={{ display: "grid", gap: "20px" }}>
                                            <div>
                                                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: theme === "light" ? "#64748b" : "#94a3b8" }}>{t('specialtySelection')}</label>
                                                <select
                                                    className="vital-input"
                                                    required
                                                    value={bookingForm.specialtyId}
                                                    onChange={e => { setBookingForm({ ...bookingForm, specialtyId: e.target.value, doctorId: "" }); setBookingError(""); }}
                                                    style={{ background: theme === "light" ? "white" : "#0f172a" }}
                                                >
                                                    <option value="">{t('pleaseSelectSpecialty')}</option>
                                                    {Array.from(new Set(doctors.map(d => d.specialty).filter(s => s)))
                                                        .map(spec => (
                                                            <option key={spec} value={spec}>{spec}</option>
                                                        ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: theme === "light" ? "#64748b" : "#94a3b8" }}>{t('doctorSelection')}</label>
                                                <select
                                                    className="vital-input"
                                                    required
                                                    value={bookingForm.doctorId}
                                                    onChange={e => setBookingForm({ ...bookingForm, doctorId: e.target.value })}
                                                    style={{ background: theme === "light" ? "white" : "#0f172a" }}
                                                    disabled={!bookingForm.specialtyId}
                                                >
                                                    <option value="">{bookingForm.specialtyId ? t('pleaseSelectDoctor') : t('selectSpecialtyFirst')}</option>
                                                    {doctors
                                                        .filter(doc => {
                                                            const docSpec = (doc.specialty || "").toLowerCase();
                                                            const selectedSpec = (bookingForm.specialtyId || "").toLowerCase();
                                                            return docSpec.includes(selectedSpec) || selectedSpec.includes(docSpec);
                                                        })
                                                        .map(doc => (
                                                            <option key={doc._id} value={doc._id}>
                                                                {doc.title ? `${doc.title} ` : ""}{doc.name}
                                                            </option>
                                                        ))}
                                                </select>
                                            </div>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                                <div>
                                                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: theme === "light" ? "#64748b" : "#94a3b8" }}>{t('dateLabel')}</label>
                                                    <DatePicker
                                                        selected={bookingForm.date ? new Date(bookingForm.date + "T12:00:00") : null}
                                                        onChange={date => {
                                                            if (date) {
                                                                const formatted = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, '0') + "-" + String(date.getDate()).padStart(2, '0');
                                                                setBookingForm({ ...bookingForm, date: formatted, time: "" });
                                                            } else {
                                                                setBookingForm({ ...bookingForm, date: "", time: "" });
                                                            }
                                                        }}
                                                        filterDate={date => date.getDay() !== 0}
                                                        minDate={new Date()}
                                                        className="vital-input"
                                                        placeholderText={t('selectDate')}
                                                        dateFormat="dd.MM.yyyy"
                                                        locale={lang === 'tr' ? tr : undefined}
                                                        required
                                                        customInput={<input style={{ background: theme === "light" ? "white" : "#0f172a", width: "100%", color: theme === "light" ? "#1e293b" : "white" }} />}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: theme === "light" ? "#64748b" : "#94a3b8" }}>{t('timeLabel')}</label>
                                                    {(() => {
                                                        const selectedDateObj = bookingForm.date ? new Date(bookingForm.date) : null;
                                                        const selectedDay = selectedDateObj ? selectedDateObj.getDay() : null;

                                                        // 6 = Saturday (Half-day)
                                                        // Other days (Full-day)
                                                        const allTimeSlots = selectedDay === 6
                                                            ? ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00"]
                                                            : ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];

                                                        const timeSlots = allTimeSlots.filter(t => {
                                                            if (bookedSlots.includes(t)) return false;

                                                            // Filter out past slots if the selected date is today
                                                            const todayStr = new Date().toISOString().split('T')[0];
                                                            if (bookingForm.date === todayStr) {
                                                                const now = new Date();
                                                                const [h, m] = t.split(':').map(Number);
                                                                const slotTime = new Date();
                                                                slotTime.setHours(h, m, 0, 0);
                                                                return slotTime > now;
                                                            }
                                                            return true;
                                                        });

                                                        return (
                                                            <select
                                                                className="vital-input"
                                                                required
                                                                value={bookingForm.time}
                                                                onChange={e => setBookingForm({ ...bookingForm, time: e.target.value })}
                                                                style={{ background: theme === "light" ? "white" : "#0f172a" }}
                                                                disabled={!bookingForm.date || timeSlots.length === 0}
                                                            >
                                                                <option value="">{bookingForm.date ? (timeSlots.length === 0 ? t('noAvailableTime') : t('chooseTime')) : t('selectDateFirst')}</option>
                                                                {timeSlots.map(t => {
                                                                    const isOptimal = parseInt(t.split(":")[0]) >= 10;
                                                                    return (
                                                                        <option key={t} value={t} style={{ fontWeight: isOptimal ? "bold" : "normal", color: isOptimal ? "#16a34a" : "inherit" }}>
                                                                            {t} {isOptimal ? "⭐" : ""}
                                                                        </option>
                                                                    );
                                                                })}
                                                            </select>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px", color: theme === "light" ? "#64748b" : "#94a3b8" }}>{t('appointmentNote')}</label>
                                                <textarea
                                                    className="vital-input"
                                                    rows="3"
                                                    value={bookingForm.notes}
                                                    onChange={e => setBookingForm({ ...bookingForm, notes: e.target.value })}
                                                    placeholder={t('notePlaceholder')}
                                                    style={{ background: theme === "light" ? "white" : "#0f172a", resize: "none" }}
                                                ></textarea>
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
                                            <button
                                                type="button"
                                                onClick={() => { setShowBookingModal(false); setBookingError(""); }}
                                                style={{
                                                    flex: 1, padding: "14px", borderRadius: "12px",
                                                    background: theme === "light" ? "#f1f5f9" : "rgba(255,255,255,0.05)",
                                                    color: theme === "light" ? "#64748b" : "#94a3b8",
                                                    border: "none", fontWeight: 700, cursor: "pointer", transition: "all 0.3s"
                                                }}
                                            >
                                                {t('cancel')}
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={bookingLoading}
                                                style={{
                                                    flex: 2, padding: "14px", borderRadius: "12px",
                                                    background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                                                    color: "white", border: "none", fontWeight: 700, cursor: "pointer",
                                                    boxShadow: "0 10px 20px -5px rgba(22, 163, 74, 0.4)",
                                                    opacity: bookingLoading ? 0.7 : 1, transition: "all 0.3s"
                                                }}
                                            >
                                                {bookingLoading ? t('creatingAppointment') : t('confirmAppointment')}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                )
            }
            {/* LAB TRENDS MODAL */}
            {
                showLabTrends.show && (
                    <div style={{
                        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                        background: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(8px)",
                        zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "20px"
                    }} onClick={() => setShowLabTrends({ show: false, parameter: "" })}>
                        <div style={{
                            background: theme === "light" ? "white" : "#1e293b",
                            width: "100%", maxWidth: "700px", borderRadius: "24px",
                            padding: "32px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                        }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                                <div>
                                    <h2 style={{ fontSize: "24px", fontWeight: 800, color: theme === "light" ? "#1e293b" : "#f8fafc", margin: 0 }}>{showLabTrends.parameter} {t('labTrends')}</h2>
                                    <p style={{ fontSize: "14px", color: "#64748b", margin: "4px 0 0 0" }}>{t('compareWithPast')}</p>
                                </div>
                                <button onClick={() => setShowLabTrends({ show: false, parameter: "" })} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                                    <FiXCircle size={24} />
                                </button>
                            </div>

                            <div style={{ width: "100%", height: "350px", background: theme === "light" ? "#f8fafc" : "#0f172a", borderRadius: "16px", padding: "20px" }}>
                                {(() => {
                                    const chartData = getParameterChartData(showLabTrends.parameter);
                                    if (chartData.length === 0) {
                                        return <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>{t('noNumericData')}</div>;
                                    }
                                    return (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === "light" ? "#e2e8f0" : "#334155"} />
                                                <XAxis dataKey="date" stroke={theme === "light" ? "#64748b" : "#94a3b8"} fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke={theme === "light" ? "#64748b" : "#94a3b8"} fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                                                <Tooltip
                                                    contentStyle={{ background: theme === "light" ? "white" : "#1e293b", border: "none", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                                                    itemStyle={{ fontWeight: 700, color: "#be123c" }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="value"
                                                    stroke="#be123c"
                                                    strokeWidth={3}
                                                    dot={{ r: 6, fill: "#be123c", strokeWidth: 2, stroke: theme === "light" ? "white" : "#1e293b" }}
                                                    activeDot={{ r: 8, strokeWidth: 0 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    );
                                })()}
                            </div>

                            <button
                                onClick={() => setShowLabTrends({ show: false, parameter: "" })}
                                style={{ width: "100%", marginTop: "32px", padding: "14px", borderRadius: "12px", background: "#f1f5f9", color: "#64748b", border: "none", fontWeight: 700, cursor: "pointer" }}
                            >
                                {t('backToDashboard')}
                            </button>
                        </div>
                    </div>
                )
            }
            {/* COMPOSE MESSAGE MODAL */}
            {
                showComposeModal.show && (
                    <div style={{
                        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                        background: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(8px)",
                        zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "20px"
                    }} onClick={() => setShowComposeModal({ show: false, receiverId: "", receiverName: "" })}>
                        <div style={{
                            background: theme === "light" ? "white" : "#1e293b",
                            width: "100%", maxWidth: "500px", borderRadius: "24px",
                            padding: "32px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                        }} onClick={e => e.stopPropagation()}>
                            <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "24px" }}>{t('composeMessage')}</h2>
                            <form onSubmit={handleSendMessage}>
                                <div style={{ marginBottom: "16px" }}>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#64748b", marginBottom: "8px" }}>{t('selectDoctor')}</label>
                                    <select
                                        value={showComposeModal.receiverId}
                                        onChange={e => setShowComposeModal({ ...showComposeModal, receiverId: e.target.value })}
                                        style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0", outline: "none" }}
                                        required
                                    >
                                        <option value="">{t('selectDoctor')}</option>
                                        {doctors
                                            .filter(d => appointments.some(a => a.doctorId?._id === d._id))
                                            .map(d => (
                                                <option key={d._id} value={d._id}>{d.title} {d.name}</option>
                                            ))}
                                    </select>
                                </div>
                                <div style={{ marginBottom: "20px" }}>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#64748b", marginBottom: "8px" }}>{t('messageContent')}</label>
                                    <textarea
                                        value={newMessage.content}
                                        onChange={e => setNewMessage({ ...newMessage, content: e.target.value })}
                                        style={{ width: "100%", height: "150px", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0", outline: "none", resize: "none" }}
                                        required
                                        placeholder={t('messageContent')}
                                    />
                                </div>
                                <div style={{ display: "flex", gap: "12px" }}>
                                    <button type="button" onClick={() => setShowComposeModal({ show: false, receiverId: "", receiverName: "" })} style={{ flex: 1, padding: "14px", borderRadius: "12px", background: "#f1f5f9", color: "#64748b", border: "none", fontWeight: 700, cursor: "pointer" }}>{t('cancel')}</button>
                                    <button type="submit" disabled={sendMessageLoading} style={{ flex: 1, padding: "14px", borderRadius: "12px", background: "#be123c", color: "white", border: "none", fontWeight: 700, cursor: "pointer" }}>{sendMessageLoading ? "..." : t('send')}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* FILE UPLOAD MODAL */}
            {
                showFileUpload && (
                    <div style={{
                        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                        background: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(8px)",
                        zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center",
                        padding: "20px"
                    }} onClick={() => setShowFileUpload(false)}>
                        <div style={{
                            background: theme === "light" ? "white" : "#1e293b",
                            width: "100%", maxWidth: "400px", borderRadius: "24px",
                            padding: "32px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                        }} onClick={e => e.stopPropagation()}>
                            <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "24px" }}>{t('uploadFile')}</h2>
                            <div style={{ marginBottom: "20px" }}>
                                <input
                                    type="file"
                                    onChange={e => setSelectedFile(e.target.files[0])}
                                    style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0" }}
                                />
                                <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "8px" }}>PDF, JPG, PNG (Max 10MB)</p>
                            </div>
                            <div style={{ display: "flex", gap: "12px" }}>
                                <button onClick={() => setShowFileUpload(false)} style={{ flex: 1, padding: "14px", borderRadius: "12px", background: "#f1f5f9", color: "#64748b", border: "none", fontWeight: 700, cursor: "pointer" }}>{t('cancel')}</button>
                                <button onClick={handleFileUpload} disabled={uploadingFile || !selectedFile} style={{ flex: 1, padding: "14px", borderRadius: "12px", background: "#be123c", color: "white", border: "none", fontWeight: 700, cursor: "pointer" }}>{uploadingFile ? "..." : t('uploadFile')}</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* REVIEW MODAL */}
            {reviewModalOpen && selectedAppointmentForReview && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 10005, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setReviewModalOpen(false)}>
                    <div style={{ background: theme === "light" ? "white" : "#1e293b", width: "100%", maxWidth: "400px", borderRadius: "24px", padding: "32px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", position: "relative" }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setReviewModalOpen(false)} style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px" }}>
                            <FiXCircle size={24} />
                        </button>

                        <div style={{ textAlign: "center", marginBottom: "24px" }}>
                            <h2 style={{ fontSize: "20px", fontWeight: 800, color: theme === "light" ? "#1e293b" : "white", marginBottom: "8px" }}>{t('rateDoctor')}</h2>
                            <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>{selectedAppointmentForReview.doctorId?.name?.startsWith('Dr') ? selectedAppointmentForReview.doctorId?.name : `Dr. ${selectedAppointmentForReview.doctorId?.name}`}</p>
                            <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>{new Date(selectedAppointmentForReview.date).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}</p>
                        </div>

                        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "24px" }}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    style={{ background: "none", border: "none", cursor: "pointer", padding: "0", transition: "transform 0.2s" }}
                                >
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill={(hoverRating || rating) >= star ? "#fbbf24" : "none"} stroke={(hoverRating || rating) >= star ? "#fbbf24" : "#cbd5e1"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: (hoverRating || rating) >= star ? "drop-shadow(0 4px 6px rgba(251, 191, 36, 0.3))" : "none" }}>
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                    </svg>
                                </button>
                            ))}
                        </div>

                        <div style={{ marginBottom: "24px" }}>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: theme === "light" ? "#475569" : "#cbd5e1", marginBottom: "8px" }}>{t('writeReview')}</label>
                            <textarea
                                value={reviewComment}
                                onChange={e => setReviewComment(e.target.value)}
                                placeholder={t('reviewPlaceholder')}
                                style={{
                                    width: "100%", padding: "16px", borderRadius: "16px", border: theme === "light" ? "1px solid #e2e8f0" : "1px solid #334155",
                                    background: theme === "light" ? "#f8fafc" : "#0f172a", color: theme === "light" ? "#1e293b" : "white",
                                    minHeight: "100px", resize: "vertical", fontSize: "14px", outline: "none", fontFamily: "inherit"
                                }}
                            />
                        </div>

                        <button
                            onClick={handleReviewSubmit}
                            disabled={submittingReview || rating === 0}
                            style={{
                                width: "100%", padding: "16px", borderRadius: "16px", background: rating > 0 ? "#10b981" : "#cbd5e1",
                                color: "white", border: "none", fontWeight: 800, fontSize: "15px", cursor: rating > 0 ? "pointer" : "not-allowed",
                                transition: "all 0.3s", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px"
                            }}
                        >
                            {submittingReview ? "..." : t('submitReview')}
                        </button>
                    </div>
                </div>
            )}

            {/* EMERGENCY CARD MODAL */}
            {showEmergencyCard && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(8px)", zIndex: 11000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setShowEmergencyCard(false)}>
                    <div style={{ background: theme === 'light' ? 'white' : '#1e293b', width: '100%', maxWidth: '450px', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', position: 'relative' }} onClick={e => e.stopPropagation()}>
                        {/* Header Gradient */}
                        <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '32px', color: 'white', textAlign: 'center', position: 'relative' }}>
                            <button onClick={() => setShowEmergencyCard(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><FiX size={18} /></button>
                            <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <FiHeart size={32} fill="white" />
                            </div>
                            <h2 style={{ fontSize: '24px', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>{t('emergencyCard')}</h2>
                            <p style={{ fontSize: '14px', opacity: 0.9, marginTop: '4px' }}>{lang === 'tr' ? 'Tıbbi Acil Durum Bilgisi' : 'Medical Emergency Information'}</p>
                        </div>

                        <div style={{ padding: '32px' }}>
                            {/* Profile Info */}
                            <div style={{ display: 'flex', gap: '24px', marginBottom: '32px' }}>
                                <div style={{ background: theme === 'light' ? '#f8fafc' : 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '20px', border: `1px solid ${theme === 'light' ? '#e2e8f0' : '#334155'}` }}>
                                    <QRCode value={patientUser?._id || 'unknown'} size={100} level="H" bgColor="transparent" fgColor={theme === 'light' ? '#0f172a' : '#f8fafc'} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>{lang === 'tr' ? 'AD SOYAD' : 'FULL NAME'}</label>
                                        <div style={{ fontSize: '18px', fontWeight: 800, color: theme === 'light' ? '#1e293b' : 'white' }}>{patientUser?.name}</div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('bloodType')}</label>
                                        <div style={{ fontSize: '24px', fontWeight: 900, color: '#ef4444' }}>{patientUser?.bloodType || '??'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Medical Details */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                                <div style={{ padding: '16px', background: theme === 'light' ? '#fff1f2' : 'rgba(239, 68, 68, 0.1)', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', marginBottom: '4px' }}>{lang === 'tr' ? 'ALERJİLER' : 'ALLERGIES'}</div>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: theme === 'light' ? '#991b1b' : '#fca5a5' }}>{patientUser?.allergies || (lang === 'tr' ? 'Yok' : 'None')}</div>
                                </div>
                                <div style={{ padding: '16px', background: theme === 'light' ? '#fff7ed' : 'rgba(249, 115, 22, 0.1)', borderRadius: '16px', border: '1px solid rgba(249, 115, 22, 0.1)' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#f97316', textTransform: 'uppercase', marginBottom: '4px' }}>{lang === 'tr' ? 'KRONİK' : 'CHRONIC'}</div>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: theme === 'light' ? '#9a3412' : '#fdba74' }}>{patientUser?.chronicDiseases || (lang === 'tr' ? 'Yok' : 'None')}</div>
                                </div>
                            </div>

                            {/* Emergency Contact */}
                            <div style={{ padding: '20px', background: theme === 'light' ? '#f0f9ff' : 'rgba(14, 165, 233, 0.1)', borderRadius: '20px', border: '1px solid rgba(14, 165, 233, 0.1)', marginBottom: '32px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <FiUserCheck size={16} color="#0ea5e9" />
                                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase' }}>{lang === 'tr' ? 'ACİL DURUM YAKINI' : 'EMERGENCY CONTACT'}</span>
                                </div>
                                <div style={{ fontSize: '15px', fontWeight: 700, color: theme === 'light' ? '#0c4a6e' : '#7dd3fc' }}>{patientUser?.emergencyContact?.name || '---'}</div>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0ea5e9', marginTop: '2px' }}>{patientUser?.emergencyContact?.phone || '---'}</div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={() => window.print()} style={{ flex: 1, padding: '14px', background: theme === 'light' ? '#f1f5f9' : 'rgba(255,255,255,0.05)', color: theme === 'light' ? '#475569' : '#cbd5e1', border: 'none', borderRadius: '16px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <FiDownload size={18} /> {lang === 'tr' ? 'Yazdır' : 'Print'}
                                </button>
                                <button onClick={() => setShowEmergencyCard(false)} style={{ flex: 1, padding: '14px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '16px', fontWeight: 700, cursor: 'pointer' }}>
                                    {t('close')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}

