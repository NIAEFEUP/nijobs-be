const DBErrorTypes = Object.freeze({
    UNDETERMINED_ERROR: 1,
    DUPLICATED_KEY: 2,
});

const errorExtractor = (err) => {
    if (handlers.hasOwnProperty(err.code)) {
        return handlers[err.code](err);
    }

    return {
        type: DBErrorTypes.UNDETERMINED_ERROR,
    };
};

const handlers = {
    11000: (err) => {
        let field = "";
        let value = "";

        // The if is for compatibility with older versions of mongo
        if (err.hasOwnProperty("keyValue")) {
            for (const obj_field in err.keyValue) {
                if (err.keyValue.hasOwnProperty(obj_field)) {
                    const obj_value = err.keyValue[obj_field];
                    field = obj_field;
                    value = obj_value;
                }
            }
        } else {
            const match = err.errmsg.match(/index:\s([a-z]+).*{\s?\w*:\s?"([a-z]+)"/i);
            value = match[2];
            field = match[1];
        }

        return {
            type: DBErrorTypes.DUPLICATED_KEY,
            field,
            value,
        };
    },
};
module.exports = { errorExtractor, DBErrorTypes };
