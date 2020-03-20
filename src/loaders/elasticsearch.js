const elasticsearch = require("elasticsearch");
const config = require("../config/env");

const makeConfig = () => {
    if (!(config.db_uri || (config.db_host && config.db_port))) {
        console.error("Either 'ES_URI' or 'ES_HOST' and 'ES_PORT' must be specified in the env file! See README.md for details.");
        process.exit(125);
    }

    const pass = config.es_pass ? `:${config.es_pass}` : "";
    const auth = `${config.es_user}${pass}`;

    const uri = config.es_uri || `http://${config.es_host}:${config.es_port}`;

    return {
        host: uri,
        httpAuth: auth,
        log: "warning", // development only
        apiVersion: "7.6",
        name: "nijobs-es",
    };
};

let client;

const setupClient = () => {
    if (!client)
        client = elasticsearch.Client(makeConfig());
    return client;
};

module.exports = setupClient;
