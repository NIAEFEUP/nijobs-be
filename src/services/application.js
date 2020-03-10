const mongoose = require("mongoose");
const EmailClient = require("../lib/EmailClient");
const CompanyApplication = require("../models/CompanyApplication");
const ApplicationStatus = require("../models/ApplicationStatus");
const AuthService = require("./auth");
const CompanyService = require("./company");
const hash = require("../lib/passwordHashing");

class CompanyApplicationService {
    static get MAX_OFFERS_PER_QUERY() {
        return 20;
    }

    async create({ email, password, companyName, motivation }) {
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

    async get({
        offset = 0,
        limit = CompanyApplicationService.MAX_OFFERS_PER_QUERY,
    }) {
        const applications = await CompanyApplication.find()
            .pending()
            .skip(offset)
            .limit(limit);
        return applications;
    }

    async accept(id) {
        const application = await CompanyApplication.findById(id);
        if (application.state !== ApplicationStatus.PENDING) return false;

        let session = null;
        await mongoose.startSession().
            then((_session) => {
                session = _session;
                return session.startTransaction();
            }).
            then((_) => (new CompanyService().create(application))).
            then((company) => new AuthService().registerCompany(
                application.email,
                application.password,
                company._id,
            )).
            then((_) => {
                application.approvedAt = Date.now();
                return application.save();
            }).
            catch((err) => {
                if (session) session.abortTransaction();
                console.error(err);
                throw new Error("Error in acceptance transaction");
            }).
            then((application) => EmailClient.sendAcceptance(application)).
            catch((err) => {
                console.error(err);
                return true;
            });

        return true;
    }
}

module.exports = CompanyApplicationService;
