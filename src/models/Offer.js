const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const JobTypes = require("./constants/JobTypes");
const { FieldTypes, MIN_FIELDS, MAX_FIELDS } = require("./constants/FieldTypes");
const { TechnologyTypes, MIN_TECHNOLOGIES, MAX_TECHNOLOGIES } = require("./constants/TechnologyTypes");
const PointSchema = require("./Point");
const { MONTH_IN_MS, OFFER_MAX_LIFETIME_MONTHS } = require("./constants/TimeConstants");
const { noDuplicatesValidator, lengthBetweenValidator } = require("./modelUtils");
const OfferConstants = require("./constants/Offer");
const { concurrentOffersNotExceeded } = require("../api/middleware/validators/validatorUtils");

const OfferSchema = new Schema({
    title: { type: String, maxlength: OfferConstants.title.max_length, required: true },
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
        required: function() {
            // jobMinDuration is required if jobMaxDuration was specified
            return !!this.jobMaxDuration;
        },
    },
    jobMaxDuration: {
        type: Number,
        validate: [
            validateJobMaxDuration,
            "`jobMaxDuration` must be larger than `jobMinDuration`",
        ],
    },
    jobStartDate: { type: Date },
    description: { type: String, maxlength: OfferConstants.description.max_length, required: true },

    contacts: {
        type: [String],
        required: true,
        validate: [
            (val) => val.length >= 1,
            "There must be at least one contact.",
        ],
    },

    isPaid: { type: Boolean },
    vacancies: { type: Number },
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

    isHidden: {
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

    location: { type: String, required: true },
    coordinates: { type: PointSchema, required: false },
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

function validatePublishEndDateLimit(publishDate, publishEndDate) {

    // Milisseconds from publish date to end date (Offer is no longer valid)
    const timeDiff = publishEndDate.getTime() - publishDate.getTime();
    const diffInMonths = timeDiff / MONTH_IN_MS;

    return diffInMonths <= OFFER_MAX_LIFETIME_MONTHS;
}

// jobMaxDuration must be larger than jobMinDuration
function validateJobMaxDuration(value) {
    return value >= this.jobMinDuration;
}

function validateOwnerConcurrentOffers(value) {
    return concurrentOffersNotExceeded(this.constructor)(value, this.publishDate, this.publishEndDate);
}

/**
 * Currently active Offers (publish date was before Date.now and end date is after Date.now)
 */
OfferSchema.query.current = function() {
    return this.where({
        publishDate: {
            $lte: new Date(Date.now()),
        },
        publishEndDate: {
            $gt: new Date(Date.now()),
        },
    });
};

/**
 * Currently active and non-hidden Offers
 */
OfferSchema.query.withoutHidden = function() {
    return this.where({ isHidden: false });
};

const Offer = mongoose.model("Offer", OfferSchema);

// Useful for testing correct field implementation
// console.log("DBG: ", OfferSchema.path("location"));

module.exports = Offer;
module.exports.validatePublishEndDateLimit = validatePublishEndDateLimit;
