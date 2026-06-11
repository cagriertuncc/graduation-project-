/**
 * AI Triage & Analytics Utility
 */

const symptomSpecialtyMap = {
    // Cardiology
    "göğüs ağrısı": { specialty: "Kardiyoloji", condition: "Anjin/Kalp Rahatsızlığı", risk: 8 },
    "kalp çarpıntısı": { specialty: "Kardiyoloji", condition: "Aritmi", risk: 6 },
    "nefes darlığı": { specialty: "Kardiyoloji", condition: "Kalp Yetmezliği", risk: 7 },

    // Endocrinology / Internal Medicine
    "susama": { specialty: "Endokrinoloji", condition: "Diyabet", risk: 4 },
    "aşırı idrar": { specialty: "Endokrinoloji", condition: "Diyabet", risk: 3 },
    "kilo kaybı": { specialty: "Dahiliye", condition: "Metabolik Bozukluk", risk: 5 },

    // Neurology
    "baş ağrısı": { specialty: "Nöroloji", condition: "Migren/Gerilim Tipi", risk: 3 },
    "baş dönmesi": { specialty: "Nöroloji", condition: "Vertigo", risk: 4 },
    "uyuşma": { specialty: "Nöroloji", condition: "Sinir Sıkışması", risk: 5 },

    // Orthopedics
    "diz ağrısı": { specialty: "Ortopedi", condition: "Menisküs/Artrit", risk: 2 },
    "bel ağrısı": { specialty: "Ortopedi", condition: "Bel Fıtığı", risk: 3 },
    "eklem şişmesi": { specialty: "Ortopedi", condition: "Romatizma", risk: 4 },

    // Dermatology
    "kaşıntı": { specialty: "Dermatoloji", condition: "Alerji/Egzama", risk: 2 },
    "döküntü": { specialty: "Dermatoloji", condition: "Dermatit", risk: 2 },
    "sivilce": { specialty: "Dermatoloji", condition: "Akne Vulgaris", risk: 1 },

    // Psychiatry
    "kaygı": { specialty: "Psikiyatri", condition: "Anksiyete", risk: 3 },
    "uykusuzluk": { specialty: "Psikiyatri", condition: "İnsomnia", risk: 2 },
    "mutsuzluk": { specialty: "Psikiyatri", condition: "Depresyon", risk: 4 },
};

/**
 * Maps symptoms to a specialty and predicted condition
 * @param {string} symptomText 
 * @returns {Object} { suggestedSpecialty, predictedCondition, baseRisk }
 */
export const performTriage = (symptomText) => {
    if (!symptomText) return null;

    const text = symptomText.toLowerCase();
    for (const [key, result] of Object.entries(symptomSpecialtyMap)) {
        if (text.includes(key)) {
            return {
                suggestedSpecialty: result.specialty,
                predictedCondition: result.condition,
                baseRisk: result.risk
            };
        }
    }

    // Generic fallback
    return {
        suggestedSpecialty: "Dahiliye",
        predictedCondition: "Genel Muayene Gerekli",
        baseRisk: 2
    };
};

/**
 * Calculates a patient risk score (0-10)
 * @param {Object} patient - Patient data (age, weight, height, smokingAlcoholStatus, chronicDiseases)
 * @returns {Object} { score, level, factors }
 */
export const calculateRiskScore = (patient) => {
    let score = 0;
    const factors = [];

    // Age factor
    if (patient.age > 65) {
        score += 3;
        factors.push("Yaş (>65)");
    } else if (patient.age > 50) {
        score += 1.5;
        factors.push("Yaş (>50)");
    }

    // BMI factor
    if (patient.height && patient.weight) {
        const bmi = patient.weight / ((patient.height / 100) ** 2);
        if (bmi >= 30) {
            score += 2.5;
            factors.push("Yüksek BMI (Obezite)");
        } else if (bmi >= 25) {
            score += 1;
            factors.push("Fazla Kilolu");
        }
    }

    // Lifestyle factor
    if (patient.smokingAlcoholStatus) {
        const lifestyle = patient.smokingAlcoholStatus.toLowerCase();
        if (lifestyle.includes("sigara") || lifestyle.includes("alkol")) {
            score += 2;
            factors.push("Tütün/Alkol Kullanımı");
        }
    }

    // Chronic diseases factor
    if (patient.chronicDiseases && patient.chronicDiseases.length > 5) {
        score += 2;
        factors.push("Kronik Hastalık Öyküsü");
    }

    score = Math.min(10, score);

    let level = "Düşük";
    if (score >= 7) level = "Kritik";
    else if (score >= 4) level = "Orta";

    return { score: score.toFixed(1), level, factors };
};

/**
 * Analyzes clinic density for a specialty
 * @param {number} pendingCount - Number of waiting appointments
 * @returns {Object} { densityScore, status }
 */
export const analyzeDensity = (pendingCount) => {
    let status = "Müsait";
    let score = pendingCount / 10; // Simple normalization (10 apps = 1.0/full)

    if (score > 0.8) status = "Çok Yoğun";
    else if (score > 0.4) status = "Orta Yoğun";

    return { densityScore: score.toFixed(2), status };
};
