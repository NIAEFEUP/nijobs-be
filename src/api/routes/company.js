const { Router } = require("express");

const validators = require("../middleware/validators/company");
const authMiddleware = require("../middleware/auth");
const CompanyService = require("../../services/company");

const router = Router();

const upload  = require("../middleware/multer");

module.exports = (app) => {
    app.use("/company", router);

    /**
     * Creates a new Company Application
     */
    router.post("/finish",
        authMiddleware.isCompany,
        upload.single("logo"),
        validators.finish,
        async (req, res, next) => {

            try {
                const companyService = new CompanyService();
                const { bio, contacts } = req.body;
                const logo = `static/uploads/${req.file.filename}`;
                const company_id = req.user.company;
                await companyService.changeAttributes(company_id, { bio, contacts, logo, finished: true });
                return res.json({});
            } catch (err) {
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
            const { companies, totalDocCount } = await new CompanyService().findAll(computedLimit, computedOffset);
            return res.json({ companies, totalDocCount });
        } catch (error) {
            return next(error);
        }

    });
};
