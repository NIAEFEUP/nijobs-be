---
id: me
title: User Info
sidebar_label: User Info
slug: /auth/me
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import Highlight from "../../src/highlight.js"

## Details

This endpoint is used to get information about the currently logged-in user.

**URL** : `/auth/me`

**Method** : <Highlight level="info" inline>GET</Highlight>

:::caution Authentication
Auth is required to get the user info.
:::

## Response

### data

<Highlight level="info" inline>Response Field</Highlight>
<Highlight level="secondary" inline>Object</Highlight>

Object containing data about the logged-in user. Contains information about the email, its company and whether
it is an admin or not.

## Request examples

### Example 1 - Logged-In as Company

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
/auth/me
```

</TabItem>

<TabItem value="response">

```json
{
  "data": {
    "email": "company@company.com",
    "isAdmin": false,
    "company": {
      "_id": "631899ea541e53a45a423de0",
      "name": "Company Name",
      "contacts": ["company@company.com"],
      "hasFinishedRegistration": true,
      "isBlocked": false,
      "isDisabled": false,
      "__v": 0
    }
  }
}
```

</TabItem>
</Tabs>

### Example 2 - Logged-In as Admin

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
/auth/me
```

</TabItem>

<TabItem value="response">

```json
{
  "data": {
    "email": "admin@nijobs.pt",
    "isAdmin": true
  }
}
```

</TabItem>
</Tabs>

### Example 2 - Not Logged-In

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
/auth/me
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 3,
  "errors": [
    {
      "msg": "login-required"
    }
  ]
}
```

</TabItem>
</Tabs>
