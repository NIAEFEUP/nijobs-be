const CompanyApplication = require("../models/CompanyApplication");
const CompanyApplicationRules = require("../models/CompanyApplication").CompanyApplicationRules;
const hash = require("../lib/passwordHashing");
const AccountService = require("./account");

class CompanyApplicationNotFound extends Error {
    constructor(msg) {
        super(msg);
    }
}

class CompanyApplicationAlreadyReiewed extends Error {
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

        const retVal = { ...application.toObject() };
        delete retVal.password;
        return retVal;
    }

    findById(id) {
        return CompanyApplication.findById(id).exec();
    }

    /**
     *
     * @param {*} limit - Number of documents to return
     * @param {*} offset - where to start the query (pagination - how many documents to skip, NOT how many pages to skip)
     *
     * @returns {applications, docCount}
     */
    async findAll(limit, offset) {

        const docCount = await CompanyApplication.estimatedDocumentCount();

        return {
            docCount,
            applications: await Promise.all([...(await CompanyApplication.find({})
                .sort({ submittedAt: "desc" })
                .skip(offset)
                .limit(limit).exec()
            )]
                .map(async (application) => ({
                    ...application.toObject(),
                    state: (await CompanyApplication.findById(application._id).exec()).state,
                }))),
        };
    }

    buildFiltersQuery({
        companyName,
        submissionDate,
    }) {
        const filterQueries = [];

        if (companyName) {
            filterQueries.push({
                // This allows for partial text matching.
                // If only full-text is needed, use $text query instead, which uses
                // a text index and is more performant
                companyName: new RegExp(companyName, "gi"),
            });
        }

        if (submissionDate) {

            const filter = { $and: [] };

            if (submissionDate.to) {
                filter["$and"].push({ submittedAt: { "$lte": submissionDate.to } });
            }
            if (submissionDate.from) {
                filter["$and"].push({ submittedAt: { "$gte": submissionDate.from } });
            }
            filterQueries.push(filter);
        }

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
     * @returns {applications, docCount}
     */
    async find(filters, limit, offset) {

        const { state: stateFilter, ...queryFilters } = { ...filters };

        if (!filters || Object.keys(filters).length === 0) return this.findAll(limit, offset);

        const docCount = await CompanyApplication.estimatedDocumentCount();

        // Using .skip().limit() can be problematic if we get big data,
        // Once problems appear, consider using .cursor API

        return {
            docCount,
            applications: (await Promise.all(
                (await CompanyApplication.find(
                    Object.keys(queryFilters).length ? {
                        $and: this.buildFiltersQuery(queryFilters),
                    } : {})
                    .sort({ submittedAt: "desc" })
                    .skip(offset)
                    .limit(limit)
                    .exec()
                )
                    .map(async (application) => ({
                        ...application.toObject(),
                        state: (await CompanyApplication.findById(application._id).exec()).state,
                    }))
            ))
                .filter((application) => (stateFilter) ?
                    application.state === stateFilter ||
                        stateFilter.includes(application.state)
                    : true
                ),
        };
    }

    async approve(id, options) {

        let application;

        try {
            application = await CompanyApplication.findById(id, {}, options);
            if (!application) throw new CompanyApplicationNotFound(CompanyApplicationRules.MUST_EXIST_TO_APPROVE.msg);
            application.approve();
        } catch (e) {
            throw new CompanyApplicationAlreadyReiewed(CompanyApplicationRules.CANNOT_REVIEW_TWICE.msg);
        }

        try {
            const account = await (new AccountService()).registerCompany(application.email, application.password, application.companyName);
            return { application, account };

        } catch (err) {
            console.error(`Error creating account for approved Company Application, rolling back approval of ${application._id}`);
            application.undoApproval();
            throw err;
        }
    }

    async reject(id, reason, options) {
        try {
            const application = (await CompanyApplication.findById(id, {}, options));
            if (!application) throw new CompanyApplicationNotFound(CompanyApplicationRules.MUST_EXIST_TO_REJECT.msg);
            application.reject(reason);
            // eslint-disable-next-line no-unused-vars
            const { password, ...trimmedApplication } = application.toObject();
            return trimmedApplication;
        } catch (e) {
            throw new CompanyApplicationAlreadyReiewed(CompanyApplicationRules.CANNOT_REVIEW_TWICE.msg);
        }
    }
}

module.exports = CompanyApplicationService;
module.exports.CompanyApplicationAlreadyReiewed = CompanyApplicationAlreadyReiewed;
module.exports.CompanyApplicationNotFound = CompanyApplicationNotFound;
