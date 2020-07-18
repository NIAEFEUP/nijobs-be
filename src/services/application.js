const CompanyApplication = require("../models/CompanyApplication");
const hash = require("../lib/passwordHashing");

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

    async approve(id) {
        const application = await CompanyApplication.findById(id);
        return application.approve();
    }

    async reject(id) {
        const application = await CompanyApplication.findById(id);
        return application.reject();
    }
}

module.exports = CompanyApplicationService;
