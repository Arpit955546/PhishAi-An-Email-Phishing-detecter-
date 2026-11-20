const { analyzeWithAI } = require("../services/aiEngine");
const { analyzeEmailLocally } = require("../services/emailAnalyzer");
const { modelInfo } = require("../services/mlClassifier");
const Analysis = require("../models/Analysis");

async function analyzeEmail(req, res) {

    try {

        const { email } = req.body;

        if (!email || typeof email !== "string") {
            return res.status(400).json({
                success: false,
                message: "Email content is required"
            });
        }

        if (email.trim().length < 5) {
            return res.status(400).json({
                success: false,
                message: "Email content is too short"
            });
        }

        console.log("📧 Email analysis started");

        // ==========================================
        // 1. FIRST TRY AI
        // ==========================================

        const mlIsTrained = modelInfo().source === "dataset-trained";
        const aiResult = mlIsTrained
            ? { success: false, reason: "DATASET_ML_ENABLED" }
            : await analyzeWithAI(email);

        if (aiResult.success) {

            console.log("🤖 Analysis Mode: AI");

            const result = aiResult.data;

            // ==========================================
            // SAVE AI RESULT TO MONGODB
            // ==========================================

            await Analysis.create({
                user: req.user.userId,

                emailContent: email,

                riskScore: Number(result.riskScore ?? result.score ?? 0),

                riskLevel: result.riskLevel || "LOW",

                analysisMode: "AI",

                summary: result.summary || "",

                recommendation: result.recommendation || "",

                indicators: Array.isArray(result.indicators)
                    ? result.indicators
                    : [],

                urls: Array.isArray(result.urls)
                    ? result.urls
                    : [],

                urlResults: Array.isArray(result.urlResults)
                    ? result.urlResults
                    : [],

                rawResult: result
            });

            console.log("💾 AI analysis saved to MongoDB");

            return res.json({
                success: true,
                data: result
            });
        }

        // ==========================================
        // 2. AI FAILED → LOCAL FALLBACK
        // ==========================================

        console.log(mlIsTrained ? "Dataset-trained ML analysis" : "AI unavailable; using local ML fallback");

        const localResult = analyzeEmailLocally(email);

        // ==========================================
        // SAVE LOCAL RESULT TO MONGODB
        // ==========================================

        await Analysis.create({
            user: req.user.userId,

            emailContent: email,

            riskScore: Number(
                localResult.riskScore ??
                localResult.score ??
                0
            ),

            riskLevel:
                localResult.riskLevel || "LOW",

            analysisMode: localResult.analysisMode || "LOCAL",

            summary:
                localResult.summary || "",

            recommendation:
                localResult.recommendation || "",

            indicators:
                Array.isArray(localResult.indicators)
                    ? localResult.indicators
                    : [],

            urls:
                Array.isArray(localResult.urls)
                    ? localResult.urls
                    : [],

            urlResults:
                Array.isArray(localResult.urlResults)
                    ? localResult.urlResults
                    : [],

            rawResult: localResult
        });

        console.log("💾 Local analysis saved to MongoDB");

        return res.json({
            success: true,
            data: localResult
        });

    } catch (error) {

        console.error(
            "Email Controller Error:",
            error
        );

        // ==========================================
        // FINAL SAFETY FALLBACK
        // ==========================================

        try {

            const localResult = analyzeEmailLocally(
                req.body?.email || ""
            );

            // Save fallback result if user is authenticated
            if (req.user?.userId) {

                await Analysis.create({
                    user: req.user.userId,

                    emailContent:
                        req.body?.email || "",

                    riskScore: Number(
                        localResult.riskScore ??
                        localResult.score ??
                        0
                    ),

                    riskLevel:
                        localResult.riskLevel || "LOW",

                    analysisMode: localResult.analysisMode || "LOCAL",

                    summary:
                        localResult.summary || "",

                    recommendation:
                        localResult.recommendation || "",

                    indicators:
                        Array.isArray(
                            localResult.indicators
                        )
                            ? localResult.indicators
                            : [],

                    urls:
                        Array.isArray(localResult.urls)
                            ? localResult.urls
                            : [],

                    urlResults:
                        Array.isArray(
                            localResult.urlResults
                        )
                            ? localResult.urlResults
                            : [],

                    rawResult: localResult
                });

                console.log(
                    "💾 Final fallback saved to MongoDB"
                );
            }

            return res.json({
                success: true,
                data: localResult
            });

        } catch (localError) {

            console.error(
                "Local fallback error:",
                localError
            );

            return res.status(500).json({
                success: false,
                message: "Email analysis failed"
            });
        }
    }
}
async function getMyAnalyses(req, res) {

    try {

        const analyses = await Analysis
            .find({
                user: req.user.userId
            })
            .sort({
                createdAt: -1
            })
            .limit(100)
            .lean();

        return res.json({

            success: true,

            count: analyses.length,

            data: analyses

        });

    } catch (error) {

        console.error(
            "Get My Analyses Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to load analysis history"

        });
    }
}

module.exports = {
    analyzeEmail,
    getMyAnalyses
};
