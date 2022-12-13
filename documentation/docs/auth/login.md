---
id: login
title: Login
sidebar_label: Login
slug: /auth/login
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import Highlight from "../../src/highlight.js"

## Details

This endpoint is used to log in the user. Works for Companies, Admins or any other type of user with an account.

**URL** : `/auth/login`

**Method** : <Highlight level="info" inline>POST</Highlight>

## Parameters

### email

<Highlight level="info">Body Parameter</Highlight>
<Highlight level="danger" inline>Required</Highlight>
<Highlight level="secondary" inline>String</Highlight>

Email of the account trying to log in.

Must be in a valid email format.

### password

<Highlight level="info">Body Parameter</Highlight>
<Highlight level="danger" inline>Required</Highlight>
<Highlight level="secondary" inline>String</Highlight>

Password of the account trying to log in.

## Request examples

### Example 1 - Successful Login

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
  "email": "company@company.com",
  "password": "strongpassword123"
}
```

</TabItem>

<TabItem value="response">

```json
{}
```

</TabItem>
</Tabs>

### Example 1 - Invalid Credentials

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
  "email": "company@company.com",
  "password": "wrongpassword123"
}
```

</TabItem>

<TabItem value="response">

```text
Unauthorized
```

</TabItem>
</Tabs>
