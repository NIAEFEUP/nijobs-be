const express = require("express");
const config = require("../config/env");
const fs = require("fs");

const setupStatic = (expressApp) => {
    const file_dir = config.upload_folder;
    if (!fs.existsSync(file_dir)) fs.mkdirSync(file_dir);
    expressApp.use("/static", express.static(file_dir));
};

module.exports = setupStatic;
