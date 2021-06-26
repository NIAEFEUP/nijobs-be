const { COMPANY_BLOCKED_NOTIFICATION, COMPANY_UNBLOCKED_NOTIFICATION } = require("../email-templates/companyManagement");
const EmailService = require("../lib/emailService");
const Account = require("../models/Account");
const Company = require("../models/Company");
const Offer = require("../models/Offer");
const OfferConstants = require("../models/constants/Offer");

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
     * @param {*} showHidden - weather to show the hidden companies or not, defaults to 'false'
     *
     * @returns {companies, totalDocCount}
     */
    async findAll(limit, offset, showBlocked = false, showAdminReason = false) {


        const companyQuery = Company.find({});

        if (!showBlocked) companyQuery.withoutBlocked();
        if (!showAdminReason) companyQuery.hideAdminReason();

        const companies = [...(await companyQuery
            .sort({ name: "asc" })
            .skip(offset)
            .limit(limit)
            .exec())]
            .map((company) => company.toObject());

        return {
            totalDocCount: companies.length,
            companies,

        };
    }

    /**
     * @param {*} company_id Id of the company
     */
    findById(company_id, showBlocked = false, showAdminReason = false) {
        const query = Company.findById(company_id);
        if (!showBlocked) query.withoutBlocked();
        if (!showAdminReason) query.hideAdminReason();
        return query;
    }

    /**
     * @param {@param} companyId Id of the company
     */
    block(companyId, adminReason) {
        return Company.findByIdAndUpdate(
            companyId,
            {
                isBlocked: true,
                adminReason
            },
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
            {
                isBlocked: false,
                $unset: { adminReason: undefined },
            },
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
        return Company.findOneAndUpdate(
            { _id: company_id },
            attributes,
            { new: true, omitUndefined: true });
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

    async disable(company_id) {
        const company = this.changeAttributes(company_id, { isDisabled: true });

        await Offer.updateMany(
            { owner: company_id },
            {
                isHidden: true,
                hiddenReason: OfferConstants.HiddenOfferReasons.COMPANY_DISABLED,
            },
            { new: true },
            (err) => {
                if (err) {
                    throw err;
                }
            }
        );

        return company;
    }

    async enable(company_id) {
        const company = this.changeAttributes(company_id, { isDisabled: false });

        await Offer.updateMany(
            { owner: company_id },
            {
                isHidden: false,
                $unset: { hiddenReason: undefined, adminReason: undefined },
            },
            { new: true },
            (err) => {
                if (err) {
                    throw err;
                }
            }
        );

        return company;
    }

}

module.exports = CompanyService;
