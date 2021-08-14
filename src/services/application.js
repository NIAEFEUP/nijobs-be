const CompanyApplication = require("../models/CompanyApplication");
const CompanyApplicationRules = require("../models/CompanyApplication").CompanyApplicationRules;
const hash = require("../lib/passwordHashing");
const AccountService = require("./account");
const EmailService = require("../lib/emailService");
const {
    NEW_COMPANY_APPLICATION_ADMINS,
    NEW_COMPANY_APPLICATION_COMPANY,
    APPROVAL_NOTIFICATION,
    REJECTION_NOTIFICATION,
} = require("../email-templates/companyApplicationApproval");
const config = require("../config/env");

class CompanyApplicationNotFound extends Error {
    constructor(msg) {
        super(msg);
    }
}

class CompanyApplicationAlreadyReviewed extends Error {
    constructor(msg) {
        super(msg);
    }
}

class CompanyApplicationEmailAlreadyInUse extends Error {
    constructor(msg) {
        super(msg);
    }
}

class CompanyApplicationService {

    async create({
        email, password, companyName, motivation,
    }) {
        const application = await CompanyApplication.create({
            email,
            password: await hash(password),
            companyName,
            motivation,
            submittedAt: Date.now(),
        });

        await EmailService.sendMail({
            to: config.mail_from,
            ...NEW_COMPANY_APPLICATION_ADMINS(application.email, companyName, motivation)
        });

        await EmailService.sendMail({
            to: application.email,
            ...NEW_COMPANY_APPLICATION_COMPANY(companyName, application._id.toString())
        });

        return application.toObject();
    }

    findById(id) {
        return CompanyApplication.findById(id).exec();
    }

    /**
     *
     * @param {*} limit - Number of documents to return
     * @param {*} offset - where to start the query (pagination - how many documents to skip, NOT how many pages to skip)
     *
     * @returns {applications, totalDocCount}
     */
    async findAll(limit, offset, sortingOptions) {

        const totalDocCount = await CompanyApplication.estimatedDocumentCount();

        return {
            totalDocCount,
            applications:
                [...(await CompanyApplication.find({})
                    .sort(sortingOptions || { submittedAt: "desc" })
                    .skip(offset)
                    .limit(limit)
                    .exec()
                )]
                    .map((application) => application.toObject()),

        };
    }

    buildCompnayNameFilter(companyNameFilter) {
        return {
            // This allows for partial text matching.
            // If only full-text is needed, use $text query instead, which uses
            // a text index and is more performant
            companyName: new RegExp(companyNameFilter, "gi"),
        };
    }

    buildSubmissionDateFilter(submissionDateFilter) {
        const filter = { $and: [] };

        if (submissionDateFilter.to) {
            filter["$and"].push({ submittedAt: { "$lte": submissionDateFilter.to } });
        }
        if (submissionDateFilter.from) {
            filter["$and"].push({ submittedAt: { "$gte": submissionDateFilter.from } });
        }

        return filter;
    }

    buildFiltersQuery({
        companyName,
        submissionDateFrom,
        submissionDateTo,
    }) {
        const filterQueries = [];

        if (companyName) filterQueries.push(this.buildCompnayNameFilter(companyName));

        if (submissionDateFrom || submissionDateTo)
            filterQueries.push(this.buildSubmissionDateFilter({ from: submissionDateFrom, to: submissionDateTo }));

        return filterQueries;
    }

    /**
     * @param {*} limit - Number of documents to return
     * @param {*} offset - where to start the query (pagination - how many documents to skip, NOT how many pages to skip)
     * @param {*} filters - object with optional properties: state, submissionDate, companyName
     * {
     *      companyName: String
     *      submissionDate: { - only one of the properties is necessary, but you can use both to define interval
     *          from: Date
     *          to: Date
     *      }
     *      state: String | Array - String for exact match, Array to provide set of options
     * }
     * @returns {applications, totalDocCount}
     */
    async find(filters, limit, offset, sortingOptions) {

        const { state: stateFilter, ...queryFilters } = { ...filters };

        if (!filters || Object.keys(filters).length === 0) return this.findAll(limit, offset, sortingOptions);

        const totalDocCount = await CompanyApplication.estimatedDocumentCount();

        // Using .skip().limit() can be problematic if we get big data,
        // Once problems appear, consider using .cursor API

        return {
            totalDocCount,
            applications:
                (await CompanyApplication.find(
                    Object.keys(queryFilters).length ? {
                        $and: this.buildFiltersQuery(queryFilters),
                    } : {})
                    .sort(sortingOptions || { submittedAt: "desc" })
                    .skip(offset)
                    .limit(limit)
                    .exec()
                )
                    .map((application) => application.toObject())
                    .filter((application) => (stateFilter) ?
                        application.state === stateFilter ||
                        stateFilter.includes(application.state)
                        : true
                    ),
        };
    }

    async approve(id, options) {

        const application = await CompanyApplication.findById(id, {}, options);
        if (!application) throw new CompanyApplicationNotFound(CompanyApplicationRules.MUST_EXIST_TO_APPROVE.msg);
        try {
            application.approve();
        } catch (e) {
            console.error(e);
            throw new CompanyApplicationAlreadyReviewed(CompanyApplicationRules.CANNOT_REVIEW_TWICE.msg);
        }

        try {
            const account = await (new AccountService()).registerCompany(application.email, application.password, application.companyName);

            await EmailService.sendMail({
                to: application.email,
                ...APPROVAL_NOTIFICATION(application.companyName),
            });

            return { application, account };

        } catch (err) {
            console.error(`Error creating account for approved Company Application, rolling back approval of ${application._id}`, err);
            application.undoApproval();
            if (err.name === "MongoError" && /E11000\s.*collection:\s.*\.accounts.*/.test(err.errmsg)) {
                throw new CompanyApplicationEmailAlreadyInUse(CompanyApplicationRules.EMAIL_ALREADY_IN_USE.msg);
            } else {
                throw err;
            }
        }
    }

    async reject(id, reason, options) {
        const application = (await CompanyApplication.findById(id, {}, options));
        if (!application) throw new CompanyApplicationNotFound(CompanyApplicationRules.MUST_EXIST_TO_REJECT.msg);
        try {
            application.reject(reason);

            await EmailService.sendMail({
                to: application.email,
                ...REJECTION_NOTIFICATION(application.companyName),
            });

            return application.toObject();
        } catch (e) {
            console.error(e);
            throw new CompanyApplicationAlreadyReviewed(CompanyApplicationRules.CANNOT_REVIEW_TWICE.msg);
        }
    }
}

module.exports = CompanyApplicationService;
module.exports.CompanyApplicationAlreadyReviewed = CompanyApplicationAlreadyReviewed;
module.exports.CompanyApplicationNotFound = CompanyApplicationNotFound;
module.exports.CompanyApplicationEmailAlreadyInUse = CompanyApplicationEmailAlreadyInUse;
