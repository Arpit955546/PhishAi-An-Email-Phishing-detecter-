function isValidEmail(email) {
    if (!email || typeof email !== "string") {
        return false;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email.trim()
    );
}

function isValidURL(url) {
    if (!url || typeof url !== "string") {
        return false;
    }

    try {
        const parsed = new URL(url.trim());

        return (
            parsed.protocol === "http:" ||
            parsed.protocol === "https:"
        );
    } catch (error) {
        return false;
    }
}

function isValidIP(ip) {
    if (!ip || typeof ip !== "string") {
        return false;
    }

    const parts = ip.trim().split(".");

    if (parts.length !== 4) {
        return false;
    }

    return parts.every(part => {
        if (!/^\d+$/.test(part)) {
            return false;
        }

        const value = Number(part);

        return value >= 0 && value <= 255;
    });
}

function isValidHash(hash) {
    if (!hash || typeof hash !== "string") {
        return false;
    }

    const value = hash.trim();

    return (
        /^[a-f0-9]{32}$/i.test(value) ||
        /^[a-f0-9]{40}$/i.test(value) ||
        /^[a-f0-9]{64}$/i.test(value)
    );
}

function validateText(value, maxLength = 10000) {
    if (typeof value !== "string") {
        return false;
    }

    const text = value.trim();

    return (
        text.length > 0 &&
        text.length <= maxLength
    );
}

module.exports = {
    isValidEmail,
    isValidURL,
    isValidIP,
    isValidHash,
    validateText
};