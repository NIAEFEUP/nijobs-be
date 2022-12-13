---
id: reject
title: Reject Application
sidebar_label: Reject Application
slug: /applications/reject
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import Highlight from "../../src/highlight.js"

## Details

This endpoint is used to reject a company Application, specified by applicationId.

**URL** : `/applications/company/:applicationId/reject`

**Method** : <Highlight level="info" inline>POST</Highlight>

:::caution Authentication
Auth is required an Admin to reject applications.
:::

## Parameters

### rejectReason

<Highlight level="info" inline>Body Parameter</Highlight>
<Highlight level="danger" inline>Required</Highlight>
<Highlight level="secondary" inline>String</Highlight>
<br/>
<Highlight level="warning" inline>Min Length: 10</Highlight>
<Highlight level="warning" inline>Max Length: 1500</Highlight>

Reason for the application to be rejected. Only meant to be used internally between admins.

## Response

<Highlight level="secondary" inline>Object</Highlight>

Information about the application just rejected.

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
 "rejectReason": "The motivation of the company is not convincing" 
}
```

</TabItem>

<TabItem value="response">

```json
{
  "_id": "631a18cf8e61e0acea76e5e1",
  "email": "company@company.com",
  "companyName": "Company Name",
  "motivation": "We wish to revolutionize the industry with young engineers.",
  "submittedAt": "2022-09-08T16:31:11.784Z",
  "__v": 0,
  // highlight-start
  "rejectedAt": "2022-09-09T15:59:04.996Z",
  "rejectReason": "The motivation of the company is not convincing",
  "state": "REJECTED"
  // highlight-end
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

```json
{
 "rejectReason": "The motivation of the company is not convincing" 
}
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
/applications/company/631a18cf8e61e0acea76e5e1/reject
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

```json
{
 "rejectReason": "The motivation of the company is not convincing" 
}
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
