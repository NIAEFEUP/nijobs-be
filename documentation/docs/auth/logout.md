---
id: logout
title: Logout
sidebar_label: Logout
slug: /auth/logout
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import Highlight from "../../src/highlight.js"

## Details

This endpoint is used to log out the user. Works for Companies, Admins or any other type of user with an account.

Returns 200 status even if the user is not logged-in (idempotent).

**URL** : `/auth/login`

**Method** : <Highlight level="info" inline>DELETE</Highlight>

## Request examples

### Example 1 - User Logged-In

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
/auth/login
```

</TabItem>

<TabItem value="response">

```json
{}
```

</TabItem>
</Tabs>

### Example 2 - User Not Logged-In

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
/auth/login
```

</TabItem>

<TabItem value="response">

```json
{}
```

</TabItem>
</Tabs>
