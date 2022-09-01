---
id: search
title: Search Offers
sidebar_label: Search Offers
slug: /offers/search
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import Highlight from "../../src/highlight.js"

## Details

This endpoint returns offers based on search criteria. It allows for _Full-Text Search_ as well as results filtering.
Perfect for a search component!

**URL** : `/offers`

**Method** : <Highlight level="info" inline>GET</Highlight>

:::caution Authentication
Auth is required to get hidden Offers. Only Admins or owners of hidden Offers will see them if `showHidden` is set
to `true`.
:::

## Parameters

### showHidden

<Highlight level="info">Query Parameter</Highlight>

<Highlight level="success" inline>Optional</Highlight>
<Highlight level="secondary" inline>Boolean</Highlight>

If active, will also return hidden offers, only for admin or offer owner.

### limit

<Highlight level="info" inline>Query Parameter</Highlight>
<Highlight level="success" inline>Optional</Highlight>
<br/>
<Highlight level="warning" inline>Default: 20</Highlight>
<Highlight level="secondary" inline>Number</Highlight>

Limits the number of results returned.

### queryToken

<Highlight level="info">Query Parameter</Highlight>

<Highlight level="success" inline>Optional</Highlight>
<Highlight level="secondary" inline>String</Highlight>

Used to continue a search after the previous one (often used with [limit](#limit-query-parameter) to have pagination).
When using this parameter, it's not needed to pass the previous search parameters again.

:::info
You can get this token in the response of a previous call to this endpoint.
:::

### value

<Highlight level="info" inline>Query Parameter</Highlight>
<Highlight level="success" inline>Optional</Highlight>
<br/>
<Highlight level="warning" inline>Default: ""</Highlight>
<Highlight level="secondary" inline>String</Highlight>

Query for full text search.

### jobType

<Highlight level="info">Query Parameter</Highlight>

<Highlight level="success" inline>Optional</Highlight>
<Highlight level="secondary" inline>String</Highlight>

Filters the search results to only include ones of given type.

:::caution
Must be a valid Job Type (
currently `["FULL-TIME", "PART-TIME", "SUMMER INTERNSHIP", "CURRICULAR INTERNSHIP", "RESEARCH GRANT", "OTHER"]`).
:::

### jobMinDuration

<Highlight level="info">Query Parameter</Highlight>

<Highlight level="success" inline>Optional</Highlight>
<Highlight level="secondary" inline>Number</Highlight>

Filters the search results to only include Offers with a `jobMinDuration` greater than given value.

### jobMaxDuration

<Highlight level="info">Query Parameter</Highlight>

<Highlight level="success" inline>Optional</Highlight>
<Highlight level="secondary" inline>Number</Highlight>

Filters the search results to only include Offers with a `jobMinDuration` lower than given value.

### fields

<Highlight level="info" inline>Query Parameter</Highlight>
<Highlight level="success" inline>Optional</Highlight>
<br/>
<Highlight level="secondary" inline>String</Highlight>
<Highlight level="secondary" inline>Array</Highlight>

Filters the search results to only include Offers with at least one of `fields` being one of given values.

:::caution
Must be a valid Field Type (
see [list](https://github.com/NIAEFEUP/nijobs-be/blob/develop/src/models/constants/FieldTypes.js)).
:::

:::info
If you pass multiple values like: `<url>/?fields=field1&fields=field2` it will be parsed as a String array.
:::

### technologies

<Highlight level="info" inline>Query Parameter</Highlight>
<Highlight level="success" inline>Optional</Highlight>
<br/>
<Highlight level="secondary" inline>String</Highlight>
<Highlight level="secondary" inline>Array</Highlight>

Filters the search results to only include Offers with at least one of `technologies` being one of given values.

:::caution
Must be a valid Technology Type (
see [list](https://github.com/NIAEFEUP/nijobs-be/blob/develop/src/models/constants/TechnologyTypes.js)).
:::

:::info
If you pass multiple values like: `<url>/?technologies=tech1&technologies=tech2` it will be parsed as a String array
:::

## Response

### results

<Highlight level="info">Response Field</Highlight>

<Highlight level="secondary" inline>Object</Highlight>
<Highlight level="secondary" inline>Array</Highlight>

Array of objects containing the offers found by the search

### queryToken

<Highlight level="info" inline>Response Field</Highlight>
<Highlight level="secondary" inline>String</Highlight>

Token used to continue the search in a following request. It's needed to get the next page of results.

:::info
You can use this together with [limit](#limit-query-parameter) to achieve pagination
:::

## Request examples

### Example 1 - Valid Request

**Code** : <Highlight level="success" inline>200 OK</Highlight>

<Tabs
defaultValue="request"
values={[
{label: 'Request', value: 'request'},
{label: 'Response', value: 'response'},
]}
>

<TabItem value="request">

```bash
/offers?value=testcompany%20frontend&technologies=React&technologies=NodeJS
```

</TabItem>

<TabItem value="response">

```json
{
  "results": [
    {
      "contacts": [
        "contact@company.com"
      ],
      "fields": [
        "FRONTEND",
        "FULL-STACK"
      ],
      "technologies": [
        "React",
        "JavaScript"
      ],
      "isHidden": false,
      "isArchived": false,
      "requirements": [
        "Ambitious people with a passion for this area",
        "Degree in Computer Engineering or similar"
      ],
      "_id": "62601cb7cb39d3001b3664d9",
      "title": "React JS Developer",
      "publishDate": "2022-04-20T14:28:59.072Z",
      "publishEndDate": "2022-10-19T02:57:47.000Z",
      "jobMinDuration": 1,
      "jobMaxDuration": 12,
      "description": "We are an amazing company with amazing job opportunities. We're currently looking for amazing engineers",
      "applyURL": "https://www.company.com/apply",
      "isPaid": true,
      "jobType": "FULL-TIME",
      "owner": "625ff2d1cb39d3001b36635b",
      "ownerName": "Company Name",
      "ownerLogo": "https://res.cloudinary.com/coolimage.jpg",
      "location": "Porto, Portugal",
      "createdAt": "2022-04-20T14:46:15.281Z",
      "updatedAt": "2022-04-20T14:46:15.281Z",
      "__v": 0,
      "score": 5.5
    },
    {
      "contacts": [
        "contact@company2.pt"
      ],
      "fields": [
        "FRONTEND",
        "MOBILE"
      ],
      "technologies": [
        "JavaScript",
        "React Native"
      ],
      "isHidden": false,
      "isArchived": false,
      "requirements": [
        "Recent graduate/master's degree in Computer Science, Engineering or similar areas"
      ],
      "_id": "62cd48ab5dee380013abe4a7",
      "title": "Software Developer - Trainee (Full remote)",
      "publishDate": "2022-07-12T10:02:38.499Z",
      "publishEndDate": "2023-01-09T22:31:26.000Z",
      "jobMinDuration": 1,
      "jobMaxDuration": 9,
      "description": "We are currently looking for a Software Developer - Graduate Trainee to join our Creative Tech team.",
      "isPaid": true,
      "jobType": "OTHER",
      "owner": "62cd33385dee380013abe457",
      "ownerName": "Company2 Name",
      "ownerLogo": "https://res.cloudinary.com/niceimage.jpg",
      "location": "Porto, Portugal",
      "createdAt": "2022-07-12T10:10:51.054Z",
      "updatedAt": "2022-07-12T10:11:10.743Z",
      "__v": 0,
      "score": 5.5
    }
  ],
  "queryToken": "eyJpZCI6IjYyY2Q0OGFiNWRlZTM4MDAxM2FiZTRhNyIsInNjb3JlIjo1LjUsInZhbHVlIjoidGVzdGNvbXBhbnkgZnJvbnRlbmQiLCJmaWx0ZXJzIjp7InRlY2hub2xvZ2llcyI6WyJSZWFjdCIsIk5vZGVKUyJdfX0"
}
```

</TabItem>
</Tabs>

### Example 2 - Invalid job type

**Condition** : If jobType contains an invalid value (e.g. `jobType=fas`)

**Code** : <Highlight level="danger" inline>422 UNPROCESSABLE ENTITY</Highlight>

<Tabs
defaultValue="request"
values={[
{label: 'Request', value: 'request'},
{label: 'Response', value: 'response'},
]}
>

<TabItem value="request">

```bash
/offers?jobType=fas
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 1,
  "errors": [
    {
      "value": "fas",
      "msg": "must-be-in:[FULL-TIME,PART-TIME,SUMMER INTERNSHIP,CURRICULAR INTERNSHIP,RESEARCH GRANT,OTHER]",
      "param": "jobType",
      "location": "query"
    }
  ]
}
```

</TabItem>
</Tabs>

### Example 3 - Invalid fields

**Condition** : If fields contains an invalid value (e.g. `fields=fas`)

**Code** : <Highlight level="danger" inline>422 UNPROCESSABLE ENTITY</Highlight>

<Tabs
defaultValue="request"
values={[
{label: 'Request', value: 'request'},
{label: 'Response', value: 'response'},
]}
>

<TabItem value="request">

```bash
/offers?fields=fas
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 1,
  "errors": [
    {
      "value": [
        "fas"
      ],
      "msg": "must-be-in:[ARTIFICIAL INTELLIGENCE,BACKEND,BLOCKCHAIN,DEVOPS,FRONTEND,OTHER]",
      "param": "fields",
      "location": "query"
    }
  ]
}
```

</TabItem>
</Tabs>

### Example 4 - Invalid technologies

**Condition** : If technologies contains an invalid value (e.g. `technologies=fas`)

**Code** : <Highlight level="danger" inline>422 UNPROCESSABLE ENTITY</Highlight>

<Tabs
defaultValue="request"
values={[
{label: 'Request', value: 'request'},
{label: 'Response', value: 'response'},
]}
>

<TabItem value="request">

```bash
/offers?technologies=fas
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 1,
  "errors": [
    {
      "value": [
        "fas"
      ],
      "msg": "must-be-in:[.NET,Angular,Go,Haskell,NodeJS,Rust,Spring,Unity,Windows,Other]",
      "param": "technologies",
      "location": "query"
    }
  ]
}
```

</TabItem>
</Tabs>

### Example 5 - Invalid numeric fields

**Condition** : If given a non-int to any of the numeric fields

**Code** : <Highlight level="danger" inline>422 UNPROCESSABLE ENTITY</Highlight>

<Tabs
defaultValue="request"
values={[
{label: 'Request', value: 'request'},
{label: 'Response', value: 'response'},
]}
>

<TabItem value="request">

```bash
/offers?limit=fas
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 1,
  "errors": [
    {
      "value": "fas",
      "msg": "must-be-int",
      "param": "limit",
      "location": "query"
    }
  ]
}
```

</TabItem>
</Tabs>

### Example 6 - Invalid queryToken

**Condition** : If given an invalid queryToken (e.g. random string)

**Code** : <Highlight level="danger" inline>422 UNPROCESSABLE ENTITY</Highlight>

<Tabs
defaultValue="request"
values={[
{label: 'Request', value: 'request'},
{label: 'Response', value: 'response'},
]}
>

<TabItem value="request">

```bash
/offers?queryToken=random_string
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 1,
  "errors": [
    {
      "value": "random_string",
      "msg": "invalid-query-token",
      "param": "queryToken",
      "location": "query"
    }
  ]
}
```

</TabItem>
</Tabs>
