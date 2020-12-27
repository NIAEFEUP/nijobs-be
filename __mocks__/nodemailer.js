
const transporter = {
    verify: jest.fn(),
    sendMail: jest.fn(),
    use: jest.fn()
};
const createTransport = jest.fn().mockReturnValue(transporter);


module.exports = {
    createTransport,
    transporter
};
