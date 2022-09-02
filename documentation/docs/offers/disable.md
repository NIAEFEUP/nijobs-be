---
id: disable
title: Disable Offer
sidebar_label: Disable Offer
slug: /offers/disable
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import Highlight from "../../src/highlight.js"

## Details

This endpoint disables the offer specified by offerId.

**URL** : `/offers/:offerId/hide`

**Method** : <Highlight level="info" inline>POST</Highlight>

:::info
This is an action that cannot be reverted by the company. If you're looking for a less serious action, check [hide](./hide).
:::

:::caution Authentication
Auth is required to disable an Offer as an Admin. Otherwise, if in god mode, [god_token](#god_token) must be
provided.
:::

## Parameters

### god_token

<Highlight level="info">Body Parameter</Highlight>

<Highlight level="success" inline>Optional</Highlight>
<Highlight level="secondary" inline>String</Highlight>

If set, will use this for validating the usage of god mode (in case no session details are available, i.e., no logged-in
user).

### adminReason

<Highlight level="info">Body Parameter</Highlight>

<Highlight level="danger" inline>Required</Highlight>
<Highlight level="secondary" inline>String</Highlight>

Reason for the admin to disable the offer. This should only be used for admins, it's not intended to show to the
company or the public.

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

```json
{
  "adminReason": "Offer violates the website's rules"
}
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
  "adminReason": "Offer violates the website's rules"
}
```

</TabItem>
</Tabs>

### Example 2 - Missing Admin Reason

**Code** : <Highlight level="danger" inline>422 UNPROCESSABLE ENTITY</Highlight>

<Tabs
defaultValue="request"
values={[
{label: 'Request', value: 'request'},
{label: 'Response', value: 'response'},
]}
>

<TabItem value="request">

```json
{}
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 1,
  "errors": [
    {
      "msg": "required",
      "param": "adminReason",
      "location": "body"
    }
  ]
}
```

</TabItem>
</Tabs>

### Example 3 - Non-Existing Offer

**Code** : <Highlight level="danger" inline>422 UNPROCESSABLE ENTITY</Highlight>

<Tabs
defaultValue="request"
values={[
{label: 'Request', value: 'request'},
{label: 'Response', value: 'response'},
]}
>

<TabItem value="request">

```json
{
  "adminReason": "Offer violates the website's rules"
}
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 1,
  "errors": [
    {
      "value": "62601cb7cb39d3001b3664d9",
      "msg": "no-offer-found-with-id:62601cb7cb39d3001b3664d9",
      "param": "offerId",
      "location": "params"
    }
  ]
}
```

</TabItem>
</Tabs>

### Example 4 - Blocked Offer

**Code** : <Highlight level="danger" inline>403 FORBIDDEN</Highlight>

<Tabs
defaultValue="request"
values={[
{label: 'Request', value: 'request'},
{label: 'Response', value: 'response'},
]}
>

<TabItem value="request">

```json
{
  "adminReason": "Offer violates the website's rules"
}
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 3,
  "errors": [
    {
      "msg": "offer-blocked-by-admin"
    }
  ]
}
```

</TabItem>
</Tabs>
