export const C = {
    bg: "#06070f",
    surface: "#0c0e1f",
    card: "rgba(255,255,255,0.035)",
    cardHover: "rgba(255,255,255,0.055)",
    border: "rgba(255,255,255,0.07)",
    borderHover: "rgba(99,102,241,0.3)",
    primary: "#6366f1",
    pMed: "#818cf8",
    pLight: "#a5b4fc",
    green: "#22c55e",
    yellow: "#f59e0b",
    red: "#ef4444",
    orange: "#f97316",
    cyan: "#06b6d4",
    text: "white",
    muted: "rgba(255,255,255,0.45)",
    dim: "rgba(255,255,255,0.2)",
    grad: "linear-gradient(135deg,#4f46e5,#6366f1,#818cf8)",
};

export const ILANLAR = [
    { id: 1, unvan: "Kardiyoloji Uzmanı", departman: "Kardiyoloji", tip: "Tam Zamanlı", son: "2026-04-15", basvuru: 14, durum: "Aktif" },
    { id: 2, unvan: "Acil Tıp Doktoru", departman: "Acil Servis", tip: "Tam Zamanlı", son: "2026-04-01", basvuru: 22, durum: "Aktif" },
    { id: 3, unvan: "Hemşire – Yoğun Bakım", departman: "Yoğun Bakım", tip: "Vardiyalı", son: "2026-03-28", basvuru: 31, durum: "Aktif" },
    { id: 4, unvan: "Radyoloji Teknisyeni", departman: "Radyoloji", tip: "Tam Zamanlı", son: "2026-03-20", basvuru: 9, durum: "Kapandı" },
    { id: 5, unvan: "İdari İşler Uzmanı", departman: "İdari", tip: "Tam Zamanlı", son: "2026-04-30", basvuru: 6, durum: "Aktif" },
    { id: 6, unvan: "Eczacı", departman: "Eczane", tip: "Tam Zamanlı", son: "2026-04-10", basvuru: 11, durum: "İncelemede" },
];

export const BASVURULAR = [
    { id: 1, ad: "Dr. Ayşe Kaya", ilan: "Kardiyoloji Uzmanı", tarih: "08 Mar 2026", durum: "Mülakata Çağrıldı", puan: 88, deneyim: "7 yıl" },
    { id: 2, ad: "Dr. Mehmet Arslan", ilan: "Acil Tıp Doktoru", tarih: "07 Mar 2026", durum: "İnceleniyor", puan: 75, deneyim: "4 yıl" },
    { id: 3, ad: "Fatma Demir", ilan: "Hemşire – Yoğun Bakım", tarih: "06 Mar 2026", durum: "Kabul Edildi", puan: 92, deneyim: "9 yıl" },
    { id: 4, ad: "Ali Yıldız", ilan: "Radyoloji Teknisyeni", tarih: "05 Mar 2026", durum: "Reddedildi", puan: 58, deneyim: "2 yıl" },
    { id: 5, ad: "Zeynep Çelik", ilan: "Eczacı", tarih: "04 Mar 2026", durum: "İnceleniyor", puan: 81, deneyim: "5 yıl" },
    { id: 6, ad: "Dr. Hasan Öztürk", ilan: "Kardiyoloji Uzmanı", tarih: "03 Mar 2026", durum: "Mülakata Çağrıldı", puan: 84, deneyim: "6 yıl" },
    { id: 7, ad: "Elif Koç", ilan: "İdari İşler Uzmanı", tarih: "02 Mar 2026", durum: "İnceleniyor", puan: 70, deneyim: "3 yıl" },
];

export const CALISANLAR = [
    { id: 1, ad: "Dr. Serkan Yılmaz", departman: "Kardiyoloji", unvan: "Uzman Doktor", baslama: "10 May 2021", maas: "₺42.000", puan: 4.8, durum: "Aktif", email: "s.yilmaz@hastane.com", telefon: "0532 100 11 22" },
    { id: 2, ad: "Dr. Selin Aydın", departman: "Dahiliye", unvan: "Uzman Doktor", baslama: "01 Eyl 2019", maas: "₺39.500", puan: 4.6, durum: "Aktif", email: "s.aydin@hastane.com", telefon: "0533 200 33 44" },
    { id: 3, ad: "Ayşe Güler", departman: "Yoğun Bakım", unvan: "Başhemşire", baslama: "15 Mar 2017", maas: "₺28.000", puan: 4.9, durum: "Aktif", email: "a.guler@hastane.com", telefon: "0534 300 55 66" },
    { id: 4, ad: "Murat Kılıç", departman: "Radyoloji", unvan: "Teknisyen", baslama: "20 Oca 2022", maas: "₺22.500", puan: 4.3, durum: "Aktif", email: "m.kilic@hastane.com", telefon: "0535 400 77 88" },
    { id: 5, ad: "Dr. Neslihan Tekin", departman: "Acil Servis", unvan: "Acil Tıp Doktoru", baslama: "12 Tem 2020", maas: "₺37.000", puan: 4.7, durum: "İzinli", email: "n.tekin@hastane.com", telefon: "0536 500 99 00" },
    { id: 6, ad: "Burak Şahin", departman: "İdari", unvan: "İdari Uzman", baslama: "28 Şub 2023", maas: "₺18.500", puan: 4.1, durum: "Aktif", email: "b.sahin@hastane.com", telefon: "0537 600 11 22" },
];

export const IZINLER = [
    { id: 1, ad: "Dr. Neslihan Tekin", tip: "Yıllık İzin", bas: "09 Mar 2026", bit: "22 Mar 2026", gun: 14, durum: "Onaylı" },
    { id: 2, ad: "Murat Kılıç", tip: "Ücretsiz İzin", bas: "15 Mar 2026", bit: "17 Mar 2026", gun: 3, durum: "Beklemede" },
    { id: 3, ad: "Burak Şahin", tip: "Mazeret İzni", bas: "11 Mar 2026", bit: "11 Mar 2026", gun: 1, durum: "Beklemede" },
    { id: 4, ad: "Ayşe Güler", tip: "Yıllık İzin", bas: "05 Nis 2026", bit: "12 Nis 2026", gun: 8, durum: "Onaylı" },
    { id: 5, ad: "Dr. Selin Aydın", tip: "Hastalık İzni", bas: "10 Mar 2026", bit: "12 Mar 2026", gun: 3, durum: "Onaylı" },
];

export const DURUM_STYLE = {
    "Aktif": { color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
    "Kapandı": { color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
    "İncelemede": { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    "İnceleniyor": { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    "Kabul Edildi": { color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
    "Reddedildi": { color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
    "Mülakata Çağrıldı": { color: "#a5b4fc", bg: "rgba(99,102,241,0.12)" },
    "Onaylı": { color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
    "Beklemede": { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    "İzinli": { color: "#f97316", bg: "rgba(249,115,22,0.1)" },
};

export const AVA_COLORS = [
    "linear-gradient(135deg,#6366f1,#8b5cf6)",
    "linear-gradient(135deg,#0ea5e9,#6366f1)",
    "linear-gradient(135deg,#10b981,#0ea5e9)",
    "linear-gradient(135deg,#f59e0b,#ef4444)",
    "linear-gradient(135deg,#ec4899,#8b5cf6)",
    "linear-gradient(135deg,#06b6d4,#10b981)",
];

export function Badge({ label, color, bg }) {
    return (
        <span style={{
            display: "inline-flex", alignItems: "center",
            padding: "3px 10px", borderRadius: "999px",
            fontSize: "11px", fontWeight: 700,
            background: bg || "rgba(99,102,241,0.12)",
            color: color || "#a5b4fc",
            border: `1px solid ${color ? color + "28" : "rgba(99,102,241,0.2)"}`,
            whiteSpace: "nowrap",
        }}>{label}</span>
    );
}

export function DurumBadge({ durum }) {
    const s = DURUM_STYLE[durum] || { color: "rgba(255,255,255,0.4)", bg: "rgba(255,255,255,0.05)" };
    return <Badge label={durum} color={s.color} bg={s.bg} />;
}

export function StatCard({ icon, label, value, sub, color, delay = 0 }) {
    return (
        <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: "18px", padding: "22px 24px",
            display: "flex", gap: "16px", alignItems: "flex-start",
            transition: "all 0.25s", cursor: "default",
        }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = color + "50"; e.currentTarget.style.background = C.cardHover; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card; e.currentTarget.style.transform = "translateY(0)"; }}
        >
            <div style={{ width: 46, height: 46, borderRadius: 13, background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>{icon}</div>
            <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{label}</div>
                {sub && <div style={{ fontSize: 11, color, marginTop: 5, fontWeight: 700 }}>{sub}</div>}
            </div>
        </div>
    );
}
