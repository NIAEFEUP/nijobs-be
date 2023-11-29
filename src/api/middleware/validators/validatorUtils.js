import mongoose from "mongoose";
import { parseHTML } from "linkedom";
import ValidationReasons from "./validationReasons.js";
import Account from "../../../models/Account.js";
import CompanyService from "../../../services/company.js";
import CompanyConstants from "../../../models/constants/Company.js";

const { Types } = mongoose;

/**
 * Returns a validator that checks whether all of the elements of an array belong to the provided set of values
 * @param {Array} set
 */
export const valuesInSet = (set) => (arr) => {
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
export const checkDuplicatedEmail = async (email) => {
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
export const ensureArray = (val) => {
    if (Array.isArray(val)) return val;

    else return [val];
};

export const isObjectId = (id) => {
    try {
        Types.ObjectId(id);
    } catch {
        return false;
    }
    return true;
};

const sortOffersByFieldAscending = (field) => (offer1, offer2) => Date.parse(offer1[field]) - Date.parse(offer2[field]);

/**
 * Checks if the concurrent offers of a given owner have not exceeded the defined limit.
 * If the offers in the timed period exceed the limit, checks how many are concurrent.
 * @param {*} OfferModel Either the default Offer model or an instance's constructor
 * @param {*} owner Owner of the offer
 * @param {*} publishDate Publish date of the
 * @param {*} publishEndDate Date in which the offer will end
 * @param {*} offerId the id of the offer to exclude from the count, if defined
 */
export const concurrentOffersNotExceeded = (OfferModel) => async (owner, publishDate, publishEndDate, offerId) => {
    // We need to pass the offer model in case we're inside an Offer instance
    const offersInTimePeriod = await (new CompanyService())
        .getOffersInTimePeriod(owner, publishDate, publishEndDate, OfferModel)
        .withoutHidden()
        .withoutArchived()
        .find(offerId ? { _id: { $ne: offerId } } : {});

    const offerNumber = offersInTimePeriod.length;
    if (offerNumber < CompanyConstants.offers.max_concurrent) return true;

    // This algorithm is explained in https://github.com/NIAEFEUP/nijobs-be/issues/123#issuecomment-782272539

    const offersSortedByStart = offersInTimePeriod; // we won't need this array unmodified
    const offersSortedByEnd = [...offersInTimePeriod];
    offersSortedByStart.sort(sortOffersByFieldAscending("publishDate"));
    offersSortedByEnd.sort(sortOffersByFieldAscending("publishEndDate"));

    let counter = 0, maxConcurrent = 0;
    let startIndex = 0, endIndex = 0;
    while (startIndex < offerNumber || endIndex < offerNumber) {
        if (startIndex < offerNumber &&
            (endIndex >= offerNumber || offersSortedByStart[startIndex].publishDate <= offersSortedByEnd[endIndex].publishEndDate)) {

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

export const maxHTMLContentLength = (max) => (text) => {
    const { document } = parseHTML();
    const node = document.createElement("pre");
    node.innerHTML = text;
    if (node.textContent.length > max) {
        throw new Error(ValidationReasons.TOO_LONG(max));
    }
    return true;
};

export const normalizeDate = (date) => (new Date(Date.parse(date))).toISOString();
