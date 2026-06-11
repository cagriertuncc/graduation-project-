import express from "express";
import { aiController } from "../controllers/aiController.js";
import patientAuth from "../middleware/patientAuth.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// General Health AI Chat
router.post("/chat", patientAuth, aiController.chat);

// Lab Result Explanation
router.post("/explain-results", patientAuth, aiController.explainLabResults);

// Health Summary
router.post("/health-summary", patientAuth, aiController.healthSummary);

// Smart Triage
router.post("/triage", patientAuth, aiController.triage);

// Vital Analysis
router.post("/analyze-vitals", patientAuth, aiController.analyzeVitals);

// Diet Plan
router.post("/diet-plan", patientAuth, aiController.generateDietPlan);

// Swap Meal
router.post("/swap-meal", patientAuth, aiController.swapMeal);

// Shopping List
router.post("/shopping-list", patientAuth, aiController.generateShoppingList);

// Diet Chat
router.post("/diet-chat", patientAuth, aiController.dietChat);

// Doctor AI Chat (uses doctor JWT auth)
router.post("/doctor-chat", auth, aiController.doctorChat);

export default router;
