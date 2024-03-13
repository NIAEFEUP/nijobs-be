import { Router } from "express";
import { StatusCodes as HTTPStatus } from "http-status-codes";

import config from "../../config/env.js";
import * as validators from "../middleware/validators/company.js";
import * as companyMiddleware from "../middleware/company.js";
import * as authMiddleware from "../middleware/auth.js";
import * as offerMiddleware from "../middleware/offer.js";
import CompanyService from "../../services/company.js";
import { ErrorTypes } from "../middleware/errorHandler.js";
import ValidationReasons from "../middleware/validators/validationReasons.js";
import { concurrentOffersNotExceeded } from "../middleware/validators/validatorUtils.js";

import { or } from "../middleware/utils.js";

import * as fileMiddleware from "../middleware/files.js";
import OfferService from "../../services/offer.js";
import AccountService from "../../services/account.js";
import Offer from "../../models/Offer.js";

const router = Router();

export default (app) => {
    app.use("/company", router);

    router.use(offerMiddleware.setTargetOwner);

    /**
     * Finishes the profile of a Company
     */
    router.post("/application/finish",
        authMiddleware.authRequired,
        authMiddleware.isCompany,
        companyMiddleware.profileNotComplete,
        fileMiddleware.parseSingleFile("logo"),
        validators.finish,
        fileMiddleware.localSave,
        fileMiddleware.cloudSave,
        async (req, res, next) => {

            try {
                const companyService = new CompanyService();
                const { bio, contacts } = req.body;
                const logo = req?.file?.url || `${config.webserver_host}/static/${req.file.filename}`;
                const company_id = req.user.company;
                await companyService.changeAttributes(company_id, { bio, contacts, logo, hasFinishedRegistration: true });
                return res.json({});
            } catch (err) {
                console.error(err);
                return next(err);
            }
        });

    /**
     * List all Companies
     * @param {*} limit - Number of documents to return
     * @param {*} offset - where to start the query (pagination - how many documents to skip, NOT how many pages to skip)
     */
    router.get("", validators.list, async (req, res, next) => {
        const { limit, offset } = req.query;
        const computedLimit = parseInt(limit || validators.MAX_LIMIT_RESULTS, 10);
        const computedOffset = parseInt(offset || 0, 10);

        try {
            const { companies, totalDocCount } =
                await new CompanyService().findAll(computedLimit, computedOffset, req.hasAdminPrivileges, req.hasAdminPrivileges);
            return res.json({ companies, totalDocCount });
        } catch (error) {
            console.error(error);
            return next(error);
        }

    });

    router.get("/:companyId",
        validators.profile,
        (req, res, next) => companyMiddleware.canAccessProfile(req.params.companyId)(req, res, next),
        async (req, res) => {
            const company = await new CompanyService().findById(
                req.params.companyId,
                // Can be safely set to true, as the middleware takes
                // care of validation for us
                true,
                req.hasAdminPrivileges
            );
            const offers = await new OfferService().getOffersByCompanyId(
                req.params.companyId,
                req.targetOwner,
                req.hasAdminPrivileges
            );
            return res.json({ company, offers });
        }
    );

    router.put(
        "/:companyId/block",
        or([
            authMiddleware.isGod,
            authMiddleware.isAdmin
        ],
        { status_code: HTTPStatus.UNAUTHORIZED, error_code: ErrorTypes.FORBIDDEN, msg: ValidationReasons.INSUFFICIENT_PERMISSIONS }),
        validators.block,
        async (req, res, _next) => {
            const service = new CompanyService();
            await new OfferService().blockByCompany(req.params.companyId);
            const company = await service.block(req.params.companyId, req.body.adminReason);
            await service.sendCompanyBlockedNotification(req.params.companyId);
            return res.json(company);
        });

    router.put(
        "/:companyId/unblock",
        or([
            authMiddleware.isGod,
            authMiddleware.isAdmin
        ],
        { status_code: HTTPStatus.UNAUTHORIZED, error_code: ErrorTypes.FORBIDDEN, msg: ValidationReasons.INSUFFICIENT_PERMISSIONS }),
        validators.enable,
        async (req, res, _next) => {
            try {
                const service = new CompanyService();
                await new OfferService().unblockByCompany(req.params.companyId);
                const company = await service.unblock(req.params.companyId);
                await service.sendCompanyUnblockedNotification(req.params.companyId);
                return res.json(company);
            } catch (err) {
                console.error(err);
                throw err;
            }
        });

    /**
     * Enables a previously disabled company
     */
    router.put("/:companyId/enable",
        or([
            authMiddleware.isCompany,
            authMiddleware.isAdmin,
            authMiddleware.isGod
        ], { status_code: HTTPStatus.UNAUTHORIZED, error_code: ErrorTypes.FORBIDDEN, msg: ValidationReasons.INSUFFICIENT_PERMISSIONS }),
        validators.enable,
        (req, res, next) => companyMiddleware.canManageAccountSettings(req.params.companyId)(req, res, next),
        async (req, res, next) => {
            try {
                const service = new CompanyService();
                await new OfferService().enableByCompany(req.params.companyId);
                const company = await service.enable(req.params.companyId);
                await service.sendCompanyEnabledNotification(req.params.companyId);
                return res.json(company);
            } catch (err) {
                return next(err);
            }
        });

    /**
     * Disables a previously enabled company
     */
    router.put("/:companyId/disable",
        or([
            authMiddleware.isCompany,
            authMiddleware.isGod
        ], { status_code: HTTPStatus.UNAUTHORIZED, error_code: ErrorTypes.FORBIDDEN, msg: ValidationReasons.INSUFFICIENT_PERMISSIONS }),
        validators.disable,
        (req, res, next) => companyMiddleware.canManageAccountSettings(req.params.companyId)(req, res, next),
        async (req, res, next) => {
            try {
                const service = new CompanyService();
                await new OfferService().disableByCompany(req.params.companyId);
                const company = await service.disable(req.params.companyId);
                await service.sendCompanyDisabledNotification(req.params.companyId);
                return res.json(company);
            } catch (err) {
                return next(err);
            }
        });

    /**
     * Deletes a company, its account and all its offers
     */
    router.post("/:companyId/delete",
        or([
            authMiddleware.isCompany,
            authMiddleware.isGod
        ], { status_code: HTTPStatus.UNAUTHORIZED, error_code: ErrorTypes.FORBIDDEN, msg: ValidationReasons.INSUFFICIENT_PERMISSIONS }),
        validators.deleteCompany,
        (req, res, next) => companyMiddleware.canManageAccountSettings(req.params.companyId)(req, res, next),
        async (req, res, next) => {
            try {
                const companyService = new CompanyService();
                await new OfferService().deleteOffersByCompanyId(req.params.companyId);
                const company = await companyService.findAndDeleteById(req.params.companyId);
                const account = await new AccountService().findAndDeleteByCompanyId(req.params.companyId);
                await companyService.sendCompanyDeletedNotification(account.email, company.name);
                return res.json(company);
            } catch (err) {
                return next(err);
            }
        });

    /**
     * Verifies if a company has reached max concurrent offers between two dates
     */
    router.get("/:companyId/hasReachedMaxConcurrentOffersBetweenDates",
        or([
            authMiddleware.isCompany,
            authMiddleware.isAdmin,
            authMiddleware.isGod,
        ], { status_code: HTTPStatus.UNAUTHORIZED, error_code: ErrorTypes.FORBIDDEN, msg: ValidationReasons.INSUFFICIENT_PERMISSIONS }),
        validators.checkConcurrent,
        validators.setDefaultValuesConcurrent,
        (req, res, next) => companyMiddleware.canManageAccountSettings(req.params.companyId)(req, res, next),
        async (req, res, next) => {
            try {
                const maxNotReached = await concurrentOffersNotExceeded(Offer)(
                    req.params.companyId,
                    req.body.publishDate,
                    req.body.publishEndDate
                );

                return res.json({ maxOffersReached: !maxNotReached });
            } catch (err) {
                return next(err);
            }
        });


    /**
     * Edit company details.
     * Company or admin can edit.
     */
    router.put("/:companyId/edit",
        or([
            authMiddleware.isCompany,
            authMiddleware.isAdmin,
            authMiddleware.isGod
        ], { status_code: HTTPStatus.UNAUTHORIZED, error_code: ErrorTypes.FORBIDDEN, msg: ValidationReasons.INSUFFICIENT_PERMISSIONS }),
        validators.edit,
        fileMiddleware.parseSingleFile("logo", false),
        fileMiddleware.localSave,
        fileMiddleware.cloudSave,
        (req, res, next) => companyMiddleware.canManageAccountSettings(req.params.companyId)(req, res, next),
        (req, res, next) => companyMiddleware.isNotBlocked(req.params.companyId)(req, res, next),
        (req, res, next) => companyMiddleware.isNotDisabled(req.params.companyId)(req, res, next),
        async (req, res, next) => {
            try {
                const companyService = new CompanyService();
                const offerService = new OfferService();
                const logo = req.file && (req?.file?.url || `${config.webserver_host}/static/${req.file.filename}`);
                const company = await companyService.changeAttributes(req.params.companyId, { ...req.body, logo });
                await offerService.updateAllOffersByCompanyId(company);
                return res.json(company);
            } catch (err) {
                return next(err);
            }
        }
    );

    /**
     * Gets all the offers of a certain company from the db
     */
    router.get("/:companyId/offers", validators.getOffers, async (req, res, next) => {
        try {
            const offers = await (new OfferService())
                .getOffersByCompanyId(req.params.companyId, req.targetOwner, req.hasAdminPrivileges);

            return res.json(offers);
        } catch (err) {
            /* istanbul ignore next */
            return next(err);
        }
    });

};
