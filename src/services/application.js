const CompanyApplication = require("../models/CompanyApplication");
const ApplicationStatus = require("../models/ApplicationStatus");
const AuthService = require("./auth");
const CompanyService = require("./company");
const hash = require("../lib/passwordHashing");

class CompanyApplicationService {

    static get MAX_OFFERS_PER_QUERY() {
        return 20;
    }

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

    async get({ offset = 0, limit = CompanyApplicationService.MAX_OFFERS_PER_QUERY }) {
        const applications = await CompanyApplication.find().pending().skip(offset).limit(limit);
        return applications;
    }

    async accept(id) {
        const application = await CompanyApplication.findById(id);
        if (application.state !== ApplicationStatus.PENDING)
            return false;

        const company = await (new CompanyService()).create(application);
        await (new AuthService()).registerCompany(application.email, application.password, company._id);
        application.approvedAt = Date.now();
        await application.save();
        return true;
    }
}

module.exports = CompanyApplicationService;
