const {
    checkIndicator,
    checkIndicators,
    calculateThreatIntelScore
} = require("../services/threatIntel");

async function analyzeThreat(req, res) {
    try {
        const { indicator } = req.body;

        if (!indicator || typeof indicator !== "string") {
            return res.status(400).json({
                success: false,
                error: "Threat indicator is required"
            });
        }

        const result = await checkIndicator(indicator);

        return res.json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error(
            "Threat controller error:",
            error
        );

        return res.status(500).json({
            success: false,
            error: "Threat intelligence analysis failed"
        });
    }
}


async function analyzeThreats(req, res) {
    try {
        const { indicators } = req.body;

        if (!Array.isArray(indicators)) {
            return res.status(400).json({
                success: false,
                error: "Indicators must be an array"
            });
        }

        const results = await checkIndicators(indicators);

        const threatIntelScore =
            calculateThreatIntelScore(results);

        return res.json({
            success: true,
            count: results.length,
            threatIntelScore,
            results
        });

    } catch (error) {
        console.error(
            "Threats controller error:",
            error
        );

        return res.status(500).json({
            success: false,
            error: "Threat intelligence analysis failed"
        });
    }
}


module.exports = {
    analyzeThreat,
    analyzeThreats
};