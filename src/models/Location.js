import mongoose from "mongoose";

const { Schema } = mongoose;

const LocationSchema = new Schema({
    city: {
        type: String,
        required: true
    },
    citySearch: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    countrySearch: {
        type: String,
        required: true
    },
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    }
});

LocationSchema.index(
    { citySearch: "text", countrySearch: "text" },
    { name: "Search index", weights: { citySearch: 10, countrySearch: 5 } }
);

const Location = mongoose.model("Location", LocationSchema);

export default Location;
