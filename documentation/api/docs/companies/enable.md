---
id: enable
title: Enable Company
sidebar_label: Enable Company
slug: /company/enable
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import Highlight from "../../src/highlight.js"

## Details

This endpoint enables the company specified by companyId.
Also enables all the company's offers that were hidden when the company was disabled.

**URL** : `/company/:companyId/enable`

**Method** : <Highlight level="info" inline>PUT</Highlight>

:::caution Authentication
Auth is required to enable a Company as the Company or Admin. Otherwise, if in god mode, [god_token](#god_token) must be
provided.
:::

## Parameters

### god_token

<Highlight level="info">Body Parameter</Highlight>

<Highlight level="success" inline>Optional</Highlight>
<Highlight level="secondary" inline>String</Highlight>

If set, will use this for validating the usage of god mode (in case no session details are available, i.e., no logged-in
user).

## Request examples

### Example 1 - Valid Request (Logged-in as Company)

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
/company/431859ea531e53a45a443de0/enable
```

</TabItem>

<TabItem value="response">

```json
{
  "_id": "431859ea531e53a45a443de0",
  "name": "Enabled Company",
  "contacts": [
    "enable@company.com"
  ],
  "hasFinishedRegistration": true,
  "isBlocked": false,
  // highlight-next-line
  "isDisabled": false,
  "__v": 0,
  "bio": "We enabled our own account",
  "logo": "https://res.cloudinary.com/enable.jpg"
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
/company/431859ea531e53a45a443de0/enable
```

</TabItem>

<TabItem value="response">

```json
{
  "_id": "431859ea531e53a45a443de0",
  "name": "Enabled Company",
  "contacts": [
    "enable@company.com"
  ],
  "hasFinishedRegistration": true,
  "isBlocked": false,
  // highlight-next-line
  "isDisabled": false,
  "__v": 0,
  "bio": "Our account was enabled by an admin",
  "logo": "https://res.cloudinary.com/enable.jpg"
}
```

</TabItem>
</Tabs>

### Example 3 - Non-Existing Company

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
/company/62601cb7cb39d3001b3664d9/enable
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

### Example 4 - Logged-in as a Different Company

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
/company/62601cb7cb39d3001b3664d9/enable
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 3,
  "errors": [
    {
      "msg": "insufficient-permissions-to-manage-company-settings"
    }
  ]
}
```

</TabItem>
</Tabs>
