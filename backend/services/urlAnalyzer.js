const { scoreURL, modelInfo } = require("./mlClassifier");

function analyzeURLLocally(inputURL) {

    let url;

    try {
        url = new URL(inputURL);
    } catch (error) {

        return {
            url: inputURL,
            score: 100,
            riskLevel: "HIGH",
            indicators: [
                "Invalid or malformed URL"
            ],
            summary: "The provided URL could not be parsed safely.",
            recommendation:
                "Do not open this URL until its source has been verified.",
            analysisMode: "LOCAL"
        };
    }

    let score = 0;
    const indicators = [];

    const hostname = url.hostname.toLowerCase();
    const fullURL = inputURL.toLowerCase();

    // --------------------------------------------------
    // 1. HTTP instead of HTTPS
    // --------------------------------------------------

    if (url.protocol === "http:") {

        score += 15;

        indicators.push(
            "Connection is not using HTTPS"
        );
    }

    // --------------------------------------------------
    // 2. IP address instead of domain
    // --------------------------------------------------

    const ipPattern =
        /^(?:\d{1,3}\.){3}\d{1,3}$/;

    if (ipPattern.test(hostname)) {

        score += 25;

        indicators.push(
            "URL uses an IP address instead of a domain name"
        );
    }

    // --------------------------------------------------
    // 3. @ symbol
    // --------------------------------------------------

    if (fullURL.includes("@")) {

        score += 20;

        indicators.push(
            "URL contains an @ symbol"
        );
    }

    // --------------------------------------------------
    // 4. Very long URL
    // --------------------------------------------------

    if (inputURL.length > 100) {

        score += 10;

        indicators.push(
            "Unusually long URL"
        );
    }

    if (inputURL.length > 200) {

        score += 10;

        indicators.push(
            "Extremely long URL"
        );
    }

    // --------------------------------------------------
    // 5. Too many subdomains
    // --------------------------------------------------

    const domainParts = hostname.split(".");

    if (domainParts.length >= 4) {

        score += 15;

        indicators.push(
            "Multiple subdomains detected"
        );
    }

    // --------------------------------------------------
    // 6. Suspicious keywords
    // --------------------------------------------------

    const suspiciousKeywords = [
        "login",
        "verify",
        "verification",
        "secure",
        "account",
        "update",
        "confirm",
        "password",
        "credential",
        "signin",
        "bank",
        "payment",
        "wallet",
        "free",
        "bonus",
        "claim",
        "gift",
        "prize",
        "urgent"
    ];

    const foundKeywords = [];

    suspiciousKeywords.forEach(keyword => {

        if (fullURL.includes(keyword)) {
            foundKeywords.push(keyword);
        }

    });

    if (foundKeywords.length > 0) {

        const keywordScore =
            Math.min(foundKeywords.length * 5, 20);

        score += keywordScore;

        indicators.push(
            `Suspicious keywords detected: ${foundKeywords.join(", ")}`
        );
    }

    // --------------------------------------------------
    // 7. Hyphen-heavy domain
    // --------------------------------------------------

    const hyphenCount =
        (hostname.match(/-/g) || []).length;

    if (hyphenCount >= 3) {

        score += 10;

        indicators.push(
            "Domain contains multiple hyphens"
        );
    }

    // --------------------------------------------------
    // 8. Suspicious URL encoding
    // --------------------------------------------------

    const encodedCount =
        (fullURL.match(/%[0-9a-f]{2}/g) || []).length;

    if (encodedCount >= 5) {

        score += 10;

        indicators.push(
            "URL contains excessive encoded characters"
        );
    }

    // --------------------------------------------------
    // 9. Punycode domain
    // --------------------------------------------------

    if (hostname.includes("xn--")) {

        score += 20;

        indicators.push(
            "Internationalized/Punycode domain detected"
        );
    }

    // --------------------------------------------------
    // 10. Suspicious file extension
    // --------------------------------------------------

    const suspiciousExtensions = [
        ".exe",
        ".scr",
        ".bat",
        ".cmd",
        ".msi",
        ".zip"
    ];

    for (const extension of suspiciousExtensions) {

        if (url.pathname.toLowerCase().includes(extension)) {

            score += 20;

            indicators.push(
                `Suspicious file type detected: ${extension}`
            );

            break;
        }
    }

    // --------------------------------------------------
    // Blend the supervised Naive Bayes prediction with transparent indicators.
    // Final score
    // --------------------------------------------------

    const ruleScore = Math.min(score, 100);
    score = Math.round(ruleScore * 0.45 + scoreURL(inputURL) * 0.55);

    let riskLevel = "LOW";

    if (score >= 70) {

        riskLevel = "HIGH";

    } else if (score >= 40) {

        riskLevel = "MEDIUM";
    }

    // --------------------------------------------------
    // Summary
    // --------------------------------------------------

    let summary;

    if (riskLevel === "HIGH") {

        summary =
            "This URL contains multiple suspicious indicators commonly associated with phishing or malicious links.";

    } else if (riskLevel === "MEDIUM") {

        summary =
            "This URL contains some suspicious characteristics that should be verified before opening.";

    } else {

        summary =
            "No major suspicious URL indicators were detected.";
    }

    // --------------------------------------------------
    // Recommendation
    // --------------------------------------------------

    let recommendation;

    if (riskLevel === "HIGH") {

        recommendation =
            "Do not open this URL or provide sensitive information.";

    } else if (riskLevel === "MEDIUM") {

        recommendation =
            "Verify the domain carefully before opening the URL.";

    } else {

        recommendation =
            "The URL appears relatively safe, but always verify the domain before proceeding.";
    }

    return {
        url: inputURL,
        protocol: url.protocol.replace(":", ""),
        hostname,
        https: url.protocol === "https:",
        length: inputURL.length,
        score,
        riskLevel,
        indicators,
        summary,
        recommendation,
        analysisMode: "LOCAL_ML",
        model: `Naive Bayes (${modelInfo().source})`
    };
}

module.exports = {
    analyzeURLLocally
};
