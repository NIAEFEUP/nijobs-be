const { Router } = require("express");

const authMiddleware = require("../middleware/auth");
const { MAX_LIMIT_RESULTS, ...companyApplicationValidators } = require("../middleware/validators/application");
const ApplicationService = require("../../services/application");
const mongoose = require("mongoose");

const HTTPStatus = require("http-status-codes");
const { buildErrorResponse, ErrorTypes } = require("../middleware/errorHandler");

const router = Router();

module.exports = (app) => {
    app.use("/applications/company", router);

    /**
     * Searches for a Company Application, with provided filters
     * // TODO: Document inputs (limit, offset, filters and sorting options)
     */
    router.get("/search", companyApplicationValidators.search, async (req, res, next) => {

        const limit = parseInt(req.query.limit || MAX_LIMIT_RESULTS, 10);
        const offset = parseInt(req.query.offset || 0, 10);
        let sortingOptions;

        if (!req.body.sortBy) {
            sortingOptions = undefined;
        } else if (typeof sortBy === "string") {
            sortingOptions = { [req.body.sortBy]: "desc" };
        } else {
            sortingOptions = req.body.sortBy;
        }

        try {
            // This is safe since the service is destructuring the passed object and the fields have been validated
            const { applications, docCount } = await (new ApplicationService()).find(req.body.filters, limit, offset, sortingOptions);
            return res.json({ applications, docCount });
        } catch (err) {
            return next(err);
        }
    });

    /**
     * Approves a Pending Company Application
     */
    router.post("/:id/approve",
        authMiddleware.authRequired,
        authMiddleware.isAdmin,
        companyApplicationValidators.approve,
        async (req, res, next) => {

            try {
                const { account } = await (new ApplicationService()).approve(mongoose.Types.ObjectId(req.params.id));
                return res.json(account);
            } catch (err) {
                if (err instanceof ApplicationService.CompanyApplicationNotFound) {
                    return res
                        .status(HTTPStatus.NOT_FOUND)
                        .json(buildErrorResponse(ErrorTypes.VALIDATION_ERROR, [err.message]));
                } else if (err instanceof ApplicationService.CompanyApplicationAlreadyReiewed) {
                    return res
                        .status(HTTPStatus.CONFLICT)
                        .json(buildErrorResponse(ErrorTypes.VALIDATION_ERROR, [err.message]));

                } else if (err instanceof ApplicationService.CompanyApplicationEmailAlreadyInUse) {
                    return res
                        .status(HTTPStatus.CONFLICT)
                        .json(buildErrorResponse(ErrorTypes.VALIDATION_ERROR, [err.message]));
                } else {
                    return next(err);
                }
            }
        });

    /**
     * Rejects a Pending Company Application
     */
    router.post("/:id/reject",
        authMiddleware.authRequired,
        authMiddleware.isAdmin,
        companyApplicationValidators.reject,
        async (req, res, next) => {

            try {
                const application = await (new ApplicationService()).reject(mongoose.Types.ObjectId(req.params.id), req.body.rejectReason);
                return res.json(application);
            } catch (err) {
                if (err instanceof ApplicationService.CompanyApplicationNotFound) {
                    return res
                        .status(HTTPStatus.NOT_FOUND)
                        .json(buildErrorResponse(ErrorTypes.VALIDATION_ERROR, [err.message]));
                } else if (err instanceof ApplicationService.CompanyApplicationAlreadyReiewed) {
                    return res
                        .status(HTTPStatus.CONFLICT)
                        .json(buildErrorResponse(ErrorTypes.VALIDATION_ERROR, [err.message]));
                } else {
                    return next(err);
                }
            }
        });
};

module.exports.MAX_LIMIT_RESULTS = MAX_LIMIT_RESULTS;
