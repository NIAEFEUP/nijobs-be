const bcrypt = require("bcrypt");

const hash = (password) => bcrypt.hash(password, 10);
module.exports = hash;
