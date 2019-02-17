const mongoose = require("mongoose");
const { Schema } = mongoose;

// First we create our schema
const ExampleUserSchema = new Schema({
    username: {type: String, unique: true},
    // The schemas can have very flexible type definition options, see https://mongoosejs.com/docs/schematypes.html
    age: {type: Number, default: 420},
});

// Then we enable using it by converting it into a model
const ExampleUser = mongoose.model("ExampleUser", ExampleUserSchema);

// Which we can then export
module.exports = ExampleUser;