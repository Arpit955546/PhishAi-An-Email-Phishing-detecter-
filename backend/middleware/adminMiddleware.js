function adminMiddleware(req, res, next) {
    // User authenticated hai ya nahi
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    // User ka role check
    if (req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Admin access required"
        });
    }

    // Admin hai → next route par jao
    next();
}

module.exports = adminMiddleware;