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
