import { Router } from "express";
import mongoose from "mongoose";
import HTTPStatus from "http-status-codes";

import * as authMiddleware from "../middleware/auth.js";
import * as companyApplicationValidators from "../middleware/validators/application.js";
import ApplicationService from "../../services/application.js";

import { buildErrorResponse, ErrorTypes } from "../middleware/errorHandler.js";

const router = Router();

const parseSortingOptions = (sortingOptions) => sortingOptions
    .reduce((sortingOptionsObj, sortingOption) => {
        const [field, mode] = sortingOption.split(":");
        if (!mode) {
            return {
                ...sortingOptionsObj,
                [field]: "desc"
            };
        } else {
            return {
                ...sortingOptionsObj,
                [field]: mode
            };
        }
    }, {});

export default (app) => {
    app.use("/applications/company", router);

    /**
     * Searches for a Company Application, with provided filters
     * @param {*} limit - Number of documents to return
     * @param {*} offset - where to start the query (pagination - how many documents to skip, NOT how many pages to skip)
     * @param {*} companyName: String
     * @param {*} submissionDateFrom: Date  - only one of the properties is necessary, but you can use both to define interval
     * @param {*} submissionDateTo: Date  - only one of the properties is necessary, but you can use both to define interval
     * @param {*} state: Array - set of options - NO NEED TO ESCAPE STRINGS
     *      e.g. /applications/company/search?state=["APPROVED","REJECTED"]
     * @param {*} sortBy: String - format: field:(desc|asc)?[,field:(desc|asc)?]*
     * where field is a valid company application field to sort on
     * If no mode (desc/asc) is given, it defaults to desc. Also if no sortBy is passed, the default is submittedAt:desc
     */
    router.get("/search",
        authMiddleware.authRequired,
        authMiddleware.isAdmin,
        companyApplicationValidators.search,
        async (req, res, next) => {

            const { limit, offset, sortBy, ...filters } = req.query;
            const computedLimit = parseInt(limit || companyApplicationValidators.MAX_LIMIT_RESULTS, 10);
            const computedOffset = parseInt(offset || 0, 10);
            let sortingOptions;

            if (sortBy?.length) {
                sortingOptions = parseSortingOptions(sortBy);
            }

            try {
                const { applications, docCount } = await (new ApplicationService()).find(
                    filters, computedLimit, computedOffset, sortingOptions
                );
                return res.json({ applications, docCount });
            } catch (err) {
                console.error(err);
                return next(err);
            }
        }
    );

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
                console.error(err);
                if (err instanceof ApplicationService.CompanyApplicationNotFound) {
                    return res
                        .status(HTTPStatus.NOT_FOUND)
                        .json(buildErrorResponse(ErrorTypes.VALIDATION_ERROR, [{ msg: err.message }]));
                } else if (
                    err instanceof ApplicationService.CompanyApplicationAlreadyReviewed ||
                    err instanceof ApplicationService.CompanyApplicationEmailAlreadyInUse
                ) {
                    return res
                        .status(HTTPStatus.CONFLICT)
                        .json(buildErrorResponse(ErrorTypes.VALIDATION_ERROR, [{ msg: err.message }]));
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
                console.error(err);
                if (err instanceof ApplicationService.CompanyApplicationNotFound) {
                    return res
                        .status(HTTPStatus.NOT_FOUND)
                        .json(buildErrorResponse(ErrorTypes.VALIDATION_ERROR, [{ msg: err.message }]));
                } else if (err instanceof ApplicationService.CompanyApplicationAlreadyReviewed) {
                    return res
                        .status(HTTPStatus.CONFLICT)
                        .json(buildErrorResponse(ErrorTypes.VALIDATION_ERROR, [{ msg: err.message }]));
                } else {
                    return next(err);
                }
            }
        });
};

export { MAX_LIMIT_RESULTS } from "../middleware/validators/application.js";
