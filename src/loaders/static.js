const express = require("express");

const setupStatic = (expressApp) => {
    const file_dir = `${__dirname}/../../public`;
    expressApp.use("/static", express.static(file_dir));
};

module.exports = setupStatic;
