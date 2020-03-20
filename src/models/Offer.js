const mongoose = require("mongoose");
const { Schema, Types } = mongoose;
const mexp = require("mongoose-elasticsearch-xp").v7;

const esClient = require("../loaders/elasticsearch");

const JobTypes = require("./JobTypes");
const { FieldTypes, MIN_FIELDS, MAX_FIELDS } = require("./FieldTypes");
const { TechnologyTypes, MIN_TECHNOLOGIES, MAX_TECHNOLOGIES } = require("./TechnologyTypes");
const PointSchema = require("./Point");
const { MONTH_IN_MS, OFFER_MAX_LIFETIME_MONTHS } = require("./TimeConstants");
const { noDuplicatesValidator, lengthBetweenValidator } = require("./modelUtils");
const OfferConstants = require("./constants/Offer");

const OfferSchema = new Schema({
    title: {
        type: String,
        required: true,
        maxlength: OfferConstants.title.max_length,
        es_indexed: true,
    },
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
        es_indexed: true,
    },
    jobMaxDuration: {
        type: Number,
        validate: [
            validateJobMaxDuration,
            "`jobMaxDuration` must be larger than `jobMinDuration`",
        ],
        es_indexed: true,
    },
    jobStartDate: {
        type: Date,
        es_indexed: true,
    },
    description: {
        type: String,
        required: true,
        maxlength: OfferConstants.description.max_length,
        es_indexed: true,
    },
    contacts: {
        type: Map,
        of: String,
        required: true,
        validate: [
            (val) => val.size >= 1,
            "There must be at least one contact",
        ],
    },
    isPaid: {
        type: Boolean,
        es_indexed: true,
    },
    vacancies: { type: Number },
    jobType: {
        type: String,
        required: true,
        enum: JobTypes,
        es_indexed: true,
    },
    fields: {
        type: [{ type: String, enum: FieldTypes }],
        required: true,
        validate: (val) => lengthBetweenValidator(val, MIN_FIELDS, MAX_FIELDS) && noDuplicatesValidator(val),
        es_indexed: true,
    },
    technologies: {
        type: [{ type: String, enum: TechnologyTypes }],
        required: true,
        validate: (val) => lengthBetweenValidator(val, MIN_TECHNOLOGIES, MAX_TECHNOLOGIES) && noDuplicatesValidator(val),
        es_indexed: true,
    },
    isHidden: { type: Boolean },
    owner: {
        type: Types.ObjectId,
        ref: "Company",
        required: true,
        es_indexed: true,
    },
    location: {
        type: String,
        required: true,
        es_indexed: true,
    },
    coordinates: {
        type: PointSchema,
        required: false,
        es_indexed: true,
    },
});

// Checking if the publication date is less than or equal than the end date.
function validatePublishDate(value) {
    return value <= this.publishEndDate;
}

function validateEndDate(value) {
    // Milisseconds from publish date to end date (Offer is no longer valid)
    const timeDiff = value.getTime() - this.publishDate.getTime();
    const diffInMonths = timeDiff / MONTH_IN_MS;

    return diffInMonths <= OFFER_MAX_LIFETIME_MONTHS;
}

// jobMaxDuration must be larger than jobMinDuration
function validateJobMaxDuration(value) {
    return value >= this.jobMinDuration;
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

// Index offers in the elasticsearch service
OfferSchema.plugin(mexp, {
    index: "offers",
    client: esClient(),
    type: "offer",
});

const Offer = mongoose.model("Offer", OfferSchema);

// Useful for testing correct field implementation
// console.log("DBG: ", OfferSchema.path("location"));

module.exports = Offer;
