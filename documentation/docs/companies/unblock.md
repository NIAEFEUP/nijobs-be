---
id: unblock
title: Unblock Company
sidebar_label: Unblock Company
slug: /company/unblock
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import Highlight from "../../src/highlight.js"

## Details

This endpoint unblocks the company specified by companyId.
Also enables all the offers previously disabled with the same adminReason.

**URL** : `/company/:companyId/unblock`

**Method** : <Highlight level="info" inline>PUT</Highlight>

:::caution Authentication
Auth is required to unblock a Company as an Admin. Otherwise, if in god mode, [god_token](#god_token) must be
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

### Example 1 - Valid Request (Logged-in as Admin)

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
/company/431859ea531e53a45a443de0/unblock
```

</TabItem>

<TabItem value="response">

```json
{
  "_id": "431859ea531e53a45a443de0",
  "name": "Unblocked Company",
  "contacts": [
    "unblocked@company.com"
  ],
  "hasFinishedRegistration": true,
  // highlight-next-line
  "isBlocked": false,
  "isDisabled": false,
  "__v": 0,
  "bio": "We were unblocked after we broke the rules",
  "logo": "https://res.cloudinary.com/unblocked.jpg"
}
```

</TabItem>
</Tabs>

### Example 2 - Logged-in as a Company

**Code** : <Highlight level="danger" inline>401 UNAUTHORIZED</Highlight>

<Tabs
defaultValue="request"
values={[
{label: 'Request', value: 'request'},
{label: 'Response', value: 'response'},
]}
>

<TabItem value="request">

```bash
/company/431859ea531e53a45a443de0/unblock
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 3,
  "errors": [
    {
      "msg": "insufficient-permissions"
    }
  ],
  "or": [
    {
      "error_code": 3,
      "errors": [
        {
          "msg": "must-be-god"
        }
      ]
    },
    {
      "error_code": 3,
      "errors": [
        {
          "msg": "must-be-admin"
        }
      ]
    }
  ]
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
/company/62601cb7cb39d3001b3664d9/unblock
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
