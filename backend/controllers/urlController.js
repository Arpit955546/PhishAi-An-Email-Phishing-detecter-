const { analyzeURLWithAI } = require("../services/aiEngine");
const { analyzeURLLocally } = require("../services/urlAnalyzer");
const { modelInfo } = require("../services/mlClassifier");

async function analyzeURL(req, res) {

    try {

        const { url } = req.body;

        if (!url || typeof url !== "string") {
            return res.status(400).json({
                success: false,
                message: "URL is required"
            });
        }

        if (url.trim().length < 4) {
            return res.status(400).json({
                success: false,
                message: "Invalid URL"
            });
        }

        const cleanURL = url.trim();

        console.log(`🔗 URL analysis started: ${cleanURL}`);

        // ==========================================
        // FIRST: TRY AI
        // ==========================================

        const mlIsTrained = modelInfo().source === "dataset-trained";
        const aiResult = mlIsTrained
            ? { success: false, reason: "DATASET_ML_ENABLED" }
            : await analyzeURLWithAI(cleanURL);

        if (aiResult.success) {

            console.log("🤖 URL Analysis Mode: AI");

            return res.json({
                success: true,
                data: aiResult.data
            });
        }

        console.log(
            `🛡️ URL AI unavailable: ${aiResult.reason}`
        );

        console.log(
            "🛡️ Switching to LOCAL URL analysis"
        );

        // ==========================================
        // FALLBACK: LOCAL
        // ==========================================

        const localResult = analyzeURLLocally(cleanURL);

        return res.json({
            success: true,
            data: localResult
        });

    } catch (error) {

        console.error(
            "URL Controller Error:",
            error.message
        );

        // ==========================================
        // FINAL SAFETY FALLBACK
        // ==========================================

        try {

            const cleanURL = req.body?.url || "";

            const localResult =
                analyzeURLLocally(cleanURL);

            return res.json({
                success: true,
                data: localResult
            });

        } catch (localError) {

            console.error(
                "Local URL Error:",
                localError.message
            );

            return res.status(500).json({
                success: false,
                message: "URL analysis failed"
            });
        }
    }
}

module.exports = {
    analyzeURL
};
