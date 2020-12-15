
const transporter = {
    verify: jest.fn(),
    sendMail: jest.fn()
};
const createTransport = jest.fn().mockReturnValue(transporter);


module.exports = {
    createTransport,
    transporter

};
