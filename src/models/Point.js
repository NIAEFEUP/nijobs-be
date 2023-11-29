import mongoose from "mongoose";
const { Schema } = mongoose;

// As per https://mongoosejs.com/docs/geojson.html#points
// Cool for usage with $near - see https://docs.mongodb.com/manual/tutorial/query-a-2dsphere-index/

const PointSchema = new Schema({
    type: {
        type: String,
        enum: ["Point"],
        required: true,
    },
    coordinates: {
        type: [Number],
        required: true,
    },
});

PointSchema.index("2dsphere");

// Only exporting the Schema because Point will only be used as a subdocument - no need to create a model
export default PointSchema;
