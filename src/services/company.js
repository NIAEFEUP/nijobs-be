const { COMPANY_BLOCKED_NOTIFICATION, COMPANY_UNBLOCKED_NOTIFICATION } = require("../email-templates/companyManagement");
const EmailService = require("../lib/emailService");
const Account = require("../models/Account");
const Company = require("../models/Company");

class CompanyService {
    getOffersInTimePeriod(owner, publishDate, publishEndDate, OfferModel) {
        return OfferModel.find({
            owner,
            $or:
                [
                    { $and: [{ publishEndDate: { $gte: publishDate } }, { publishEndDate: { $lte: publishEndDate } }] },
                    { $and: [{ publishDate: { $gte: publishDate } }, { publishDate: { $lte: publishEndDate } }] },
                    { $and: [{ publishDate: { $lte: publishDate } }, { publishEndDate: { $gte: publishEndDate } }] }
                ]
        });
    }

    /**
     *
     * @param {*} limit - Number of documents to return
     * @param {*} offset - where to start the query (pagination - how many documents to skip, NOT how many pages to skip)
     *
     * @returns {companies, totalDocCount}
     */
    async findAll(limit, offset) {

        const totalDocCount = await Company.estimatedDocumentCount();

        return {
            totalDocCount,
            companies:
                [...(await Company.find({})
                    .sort({ name: "asc" })
                    .skip(offset)
                    .limit(limit)
                    .exec()
                )]
                    .map((company) => company.toObject()),

        };
    }

    /**
     * @param {*} company_id Id of the company
     */
    findById(company_id) {
        return Company.findById(company_id);
    }

    /**
     * @param {@param} companyId Id of the company
     */
    block(companyId) {
        return Company.findByIdAndUpdate(
            companyId,
            { isBlocked: true },
            { new: true },
            (err) => {
                if (err) {
                    console.error(err);
                    throw err;
                }
            });
    }

    /**
     * @param {@param} companyId Id of the company
     */
    unblock(companyId) {
        return Company.findByIdAndUpdate(
            companyId,
            { isBlocked: false },
            { new: true },
            (err) => {
                if (err) {
                    console.error(err);
                    throw err;
                }
            });
    }

    /**
     * Changes the attributes of a company
     * @param {*} company_id id of the company
     * @param {*} attributes object containing the attributes to change in company
     */
    changeAttributes(company_id, attributes) {
        return Company.findOneAndUpdate({ _id: company_id }, attributes);
    }

    async sendCompanyBlockedNotification(companyId) {
        try {
            const company = await Company.findById(companyId);
            const companyAccount = await Account.findOne({
                company
            });
            await EmailService.sendMail({
                to: companyAccount.email,
                ...COMPANY_BLOCKED_NOTIFICATION(company.name),
            });
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    async sendCompanyUnblockedNotification(companyId) {
        try {
            const company = await Company.findById(companyId);
            const companyAccount = await Account.findOne({
                company
            });
            await EmailService.sendMail({
                to: companyAccount.email,
                ...COMPANY_UNBLOCKED_NOTIFICATION(company.name),
            });
        } catch (err) {
            console.error(err);
            throw err;
        }
    }
}

module.exports = CompanyService;
