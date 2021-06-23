const config = require("../../config/env");
const { Router } = require("express");
const HTTPStatus = require("http-status-codes");

const validators = require("../middleware/validators/company");
const companyMiddleware = require("../middleware/company");
const authMiddleware = require("../middleware/auth");
const CompanyService = require("../../services/company");
const { ErrorTypes } = require("../middleware/errorHandler");
const ValidationReasons = require("../middleware/validators/validationReasons");

const { or } = require("../middleware/utils");

const router = Router();

const fileMiddleware  = require("../middleware/files");
const { authRequired } = require("../middleware/auth");
const OfferService = require("../../services/offer");

module.exports = (app) => {
    app.use("/company", router);

    /**
     * Finishes the profile of a Company
     */
    router.post("/application/finish",
        authRequired,
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
        validators.unblock,
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
    router.put("/enable",
        or([
            authMiddleware.isCompany,
            authMiddleware.isAdmin,
            authMiddleware.isGod
        ], { status_code: HTTPStatus.UNAUTHORIZED, error_code: ErrorTypes.FORBIDDEN, msg: ValidationReasons.INSUFFICIENT_PERMISSIONS }),
        companyMiddleware.canEnable,
        companyMiddleware.validCompany,
        async (req, res, next) => {
            try {
                const company = await (new CompanyService()).changeAttributes(req.body.owner, { isDisabled: false });
                return res.json({ company });
            } catch (err) {
                return next(err);
            }
        });

    /**
     * Disables a previously enabled company
     */
    router.put("/disable",
        or([
            authMiddleware.isCompany,
            authMiddleware.isGod
        ], { status_code: HTTPStatus.UNAUTHORIZED, error_code: ErrorTypes.FORBIDDEN, msg: ValidationReasons.INSUFFICIENT_PERMISSIONS }),
        companyMiddleware.canDisable,
        companyMiddleware.validCompany,
        async (req, res, next) => {
            try {
                const company = await (new CompanyService()).changeAttributes(req.body.owner, { isDisabled: true });
                return res.json({ company });
            } catch (err) {
                return next(err);
            }
        });
};
