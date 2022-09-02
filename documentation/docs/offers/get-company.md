---
id: get-company
title: Get Offers by Company
sidebar_label: Get Offers by Company
slug: /offers/get-company
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import Highlight from "../../src/highlight.js"

## Details

This endpoint returns offers from the company specified by companyId.

**URL** : `/offers/company/:companyId`

**Method** : <Highlight level="info" inline>GET</Highlight>

:::caution Authentication
Auth is required to get hidden Offers. Only Admins or owners of hidden Offers will see them if `isHidden` is set
to `true`. Otherwise, if in god mode, [god_token](#god_token) must be provided.
:::

## Parameters

### god_token

<Highlight level="info">Body Parameter</Highlight>

<Highlight level="success" inline>Optional</Highlight>
<Highlight level="secondary" inline>String</Highlight>

If set, will use this for validating the usage of god mode (in case no session details are available, i.e., no logged-in
user).

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
/offers/company/62601cb7cb39d3001b3664d9
```

</TabItem>

<TabItem value="response">

```json
[
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
    "__v": 0
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
    "owner": "62601cb7cb39d3001b3664d9",
    "ownerName": "Company Name",
    "ownerLogo": "https://res.cloudinary.com/coolimage.jpg",
    "location": "Porto, Portugal",
    "createdAt": "2022-07-12T10:10:51.054Z",
    "updatedAt": "2022-07-12T10:11:10.743Z",
    "__v": 0
  }
]
```

</TabItem>
</Tabs>

### Example 2 - Non-Existing Company

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
/offers/company/62601cb7cb39d3001b3664d9
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 1,
  "errors": [
    {
      "value": "62601cb7cb39d3001b3664d9",
      "msg": "no-company-found-with-id:62601cb7cb39d3001b3664d9",
      "param": "companyId",
      "location": "params"
    }
  ]
}
```

</TabItem>
</Tabs>
