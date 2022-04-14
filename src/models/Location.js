import mongoose from "mongoose";

import config from "../config/env.js";

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

// this works because mongoose caches commands until a valid connection can be established or a timeout error is raised
const Location = mongoose.connection.useDb(config.location_db_name, { useCache: true }).model("Location", LocationSchema);

export default Location;
