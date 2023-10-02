import Account from "../Account";

export const validateAccountTypes = (expected) => ({
    validator: async (account) => (await Account.findById(account._id)).type === expected,
    message: "Account types must be coherent",
});
