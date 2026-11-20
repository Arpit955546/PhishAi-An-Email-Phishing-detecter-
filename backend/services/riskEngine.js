function clampScore(score) {
    const value = Number(score);

    if (!Number.isFinite(value)) {
        return 0;
    }

    return Math.max(0, Math.min(100, Math.round(value)));
}

function getRiskLevel(score) {
    const finalScore = clampScore(score);

    if (finalScore >= 80) {
        return "CRITICAL";
    }

    if (finalScore >= 60) {
        return "HIGH";
    }

    if (finalScore >= 30) {
        return "MEDIUM";
    }

    return "LOW";
}

function calculateRiskScore({
    emailScore = 0,
    urlScore = 0,
    threatIntelScore = 0,
    impersonationScore = 0
} = {}) {
    /*
        Weighted risk calculation

        Email signals        → 35%
        URL signals           → 30%
        Threat Intelligence   → 25%
        Impersonation         → 10%
    */

    const email = clampScore(emailScore);
    const url = clampScore(urlScore);
    const threatIntel = clampScore(threatIntelScore);
    const impersonation = clampScore(impersonationScore);

    const weightedScore =
        email * 0.35 +
        url * 0.30 +
        threatIntel * 0.25 +
        impersonation * 0.10;

    const score = clampScore(weightedScore);

    return {
        score,
        riskLevel: getRiskLevel(score),
        breakdown: {
            email: email,
            url: url,
            threatIntel: threatIntel,
            impersonation: impersonation
        }
    };
}

function combineThreats(...threatSources) {
    const allThreats = [];

    for (const source of threatSources) {
        if (!Array.isArray(source)) {
            continue;
        }

        for (const threat of source) {
            if (!threat) {
                continue;
            }

            const cleanThreat = String(threat).trim();

            if (
                cleanThreat &&
                !allThreats.some(
                    existing =>
                        existing.toLowerCase() ===
                        cleanThreat.toLowerCase()
                )
            ) {
                allThreats.push(cleanThreat);
            }
        }
    }

    return allThreats;
}

function buildRiskSummary(score, riskLevel) {
    switch (riskLevel) {
        case "CRITICAL":
            return "Critical security risk detected. Immediate investigation and containment are recommended.";

        case "HIGH":
            return "High security risk detected. The content contains multiple suspicious indicators.";

        case "MEDIUM":
            return "Moderate security risk detected. Additional verification is recommended.";

        default:
            return "Low security risk detected. Continue to follow normal security precautions.";
    }
}

function buildRecommendation(riskLevel) {
    switch (riskLevel) {
        case "CRITICAL":
            return "Do not interact with the content. Block or quarantine the source and investigate the associated indicators.";

        case "HIGH":
            return "Do not click links or provide sensitive information. Verify the source through an official channel.";

        case "MEDIUM":
            return "Verify the sender, domain, and requested action before interacting with the content.";

        default:
            return "No immediate high-risk indicators were detected. Continue to exercise normal caution.";
    }
}

module.exports = {
    clampScore,
    getRiskLevel,
    calculateRiskScore,
    combineThreats,
    buildRiskSummary,
    buildRecommendation
};