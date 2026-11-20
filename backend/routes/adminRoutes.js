const express = require("express");

const router = express.Router();

const authMiddleware =
    require("../middleware/authMiddleware");

const adminMiddleware =
    require("../middleware/adminMiddleware");

const {
    getAdminDashboard
} = require("../controllers/adminController");


// Admin test
router.get(
    "/test",
    authMiddleware,
    adminMiddleware,
    (req, res) => {

        res.json({
            success: true,
            message: "Admin API is working",
            admin: req.user
        });

    }
);


// Admin dashboard data
router.get(
    "/dashboard",
    authMiddleware,
    adminMiddleware,
    getAdminDashboard
);


module.exports = router;