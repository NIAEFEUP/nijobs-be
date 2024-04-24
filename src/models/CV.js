import mongoose from "mongoose";
import CVconstants from "./constants/CV.js";

const { Schema } = mongoose;
const CVSchema = new Schema({
    projects: [{
        type: {
            name: {
                type: String,
                required: true,
                maxlength: CVconstants.projectName.max_length,
                minlength: CVconstants.projectName.min_length
            },
            isExternal: { type: Boolean, default: false } // Default to internal project
        }
    }],
    languages: {
        type: [{
            language: {
                type: String,
                required: true,
                maxlength: CVconstants.language.max_length,
                minlength: CVconstants.language.min_length,
            },
            level: {
                type: String,
                required: true,
                enum: ["Beginner", "Intermediate", "Advanced", "Fluent"],
                default: "Intermediate"
            }
        }],
        validate: [arrayLengthValidator, "At least one language must be provided"]
    },
    skills: [{
        type: String,
        maxlength: CVconstants.skills.max_length,
        minlength: CVconstants.skills.min_length
    }],
    achievements: {
        type: String,
        maxlength: CVconstants.achievements.max_length,
        minlength: CVconstants.achievement.min_length,
        default: null // Make it optional, set default to null
    },
    events: {
        type: String,
        maxlength: CVconstants.events.max_length,
        minlength: CVconstants.events.min_length,
        default: null // Make it optional, set default to null
    },
    cvFileUrl: {
        type: String,
        maxlength: CVconstants.cvFileUrl.max_length,
        minlength: CVconstants.cvFileUrl.min_length,
        default: null // Make it optional, set default to null
    },
    personalWebsite: {
        type: String,
        maxlength: CVconstants.personalWebsite.max_length,
        minlength: CVconstants.personalWebsite.min_length,
        default: null // Make it optional, set default to null
    }
});

function arrayLengthValidator(arr) {
    return arr && arr.length >= 1;
}


const CV = mongoose.model("CV", CVSchema);


export default CV;
