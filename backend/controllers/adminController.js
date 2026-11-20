const User = require("../models/user");
const Analysis = require("../models/Analysis");


async function getAdminDashboard(req, res) {

    try {

        // Total users
        const totalUsers =
            await User.countDocuments();


        // Total email analyses
        const totalEmailAnalyses =
            await Analysis.countDocuments();


        // Threats detected
        const threatsDetected =
            await Analysis.countDocuments({
                riskLevel: {
                    $in: [
                        "HIGH",
                        "CRITICAL"
                    ]
                }
            });


        // Recent analyses
        const recentAnalyses =
            await Analysis
                .find()
                .populate(
                    "user",
                    "name email"
                )
                .sort({
                    createdAt: -1
                })
                .limit(10)
                .lean();


        return res.json({

            success: true,

            data: {

                totalUsers,

                totalEmailAnalyses,

                threatsDetected,

                recentAnalyses

            }

        });

    } catch (error) {

        console.error(
            "Admin Dashboard Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to load admin dashboard"

        });

    }
}


module.exports = {
    getAdminDashboard
};