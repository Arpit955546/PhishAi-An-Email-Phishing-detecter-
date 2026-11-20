const mongoose = require("mongoose");

const threatSchema = new mongoose.Schema(
    {
        indicator: {
            type: String,
            required: true,
            index: true
        },

        type: {
            type: String,
            enum: [
                "URL",
                "DOMAIN",
                "IP",
                "EMAIL",
                "MD5",
                "SHA1",
                "SHA256",
                "UNKNOWN"
            ],
            default: "UNKNOWN"
        },

        malicious: {
            type: Boolean,
            default: false
        },

        score: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },

        confidence: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },

        source: {
            type: String,
            default: "LOCAL"
        },

        lastSeen: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Threat", threatSchema);