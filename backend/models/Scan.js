const mongoose = require("mongoose");

const scanSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["EMAIL", "URL", "FILE", "QR", "SMS"],
            required: true
        },

        input: {
            type: String,
            required: true
        },

        score: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },

        riskLevel: {
            type: String,
            enum: [
                "LOW",
                "MEDIUM",
                "HIGH",
                "CRITICAL"
            ],
            default: "LOW"
        },

        threats: {
            type: [String],
            default: []
        },

        summary: {
            type: String,
            default: ""
        },

        recommendation: {
            type: String,
            default: ""
        },

        analysisMode: {
            type: String,
            enum: ["AI", "LOCAL"],
            default: "LOCAL"
        },

        indicators: {
            type: [String],
            default: []
        },

        status: {
            type: String,
            enum: ["COMPLETED", "FAILED"],
            default: "COMPLETED"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Scan", scanSchema);