const mongoose = require("mongoose");
const { Schema, Types } = mongoose;
const uniqueArrayPlugin = require("mongoose-unique-array");
const JobTypes = require("./JobTypes");
const { FieldTypes, MIN_FIELDS, MAX_FIELDS } = require("./FieldTypes");
const { TechnologyTypes, MIN_TECHNOLOGIES, MAX_TECHNOLOGIES } = require("./TechnologyTypes");
const PointSchema = require("./Point");

// Defining relevant constants
const { MONTH_IN_MS, OFFER_MAX_LIFETIME_MONTHS } = require("./TimeConstants");

const OfferSchema = new Schema({
    title: { type: String, maxlength: 90, required: true },
    publishDate: {
        type: Date,
        required: true,
        validate: [
            validatePublishDate,
            "`publishDate` must be earlier than `endDate`",
        ],
    },

    endDate: {
        type: Date,
        required: true,
        validate: [
            validateEndDate,
            `\`endDate\` must not differ from \`publishDate\` by more than ${OFFER_MAX_LIFETIME_MONTHS} months`,
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
    description: { type: String, maxlength: 1500, required: true },

    contacts: {
        type: Map,
        of: String,
        required: true,
        validate: [
            (val) => val.size >= 1,
            "There must be at least one contact",
        ],
    },

    isPaid: { type: Boolean },
    vacancies: { type: Number },
    jobType: { type: String, required: true, enum: JobTypes },
    fields: {
        // unique ensures that there are no repeated fields using mongoose-unique-array (see below)
        type: [{ type: String, enum: FieldTypes, unique: true }],
        required: true,
        validate: [
            (val) => val.length >= MIN_FIELDS && val.length <= MAX_FIELDS,
            `There must be between ${MIN_FIELDS} and ${MAX_FIELDS} fields`,
        ],
    },
    technologies: {
        // unique ensures that there are no repeated technologies using mongoose-unique-array (see below)
        type: [{ type: String, enum: TechnologyTypes, unique: true }],
        required: true,
        validate: [
            (val) => val.length >= MIN_TECHNOLOGIES && val.length <= MAX_TECHNOLOGIES,
            `There must be between ${MIN_TECHNOLOGIES} and ${MAX_TECHNOLOGIES} technologies`,
        ],
    },

    isHidden: { type: Boolean },
    owner: { type: Types.ObjectId, ref: "Company", required: true },

    location: { type: String, required: true },
    coordinates: { type: PointSchema, required: false },
});

// Checking if the publication date is less than or equal than the end date.
function validatePublishDate(value) {
    return value <= this.endDate;
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

// Adding unique array mongo plugin - to ensure that the elements inside the arrays are in fact unique
// See: https://thecodebarbarian.com/whats-new-in-mongoose-4.10-unique-in-arrays and https://www.npmjs.com/package/mongoose-unique-array
OfferSchema.plugin(uniqueArrayPlugin);

const Offer = mongoose.model("Offer", OfferSchema);

// Useful for testing correct field implementation
// console.log("DBG: ", OfferSchema.path("location"));

module.exports = Offer;
