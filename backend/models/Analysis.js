const mongoose = require("mongoose");

const analysisSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        sender: {
            type: String,
            default: ""
        },

        recipient: {
            type: String,
            default: ""
        },

        subject: {
            type: String,
            default: ""
        },

        emailContent: {
            type: String,
            default: ""
        },

        riskScore: {
            type: Number,
            min: 0,
            max: 100,
            required: true
        },

        riskLevel: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            required: true
        },

        analysisMode: {
            type: String,
            enum: ["AI", "LOCAL", "LOCAL_ML"],
            default: "LOCAL"
        },

        summary: {
            type: String,
            default: ""
        },

        recommendation: {
            type: String,
            default: ""
        },

        indicators: {
            type: [String],
            default: []
        },

        urls: {
            type: [String],
            default: []
        },

        urlResults: {
            type: mongoose.Schema.Types.Mixed,
            default: []
        },

        rawResult: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Analysis", analysisSchema);
