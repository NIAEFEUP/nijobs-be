---
id: edit
title: Edit Company
sidebar_label: Edit Company
slug: /company/edit
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import Highlight from "../../src/highlight.js"

## Details

This endpoint is used to edit companies. Both Admins and Companies can use it. The company cannot be blocked or disabled.

**URL** : `/company/:companyId/edit`

**Method** : <Highlight level="info" inline>PUT</Highlight>

:::caution Authentication
Auth is required to edit a Company as a Company owner or Admin. Otherwise, if in god mode, [god_token](#god_token) must be
provided.
:::

## Parameters

### god_token

<Highlight level="info">Body Parameter</Highlight>

<Highlight level="success" inline>Optional</Highlight>
<Highlight level="secondary" inline>String</Highlight>

If set, will use this for validating the usage of god mode (in case no session details are available, i.e., no logged-in
user).

### name

<Highlight level="info" inline>Body Parameter</Highlight>
<Highlight level="success" inline>Optional</Highlight>
<Highlight level="secondary" inline>String</Highlight>
<br/>
<Highlight level="warning" inline>Min Length: 2</Highlight>
<Highlight level="warning" inline>Max Length: 50</Highlight>

Name of the company, to be displayed to all users.

### bio

<Highlight level="info" inline>Form Parameter</Highlight>
<Highlight level="success" inline>Optional</Highlight>
<br/>
<Highlight level="secondary" inline>String</Highlight>
<Highlight level="warning" inline>Max Length: 1500</Highlight>

Description of the company.

### contacts

<Highlight level="info" inline>Form Parameter</Highlight>
<Highlight level="success" inline>Optional</Highlight>
<br/>
<Highlight level="secondary" inline>Array</Highlight>
<Highlight level="warning" inline>Minimum: 1</Highlight>
<Highlight level="warning" inline>Maximum: 10</Highlight>

List of contacts of the company.

### logo

<Highlight level="info">Form Parameter</Highlight>

<Highlight level="success" inline>Optional</Highlight>
<Highlight level="secondary" inline>File</Highlight>

Logo to be displayed in the company's profile and offers.

:::caution File types
The only valid file types are: png, jpeg and jpg.
:::

## Request examples

### Example 1 - Valid Request (Logged-in as Company)

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
  "name": "New Company",
  "bio": "This is the rebranded company",
  "contacts": [
    "contact@company.com",
    "contact-me@company.com"
  ]
}
```

</TabItem>

<TabItem value="response">

```json
{
  "_id": "62601cb7cb39d3001b3664d9",
  // highlight-start
  "name": "New Company",
  "bio": "This is the rebranded company",
  "contacts": [
    "contact@company.com",
    "contact-me@company.com"
  ],
  // highlight-end
  "hasFinishedRegistration": true,
  "isBlocked": false,
  "isDisabled": false,
  "__v": 0,
  "logo": "https://res.cloudinary.com/coolimage.jpg"
}
```

</TabItem>
</Tabs>

### Example 2 - Blocked Company (Logged-in as Admin or Company owner)

**Code** : <Highlight level="danger" inline>403 FORBIDDEN</Highlight>

<Tabs
defaultValue="request"
values={[
{label: 'Request', value: 'request'},
{label: 'Response', value: 'response'},
]}
>

<TabItem value="request">

```bash
{
  "name": "New Company",
  "bio": "This is the rebranded company",
  "contacts": [
    "contact@company.com",
    "contact-me@company.com"
  ]
}
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 3,
  "errors": [
    {
      "msg": "company-blocked"
    }
  ]
}
```

</TabItem>
</Tabs>

### Example 3 - Disabled Company (Logged-in as Admin or Company owner)

**Code** : <Highlight level="danger" inline>403 FORBIDDEN</Highlight>

<Tabs
defaultValue="request"
values={[
{label: 'Request', value: 'request'},
{label: 'Response', value: 'response'},
]}
>

<TabItem value="request">

```bash
{
  "name": "New Company",
  "bio": "This is the rebranded company",
  "contacts": [
    "contact@company.com",
    "contact-me@company.com"
  ]
}
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 3,
  "errors": [
    {
      "msg": "company-disabled"
    }
  ]
}
```

</TabItem>
</Tabs>

### Example 4 - W/o Auth or No Permissions

**Code** : <Highlight level="danger" inline>403 FORBIDDEN</Highlight>

<Tabs
defaultValue="request"
values={[
{label: 'Request', value: 'request'},
{label: 'Response', value: 'response'},
]}
>

<TabItem value="request">

```bash
{
  "name": "New Company",
  "bio": "This is the rebranded company",
  "contacts": [
    "contact@company.com",
    "contact-me@company.com"
  ]
}
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 3,
  "errors": [
    {
      "msg": "insufficient-permissions-to-manage-company-settings"
    }
  ]
}
```

</TabItem>
</Tabs>
