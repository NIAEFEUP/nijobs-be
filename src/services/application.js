const CompanyApplication = require("../models/CompanyApplication");
const hash = require("../lib/passwordHashing");
const AccountService = require("./account");

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

    async findAll() {
        return Promise.all([...(await CompanyApplication.find({}).exec())]
            .map(async (application) => ({
                ...application.toObject(),
                state: (await CompanyApplication.findById(application._id).exec()).state,
            })));
    }

    async find(filters) {

        if (!filters || filters.length === 0) return this.findAll();

        const buildFiltersQuery = ({
            companyName,
            submissionDate,
        }) => {
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
        };

        return Promise.all([...(await CompanyApplication.find({
            $and: buildFiltersQuery(filters),
        }).exec())]
            .map(async (application) => ({
                ...application.toObject(),
                state: (await CompanyApplication.findById(application._id).exec()).state,
            }))
            .filter((application) => filters.state ?
                application.state === filters.state ||
                filters.state.includes(application.state)
                : true
            )
        );
    }

    async approve(id, options) {

        const application = (await CompanyApplication.findById(id, {}, options));
        application.approve();
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
        const application = await CompanyApplication.findById(id, {}, options);
        return application.reject(reason);
    }
}

module.exports = CompanyApplicationService;
