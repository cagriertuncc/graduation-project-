import express from "express";
import ITRequest from "../models/ITRequest.js";
import auth, { roleGuard } from "../middleware/auth.js";
import SystemLog from "../models/SystemLog.js";

const router = express.Router();
router.use(auth);

// Helper function to log actions
const logAction = async (action, userObj, details, status = "info") => {
    try {
        await SystemLog.create({
            action,
            user: userObj?.profileId?.name || userObj?.email || "Sistem",
            userId: userObj?._id || null,
            details,
            status
        });
    } catch (err) {
        console.error("System Logging Error:", err);
    }
};

// GET /api/it-requests - Get all requests (Admins/Directors only)
router.get("/", roleGuard("admin", "director", "staff"), async (req, res) => {
    try {
        const requests = await ITRequest.find().sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: "Talepler getirilemedi", message: err.message });
    }
});

// GET /api/it-requests/my - Get requests opened by current user
router.get("/my", async (req, res) => {
    try {
        const requests = await ITRequest.find({ createdById: req.user._id }).sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: "Talepleriniz getirilemedi", message: err.message });
    }
});

// POST /api/it-requests - Create a new request
router.post("/", async (req, res) => {
    try {
        const { title, category, priority, description } = req.body;
        
        if (!title || !description) {
            return res.status(400).json({ error: "Başlık ve açıklama alanları zorunludur." });
        }

        // Generate custom requestId (e.g. IT-384)
        const randId = Math.floor(100 + Math.random() * 900);
        const requestId = `IT-${randId}`;

        const creatorName = req.user.profileId?.name || req.user.email;

        const newRequest = await ITRequest.create({
            requestId,
            title,
            category: category || "Yazılım",
            priority: priority || "Orta",
            status: "Açık",
            assignee: "Atanmamış",
            createdBy: creatorName,
            createdById: req.user._id,
            description
        });

        await logAction(
            "IT Destek Talebi Açıldı",
            req.user,
            `'${requestId}' nolu ve '${title}' başlıklı destek talebi oluşturuldu.`
        );

        res.status(201).json(newRequest);
    } catch (err) {
        res.status(500).json({ error: "Talep oluşturulamadı", message: err.message });
    }
});

// PUT /api/it-requests/:id - Update status, priority, or assignee (Admins/Directors only)
router.put("/:id", roleGuard("admin", "director", "staff"), async (req, res) => {
    try {
        const { status, priority, assignee } = req.body;
        const request = await ITRequest.findById(req.params.id);
        
        if (!request) {
            return res.status(404).json({ error: "Talep bulunamadı." });
        }

        if (status) request.status = status;
        if (priority) request.priority = priority;
        if (assignee !== undefined) request.assignee = assignee;

        await request.save();

        await logAction(
            "IT Destek Talebi Güncellendi",
            req.user,
            `'${request.requestId}' nolu talep durumu '${request.status}', önceliği '${request.priority}', atanan kişi '${request.assignee}' olarak güncellendi.`
        );

        res.json(request);
    } catch (err) {
        res.status(500).json({ error: "Talep güncellenemedi", message: err.message });
    }
});

// DELETE /api/it-requests/:id - Delete an IT request (Admins/Directors only)
router.delete("/:id", roleGuard("admin", "director", "staff"), async (req, res) => {
    try {
        const request = await ITRequest.findById(req.params.id);
        
        if (!request) {
            return res.status(404).json({ error: "Talep bulunamadı." });
        }

        const reqId = request.requestId;
        await request.deleteOne();

        await logAction(
            "IT Destek Talebi Silindi",
            req.user,
            `'${reqId}' nolu destek talebi silindi.`,
            "warning"
        );

        res.json({ message: "Talep başarıyla silindi." });
    } catch (err) {
        res.status(500).json({ error: "Talep silinemedi", message: err.message });
    }
});

export default router;
