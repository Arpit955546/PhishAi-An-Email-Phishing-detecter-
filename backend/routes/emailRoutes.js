const express = require("express");
const router = express.Router();

const authMiddleware =
    require("../middleware/authMiddleware");

const {
    analyzeEmail,
    getMyAnalyses
} = require("../controllers/emailController");


router.post(
    "/analyze",
    authMiddleware,
    analyzeEmail
);


router.get(
    "/my-analyses",
    authMiddleware,
    getMyAnalyses
);


module.exports = router;