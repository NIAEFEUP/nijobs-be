import mongoose from "mongoose";
import CompanyConstants from "./constants/Company.js";
import Offer from "./Offer.js";

const { Schema } = mongoose;

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
    social: {
        type: [String],
        minlength: CompanyConstants.social.min_length,
        maxlength: CompanyConstants.social.max_length,
    },
    locations: {
        type: [String],
        minlength: CompanyConstants.locations.min_length,
        maxlength: CompanyConstants.locations.max_length,
    },
    images: {
        type: [String],
        minlength: CompanyConstants.images.min_length,
        maxlength: CompanyConstants.images.max_length,
    },
    hasFinishedRegistration: {
        type: Boolean,
        default: false
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    adminReason: {
        type: String,
    },
    logo: {
        type: String,
    },
    isDisabled: {
        type: Boolean,
        default: false
    }

});

// Update offers from this company on name change
CompanySchema.post("findOneAndUpdate", async function(doc) {
    await Offer.updateMany({ owner: doc._id }, { ownerName: doc.name, ownerLogo: doc.logo });
});

CompanySchema.query.withoutBlocked = function() {
    return this.where({ isBlocked: false });
};

CompanySchema.query.withoutDisabled = function() {
    return this.where({ isDisabled: false });
};

CompanySchema.query.hideAdminReason = function() {
    return this.select("-adminReason");
};

// Delete Offers from the deleted Company (maybe we want to archive them instead?,
// also maybe we want other hooks as well such as deleteOne)
// CompanySchema.post("findOneAndDelete", async function(doc) {
//     await Offer.deleteMany({ owner: doc._id }, { ownerName: doc.name });
// });

const Company = mongoose.model("Company", CompanySchema);


export default Company;
