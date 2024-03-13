import CompanyApplication, { CompanyApplicationRules } from "../models/CompanyApplication.js";
import { generateToken } from "../lib/token.js";
import hash from "../lib/passwordHashing.js";
import { VALIDATION_LINK_EXPIRATION } from "../models/constants/ApplicationStatus.js";
import AccountService from "./account.js";
import EmailService from "../lib/emailService.js";
import {
    NEW_COMPANY_APPLICATION_ADMINS,
    NEW_COMPANY_APPLICATION_COMPANY,
    APPROVAL_NOTIFICATION,
    REJECTION_NOTIFICATION,
    APPLICATION_CONFIRMATION
} from "../email-templates/companyApplicationApproval.js";
import config from "../config/env.js";
import Account from "../models/Account.js";


export class CompanyApplicationNotFound extends Error {
    constructor(msg) {
        super(msg);
    }
}

export class CompanyApplicationAlreadyReviewed extends Error {
    constructor(msg) {
        super(msg);
    }
}

export class CompanyApplicationEmailAlreadyInUse extends Error {
    constructor(msg) {
        super(msg);
    }
}

export class CompanyApplicationAlreadyValidated extends Error {
    constructor(msg) {
        super(msg);
    }
}
export class CompanyApplicationUnverified extends Error {
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
            isVerified: false,
        });
        const link = this.buildConfirmationLink(application._id);
        await EmailService.sendMail({
            to: email,
            ...APPLICATION_CONFIRMATION(link),
        });
        return application.toObject();
    }

    async findById(id) {
        const company = await CompanyApplication.findById(id).exec();
        return company;
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

    buildCompanyNameFilter(companyNameFilter) {
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

        if (companyName) filterQueries.push(this.buildCompanyNameFilter(companyName));

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

        const docCount = await CompanyApplication.estimatedDocumentCount();

        // Using .skip().limit() can be problematic if we get big data,
        // Once problems appear, consider using .cursor API

        return {
            docCount,
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
            await application.approve();
            await EmailService.sendMail({
                to: application.email,
                ...APPROVAL_NOTIFICATION(application.companyName),
            });
        } catch (err) {
            if (!(err instanceof CompanyApplicationUnverified || err instanceof CompanyApplicationAlreadyReviewed))
                await application.undoApproval();
            console.error("Error while approving company ", err.msg);
            throw err;
        }
        return Account.findOne({ email: application.email });
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
            throw e;
        }
    }

    buildConfirmationLink(id) {
        const token = generateToken({ _id: id }, config.jwt_secret, VALIDATION_LINK_EXPIRATION);
        return `${config.application_confirmation_link}${token}/validate`;
    }

    async validateApplication(id) {
        const application = await this.findById(id);

        try {
            application.verifyCompany();
            await EmailService.sendMail({
                to: config.mail_from,
                ...NEW_COMPANY_APPLICATION_ADMINS(application.email, application.companyName, application.motivation)
            });

            await EmailService.sendMail({
                to: application.email,
                ...NEW_COMPANY_APPLICATION_COMPANY(application.companyName, application._id.toString())
            });
        } catch (err) {
            console.error(err);
            throw new CompanyApplicationAlreadyValidated(CompanyApplicationRules.APPLICATION_ALREADY_VALIDATED.msg);
        }

        try {
            await (new AccountService()).registerCompany(application.email, application.password, application.companyName);
        } catch (err) {
            console.error("Error creating account for validated Company Application", err);
            throw err;

        }
    }

    async updateOrCreate(query, update) {
        let application = await CompanyApplication.findOne(query);
        if (!application) application = await this.create(update);
        else application = await CompanyApplication.findOneAndUpdate(query, update, { new: true });
        return application;
    }
    async deleteApplications(email) {
        await CompanyApplication.deleteMany({ email: email, isVerified: false });
    }
}


export default CompanyApplicationService;
