---
id: validate
title: Validate Application
sidebar_label: Validate Application
slug: /applications/validate
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import Highlight from "../../src/highlight.js"

## Details

This endpoint is used to validate an application using a previous created token.
The token is generated with the [ create ](./create) endpoint and is sent to the user by email.


**URL** : `/apply/company/:token/validate`

**Method** : <Highlight level="info" inline>POST</Highlight>

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
/apply/company/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im5pQGFlZmV1cC5wdCIsImlhdCI6MTY2MzAxMzg0OSwiZXhwIjoxNjYzMDE0NDQ5fQ.k5Z_nBpqt_Hs8JBhLH0ZXTl2-BG-utdIAUdhKXEFuFc/validate
```

</TabItem>

<TabItem value="response">

```json
{}
```

</TabItem>
</Tabs>

### Example 2 - Invalid Token

**Code** : <Highlight level="danger" inline>404 NOT_FOUND</Highlight>

<Tabs
defaultValue="request"
values={[
{label: 'Request', value: 'request'},
{label: 'Response', value: 'response'},
]}
>

<TabItem value="request">

```bash
/apply/company/invalid/validate

```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 3,
  "errors": [
    {
      "msg": "invalid-token"
    }
  ]
}
```

</TabItem>
</Tabs>

### Example 3 - Expired Token

**Code** : <Highlight level="danger" inline>410 GONE</Highlight>

<Tabs
defaultValue="request"
values={[
{label: 'Request', value: 'request'},
{label: 'Response', value: 'response'},
]}
>

<TabItem value="request">

```bash
/apply/company/expired/validate
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 3,
  "errors": [
    {
      "msg": "expired-token"
    }
  ]
}
```

</TabItem>
</Tabs>

### Example 4 - Application Already Validated

**Code** : <Highlight level="danger" inline>409 CONFLICT</Highlight>

<Tabs
defaultValue="request"
values={[
{label: 'Request', value: 'request'},
{label: 'Response', value: 'response'},
]}
>

<TabItem value="request">

```bash
/apply/company/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im5pQGFlZmV1cC5wdCIsImlhdCI6MTY2MzAxMzg0OSwiZXhwIjoxNjYzMDE0NDQ5fQ.k5Z_nBpqt_Hs8JBhLH0ZXTl2-BG-utdIAUdhKXEFuFc/validate
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 3,
  "errors": [
    {
      "msg": "application-already-validated"
    }
  ]
}
```

</TabItem>
</Tabs>
