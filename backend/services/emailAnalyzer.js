const { scoreEmail, modelInfo } = require("./mlClassifier");

function analyzeEmailLocally(email) {

    const text = email.toLowerCase();

    let score = 0;
    const threats = [];

    // Urgency
    const urgencyWords = [
        "urgent",
        "immediately",
        "act now",
        "within 24 hours",
        "as soon as possible"
    ];

    if (urgencyWords.some(word => text.includes(word))) {
        score += 15;
        threats.push("Urgent request");
    }

    // Account threat
    const accountThreats = [
        "account suspended",
        "account will be closed",
        "account blocked",
        "suspend your account",
        "verify your account"
    ];

    if (accountThreats.some(word => text.includes(word))) {
        score += 20;
        threats.push("Account threat");
    }

    // Credentials
    const credentialWords = [
        "password",
        "otp",
        "pin",
        "login",
        "username",
        "credentials"
    ];

    if (credentialWords.some(word => text.includes(word))) {
        score += 20;
        threats.push("Credential request");
    }

    // Financial information
    const financialWords = [
        "bank account",
        "credit card",
        "debit card",
        "cvv",
        "payment",
        "upi",
        "transaction"
    ];

    if (financialWords.some(word => text.includes(word))) {
        score += 20;
        threats.push("Financial information request");
    }

    // Links
    if (/https?:\/\/|www\./i.test(email)) {
        score += 10;
        threats.push("Contains external link");
    }

    // Verification
    const verificationWords = [
        "verify now",
        "verification required",
        "confirm your identity",
        "verify your identity"
    ];

    if (verificationWords.some(word => text.includes(word))) {
        score += 15;
        threats.push("Verification request");
    }

    // Blend the supervised Naive Bayes prediction with transparent indicators.
    const ruleScore = Math.min(score, 100);
    score = Math.round(ruleScore * 0.45 + scoreEmail(email) * 0.55);

    let riskLevel = "LOW";

    if (score >= 70) {
        riskLevel = "HIGH";
    } else if (score >= 40) {
        riskLevel = "MEDIUM";
    }

    let summary;

    if (riskLevel === "HIGH") {
        summary = "Multiple phishing indicators were detected in this email.";
    } else if (riskLevel === "MEDIUM") {
        summary = "Some suspicious indicators were detected in this email.";
    } else {
        summary = "No major phishing indicators were detected.";
    }

    let recommendation;

    if (riskLevel === "HIGH") {
        recommendation =
            "Do not click links or provide sensitive information.";
    } else if (riskLevel === "MEDIUM") {
        recommendation =
            "Verify the sender and links before taking any action.";
    } else {
        recommendation =
            "The email appears relatively safe, but verify the sender before taking action.";
    }

    return {
        score,
        riskLevel,
        threats,
        summary,
        recommendation,
        analysisMode: "LOCAL_ML",
        model: `Naive Bayes (${modelInfo().source})`
    };
}

module.exports = {
    analyzeEmailLocally
};
