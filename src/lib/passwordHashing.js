import bcrypt from "bcrypt";

export default (password) => bcrypt.hash(password, 10);
