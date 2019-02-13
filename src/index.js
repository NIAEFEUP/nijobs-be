require("dotenv").config();
const express = require("express");
const app = express();

const db_connection = require("./db_controller");

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === "production") {
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI was not defined in .env file and we are in production environment! Aborting!");
        process.exit(88);
    } else {
        console.warn("MONGO_URI was not defined in .enf file, falling back to localhost defaults.");
    }
}

db_connection
    .then(() => {
        app.listen(PORT, () => console.info(`App listening on internal port ${PORT}`));
    })
    .catch((err) => {
        console.error("Error connecting to the DB (aborting): ", err);
        process.exit(44);
    });


app.get("/", (req, res) => {
    res.send("Hello World!");
});