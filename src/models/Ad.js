const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const AdSchema = new Schema({
    title: {type: String, required: true},
    publishDate: {type: Date, required: true},
    endDate: {type: Date, required: true},
    // Shouldn't this just be a String? Simplifies companies wanting to insert ranges and whatnot
    jobDuration: {type: Number},
    jobStartDate: {type: Date},
    description: {type: String, maxlength: 1500, required: true},
    contacts: {type: String, required: true},
    isPaid: {type: Boolean},
    vacancies: {type: Number},
    isHidden: {type: Boolean},
    owner: {type: Types.ObjectId, ref: "Company", required: true},
});

const Ad = mongoose.model("Ad", AdSchema);

module.exports = Ad;