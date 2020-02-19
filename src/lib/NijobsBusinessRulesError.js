/**
 * Utility to throw custom errors that can be filtered by err.name
 */
class NijobsBusinessRulesError extends Error {
    constructor(msg) {
        super(msg);
        this.name = "NijobsBusinessRulesError";

    }
}

module.exports = NijobsBusinessRulesError;
