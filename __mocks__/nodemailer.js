
const transporter = {
    verify: jest.fn(),
    sendMail: jest.fn().mockReturnValue({
        response: "mockedMail",
        envelope: "mockedMail",
        messageId: "mock123"
    }),
    use: jest.fn()
};
const createTransport = jest.fn().mockReturnValue(transporter);


module.exports = {
    createTransport,
    transporter
};
