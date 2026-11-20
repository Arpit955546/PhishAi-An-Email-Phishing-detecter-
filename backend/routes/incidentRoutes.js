const express = require("express");

const {
    createIncident,
    getIncidents,
    getIncident,
    updateIncident
} = require("../controllers/incidentController");

const router = express.Router();

router.post("/", createIncident);

router.get("/", getIncidents);

router.get("/:id", getIncident);

router.patch("/:id", updateIncident);

module.exports = router;