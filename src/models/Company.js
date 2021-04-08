const mongoose = require("mongoose");
const { Schema } = mongoose;
const CompanyConstants = require("./constants/Company");
const Offer = require("./Offer");

const CompanySchema = new Schema({
    name: {
        type: String,
        required: true,
        maxlength: CompanyConstants.companyName.max_length,
        minlength: CompanyConstants.companyName.min_length,
    },
    contacts: {
        type: [String],
        minlength: CompanyConstants.contacts.min_length,
        maxlength: CompanyConstants.contacts.max_length,
    },
    bio: {
        type: String,
        maxlength: CompanyConstants.bio.max_length,
    },
    hasFinishedRegistration: {
        type: Boolean,
        default: false
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    logo: {
        type: String,
    }
});

// Update offers from this company on name change
CompanySchema.post("findOneAndUpdate", async function(doc) {
    await Offer.updateMany({ owner: doc._id }, { ownerName: doc.name, ownerLogo: doc.logo });
});

// Delete Offers from the deleted Company (maybe we want to archive them instead?,
// also maybe we want other hooks as well such as deleteOne)
// CompanySchema.post("findOneAndDelete", async function(doc) {
//     await Offer.deleteMany({ owner: doc._id }, { ownerName: doc.name });
// });

const Company = mongoose.model("Company", CompanySchema);


module.exports = Company;
