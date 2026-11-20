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

function calculateWeightedScore(values = {}) {
    let total = 0;
    let totalWeight = 0;

    for (const key of Object.keys(values)) {
        const item = values[key];

        if (!item || typeof item !== "object") {
            continue;
        }

        const score = clampScore(item.score);
        const weight = Number(item.weight);

        if (!Number.isFinite(weight) || weight <= 0) {
            continue;
        }

        total += score * weight;
        totalWeight += weight;
    }

    if (totalWeight === 0) {
        return 0;
    }

    return clampScore(total / totalWeight);
}

module.exports = {
    clampScore,
    getRiskLevel,
    calculateWeightedScore
};