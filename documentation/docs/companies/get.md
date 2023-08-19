---
id: get
title: Get Company
sidebar_label: Get Company
slug: /company/get
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import Highlight from "../../src/highlight.js"

## Details

This endpoint returns a company based on the ID provided.

**URL** : `/company/:companyId`

**Method** : <Highlight level="info" inline>GET</Highlight>

:::caution Authentication
Auth is required to get Companies that are blocked or disabled. Only Admins and Gods will have access to blocked companies but its owner will get an error informing that it is blocked.
On the other hand, Admins, Gods and the Company owner will have access to it if disabled. These entities will also get an informative error if the company hasn't finished its registration.

All other situations will result in a 404 not found error.

If in god mode, [god_token](#god_token) must be provided.
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
/company/62601cb7cb39d3001b3664d9
```

</TabItem>

<TabItem value="response">

```json
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
  "logo": "https://res.cloudinary.com/coolimage.jpg",
  "offers": [
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
      "owner": "62601cb7cb39d3001b3664d9",
      "ownerName": "Company Name",
      "ownerLogo": "https://res.cloudinary.com/coolimage.jpg",
      "location": "Porto, Portugal",
      "createdAt": "2022-04-20T14:46:15.281Z",
      "updatedAt": "2022-04-20T14:46:15.281Z",
      "__v": 0
    }
  ]
}
```

</TabItem>
</Tabs>

### Example 2 - Non-Existing Company or Blocked / Disabled / Unfinished Registration w/o Auth

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
/company/62601cb7cb39d3001b3664d9
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 3,
  "errors": [
    {
      "msg": "no-company-found-with-id:62601cb7cb39d3001b3664d9"
    }
  ]
}
```

</TabItem>
</Tabs>

### Example 3 - Invalid ID

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
/company/invalid
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
      "param": "companyId",
      "location": "params"
    }
  ]
}
```

</TabItem>
</Tabs>

### Example 4 - Blocked Company (Logged-in as Admin)

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
/company/62601cb7cb39d3001b3664d9
```

</TabItem>

<TabItem value="response">

```json
{
  "_id": "62601cb7cb39d3001b3664d9",
  "name": "Company Name",
  "contacts": [
    "company@company.com"
  ],
  "hasFinishedRegistration": true,
  // highlight-start
  "isBlocked": true,
  "adminReason": "Company was spamming offers",
  // highlight-end
  "isDisabled": false,
  "__v": 0,
  "bio": "We are an amazing company with amazing job opportunities. We're currently looking for amazing engineers",
  "logo": "https://res.cloudinary.com/coolimage.jpg",
  "offers": [
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
      // highlight-start
      "isHidden": true,
      "hiddenReason": "COMPANY_BLOCKED",
      // highlight-end
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
      "owner": "62601cb7cb39d3001b3664d9",
      "ownerName": "Company Name",
      "ownerLogo": "https://res.cloudinary.com/coolimage.jpg",
      "location": "Porto, Portugal",
      "createdAt": "2022-04-20T14:46:15.281Z",
      "updatedAt": "2022-04-20T14:46:15.281Z",
      "__v": 0
    }
  ]
}
```

</TabItem>
</Tabs>

### Example 5 - Blocked Company (Logged-in as Company owner)

**Code** : <Highlight level="danger" inline>403 FORBIDDEN</Highlight>

<Tabs
defaultValue="request"
values={[
{label: 'Request', value: 'request'},
{label: 'Response', value: 'response'},
]}
>

<TabItem value="request">

```bash
/company/62601cb7cb39d3001b3664d9
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 3,
  "errors": [
    {
      "msg": "company-blocked"
    }
  ]
}
```

</TabItem>
</Tabs>

### Example 6 - Disabled Company (Logged-in as Admin or Company owner)

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
/company/62601cb7cb39d3001b3664d9
```

</TabItem>

<TabItem value="response">

```json
{
  "_id": "62601cb7cb39d3001b3664d9",
  "name": "Company Name",
  "contacts": [
    "company@company.com"
  ],
  "hasFinishedRegistration": true,
  "isBlocked": false,
  // highlight-start
  "isDisabled": true,
  // highlight-end
  "__v": 0,
  "bio": "We are an amazing company with amazing job opportunities. We're currently looking for amazing engineers",
  "logo": "https://res.cloudinary.com/coolimage.jpg",
  "offers": [
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
      // highlight-start
      "isHidden": true,
      "hiddenReason": "COMPANY_DISABLED",
      // highlight-end
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
      "owner": "62601cb7cb39d3001b3664d9",
      "ownerName": "Company Name",
      "ownerLogo": "https://res.cloudinary.com/coolimage.jpg",
      "location": "Porto, Portugal",
      "createdAt": "2022-04-20T14:46:15.281Z",
      "updatedAt": "2022-04-20T14:46:15.281Z",
      "__v": 0
    }
  ]
}
```

</TabItem>
</Tabs>

### Example 7 - Unfinished Registration (Logged-in as Admin or Company owner)

**Code** : <Highlight level="danger" inline>403 FORBIDDEN</Highlight>

<Tabs
defaultValue="request"
values={[
{label: 'Request', value: 'request'},
{label: 'Response', value: 'response'},
]}
>

<TabItem value="request">

```bash
/company/62601cb7cb39d3001b3664d9
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 3,
  "errors": [
    {
      "msg": "registration-not-finished-yet"
    }
  ]
}
```

</TabItem>
</Tabs>
