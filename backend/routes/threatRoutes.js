const express = require("express");

const {
    analyzeThreat,
    analyzeThreats
} = require("../controllers/threatController");

const router = express.Router();

router.post("/analyze", analyzeThreat);

router.post("/analyze-batch", analyzeThreats);

module.exports = router;