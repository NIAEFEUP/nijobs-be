---
id: get-application
title: Get Company Application by Company Id
sidebar_label: Get Application by Company Id
slug: /companies/get-application
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import Highlight from "../../src/highlight.js"

## Details

This endpoint returns an application of a Company based on the Company ID provided.

**URL** : `/company/:companyId/application`

**Method** : <Highlight level="info" inline>GET</Highlight>

:::caution Authentication
Auth is required to get the application. Only Admins or owners of the company will have permission. Otherwise, if in god mode, [god_token](#god_token) must be provided.
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
/company/649a1ac0282d8ea3c574e25f/application
```

</TabItem>

<TabItem value="response">

```json
{
  "_id": "649a1ab4282d8ea3c574e259",
  "email": "company@example.com",
  "companyName": "Company",
  "motivation": "We wish to revolutionize the industry with young engineers.",
  "submittedAt": "2023-06-26T23:09:40.450Z",
  "isVerified": true,
  "__v": 0,
  "approvedAt": "2023-06-26T23:11:37.488Z",
  "state": "APPROVED"
}
```

</TabItem>
</Tabs>

### Example 2 - Insufficient permission

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
/company/649a1ac0282d8ea3c574e25f/application
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
/company/invalid/application
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
/company/649a1ac0282d8ea3c574e26f/application
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 1,
  "errors": [
    {
      "value": "649a1ac0282d8ea3c574e26f",
      "msg": "no-company-found-with-id:649a1ac0282d8ea3c574e26f",
      "param": "companyId",
      "location": "params"
    }
  ]
}
```

</TabItem>
</Tabs>
