---
id: block
title: Block Company
sidebar_label: Block Company
slug: /company/block
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import Highlight from "../../src/highlight.js"

## Details

This endpoint blocks the company specified by companyId.
Also disabled all the company's offers using the same adminReason.

**URL** : `/company/:companyId/block`

**Method** : <Highlight level="info" inline>PUT</Highlight>

:::info
This is an action that cannot be reverted by the company. If you're looking for a less serious action, check [disable](./disable).
:::

:::caution Authentication
Auth is required to block a Company as an Admin. Otherwise, if in god mode, [god_token](#god_token) must be
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

Reason for the admin to block the company. This should only be used for admins, it's not intended to show to the
company or the public.

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

```json
{
  "adminReason": "Not respectful to the students"
}
```

</TabItem>

<TabItem value="response">

```json
{
  "_id": "431859ea531e53a45a443de0",
  "name": "Blocked Company",
  "contacts": [
    "blocked@company.com"
  ],
  "hasFinishedRegistration": true,
  // highlight-start
  "isBlocked": true,
  "adminReason": "Not respectful to the students",
  // highlight-end
  "isDisabled": false,
  "__v": 0,
  "bio": "We were blocked because we broke the rules",
  "logo": "https://res.cloudinary.com/blocked.jpg"
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

### Example 3 - Logged-in as a Company

**Code** : <Highlight level="danger" inline>401 UNAUTHORIZED</Highlight>

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
  "adminReason": "Not respectful to the students"
}
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

### Example 4 - Non-Existing Company

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
/company/62601cb7cb39d3001b3664d9/block
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
