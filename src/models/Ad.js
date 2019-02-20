const mongoose = require("mongoose");
const { Schema } = mongoose;

const AdSchema = new Schema({
    title: {type: String},
    publishDate: {type: Date},
    endDate: {type: Date},
    jobDuration: {type: Number},
    jobStartDate: {type: Date},
    description: {type: String, maxlength: 1500},
    contacts: {type: String},
    isPaid: {type: Boolean},
    vacancies: {type: Number},
    isHidden: {type: Boolean},
});

const Ad = mongoose.model("Ad", AdSchema);

module.exports = Ad;