---
id: register
title: Register Admin
sidebar_label: Register Admin
slug: /auth/register
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import Highlight from "../../src/highlight.js"

## Details

This endpoint is used to register an admin in the website. If you're looking to register a company,
see [create application](../applications/create.md).

**URL** : `/auth/register`

**Method** : <Highlight level="info" inline>POST</Highlight>

:::caution Authentication
God permissions are needed in order to register and Admin.
:::

## Parameters

### god_token

<Highlight level="info">Body Parameter</Highlight>

<Highlight level="danger" inline>Required</Highlight>
<Highlight level="secondary" inline>String</Highlight>

The endpoint will use this for validating the usage of god mode.

### email

<Highlight level="info">Body Parameter</Highlight>
<Highlight level="danger" inline>Required</Highlight>
<Highlight level="secondary" inline>String</Highlight>

Email used for the admin's account.

Must be in a valid email format.  Can't already be in use in another account.

### password

<Highlight level="info" inline>Body Parameter</Highlight>
<Highlight level="danger" inline>Required</Highlight>
<br/>
<Highlight level="secondary" inline>String</Highlight>
<Highlight level="warning" inline>Min Length: 8</Highlight>

Password used for the admin's account.

Must contain at least one number.

## Response

### data

<Highlight level="info" inline>Response Field</Highlight>
<Highlight level="secondary" inline>Object</Highlight>

Object containing data about the created account (without the password).

## Request examples

### Example 1 - Successful Request

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
  "email": "admin@nijobs.pt",
  "password": "password123",
  "god_token": "token123"
}
```

</TabItem>

<TabItem value="response">

```json
{
  "data": {
    "email": "admin@nijobs.pt"
  }
}
```

</TabItem>
</Tabs>

### Example 2 - Duplicate Email

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
  "email": "admin@nijobs.pt",
  "password": "password123",
  "god_token": "token123"
}
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 1,
  "errors": [
    {
      "value": "admin@nijobs.pt",
      "msg": "email-already-exists",
      "param": "email",
      "location": "body"
    }
  ]
}
```

</TabItem>
</Tabs>

### Example 3 - God Token Missing

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
  "email": "admin@nijobs.pt",
  "password": "password123"
}
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 3,
  "errors": [
    {
      "msg": "must-be-god"
    }
  ]
}
```

</TabItem>
</Tabs>
