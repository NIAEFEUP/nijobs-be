---
id: search
title: Search Applications
sidebar_label: Search Applications
slug: /applications/search
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import Highlight from "../../src/highlight.js"

## Details

This endpoint is used to search company Applications. It supports pagination and different search filters.

**URL** : `/applications/company/search`

**Method** : <Highlight level="info" inline>GET</Highlight>

:::caution Authentication
Auth is required an Admin to search applications.
:::

## Parameters

### limit

<Highlight level="info" inline>Query Parameter</Highlight>
<Highlight level="success" inline>Optional</Highlight>
<Highlight level="secondary" inline>Number</Highlight>
<br/>
<Highlight level="warning" inline>Default: 100</Highlight>
<Highlight level="warning" inline>Minimum: 1</Highlight>
<Highlight level="warning" inline>Maximum: 100</Highlight>

Limits the number of applications returned.

### offset

<Highlight level="info" inline>Query Parameter</Highlight>
<Highlight level="success" inline>Optional</Highlight>
<Highlight level="secondary" inline>Number</Highlight>
<br/>
<Highlight level="warning" inline>Default: 0</Highlight>
<Highlight level="warning" inline>Minimum: 0</Highlight>

Number of applications to skip.

### companyName

<Highlight level="info">Query Parameter</Highlight>

<Highlight level="success" inline>Optional</Highlight>
<Highlight level="secondary" inline>String</Highlight>

Filters the applications by the name of the respective companies.

### state

<Highlight level="info">Query Parameter</Highlight>

<Highlight level="success" inline>Optional</Highlight>
<Highlight level="secondary" inline>Array</Highlight>

Array of strings which filters the application by their state.

:::caution
Must be a valid state (currently `["UNVERIFIED", "PENDING", "APPROVED", "REJECTED"]`).
:::

### submissionDateFrom

<Highlight level="info">Query Parameter</Highlight>

<Highlight level="success" inline>Optional</Highlight>
<Highlight level="secondary" inline>Date (ISO8601 String)</Highlight>

Filters the applications by their submission date, by removing the ones before the specified date.

### submissionDateTo

<Highlight level="info">Query Parameter</Highlight>

<Highlight level="success" inline>Optional</Highlight>
<Highlight level="secondary" inline>Date (ISO8601 String)</Highlight>

Filters the applications by their submission date, by removing the ones after the specified date.

### sortBy

<Highlight level="info">Query Parameter</Highlight>

<Highlight level="success" inline>Optional</Highlight>
<Highlight level="secondary" inline>String</Highlight>

String describing how the applications should be sorted.
The default is to sort by `submittedAt` descending.

:::caution
It must follow the following format: `field:(desc|asc)?[,field:(desc|asc)?]*`

Each field must be one of `["email", "password", "companyName", "motivation", "submittedAt", "approvedAt"
, "rejectedAt", "rejectReason"]`
:::

## Response

### applications

<Highlight level="info" inline>Response Field</Highlight>
<Highlight level="secondary" inline>Array</Highlight>

Array of objects containing the applications found by the search.

### docCount

<Highlight level="info" inline>Response Field</Highlight>
<Highlight level="secondary" inline>Number</Highlight>

Number of results found by the search.

## Request examples

### Example 1 - No filters (Logged-in as Admin)

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
/applications/company/search
```

</TabItem>

<TabItem value="response">

```json
{
  "applications": [
    {
      "_id": "631a18cf8e61e0acea76e5e1",
      "email": "company@company.com",
      "companyName": "Company name",
      "motivation": "We wish to revolutionize the industry with young engineers.",
      "submittedAt": "2022-09-08T16:31:11.784Z",
      "isVerified": true,
      "__v": 0,
      "state": "PENDING"
    },
    {
      "_id": "63189963541e53a45a423dce",
      "email": "example@company.com",
      "companyName": "Example Company",
      "motivation": "We are a brand new tech company in Porto, Portugal",
      "submittedAt": "2022-09-07T13:15:15.971Z",
      "isVerified": true,
      "__v": 0,
      "approvedAt": "2022-09-07T13:17:30.908Z",
      "state": "APPROVED"
    },
    {
      "_id": "63189963541e53a45a423dce",
      "email": "bad@company.com",
      "companyName": "Bad Company",
      "motivation": "We want to exploit workers.",
      "submittedAt": "2022-09-07T13:15:15.971Z",
      "isVerified": true,
      "__v": 0,
      "rejectedAt": "2022-09-07T13:17:30.908Z",
      "rejectReason": "Motivation doesn't seem right",
      "state": "REJECTED"
    },
    {
      "_id": "63189963541e53a45a423dce",
      "email": "notVerified@company.com",
      "companyName": "Unverified",
      "motivation": "We are a new company in Lisbon",
      "submittedAt": "2022-09-07T13:15:15.971Z",
      "isVerified": false,
      "__v": 0,
      "state": "UNVERIFIED"
    }
  ],
  "docCount": 4
}
```

</TabItem>
</Tabs>

### Example 2 - With Filters (Logged-in as Admin)

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
/applications/company/search?state=PENDING&state=APPROVED&sortBy=companyName
```

</TabItem>

<TabItem value="response">

```json
{
  "applications": [
    {
      "_id": "63189963541e53a45a423dce",
      "email": "example@company.com",
      "companyName": "Example Company",
      "motivation": "We are a brand new tech company in Porto, Portugal",
      "submittedAt": "2022-09-07T13:15:15.971Z",
      "__v": 0,
      "approvedAt": "2022-09-07T13:17:30.908Z",
      "state": "APPROVED"
    },
    {
      "_id": "631a18cf8e61e0acea76e5e1",
      "email": "company@company.com",
      "companyName": "Company name",
      "motivation": "We wish to revolutionize the industry with young engineers.",
      "submittedAt": "2022-09-08T16:31:11.784Z",
      "__v": 0,
      "state": "PENDING"
    }
  ],
  "docCount": 2
}
```

</TabItem>
</Tabs>

### Example 3 - Logged-in as Company

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
/applications/company/search
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

### Example 4 - Invalid State

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
/applications/company/search?state=INVALID
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 1,
  "errors": [
    {
      "value": [
        "INVALID"
      ],
      "msg": "must-be-in:[PENDING,APPROVED,REJECTED]",
      "param": "state",
      "location": "query"
    }
  ]
}
```

</TabItem>
</Tabs>

### Example 5 - Invalid SortBy field

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
/applications/company/search?sortBy=field
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 1,
  "errors": [
    {
      "value": "field",
      "msg": "field:must-be-in:[email,password,companyName,motivation,submittedAt,approvedAt,rejectedAt,rejectReason]",
      "param": "sortBy",
      "location": "query"
    }
  ]
}
```

</TabItem>
</Tabs>

### Example 6 - Invalid SortBy Format

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
/applications/company/search?sortBy=companyName:invalid
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 1,
  "errors": [
    {
      "value": "companyName:invalid",
      "msg": "must-be-format-field:(desc|asc)?[,field:(desc|asc)?]*",
      "param": "sortBy",
      "location": "query"
    }
  ]
}
```

</TabItem>
</Tabs>
