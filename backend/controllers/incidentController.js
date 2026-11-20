const incidents = [];


/*
    Create a new security incident
*/
async function createIncident(req, res) {
    try {
        const {
            title,
            description,
            severity = "MEDIUM",
            source = "UNKNOWN",
            indicators = []
        } = req.body;

        if (!title || typeof title !== "string") {
            return res.status(400).json({
                success: false,
                error: "Incident title is required"
            });
        }

        const incident = {
            id: `INC-${Date.now()}`,
            title: title.trim(),
            description:
                typeof description === "string"
                    ? description.trim()
                    : "",
            severity: String(severity).toUpperCase(),
            source: String(source).toUpperCase(),
            indicators: Array.isArray(indicators)
                ? indicators
                : [],
            status: "OPEN",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        incidents.push(incident);

        return res.status(201).json({
            success: true,
            incident
        });

    } catch (error) {
        console.error(
            "Create incident error:",
            error
        );

        return res.status(500).json({
            success: false,
            error: "Failed to create incident"
        });
    }
}


/*
    Get all incidents
*/
async function getIncidents(req, res) {
    try {
        return res.json({
            success: true,
            count: incidents.length,
            incidents
        });

    } catch (error) {
        console.error(
            "Get incidents error:",
            error
        );

        return res.status(500).json({
            success: false,
            error: "Failed to fetch incidents"
        });
    }
}


/*
    Get one incident
*/
async function getIncident(req, res) {
    try {
        const { id } = req.params;

        const incident = incidents.find(
            item => item.id === id
        );

        if (!incident) {
            return res.status(404).json({
                success: false,
                error: "Incident not found"
            });
        }

        return res.json({
            success: true,
            incident
        });

    } catch (error) {
        console.error(
            "Get incident error:",
            error
        );

        return res.status(500).json({
            success: false,
            error: "Failed to fetch incident"
        });
    }
}


/*
    Update incident status
*/
async function updateIncident(req, res) {
    try {
        const { id } = req.params;
        const { status, severity, description } = req.body;

        const incident = incidents.find(
            item => item.id === id
        );

        if (!incident) {
            return res.status(404).json({
                success: false,
                error: "Incident not found"
            });
        }

        if (status) {
            const allowedStatuses = [
                "OPEN",
                "INVESTIGATING",
                "CONTAINED",
                "RESOLVED"
            ];

            const newStatus =
                String(status).toUpperCase();

            if (!allowedStatuses.includes(newStatus)) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid incident status"
                });
            }

            incident.status = newStatus;
        }

        if (severity) {
            incident.severity =
                String(severity).toUpperCase();
        }

        if (typeof description === "string") {
            incident.description =
                description.trim();
        }

        incident.updatedAt =
            new Date().toISOString();

        return res.json({
            success: true,
            incident
        });

    } catch (error) {
        console.error(
            "Update incident error:",
            error
        );

        return res.status(500).json({
            success: false,
            error: "Failed to update incident"
        });
    }
}


module.exports = {
    createIncident,
    getIncidents,
    getIncident,
    updateIncident
};