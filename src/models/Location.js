import mongoose from "mongoose";

const { Schema } = mongoose;

const LocationSchema = new Schema({
    city: {
        type: String,
        required: true
    },
    country: {
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
    { city: "text", cityAscii: "text", country: "text", latitude: "number", longitude: "number" },
    { name: "Search index", weights: { city: 10, cityAscii: 10, country: 5, latitude: 5, longitude: 5 } }
);

const Location = mongoose.model("Location", LocationSchema);

export default Location;
