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
    const offersInTimePeriod = await (new CompanyService())
        .getOffersInTimePeriod(owner, publishDate, publishEndDate, OfferModel);

    const offerNumber = offersInTimePeriod.length;
    if (offerNumber < CompanyConstants.offers.max_concurrent) return true;
    // otherwise, let's check how many are concurrent

    const startDates = offersInTimePeriod.map((offer) => offer.publishDate);
    const endDates = offersInTimePeriod.map((offer) => offer.publishEndDate);
    startDates.sort();
    endDates.sort();

    /**
     * This algorithm is explained in https://github.com/NIAEFEUP/nijobs-be/issues/123#issuecomment-782272539
     */
    let counter = 0, maxConcurrent = 0;
    let startIndex = 0, endIndex = 0;
    while (startIndex < offerNumber || endIndex < offerNumber) {
        if (startIndex < offerNumber && (endIndex >= offerNumber || startDates[startIndex] <= endDates[endIndex])) {
            counter++;
            startIndex++;
            if (counter > maxConcurrent) maxConcurrent = counter;
        } else {
            counter--;
            endIndex++;
        }
    }
    return maxConcurrent < CompanyConstants.offers.max_concurrent;
};

module.exports = {
    valuesInSet,
    checkDuplicatedEmail,
    ensureArray,
    isObjectId,
    concurrentOffersNotExceeded,
};
