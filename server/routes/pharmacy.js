import express from "express";
import auth, { roleGuard } from "../middleware/auth.js";
import Prescription from "../models/Prescription.js";
import MedicationStock from "../models/MedicationStock.js";

const router = express.Router();

// Tüm eczane rotalarını korumaya al (Sadece pharmacist ve admin erişebilir)
router.use(auth, roleGuard("pharmacist", "admin"));

// GET /api/pharmacy/prescriptions — Tüm reçeteleri getir (Arama ve filtreleme ile)
router.get("/prescriptions", async (req, res) => {
    try {
        const { status, search } = req.query;
        let query = {};

        if (status) {
            query.status = status;
        }

        // Popüle edilecek alanlarla sorguyu başlat
        let prescriptionsQuery = Prescription.find(query)
            .populate("doctorId", "name specialty")
            .populate("patientId", "name tc age gender phone")
            .sort({ date: -1 });

        let prescriptions = await prescriptionsQuery;

        // Arama filtresi varsa (Hasta adı veya TC'sine göre)
        if (search) {
            const searchLower = search.toLowerCase();
            prescriptions = prescriptions.filter(p => {
                const patientName = p.patientId?.name?.toLowerCase() || "";
                const patientTc = p.patientId?.tc || "";
                return patientName.includes(searchLower) || patientTc.includes(searchLower);
            });
        }

        res.json(prescriptions);
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// PUT /api/pharmacy/prescriptions/:id/dispense — Reçeteyi teslim et (Stokları düş)
router.put("/prescriptions/:id/dispense", async (req, res) => {
    try {
        const prescription = await Prescription.findById(req.id || req.params.id)
            .populate("patientId", "name");
        
        if (!prescription) {
            return res.status(404).json({ error: "Reçete bulunamadı" });
        }

        if (prescription.status === "verildi") {
            return res.status(400).json({ error: "Bu reçete zaten teslim edilmiş" });
        }

        // Stok kontrolü yap
        const medications = prescription.medications;
        const stockUpdates = [];

        for (const med of medications) {
            // İlaç adını tam veya kısmi eşlemeyle bul (harf duyarlılığını önlemek için regex kullanabiliriz)
            const stockItem = await MedicationStock.findOne({
                name: { $regex: new RegExp("^" + med.name.trim() + "$", "i") }
            });

            if (!stockItem) {
                return res.status(400).json({
                    error: `Stok Hatası: '${med.name}' isimli ilaç eczane envanterinde kayıtlı değil.`
                });
            }

            // Basit bir yaklaşımla dozajdan bağımsız olarak reçetede yazan miktarı (varsayılan 1 kutu kabul ederek) düşelim.
            // İlaç adedini belirlemek için adette varsa onu kullan, yoksa 1 kutu düş.
            const quantityToReduce = 1; 

            if (stockItem.stock < quantityToReduce) {
                return res.status(400).json({
                    error: `Yetersiz Stok: '${med.name}' ilacından stokta sadece ${stockItem.stock} adet var. Reçeteyi teslim etmek için stok yetersiz.`
                });
            }

            stockUpdates.push({
                item: stockItem,
                reduction: quantityToReduce
            });
        }

        // Stokları düş ve kaydet
        for (const update of stockUpdates) {
            update.item.stock -= update.reduction;
            await update.item.save();
        }

        // Reçete durumunu güncelle
        prescription.status = "verildi";
        await prescription.save();

        res.json({
            message: "Reçete başarıyla teslim edildi. İlaç stokları güncellendi.",
            prescription
        });
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// GET /api/pharmacy/stock — İlaç stok listesi
router.get("/stock", async (req, res) => {
    try {
        const stocks = await MedicationStock.find({}).sort({ name: 1 });
        res.json(stocks);
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// POST /api/pharmacy/stock — Yeni ilaç stok kaydı ekle
router.post("/stock", async (req, res) => {
    try {
        const { name, stock, criticalLimit, unit, expiryDate } = req.body;

        if (!name || stock === undefined || criticalLimit === undefined) {
            return res.status(400).json({ error: "İlaç adı, stok ve kritik limit zorunludur" });
        }

        // İlaç zaten var mı?
        const existing = await MedicationStock.findOne({
            name: { $regex: new RegExp("^" + name.trim() + "$", "i") }
        });
        if (existing) {
            return res.status(400).json({ error: "Bu ilaç zaten stokta kayıtlı, miktar güncellemesi yapın" });
        }

        const newStock = await MedicationStock.create({
            name: name.trim(),
            stock,
            criticalLimit,
            unit: unit || "Kutu",
            expiryDate
        });

        res.status(201).json(newStock);
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// PUT /api/pharmacy/stock/:id — İlaç stoğunu/bilgilerini güncelle
router.put("/stock/:id", async (req, res) => {
    try {
        const { stock, criticalLimit, unit, expiryDate } = req.body;
        
        const stockItem = await MedicationStock.findById(req.params.id);
        if (!stockItem) {
            return res.status(404).json({ error: "İlaç bulunamadı" });
        }

        if (stock !== undefined) stockItem.stock = stock;
        if (criticalLimit !== undefined) stockItem.criticalLimit = criticalLimit;
        if (unit !== undefined) stockItem.unit = unit;
        if (expiryDate !== undefined) stockItem.expiryDate = expiryDate;

        await stockItem.save();
        res.json(stockItem);
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// DELETE /api/pharmacy/stock/:id — İlaç stok kaydını sil
router.delete("/stock/:id", async (req, res) => {
    try {
        const stockItem = await MedicationStock.findByIdAndDelete(req.params.id);
        if (!stockItem) {
            return res.status(404).json({ error: "İlaç bulunamadı" });
        }
        res.json({ message: "İlaç stok kaydı silindi" });
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

// GET /api/pharmacy/stats — Eczane hızlı istatistikleri
router.get("/stats", async (req, res) => {
    try {
        const totalPending = await Prescription.countDocuments({ status: "beklemede" });
        const totalDispensed = await Prescription.countDocuments({ status: "verildi" });
        
        // Kritik seviyedeki ilaç sayısı
        const stocks = await MedicationStock.find({});
        const lowStockCount = stocks.filter(item => item.stock <= item.criticalLimit).length;

        res.json({
            pendingPrescriptions: totalPending,
            dispensedPrescriptions: totalDispensed,
            lowStockMedications: lowStockCount,
            totalMedications: stocks.length
        });
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası", message: err.message });
    }
});

export default router;
