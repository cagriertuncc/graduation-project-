# 🏥 MediTrack - Dijital Hastane Bilgi Yönetim Sistemi

MediTrack; hastalar, doktorlar, hastane yöneticileri, insan kaynakları (İK), eczacılar, muhasebeciler, teknisyenler, danışma ve idare ekipleri için özel olarak tasarlanmış, **Yapay Zeka (Gemini) destekli** uçtan uca modern bir Dijital Hastane Yönetim Sistemidir (HIS).

---

## 🌟 Öne Çıkan Özellikler & Portallar

MediTrack, hastane içerisindeki tüm departmanların entegre şekilde çalışmasını sağlayan çok yönlü modüllere sahiptir:

### 👤 1. Hasta Portalı (Patient Portal)
* **Hesap Yönetimi:** Kolay kayıt, giriş, şifre sıfırlama süreçleri.
* **Randevu Sistemi:** Bölümlere ve doktorlara göre uygun saatleri görerek anlık randevu alma.
* **Sağlık Paneli (Health Analytics):** Kişisel yaşamsal bulgular (nabız, şeker, tansiyon vb.) ve grafiksel analizler.
* **🤖 Yapay Zeka Sağlık Asistanı:** Belirtileri sorgulama, Gemini entegrasyonu ile genel sağlık önerileri alma.
* **🥗 Yapay Zeka Diyet Asistanı:** Kişiselleştirilmiş beslenme önerileri ve kalori takipleri.
* **Zaman Tüneli (Health Timeline):** Geçmiş muayene, tahlil ve randevuların kronolojik listesi.

### 🥼 2. Doktor Portalı (Doctor Portal)
* **Hasta Listesi & Detayları:** Hastaların geçmiş reçeteleri, laboratuvar/radyoloji sonuçları ve ameliyat/tedavi notları.
* **Bulgu & Reçete Girişi:** Hastalara yeni tanı (hastalık) koyma, reçete yazma ve tıbbi rapor oluşturma.
* **Gelir & Analitik Grafikleri:** Aylık bakılan hasta oranları ve finansal dağılımlar.
* **🤖 Klinik AI Yardımcısı:** Zorlu vakalarda Gemini desteğiyle tıbbi veri analizi yapabilme.

### 👑 3. Yönetici (Admin) Kontrol Paneli
* **Kullanıcı Yönetimi:** Sistemdeki tüm personellerin hesap oluşturma, düzenleme ve yetkilendirme işlemleri.
* **Uzmanlık & Branş Yönetimi:** Aktif poliklinik ve uzmanlık alanlarının yönetimi.
* **IT Destek Talepleri:** Personelden gelen teknik arıza ve destek bildirimlerinin yönetimi.
* **Sistem Durumu Kontrolü:** 
  * 🔴 **Acil Durum Kilidi (Emergency Lockdown):** Güvenlik durumunda tüm sistemi tek tıkla kilitleme ve erişimi kesme.
  * ⚙️ **Bakım Modu (Maintenance Mode):** Güncellemeler sırasında admin dışındaki kullanıcıları bilgilendirme ekranına yönlendirme.
* **Sistem Logları:** Güvenlik ve veri takibi için arka plandaki tüm hareketleri canlı izleme.

### 👥 4. İnsan Kaynakları (İK) Portalı
* **Çalışan Kartları:** Tüm personellerin maaş, departman ve aktiflik durumları.
* **Nöbet & Vardiya Planlayıcı:** Sürükle-bırak (DnD Kit) desteğiyle haftalık vardiya atamaları.
* **İzin Yönetimi:** Personel izin taleplerini onaylama/reddetme süreçleri.
* **Performans Değerlendirme:** Performans puanları ve detaylı personel analizleri.
* **İşe Alım Portalı:** [Kariyer](file:///Users/charlie/Desktop/GP-2/src/pages/Kariyer.jsx) sayfası üzerinden gelen iş başvurularını inceleme.

### 💊 5. Eczane, Muhasebe, Danışma & Teknisyen Modülleri
* **Eczane Portalı:** İlaç stok takibi, kritik seviyedeki ilaçların uyarıları ve reçete onay işlemleri.
* **Muhasebe Portalı:** Hastane gelir/gider kalemleri, faturalandırma ve finansal raporlar.
* **Teknisyen Portalı:** Laboratuvar ve radyoloji test isteklerini görüntüleme, tahlil sonuçlarını yükleme.
* **Danışma (Hasta Kabul):** Hızlı hasta kaydı, fiziksel randevu oluşturma ve karşılama paneli.

---

## 🛠️ Teknoloji Yığını (Tech Stack)

### Frontend
* **Core:** React (v19) & Vite
* **Yönlendirme:** React Router (v7)
* **Grafikler:** Recharts (Veri analitiği ve performans grafikleri için)
* **Sürükle-Bırak:** @dnd-kit (Vardiya planlaması için)
* **Stil & UI:** Vanilla CSS (Özel tasarlanmış cam morfolojisi, yumuşak gradyanlar ve mikro animasyonlar)
* **Bildirimler:** React Hot Toast

### Backend
* **Çatı:** Node.js & Express
* **Veritabanı:** MongoDB & Mongoose
* **Güvenlik:** JWT (JSON Web Tokens) & Bcryptjs
* **Zamanlanmış Görevler:** Node-Cron (Otomatik hatırlatıcılar ve rutin güncellemeler için)
* **E-Posta:** Nodemailer (Hasta ve çalışan bildirimleri)
* **AI:** @google/generative-ai (Gemini Pro entegrasyonu)

---

## ⚙️ Kurulum & Çalıştırma Rehberi

### 1. Ön Gereksinimler
* Bilgisayarınızda **Node.js** (v18+) ve **MongoDB**'nin kurulu ve çalışıyor olması gerekmektedir.

### 2. Depoyu Klonlama ve Hazırlık
```bash
# Proje dizinine gidin
cd GP-2
```

### 3. Backend (Sunucu) Kurulumu
1. `server` klasörüne geçiş yapın:
   ```bash
   cd server
   ```
2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
3. `server/.env` dosyasını oluşturun (veya `.env.example` dosyasını kopyalayın):
   ```bash
   cp .env.example .env
   ```
4. `.env` dosyasını düzenleyerek kendi veritabanı adresinizi ve Gemini API anahtarınızı tanımlayın:
   ```env
   PORT=5001
   MONGO_URI=mongodb://localhost:27017/meditrack
   JWT_SECRET=ozel_jwt_anahtariniz
   GEMINI_API_KEY=AIzaSy... (Gemini API Anahtarı)
   ```
5. Başlangıç verilerini (seed data) veritabanına yükleyin:
   ```bash
   npm run seed
   ```
6. Sunucuyu geliştirici modunda başlatın:
   ```bash
   npm run dev
   ```

### 4. Frontend (Arayüz) Kurulumu
1. Ana dizine dönün:
   ```bash
   cd ..
   ```
2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
3. Arayüzü geliştirici modunda başlatın:
   ```bash
   npm run dev
   ```
4. Tarayıcınızda `http://localhost:5173` adresine giderek sistemi kullanmaya başlayabilirsiniz.

---

## 📝 Ek Bilgiler
* Proje içerisindeki test senaryolarını incelemek veya otomasyonları test etmek için `puppeteer-test` dizinini ziyaret edebilirsiniz.
* Sistem durum kontrolleri (Acil durum/bakım) her 5 saniyede bir otomatik sorgulanarak arayüze anlık yansıtılır.
