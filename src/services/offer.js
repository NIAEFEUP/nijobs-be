import mongoose from "mongoose";
import Company  from "../models/Company.js";
import Offer  from "../models/Offer.js";
import Account  from "../models/Account.js";
import EmailService  from "../lib/emailService.js";
import { OFFER_DISABLED_NOTIFICATION }  from "../email-templates/companyOfferDisabled.js";
import OfferConstants  from "../models/constants/Offer.js";
import base64url from "base64url";

const { ObjectId } = mongoose.Types;

class OfferService {
    // TODO: Use typedi or similar
    constructor() {

    }

    static get MAX_OFFERS_PER_QUERY() {
        return 20;
    }

    async create({
        title,
        publishDate = new Date(Date.now()),
        publishEndDate,
        jobMinDuration,
        jobMaxDuration,
        jobStartDate,
        description,
        contacts,
        isPaid,
        vacancies,
        jobType,
        fields,
        technologies,
        isHidden,
        owner,
        location,
        coordinates,
        requirements,
        applyURL,
    }) {

        const { name: ownerName, logo: ownerLogo } = await Company.findById(owner);
        const offer = await Offer.create({
            title,
            publishDate,
            publishEndDate,
            jobMinDuration,
            jobMaxDuration,
            jobStartDate,
            description,
            contacts,
            isPaid,
            vacancies,
            jobType,
            fields,
            technologies,
            isHidden,
            owner,
            ownerName,
            ownerLogo,
            location,
            coordinates,
            requirements,
            applyURL,
        });
        return offer;
    }

    async edit(
        _id,
        {
            title,
            publishDate,
            publishEndDate,
            jobMinDuration,
            jobMaxDuration,
            jobStartDate,
            description,
            contacts,
            isPaid,
            vacancies,
            jobType,
            fields,
            technologies,
            location,
            coordinates,
            requirements,
            applyURL,
        }) {
        const edits = {
            title,
            publishDate,
            publishEndDate,
            jobMinDuration,
            jobMaxDuration,
            jobStartDate,
            description,
            contacts,
            isPaid,
            vacancies,
            jobType,
            fields,
            technologies,
            location,
            coordinates,
            requirements,
            applyURL,
        };
        const offer = await Offer.findOneAndUpdate(
            { _id },
            edits,
            { new: true }
        );

        return offer;
    }

    async disable(
        _id,
        hiddenReason,
        adminReason
    ) {
        const offer = await Offer.findOneAndUpdate(
            { _id },
            {
                isHidden: true,
                hiddenReason,
                adminReason
            },
            { new: true }
        );
        return offer;
    }

    async enable(
        _id
    ) {
        const query = { _id };
        const offer = await Offer.findOneAndUpdate(
            query,
            {
                isHidden: false,
                $unset: { hiddenReason: "", adminReason: "" }, // Removing property from document.
            },
            { new: true }
        );
        return offer;
    }

    async archive(_id) {
        const offer = await Offer.findOneAndUpdate(
            { _id },
            {
                isArchived: true,
            },
            { new: true }
        );
        return offer;
    }

    _hideByCompany(owner, reason) {
        return Offer.updateMany(
            { owner, isHidden: false },
            {
                isHidden: true,
                hiddenReason: reason,
            });
    }

    _unhideByCompany(owner, reason) {
        return Offer.updateMany(
            { owner, isHidden: true, hiddenReason: reason },
            {
                isHidden: false,
                $unset: { hiddenReason: "", adminReason: "" },
            });
    }

    blockByCompany(owner) {
        return this._hideByCompany(owner, OfferConstants.HiddenOfferReasons.COMPANY_BLOCKED);
    }

    unblockByCompany(owner) {
        return this._unhideByCompany(owner, OfferConstants.HiddenOfferReasons.COMPANY_BLOCKED);
    }

    disableByCompany(owner) {
        return this._hideByCompany(owner, OfferConstants.HiddenOfferReasons.COMPANY_DISABLED);
    }

    enableByCompany(owner) {
        return this._unhideByCompany(owner, OfferConstants.HiddenOfferReasons.COMPANY_DISABLED);
    }

    /**
     * Fetches offers according to specified options
     * Learn more about keyset search here: https://github.com/NIAEFEUP/nijobs-be/issues/129
     *
     * @param {*} options
     * value: Text to use in full-text-search
     * queryToken: Token used to continue the previous search
     * limit: How many offers to show
     * jobType: Array of jobTypes allowed
     */
    async get({ value = "", queryToken = null, limit = OfferService.MAX_OFFERS_PER_QUERY,
        showHidden = false, showAdminReason = false, ...filters }) {

        let offers, queryValue = value, queryFilters = filters;

        if (queryToken) {
            const {
                id: lastOfferId,
                score: lastOfferScore,
                ...searchInfo
            } = this.decodeQueryToken(queryToken);

            [queryValue, queryFilters] = [searchInfo.value, searchInfo.filters];

            offers = this._buildSearchContinuationQuery(lastOfferId, lastOfferScore, queryValue,
                showHidden, showAdminReason, queryFilters);
        } else {
            offers = this._buildInitialSearchQuery(queryValue, showHidden, showAdminReason, queryFilters);
        }

        const results = await offers
            .sort(queryValue ? { score: { "$meta": "textScore" }, _id: 1 } : { _id: 1 })
            .limit(limit)
        ;

        if (results.length > 0) {
            const lastOffer = results[results.length - 1];
            return {
                results,
                queryToken: this.encodeQueryToken(
                    lastOffer._id,
                    lastOffer.score || lastOffer._doc?.score,
                    queryValue, queryFilters
                ),
            };
        } else {
            return { results };
        }
    }

    /**
     * Builds an initial search query. Cannot be used when loading more offers.
     * Otherwise, use _buildSearchContinuationQuery().
     */
    _buildInitialSearchQuery(value, showHidden, showAdminReason, filters) {
        const offers = (value ? Offer.find({ "$and": [
            this._buildFilterQuery(filters),
            { "$text": { "$search": value } }
        ] }, { score: { "$meta": "textScore" } }

        ) : Offer.find(this._buildFilterQuery(filters)));

        return this.selectSearchOffers(offers, showHidden, showAdminReason);
    }

    /**
     * Builds a search continuation query. Only use this when loading more offers.
     * Otherwise, use _buildInitialSearchQuery().
     */
    _buildSearchContinuationQuery(lastOfferId, lastOfferScore, value, showHidden, showAdminReason, filters) {
        let offers;
        if (value) {
            offers = Offer.aggregate([
                { $match: { $text: { $search: value } } },
                { $match: this._buildFilterQuery(filters) },
                { $addFields: {
                    score: { $meta: "textScore" },
                    adminReason: { $cond: [showAdminReason, "$adminReason", "$$REMOVE"] }
                } },
                { $match: { "$or": [
                    { score: { "$lt": lastOfferScore } },
                    { score: lastOfferScore, _id: { "$gt": ObjectId(lastOfferId) } }
                ] } },
                { $match: Offer.filterCurrent() },
                { $match: showHidden ? {} : Offer.filterNonHidden() }
            ]);
        } else {
            offers = Offer.find({ "$and": [
                this._buildFilterQuery(filters),
                { _id: { "$gt": ObjectId(lastOfferId) } }
            ] });

            this.selectSearchOffers(offers, showHidden, showAdminReason);
        }

        return offers;
    }

    _buildFilterQuery(filters) {
        if (!filters || !Object.keys(filters).length) return {};

        const { jobType, jobMinDuration, jobMaxDuration, fields, technologies } = filters;
        const constraints = [];

        if (jobType) constraints.push({ jobType: { "$in": jobType } });
        if (jobMinDuration) {
            constraints.push({
                "$or": [
                    { jobMinDuration: { "$exists": false } },
                    { jobMinDuration: { "$gte": jobMinDuration } },
                    {
                        "$and": [
                            { jobMinDuration: { "$lt": jobMinDuration } },
                            { "$or": [
                                { jobMaxDuration: { "$exists": false } },
                                { jobMaxDuration: { "$gte": jobMinDuration } },
                            ] }
                        ]
                    },
                ]
            });
        }
        if (jobMaxDuration) {
            constraints.push({
                "$or": [
                    { jobMaxDuration: { "$exists": false } },
                    { jobMaxDuration: { "$lte": jobMaxDuration } },
                    {
                        "$and": [
                            { jobMaxDuration: { "$gt": jobMaxDuration } },
                            { "$or": [
                                { jobMinDuration: { "$exists": false } },
                                { jobMinDuration: { "$lte": jobMaxDuration } },
                            ] }
                        ]
                    },
                ]
            });
        }
        if (fields?.length) constraints.push({ fields: {  "$elemMatch": { "$in": fields } } });
        if (technologies?.length) constraints.push({ technologies: {  "$elemMatch": { "$in": technologies } } });

        return constraints.length ? { "$and": constraints } : {};
    }

    selectSearchOffers(offers, showHidden, showAdminReason) {
        offers.current();
        if (!showHidden) offers.withoutHidden();
        if (!showAdminReason) offers.select("-adminReason");

        return offers;
    }

    /**
     * Encodes a query token, by taking the an id and FTS score if present, and encoding them in safe url base64
     * @param {*} id
     * @param {*} score
     */
    encodeQueryToken(id, score, value, filters) {
        return base64url.encode(JSON.stringify({
            id, score, value, filters
        }));
    }

    /**
     * Decodes a query token, extracting the FTS score and remaining offer's information
     * @param {*} queryToken
     */
    decodeQueryToken(queryToken) {
        const tokenInfo = JSON.parse(base64url.decode(queryToken));

        return {
            ...tokenInfo,
            score: Number(tokenInfo.score)
        };
    }

    /**
     * Checks whether a given offer is visible to a specific userCompanyId.
     * Unpublished/Unactive offers may still be visible
     * @param {*} offer
     * @param {*} hasAdminPrivileges
     * @param {*} userCompanyId
     * @returns true if the offer is visible, false otherwise
     */
    isVisibleOffer(offer, hasAdminPrivileges, userCompanyId = "") {
        return !offer?.isHidden || hasAdminPrivileges || (offer.owner.toString() === userCompanyId.toString());
    }

    async getOfferById(offerId, targetOwner, hasAdminPrivileges, showAdminReason = false) {
        const offerQuery = Offer.findById(offerId);

        if (!showAdminReason) offerQuery.select("-adminReason");

        const offer = await offerQuery;

        if (!this.isVisibleOffer(offer, hasAdminPrivileges, targetOwner)) return null;

        return offer;
    }

    /**
     * Gets all the offers from a specific company that are visible to a specific user
     * Note: This function will show even unpublished/unactive offers
     * @param {*} companyId
     * @param {*} userCompanyId
     * @param {*} hasAdminPrivileges
     * @returns Visible offers
     */
    async getOffersByCompanyId(companyId, userCompanyId, hasAdminPrivileges) {
        return (await Offer.find({ owner: companyId }))
            .filter((offer) =>
                this.isVisibleOffer(offer, hasAdminPrivileges, userCompanyId)
            );
    }

    async sendOfferDisabledNotification(offerId) {
        const offer = await Offer.findById(offerId);
        if (!offer) return;  // validation of offerId should be done before with an error

        const companyAccount = await Account.findOne({
            company: await Company.findOne({ _id: offer.owner })
        });

        await EmailService.sendMail({
            to: companyAccount.email,
            ...OFFER_DISABLED_NOTIFICATION(offer.ownerName, offer.title, offer.description),
        });
    }

    async deleteOffersByCompanyId(companyId) {
        await Offer.deleteMany({ owner: companyId });
    }

}

export default OfferService;
