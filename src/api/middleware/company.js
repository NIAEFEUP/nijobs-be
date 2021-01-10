const { ErrorTypes } = require("./errorHandler");
const HTTPStatus = require("http-status-codes");
const CompanyService = require("../../services/company");

const isCompanyRep = (req, res, next) => {
    if (!req.user.company) {
        return res.status(HTTPStatus.UNAUTHORIZED).json({
            reason: "The user is not a company representative",
            error_code: ErrorTypes.FORBIDDEN,
        });
    }

    return next();
};

const canCreateOffer = async (req, res, next) => {
    const currentOffers = await (new CompanyService()).getCurrentOffers(req.owner);

    console.log(req.owner, currentOffers.length);

    if (currentOffers.length >= CompanyService.MAX_OFFERS_PER_COMPANY) {
        return res.status(HTTPStatus.BAD_REQUEST).json({
            reason: `Number of active offers exceeded! The limit is ${CompanyService.MAX_OFFERS_PER_COMPANY} offers`,
            error_code: ErrorTypes.VALIDATION_ERROR
        });
    }
    return next();
};


module.exports = {
    isCompanyRep,
    canCreateOffer
};
