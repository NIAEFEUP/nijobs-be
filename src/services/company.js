import { COMPANY_BLOCKED_NOTIFICATION,
    COMPANY_UNBLOCKED_NOTIFICATION,
    COMPANY_DISABLED_NOTIFICATION,
    COMPANY_ENABLED_NOTIFICATION,
    COMPANY_DELETED_NOTIFICATION
} from "../email-templates/companyManagement.js";
import EmailService from "../lib/emailService.js";
import Account from "../models/Account.js";
import Company from "../models/Company.js";
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
    async findAll(limit, offset, showHidden = false, showAdminReason = false) {


        const companyQuery = Company.find({});

        if (!showHidden) companyQuery.withoutBlocked().withoutDisabled();
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
     * @param {*} showHidden weather to show the company if it is hidden, defaults to false
     * @param {*} showAdminReason weahter to show the admin reason given to hide this company, defaults to false
     */
    findById(company_id, showHidden = false, showAdminReason = false) {
        const query = Company.findById(company_id);
        if (!showHidden) query.withoutBlocked().withoutDisabled();
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
            { new: true, omitUndefined: true },
            (err) => {
                if (err) {
                    console.error(err);
                    throw err;
                }
            });
    }

    /**
     * E-mails the given company using the provided notification template.
     * @param {*} companyId the id of the company to whom the notifications is sent
     * @param {*} notification the notification to send
     */
    async _sendCompanyNotification(companyId, notification) {
        try {
            const company = await Company.findById(companyId);
            const companyAccount = await Account.findOne({
                company
            });
            await EmailService.sendMail({
                to: companyAccount.email,
                ...notification(company.name),
            });
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    async sendCompanyBlockedNotification(companyId) {
        await this._sendCompanyNotification(companyId, COMPANY_BLOCKED_NOTIFICATION);
    }

    async sendCompanyUnblockedNotification(companyId) {
        await this._sendCompanyNotification(companyId, COMPANY_UNBLOCKED_NOTIFICATION);
    }

    disable(companyId) {

        try {
            return this.changeAttributes(companyId, { isDisabled: true });
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    enable(companyId) {

        try {
            return this.changeAttributes(companyId, { isDisabled: false });
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    async sendCompanyDisabledNotification(companyId) {
        await this._sendCompanyNotification(companyId, COMPANY_DISABLED_NOTIFICATION);
    }


    async sendCompanyEnabledNotification(companyId) {
        await this._sendCompanyNotification(companyId, COMPANY_ENABLED_NOTIFICATION);
    }

    async sendCompanyDeletedNotification(email, companyName) {
        try {
            await EmailService.sendMail({
                to: email,
                ...COMPANY_DELETED_NOTIFICATION(companyName),
            });
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    /**
     * Deletes a company by its ID and returns it
     * @param {*} companyId ID of the company
     */
    async findAndDeleteById(companyId) {
        try {
            const company = await Company.findById(companyId);
            await Company.findByIdAndRemove(companyId);
            return company;
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

}

export default CompanyService;
