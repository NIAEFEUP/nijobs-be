const ValidationReasons = require("./validationReasons");
const Account = require("../../../models/Account");
const { Types } = require("mongoose");
const CompanyService = require("../../../services/company");
const CompanyConstants = require("../../../models/constants/Company");

/**
 * Returns a validator that checks whether all of the elements of an array belong to the provided set of values
 * @param {Array} set
 */
const valuesInSet = (set) => (arr) => {
    for (const item of arr) {
        if (!set.includes(item)) {
            throw new Error(ValidationReasons.IN_ARRAY(set));
        }
    }

    return true;
};

/**
 * Throws an error if it already exists a account with the given email.
 * @param {String} email
 */
const checkDuplicatedEmail = async (email) => {
    const acc = await Account.findOne({ email }).exec();
    if (acc) {
        throw new Error(ValidationReasons.ALREADY_EXISTS("email"));
    }
};

/**
 * Sanitizes the input val to return an array. If val is an array, this is a no-op
 * Otherwise wraps val in an array
 *
 * This is especially helpful when you expect an array in a query param,
 * but a one-element array is given, therefore it is parsed as a string instead
 * @param {*} val
 */
const ensureArray = (val) => {
    if (Array.isArray(val)) return val;

    else return [val];
};

const isObjectId = (id) => {
    try {
        Types.ObjectId(id);
    } catch {
        return false;
    }
    return true;
};

/**
 * Checks if the concurrent offers of a given owner have not exceeded the defined limit
 * @param {*} OfferModel Either the default Offer model or an instance's constructor
 * @param {*} owner Owner of the offer
 * @param {*} publishDate Publish date of the
 * @param {*} publishEndDate Date in which the offer will end
 */
const concurrentOffersNotExceeded = (OfferModel) => async (owner, publishDate, publishEndDate) => {
    // We need to pass the offer model in case we're inside an Offer instance
    const concurrentOffers = await (new CompanyService())
        .getOffersInTimePeriod(owner, publishDate, publishEndDate, OfferModel);

    return concurrentOffers.length < CompanyConstants.offers.max_concurrent;
};

module.exports = {
    valuesInSet,
    checkDuplicatedEmail,
    ensureArray,
    isObjectId,
    concurrentOffersNotExceeded,
};
