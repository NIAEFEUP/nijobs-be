/**
 * Build elasticsearch DSL for various things
 *
 * Assume validated or trusted inputs
 *
 * Full text queries:
 * https://www.elastic.co/guide/en/elasticsearch/reference/current/full-text-queries.html
 * https://www.elastic.co/guide/en/elasticsearch/reference/current/term-level-queries.html
 */

/**
  * Elasticsearch DSL (Object domain specific query language)
  * @typedef {null|Object|Object[]} DSL
  */

/**
 * Match on user query string.
 */
function queryOfferSimple(q) {
    if (!q) return null;

    return {
        simple_query_string: {
            query: q,
            fields: [
                "title^5",
                "location^2",
                "description",
            ],
            default_operator: "and",
        },
    };
}

/**
 * Match on one or more offer job types
 */
function matchJobType(jobType) {
    if (!jobType) return null;

    // one job type --> match exactly
    if (typeof jobType === "string")
        return { term: { jobType: { value: jobType } } };

    // no job types given, just skip
    if (jobType.length === 0)
        return null;

    // many job types --> match exactly at least one
    return { terms: { jobType: jobType } };
}

/**
 * Match at least one of several offer fields
 */
function matchFields(fields) {
    if (!fields) return null;

    if (typeof fields === "string")
        return { term: { fields: { value: fields } } };

    if (fields.length === 0)
        return null;

    return { terms: { fields: fields } };
}

/**
 * Match at least one of several offer technologies
 */
function matchTecnologies(technologies) {
    if (!technologies) return null;

    if (typeof technologies === "string")
        return { term: { technologies: { value: technologies } } };

    if (technologies.length === 0)
        return null;

    return { terms: { technologies: technologies } };
}

/**
 * Match on min and max job durations
 */
function matchJobDuration(min, max) {
    if (!min && !max) return null;

    const match = [];
    if (typeof min === "number")
        match.push({ range: { jobMinDuration: { gte: min } } });

    if (typeof max === "number")
        match.push({ range: { jobMaxDuration: { lte: max } } });

    return match;
}

/**
 * Spread the DSL inside a boolean clause array like 'filter' or 'should'
 * Use as [.., ...push(match..(..)), ..]
 *
 * @param {DSL|DSL[]} [dsl] - One or more Elasticsearch DSL matchers
 * @returns {DSL[]}
 */
function push(DSL) {
    if (!DSL) return [];
    if (Array.isArray(DSL))
        return DSL;
    return [DSL];
}

module.exports = {
    queryOfferSimple,
    matchJobType,
    matchJobDuration,
    matchFields,
    matchTecnologies,
    push,
};
