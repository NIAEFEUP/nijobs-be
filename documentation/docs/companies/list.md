---
id: list
title: List Companies
sidebar_label: List Companies
slug: /company/list
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import Highlight from "../../src/highlight.js"

## Details

This endpoint returns all the companies, with pagination based on the parameters provided.

**URL** : `/company`

**Method** : <Highlight level="info" inline>GET</Highlight>

:::caution Authentication
Auth is required to see disabled and blocked Companies, only Admins will see them.
This also applies for the block admin reasons. Otherwise, (if in god
mode) [god_token](#god_token-body-parameter) must be provided.
:::

## Parameters

### god_token

<Highlight level="info">Body Parameter</Highlight>

<Highlight level="success" inline>Optional</Highlight>
<Highlight level="secondary" inline>String</Highlight>

If set, will use this for validating the usage of god mode (in case no session details are available, i.e., no logged-in
user).

### limit

<Highlight level="info" inline>Query Parameter</Highlight>
<Highlight level="success" inline>Optional</Highlight>
<Highlight level="secondary" inline>Number</Highlight>
<br/>
<Highlight level="warning" inline>Default: 100</Highlight>
<Highlight level="warning" inline>Maximum: 100</Highlight>

Limits the number of companies returned.

### offset

<Highlight level="info" inline>Query Parameter</Highlight>
<Highlight level="success" inline>Optional</Highlight>
<Highlight level="secondary" inline>Number</Highlight>
<br/>
<Highlight level="warning" inline>Default: 0</Highlight>
<Highlight level="warning" inline>Minimum: 0</Highlight>

Number of companies to skip.

## Response

### companies

<Highlight level="info" inline>Response Field</Highlight>
<Highlight level="secondary" inline>Array</Highlight>

Array of objects containing the companies listed.

### totalDocCount

<Highlight level="info" inline>Response Field</Highlight>
<Highlight level="secondary" inline>Number</Highlight>

Number of companies listed.

## Request examples

### Example 1 - Valid Request (Regular User)

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
/company/application/finish
```

</TabItem>

<TabItem value="response">

```json
{
  "companies": [
    {
      "_id": "62601cb7cb39d3001b3664d9",
      "name": "Company Name",
      "contacts": [
        "company@company.com"
      ],
      "hasFinishedRegistration": true,
      "isBlocked": false,
      "isDisabled": false,
      "__v": 0,
      "bio": "We are an amazing company with amazing job opportunities. We're currently looking for amazing engineers",
      "logo": "https://res.cloudinary.com/coolimage.jpg"
    },
    {
      "_id": "631899ea541e53a45a423de0",
      "name": "Cool Company",
      "contacts": [
        "cool@company.com"
      ],
      "hasFinishedRegistration": true,
      "isBlocked": false,
      "isDisabled": false,
      "__v": 0,
      "bio": "We are so cool, look at us!",
      "logo": "https://res.cloudinary.com/wowimage.jpg"
    }
  ],
  "totalDocCount": 2
}
```

</TabItem>
</Tabs>

### Example 2 - Valid Request (Logged-in as Admin)

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
/company/application/finish
```

</TabItem>

<TabItem value="response">

```json
{
  "companies": [
    {
      "_id": "62601cb7cb39d3001b3664d9",
      "name": "Company Name",
      "contacts": [
        "company@company.com"
      ],
      "hasFinishedRegistration": true,
      "isBlocked": false,
      "isDisabled": false,
      "__v": 0,
      "bio": "We are an amazing company with amazing job opportunities. We're currently looking for amazing engineers",
      "logo": "https://res.cloudinary.com/coolimage.jpg"
    },
    {
      "_id": "631899ea541e53a45a423de0",
      "name": "Cool Company",
      "contacts": [
        "cool@company.com"
      ],
      "hasFinishedRegistration": true,
      "isBlocked": false,
      "isDisabled": false,
      "__v": 0,
      "bio": "We are so cool, look at us!",
      "logo": "https://res.cloudinary.com/wowimage.jpg"
    },
    {
      "_id": "431859ea531e53a45a443de0",
      "name": "Blocked Company",
      "contacts": [
        "blocked@company.com"
      ],
      "hasFinishedRegistration": true,
      "isBlocked": true,
      "adminReason": "Not respectful to the students",
      "isDisabled": false,
      "__v": 0,
      "bio": "We were blocked because we broke the rules",
      "logo": "https://res.cloudinary.com/blocked.jpg"
    }
  ],
  "totalDocCount": 3
}
```

</TabItem>
</Tabs>
