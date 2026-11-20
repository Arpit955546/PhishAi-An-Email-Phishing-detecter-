function normalizeIndicator(indicator) {
    if (!indicator) {
        return "";
    }

    return String(indicator).trim().toLowerCase();
}

function getIndicatorType(indicator) {
    const value = normalizeIndicator(indicator);

    if (!value) {
        return "UNKNOWN";
    }

    // URL
    try {
        const parsed = new URL(value);

        if (parsed.protocol === "http:" || parsed.protocol === "https:") {
            return "URL";
        }
    } catch (error) {
        // Not a URL, continue checking
    }

    // IPv4
    const ipPattern =
        /^(?:\d{1,3}\.){3}\d{1,3}$/;

    if (ipPattern.test(value)) {
        return "IP";
    }

    // SHA-256
    if (/^[a-f0-9]{64}$/i.test(value)) {
        return "SHA256";
    }

    // SHA-1
    if (/^[a-f0-9]{40}$/i.test(value)) {
        return "SHA1";
    }

    // MD5
    if (/^[a-f0-9]{32}$/i.test(value)) {
        return "MD5";
    }

    // Email
    if (
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    ) {
        return "EMAIL";
    }

    // Domain
    if (
        /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(value)
    ) {
        return "DOMAIN";
    }

    return "UNKNOWN";
}

function createThreatResult({
    indicator,
    type,
    malicious = false,
    score = 0,
    confidence = 0,
    source = "LOCAL"
} = {}) {
    return {
        indicator: normalizeIndicator(indicator),
        type: type || getIndicatorType(indicator),
        malicious: Boolean(malicious),
        score: Math.max(0, Math.min(100, Number(score) || 0)),
        confidence: Math.max(
            0,
            Math.min(100, Number(confidence) || 0)
        ),
        source,
        checkedAt: new Date().toISOString()
    };
}

async function checkIndicator(indicator) {
    const normalized = normalizeIndicator(indicator);
    const type = getIndicatorType(normalized);

    if (!normalized) {
        return createThreatResult({
            indicator,
            type: "UNKNOWN",
            score: 0,
            confidence: 0,
            source: "LOCAL"
        });
    }

    /*
        External threat intelligence APIs will be
        connected here later.

        For now this service only identifies the
        indicator type and returns a safe baseline.
    */

    return createThreatResult({
        indicator: normalized,
        type,
        malicious: false,
        score: 0,
        confidence: 0,
        source: "LOCAL"
    });
}

async function checkIndicators(indicators = []) {
    if (!Array.isArray(indicators)) {
        return [];
    }

    const uniqueIndicators = [
        ...new Set(
            indicators
                .map(normalizeIndicator)
                .filter(Boolean)
        )
    ];

    const results = [];

    for (const indicator of uniqueIndicators) {
        const result = await checkIndicator(indicator);
        results.push(result);
    }

    return results;
}

function calculateThreatIntelScore(results = []) {
    if (!Array.isArray(results) || results.length === 0) {
        return 0;
    }

    const maliciousResults = results.filter(
        result => result && result.malicious === true
    );

    if (maliciousResults.length === 0) {
        return 0;
    }

    const highestScore = Math.max(
        ...maliciousResults.map(
            result => Number(result.score) || 0
        )
    );

    return Math.max(
        0,
        Math.min(100, Math.round(highestScore))
    );
}

module.exports = {
    normalizeIndicator,
    getIndicatorType,
    createThreatResult,
    checkIndicator,
    checkIndicators,
    calculateThreatIntelScore
};