---
id: disable
title: Disable Company
sidebar_label: Disable Company
slug: /company/disable
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import Highlight from "../../src/highlight.js"

## Details

This endpoint disables the company specified by companyId.
Also hides all the companies' offers.

**URL** : `/company/:companyId/disable`

**Method** : <Highlight level="info" inline>PUT</Highlight>

:::info
This is an action that can be reverted by the company. If you're looking for a more permanent action, check [block](./block).
:::

:::caution Authentication
Auth is required as a Company to disable it. Otherwise, if in god mode, [god_token](#god_token) must be
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
/company/431859ea531e53a45a443de0/disable
```

</TabItem>

<TabItem value="response">

```json
{
  "_id": "431859ea531e53a45a443de0",
  "name": "Disabled Company",
  "contacts": [
    "disable@company.com"
  ],
  "hasFinishedRegistration": true,
  "isBlocked": false,
  "isDisabled": true,
  "__v": 0,
  "bio": "We disabled our own account",
  "logo": "https://res.cloudinary.com/disabled.jpg"
}
```

</TabItem>
</Tabs>

### Example 2 - Logged-in as an Admin

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
/company/431859ea531e53a45a443de0/disable
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
          "msg": "must-be-company"
        }
      ]
    },
    {
      "error_code": 3,
      "errors": [
        {
          "msg": "must-be-god"
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
/company/62601cb7cb39d3001b3664d9/disable
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
/company/62601cb7cb39d3001b3664d9/disable
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
