---
id: approve
title: Approve Application
sidebar_label: Approve Application
slug: /applications/approve
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import Highlight from "../../src/highlight.js"

## Details

This endpoint is used to approve a company Application, specified by applicationId.

**URL** : `/applications/company/:applicationId/approve`

**Method** : <Highlight level="info" inline>POST</Highlight>

:::caution Authentication
Auth is required an Admin to approve applications.
:::

## Response

<Highlight level="secondary" inline>Object</Highlight>

Information about the account created for the approved company.

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
/applications/company/631a18cf8e61e0acea76e5e1/approve
```

</TabItem>

<TabItem value="response">

```json
{
  "email": "company@company.com",
  "companyName": "Company name"
}
```

</TabItem>
</Tabs>

### Example 2 - Logged-in as Company

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
/applications/company/631a18cf8e61e0acea76e5e1/approve
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 3,
  "errors": [
    {
      "msg": "must-be-admin"
    }
  ]
}
```

</TabItem>
</Tabs>

### Example 3 - Non-Existing Application

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
/applications/company/631a18cf8e61e0acea76e5e1/approve
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 1,
  "errors": [
    {
      "msg": "company-application-does-not-exist"
    }
  ]
}
```

</TabItem>
</Tabs>

### Example 4 - Application Already Reviewed

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
/applications/company/631a18cf8e61e0acea76e5e1/approve
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 1,
  "errors": [
    {
      "msg": "company-application-already-reviewed"
    }
  ]
}
```

</TabItem>
</Tabs>
