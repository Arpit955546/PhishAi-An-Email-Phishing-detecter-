const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema(
    {
        incidentId: {
            type: String,
            unique: true,
            index: true
        },

        title: {
            type: String,
            required: true
        },

        description: {
            type: String,
            default: ""
        },

        severity: {
            type: String,
            enum: [
                "LOW",
                "MEDIUM",
                "HIGH",
                "CRITICAL"
            ],
            default: "MEDIUM"
        },

        status: {
            type: String,
            enum: [
                "OPEN",
                "INVESTIGATING",
                "CONTAINED",
                "RESOLVED"
            ],
            default: "OPEN"
        },

        source: {
            type: String,
            default: "UNKNOWN"
        },

        indicators: {
            type: [String],
            default: []
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Incident",
    incidentSchema
);