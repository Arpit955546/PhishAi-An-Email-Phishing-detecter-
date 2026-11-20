const OpenAI = require("openai");

let openai = null;

if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
}


// ======================================================
// EMAIL AI ANALYSIS
// ======================================================

async function analyzeWithAI(email) {

    if (!openai) {
        return {
            success: false,
            reason: "OPENAI_API_KEY_MISSING"
        };
    }

    try {

        const response = await openai.responses.create({
            model: "gpt-5.6-luna",

            instructions: `
You are PhishAI, a professional phishing email detection engine.

Analyze the complete email.

Identify:
1. Urgency
2. Account threats
3. Verification requests
4. Password/OTP/PIN requests
5. Financial information requests
6. Suspicious links
7. Brand impersonation
8. Social engineering
9. Credential harvesting
10. Overall phishing intent

Return ONLY valid JSON.

Return exactly:

{
  "score": 0,
  "riskLevel": "LOW",
  "threats": [],
  "summary": "",
  "recommendation": ""
}

Rules:
- score must be between 0 and 100
- LOW = 0-39
- MEDIUM = 40-69
- HIGH = 70-100
`,

            input: email.trim()
        });

        const rawText = response.output_text?.trim();

        if (!rawText) {
            return {
                success: false,
                reason: "EMPTY_AI_RESPONSE"
            };
        }

        let result;

        try {
            result = JSON.parse(rawText);
        } catch (error) {
            console.error("AI JSON Parse Error:", error.message);

            return {
                success: false,
                reason: "INVALID_AI_JSON"
            };
        }

        if (
            typeof result.score !== "number" ||
            !result.riskLevel ||
            !Array.isArray(result.threats)
        ) {
            return {
                success: false,
                reason: "INVALID_AI_RESULT"
            };
        }

        result.score = Math.max(
            0,
            Math.min(100, Math.round(result.score))
        );

        result.analysisMode = "AI";

        return {
            success: true,
            data: result
        };

    } catch (error) {

        console.error("OpenAI Email Error:", error.message);

        return {
            success: false,
            reason: "AI_REQUEST_FAILED"
        };
    }
}


// ======================================================
// URL AI ANALYSIS
// ======================================================

async function analyzeURLWithAI(url) {

    if (!openai) {
        return {
            success: false,
            reason: "OPENAI_API_KEY_MISSING"
        };
    }

    try {

        const response = await openai.responses.create({
            model: "gpt-5.6-luna",

            instructions: `
You are PhishAI, a professional malicious URL detection engine.

Analyze the complete URL.

Look for:
1. HTTP instead of HTTPS
2. IP address instead of domain
3. Suspicious subdomains
4. URL shortening
5. Suspicious keywords
6. Login or credential harvesting
7. Financial/payment keywords
8. Excessive URL length
9. @ symbol
10. Punycode
11. Suspicious file extensions
12. Domain impersonation
13. Phishing characteristics

Return ONLY valid JSON.

Return exactly:

{
  "score": 0,
  "riskLevel": "LOW",
  "indicators": [],
  "summary": "",
  "recommendation": ""
}

Rules:
- score must be between 0 and 100
- LOW = 0-39
- MEDIUM = 40-69
- HIGH = 70-100
`,

            input: url.trim()
        });

        const rawText = response.output_text?.trim();

        if (!rawText) {
            return {
                success: false,
                reason: "EMPTY_AI_RESPONSE"
            };
        }

        let result;

        try {
            result = JSON.parse(rawText);
        } catch (error) {

            console.error(
                "AI URL JSON Parse Error:",
                error.message
            );

            return {
                success: false,
                reason: "INVALID_AI_JSON"
            };
        }

        if (
            typeof result.score !== "number" ||
            !result.riskLevel ||
            !Array.isArray(result.indicators)
        ) {
            return {
                success: false,
                reason: "INVALID_AI_URL_RESULT"
            };
        }

        result.score = Math.max(
            0,
            Math.min(100, Math.round(result.score))
        );

        result.url = url;
        result.analysisMode = "AI";

        return {
            success: true,
            data: result
        };

    } catch (error) {

        console.error("OpenAI URL Error:", error.message);

        return {
            success: false,
            reason: "AI_REQUEST_FAILED"
        };
    }
}


module.exports = {
    analyzeWithAI,
    analyzeURLWithAI
};