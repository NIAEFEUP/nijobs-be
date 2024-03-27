import mongoose from "mongoose";

import JobTypes from "./constants/JobTypes.js";
import { FieldTypes, MIN_FIELDS, MAX_FIELDS } from "./constants/FieldTypes.js";
import { TechnologyTypes, MIN_TECHNOLOGIES, MAX_TECHNOLOGIES } from "./constants/TechnologyTypes.js";
import PointSchema from "./Point.js";
import { MONTH_IN_MS, OFFER_MAX_LIFETIME_MONTHS } from "./constants/TimeConstants.js";
import { noDuplicatesValidator, lengthBetweenValidator, validImageURL, validApplyURL } from "./modelUtils.js";
import OfferConstants from "./constants/Offer.js";
import { concurrentOffersNotExceeded, maxHTMLContentLength } from "../api/middleware/validators/validatorUtils.js";

const { Schema, Types } = mongoose;

const OfferSchema = new Schema({
    title: { type: String, maxlength: OfferConstants.title.max_length, minlength: OfferConstants.title.min_length, required: true },
    publishDate: {
        type: Date,
        required: true,
        validate: [
            validatePublishDate,
            "`publishDate` must be earlier than `publishEndDate`",
        ],
    },

    publishEndDate: {
        type: Date,
        required: true,
        validate: [
            validateEndDate,
            `\`publishEndDate\` must not differ from \`publishDate\` by more than ${OFFER_MAX_LIFETIME_MONTHS} months`,
        ],
    },

    jobMinDuration: {
        type: Number,
        required: validateMinDuration,
    },

    jobMaxDuration: {
        required: true,
        type: Number,
        validate: [
            validateJobMaxDuration,
            "`jobMaxDuration` must be larger than `jobMinDuration`",

        ],
    },

    jobStartDate: { type: Date },
    description: {
        type: String,
        required: true,
        validator: validateDescription
    },

    contacts: {
        type: [String],
        required: true,
        validate: [
            (val) => val.length >= 1,
            "There must be at least one contact.",
        ],
    },

    isPaid: { type: Boolean },
    vacancies: { type: Number, min: OfferConstants.vacancies.min },
    jobType: { type: String, required: true, enum: JobTypes },
    fields: {
        type: [{ type: String, enum: FieldTypes }],
        required: true,
        validate: (val) => lengthBetweenValidator(val, MIN_FIELDS, MAX_FIELDS) && noDuplicatesValidator(val),
    },
    technologies: {
        type: [{ type: String, enum: TechnologyTypes }],
        required: true,
        validate: (val) => lengthBetweenValidator(val, MIN_TECHNOLOGIES, MAX_TECHNOLOGIES) && noDuplicatesValidator(val),
    },
    hiddenReason: {
        type: String,
        enum: OfferConstants.HiddenOfferReasons,
    },
    adminReason: {
        type: String,
    },
    isHidden: {
        type: Boolean,
        default: false
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    owner: {
        type: Types.ObjectId,
        ref: "Company",
        required: true,
        validator: validateOwnerConcurrentOffers,
    },
    requirements: {
        type: [String],
        required: true,
        validate: [
            (val) => val.length >= 1,
            "There must be at least one requirement"
        ],
    },
    ownerName: { type: String, required: true },
    ownerLogo: { type: String, required: true, validate: (val) => validImageURL(val) },
    location: { type: String, required: true },
    coordinates: { type: PointSchema, required: false },
    applyURL: { type: String, validate: (val) => validApplyURL(val) },
});

OfferSchema.set("timestamps", true);

OfferSchema.index(
    { title: "text", ownerName: "text", jobType: "text", fields: "text", technologies: "text", location: "text" },
    { name: "Search index", weights: { title: 10, ownerName: 5, jobType: 5, location: 5, fields: 5, technologies: 5 } }
);

// Checking if the publication date is less than or equal than the end date.
function validatePublishDate(value) {
    return value <= this.publishEndDate;
}

function validateEndDate(value) {
    return validatePublishEndDateLimit(this.publishDate, value);
}

export function validatePublishEndDateLimit(publishDate, publishEndDate) {

    // Milisseconds from publish date to end date (Offer is no longer valid)
    const timeDiff = publishEndDate.getTime() - publishDate.getTime();
    const diffInMonths = timeDiff / MONTH_IN_MS;

    return diffInMonths <= OFFER_MAX_LIFETIME_MONTHS;
}

// jobMaxDuration must be larger than jobMinDuration
function validateJobMaxDuration(value) {
    if (this.jobType === "FREELANCE" && this.jobMinDuration === undefined) return true;
    return value >= this.jobMinDuration;
}

function validateMinDuration() {
    if (this.jobType === "FREELANCE") return false;
    return true;
}

function validateOwnerConcurrentOffers(value) {
    return concurrentOffersNotExceeded(this.constructor)(value, this.publishDate, this.publishEndDate);
}

function validateDescription(value) {
    return maxHTMLContentLength(OfferConstants.description.max_length)(value);
}

/**
 * Currently active Offers (publish date was before Date.now and end date is after Date.now)
 */
OfferSchema.statics.filterCurrent = () => ({
    publishDate: {
        $lte: new Date(Date.now()),
    },
    publishEndDate: {
        $gt: new Date(Date.now()),
    },
});
OfferSchema.query.current = function() {
    return this.where(this.model.filterCurrent());
};

/**
 * Currently active and non-hidden Offers
 */
OfferSchema.statics.filterNonHidden = () => ({ isHidden: false });
OfferSchema.query.withoutHidden = function() {
    return this.where(this.model.filterNonHidden());
};

/**
 * Currently active and non-archived Offers
 */
OfferSchema.query.withoutArchived = function() {
    return this.where({ isArchived: false });
};

const Offer = mongoose.model("Offer", OfferSchema);

// Useful for testing correct field implementation
// console.log("DBG: ", OfferSchema.path("location"));

export default Offer;
