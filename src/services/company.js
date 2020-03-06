const Company = require("../models/Company");

class CompanyService {

    async create({
        companyName,
        email,
    }) {
        const contacts = new Map();
        contacts.set("email", email);
        const company = await Company.create({
            name: companyName,
            contacts,
            bio: "We are a company that needs a bio.",
        });

        return company;
    }

}

module.exports = CompanyService;
