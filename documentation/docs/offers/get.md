---
id: get
title: Get Offer
sidebar_label: Get Offer
slug: /offers/get
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import Highlight from "../../src/highlight.js"

## Details

This endpoint returns an offer based on the ID provided.

**URL** : `/offers/:offerId`

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
/offers/62601cb7cb39d3001b3664d9
```

</TabItem>

<TabItem value="response">

```json
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
}
```

</TabItem>
</Tabs>

### Example 2 - Blocked Offer (Logged-in as Admin)

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
/offers/62601cb7cb39d3001b3664d9
```

</TabItem>

<TabItem value="response">

```json
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
  "isHidden": true,
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
  "hiddenReason": "ADMIN_REQUEST",
  "adminReason": "Offer violates the website's rules" // only appears for admins
}
```

</TabItem>
</Tabs>

### Example 3 - Blocked Offer (Logged-in as Company)

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
/offers/62601cb7cb39d3001b3664d9
```

</TabItem>

<TabItem value="response">

```json
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
  "isHidden": true,
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
  "hiddenReason": "ADMIN_REQUEST" // adminReason doesn't appear
}
```

</TabItem>
</Tabs>

### Example 4 - Non-Existing Offer

**Code** : <Highlight level="danger" inline>404 NOT FOUND</Highlight>

<Tabs
defaultValue="request"
values={[
{label: 'Request', value: 'request'},
{label: 'Response', value: 'response'},
]}
>

<TabItem value="request">

```bash
/offers/62601cb7cb39d3001b3664d9
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 3,
  "errors": [
    {
      "msg": "no-offer-found-with-id:625161f7d22d12002bd09798"
    }
  ]
}
```

</TabItem>
</Tabs>

### Example 4 - Invalid ID

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
/offers/invalid
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 1,
  "errors": [
    {
      "value": "invalid",
      "msg": "must-be-a-valid-id",
      "param": "offerId",
      "location": "params"
    }
  ]
}
```

</TabItem>
</Tabs>
