---
id: recover
title: Recover Account
sidebar_label: Recover Account
slug: /auth/recover
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import Highlight from "../../src/highlight.js"

## Details

This endpoint is used to recover the account of a user.
If the account exists, the user will receive an email that will allow him to continue the process.

Returns 200 status even if the account doesn't exist (for safety purposes).

**URL** : `/auth/recover/request`

**Method** : <Highlight level="info" inline>POST</Highlight>

:::info Following steps
To continue the flow of recovering an account, see [confirm token](./confirm) and [finish recovery](./finish-recovery).
:::

## Parameters

### email

<Highlight level="info">Body Parameter</Highlight>
<Highlight level="danger" inline>Required</Highlight>
<Highlight level="secondary" inline>String</Highlight>

Email corresponding to the account to be recovered.

Must be in a valid email format.

## Request examples

### Example 1 - Existing Account

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
  "email": "admin@nijobs.pt"
}
```

</TabItem>

<TabItem value="response">

```json
{}
```

</TabItem>
</Tabs>

### Example 2 - Non-Existing Account

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
  "email": "wrong@nijobs.pt"
}
```

</TabItem>

<TabItem value="response">

```json
{}
```

</TabItem>
</Tabs>
