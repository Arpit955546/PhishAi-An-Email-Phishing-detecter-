const fs = require("node:fs");
const path = require("node:path");

function argsToOptions(argv) {
    const options = {};
    for (let i = 0; i < argv.length; i++) {
        if (!argv[i].startsWith("--")) continue;
        options[argv[i].slice(2)] = argv[i + 1];
        i++;
    }
    return options;
}

// Handles quoted cells and escaped double quotes without requiring a CSV package.
function* parseCSV(text) {
    let row = [], cell = "", quoted = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (quoted) {
            if (char === '"' && text[i + 1] === '"') { cell += '"'; i++; }
            else if (char === '"') quoted = false;
            else cell += char;
        } else if (char === '"') quoted = true;
        else if (char === ",") { row.push(cell); cell = ""; }
        else if (char === "\n") { row.push(cell.replace(/\r$/, "")); yield row; row = []; cell = ""; }
        else cell += char;
    }
    if (cell || row.length) { row.push(cell.replace(/\r$/, "")); yield row; }
}

function chooseColumn(headers, requested, candidates, description) {
    if (requested && headers.includes(requested)) return requested;
    if (requested) throw new Error(`Column '${requested}' not found. Available columns: ${headers.join(", ")}`);
    const match = headers.find(header => candidates.includes(header.toLowerCase().trim()));
    if (!match) throw new Error(`Cannot identify ${description} column. Specify it with a --${description} option. Columns: ${headers.join(", ")}`);
    return match;
}

function labelIsPhishing(value, phishingLabel) {
    const normalized = String(value).trim().toLowerCase();
    if (["phishing", "phishing email", "phish", "malicious", "spam", "true"].includes(normalized)) return 1;
    if (["legitimate", "legitimate email", "legit", "benign", "safe", "safe email", "ham", "false"].includes(normalized)) return 0;
    if (Number.isFinite(Number(normalized))) return Number(normalized) === Number(phishingLabel === undefined ? 1 : phishingLabel) ? 1 : 0;
    throw new Error(`Unrecognized label '${value}'. Use phishing/legitimate or numeric labels and configure the phishing label.`);
}

function tokens(text) { return String(text).toLowerCase().match(/[a-z0-9]+/g) || []; }

function urlFeatures(value) {
    let features = String(value);
    try {
        const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
        const host = url.hostname.toLowerCase();
        features += ` ${host} ${url.pathname} ${url.search} ${url.protocol} hostlabels${host.split(".").length}`;
        if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) features += " ipaddress";
        if (host.includes("xn--")) features += " punycode";
        if (url.username || url.password || value.includes("@")) features += " atsymbol";
        if (url.protocol === "http:") features += " insecurehttp";
    } catch (_) { features += " malformedurl"; }
    return features;
}

function train(rows) {
    const documents = [0, 0], counts = [Object.create(null), Object.create(null)], tokenTotals = [0, 0], vocabulary = new Set();
    for (const [label, text] of rows) {
        documents[label]++;
        for (const token of new Set(tokens(text))) {
            vocabulary.add(token);
            counts[label][token] = (counts[label][token] || 0) + 1;
            tokenTotals[label]++;
        }
    }
    if (!documents[0] || !documents[1]) throw new Error("Training data must contain both phishing and legitimate examples.");
    return { documents, counts, tokenTotals, vocabularySize: vocabulary.size };
}

function probability(model, text) {
    const vocabularySize = model.vocabularySize, found = new Set(tokens(text)), log = [0, 0];
    for (let label = 0; label <= 1; label++) {
        log[label] = Math.log(model.documents[label] / (model.documents[0] + model.documents[1]));
        for (const token of found) {
            const count = Object.hasOwn(model.counts[label], token) ? model.counts[label][token] : 0;
            log[label] += Math.log((count + 1) / (model.tokenTotals[label] + vocabularySize));
        }
    }
    const delta = Math.max(-30, Math.min(30, log[1] - log[0]));
    return 1 / (1 + Math.exp(-delta));
}

function splitRows(rows) {
    const groups = [rows.filter(row => row[0] === 0), rows.filter(row => row[0] === 1)];
    const trainRows = [], testRows = [];
    for (const group of groups) {
        // Deterministic pseudo-random ordering so training metrics can be reproduced.
        const shuffled = [...group].sort((a, b) => hash(a[1]) - hash(b[1]));
        const testCount = Math.max(1, Math.floor(shuffled.length * 0.2));
        testRows.push(...shuffled.slice(0, testCount)); trainRows.push(...shuffled.slice(testCount));
    }
    return { trainRows, testRows };
}
function hash(value) { let h = 2166136261; for (const char of value) h = Math.imul(h ^ char.charCodeAt(0), 16777619); return h >>> 0; }

function evaluate(model, rows, transform = value => value) {
    let correct = 0; const matrix = [[0, 0], [0, 0]];
    for (const [expected, text] of rows) {
        const predicted = probability(model, transform(text)) >= 0.5 ? 1 : 0;
        matrix[expected][predicted]++; if (expected === predicted) correct++;
    }
    const perClass = [0, 1].map(label => {
        const tp = matrix[label][label], fp = matrix[1 - label][label], fn = matrix[label][1 - label];
        const precision = tp / (tp + fp || 1), recall = tp / (tp + fn || 1);
        return { precision: +precision.toFixed(4), recall: +recall.toFixed(4), f1: +(2 * precision * recall / (precision + recall || 1)).toFixed(4) };
    });
    return { samples: rows.length, accuracy: +(correct / rows.length).toFixed(4), confusionMatrix: { trueLegitimate: matrix[0][0], falsePhishingAlerts: matrix[0][1], missedPhishing: matrix[1][0], detectedPhishing: matrix[1][1] }, legitimate: perClass[0], phishing: perClass[1] };
}

function loadRows(file, opts, kind, forcedLabel) {
    const parser = parseCSV(fs.readFileSync(file, "utf8"));
    const headers = parser.next().value?.map(header => header.trim().replace(/^\uFEFF/, ""));
    if (!headers) throw new Error(`${file} is empty or has no CSV header.`);
    const textColumn = chooseColumn(headers, opts[`${kind}-text`], kind === "email" ? ["email text", "email_text", "text", "body", "content", "message"] : ["url", "uri", "link"], `${kind}-text`);
    const labelColumn = chooseColumn(headers, opts[`${kind}-label`], ["label", "class", "type", "email type", "email_type", "category", "target"], `${kind}-label`);
    const phishingLabel = opts[`${kind}-phishing-label`];
    const unique = new Map();
    for (const values of parser) {
        const recordText = values[headers.indexOf(textColumn)] || "";
        const recordLabel = forcedLabel === undefined ? (values[headers.indexOf(labelColumn)] || "") : "forced";
        const text = String(recordText).trim();
        if (!text || !String(recordLabel).trim()) continue;
        if (kind === "email" && /this text is part of the internal format of your mail folder/i.test(text)) continue;
        const label = forcedLabel === undefined ? labelIsPhishing(recordLabel, phishingLabel) : forcedLabel;
        unique.set(`${label}:${text}`, [label, kind === "url" ? urlFeatures(text) : text]);
    }
    const rows = [...unique.values()];
    if (rows.length < 20) throw new Error(`${kind} data needs at least 20 unique rows; found ${rows.length}.`);
    return rows;
}

function main() {
    const opts = argsToOptions(process.argv.slice(2));
    if (!opts.email || !opts.url) {
        console.error("Usage: npm run train:models -- --email data/email.csv --url data/phiusiil.csv [--email-phishing-file data/phishing-only.csv --url-phishing-label 0]");
        process.exitCode = 1; return;
    }
    const emailRows = loadRows(opts.email, opts, "email");
    if (opts["email-phishing-file"]) emailRows.push(...loadRows(opts["email-phishing-file"], opts, "email", 1));
    const urlRows = loadRows(opts.url, opts, "url");
    for (const [name, rows] of [["email", emailRows], ["url", urlRows]]) {
        const labels = new Set(rows.map(row => row[0]));
        if (!labels.has(0) || !labels.has(1)) throw new Error(`${name} data needs both legitimate and phishing examples.`);
    }
    const emailSplit = splitRows(emailRows), urlSplit = splitRows(urlRows);
    const emailEvalModel = train(emailSplit.trainRows), urlEvalModel = train(urlSplit.trainRows);
    const report = {
        generatedAt: new Date().toISOString(),
        trainingRows: {
            email: { legitimate: emailRows.filter(row => row[0] === 0).length, phishing: emailRows.filter(row => row[0] === 1).length },
            url: { legitimate: urlRows.filter(row => row[0] === 0).length, phishing: urlRows.filter(row => row[0] === 1).length }
        },
        dataSources: opts.attribution || "Not specified",
        email: evaluate(emailEvalModel, emailSplit.testRows),
        url: evaluate(urlEvalModel, urlSplit.testRows),
        note: "Metrics use deterministic stratified 80/20 holdouts. Duplicates are removed before splitting."
    };
    const artifact = {
        trainedAt: report.generatedAt,
        attribution: opts.attribution || "Training data sources and licenses must be recorded by the dataset user.",
        email: train(emailRows), url: train(urlRows), evaluation: report
    };
    const out = path.resolve(opts.out || "models/trained-models.json");
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(artifact));
    const reportPath = path.resolve(opts.report || "models/training-report.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ model: out, report: reportPath, evaluation: report }, null, 2));
}

try { main(); } catch (error) { console.error(`Training failed: ${error.message}`); process.exitCode = 1; }
