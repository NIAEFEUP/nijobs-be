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

        delete application[password];
        return application;
    }
}

module.exports = CompanyApplicationService;
