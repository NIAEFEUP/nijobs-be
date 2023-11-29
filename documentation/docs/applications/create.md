---
id: create
title: Create Application
sidebar_label: Create Application
slug: /applications/create
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import Highlight from "../../src/highlight.js"

## Details

This endpoint is used to create company applications.
In order of a Company to use its account, the application must be accepted by an Admin and then the Company should
finish its registration.

**URL** : `/apply/company`

**Method** : <Highlight level="info" inline>POST</Highlight>

:::caution
This is the flow intended for Companies to create accounts. If you're looking to create an Admin's account,
see [register](../auth/register).
:::

## Parameters

### email

<Highlight level="info">Body Parameter</Highlight>
<Highlight level="danger" inline>Required</Highlight>
<Highlight level="secondary" inline>String</Highlight>

Email used for the company application and subsequent account.

Must be in a valid email format.
Can't already be in use for accounts or other applications.

### password

<Highlight level="info" inline>Body Parameter</Highlight>
<Highlight level="danger" inline>Required</Highlight>
<br/>
<Highlight level="secondary" inline>String</Highlight>
<Highlight level="warning" inline>Min Length: 8</Highlight>

Password used for the company's account after the application is accepted.

Must contain at least one number.

### motivation

<Highlight level="info" inline>Body Parameter</Highlight>
<Highlight level="danger" inline>Required</Highlight>
<Highlight level="secondary" inline>String</Highlight>
<br/>
<Highlight level="warning" inline>Min Length: 10</Highlight>
<Highlight level="warning" inline>Max Length: 1500</Highlight>

Motivation for the company to apply to the system. Used by admins when deciding whether the application should be accepted or not.

### companyName

<Highlight level="info" inline>Body Parameter</Highlight>
<Highlight level="danger" inline>Required</Highlight>
<Highlight level="secondary" inline>String</Highlight>
<br/>
<Highlight level="warning" inline>Min Length: 2</Highlight>
<Highlight level="warning" inline>Max Length: 50</Highlight>

Name of the company, to be displayed to all users.

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

```json
{
  "email": "company@company.com",
  "password": "password123",
  "companyName": "Company",
  "motivation": "We wish to revolutionize the industry with young engineers."
}
```

</TabItem>

<TabItem value="response">

```json
{
  "email": "company@company.com",
  "companyName": "Company",
  "motivation": "We wish to revolutionize the industry with young engineers.",
  "submittedAt": "2022-09-08T16:00:36.934Z",
  "_id": "631a11a48e61e0acea76e5d8",
  "__v": 0,
  "state": "PENDING",
  "id": "631a11a48e61e0acea76e5d8"
}
```

</TabItem>
</Tabs>

### Example 2 - Invalid Email

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
  "email": "not_an_email",
  "password": "password123",
  "companyName": "Company",
  "motivation": "We wish to revolutionize the industry with young engineers."
}
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 1,
  "errors": [
    {
      "value": "not_an_email",
      "msg": "must-be-a-valid-email",
      "param": "email",
      "location": "body"
    }
  ]
}
```

</TabItem>
</Tabs>

### Example 3 - Account With Email Exists

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
  "email": "company@company.com",
  "password": "password123",
  "companyName": "Company",
  "motivation": "We wish to revolutionize the industry with young engineers."
}
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 1,
  "errors": [
    {
      "value": "company@company.com",
      "msg": "email-already-exists",
      "param": "email",
      "location": "body"
    }
  ]
}
```

</TabItem>
</Tabs>

### Example 4 - Duplicate Application

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
  "email": "company@company.com",
  "password": "password123",
  "companyName": "Company",
  "motivation": "We wish to revolutionize the industry with young engineers."
}
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 1,
  "errors": [
    {
      "value": "company@company.com",
      "msg": "company-application-duplicate-email",
      "param": "email",
      "location": "body"
    }
  ]
}
```

</TabItem>
</Tabs>

### Example 5 - Invalid Password

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
  "email": "company@company.com",
  "password": "password",
  "companyName": "Company",
  "motivation": "We wish to revolutionize the industry with young engineers."
}
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 1,
  "errors": [
    {
      "value": "password",
      "msg": "must-contain-number",
      "param": "password",
      "location": "body"
    }
  ]
}
```

</TabItem>
</Tabs>
