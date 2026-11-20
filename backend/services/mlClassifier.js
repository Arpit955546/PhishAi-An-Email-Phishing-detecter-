const fs = require("node:fs");
const path = require("node:path");

// A tiny seed model keeps offline detection available before a real CSV model
// is trained. Run `npm run train:models` to replace it with dataset-trained models.
const seed = require("../data/seed-models.json");
const artifactPath = path.join(__dirname, "../models/trained-models.json");
let trained = null;
try {
    trained = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
} catch (_) {
    // Training artifact is optional; the seed baseline remains available.
}

function tokens(text) {
    return String(text || "").toLowerCase().match(/[a-z0-9]+/g) || [];
}

function probability(model, text) {
    const terms = new Set(tokens(text));
    const vocabularySize = model.vocabularySize;
    const logScores = [0, 0];
    for (let label = 0; label <= 1; label++) {
        logScores[label] = Math.log(model.documents[label] / (model.documents[0] + model.documents[1]));
        for (const term of terms) {
            const count = Object.hasOwn(model.counts[label], term) ? model.counts[label][term] : 0;
            logScores[label] += Math.log((count + 1) / (model.tokenTotals[label] + vocabularySize));
        }
    }
    const delta = Math.max(-30, Math.min(30, logScores[1] - logScores[0]));
    return Math.round((1 / (1 + Math.exp(-delta))) * 100);
}

function trainFromRows(rows) {
    const documents = [0, 0];
    const counts = [Object.create(null), Object.create(null)];
    const tokenTotals = [0, 0];
    const vocabulary = new Set();
    for (const [label, text] of rows) {
        documents[label]++;
        for (const token of new Set(tokens(text))) {
            vocabulary.add(token);
            counts[label][token] = (counts[label][token] || 0) + 1;
            tokenTotals[label]++;
        }
    }
    return { documents, counts, tokenTotals, vocabularySize: vocabulary.size };
}

const seedModel = {
    email: trainFromRows(seed.email),
    url: trainFromRows(seed.url.map(([label, text]) => [label, urlFeatures(text)]))
};

function urlFeatures(input) {
    const value = String(input || "");
    let features = value;
    try {
        const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
        const host = url.hostname.toLowerCase();
        features += ` ${host} ${url.pathname} ${url.search} ${url.protocol}`;
        features += ` hostlabels${host.split(".").length} length${Math.min(10, Math.floor(value.length / 25))}`;
        if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) features += " ipaddress";
        if (host.includes("xn--")) features += " punycode";
        if (url.username || url.password || value.includes("@")) features += " atsymbol";
        if (url.protocol === "http:") features += " insecurehttp";
    } catch (_) {
        features += " malformedurl";
    }
    return features;
}

function scoreEmail(email) {
    return probability(trained?.email || seedModel.email, email);
}

function scoreURL(url) {
    return probability(trained?.url || seedModel.url, urlFeatures(url));
}

function modelInfo() {
    return trained ? { source: "dataset-trained", trainedAt: trained.trainedAt, evaluation: trained.evaluation } : { source: "seed-fallback" };
}

module.exports = { scoreEmail, scoreURL, modelInfo };
