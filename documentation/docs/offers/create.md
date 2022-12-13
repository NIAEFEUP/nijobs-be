---
id: create
title: Create Offer
sidebar_label: Create Offer
slug: /offers/create
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import Highlight from "../../src/highlight.js"

## Details

This endpoint is used to create offers. Both Admins and Companies can use it.

:::info
If the logged-in user is a Company, that account will be the Offer owner. Otherwise, the creation will be done in
admin/god mode, which requires permissions.
:::

**URL** : `/offers/new`

**Method** : <Highlight level="info" inline>POST</Highlight>

:::caution Authentication
Auth is required to create an Offer as a Company. Otherwise, [owner](#owner-body-parameter) and (if in god
mode) [god_token](#god_token-body-parameter) must be provided.
:::

:::caution Concurrent Offers
The time when the offer is published must not make the respective company exceed the maximum number of concurrent active
offers.
:::

## Parameters

### god_token

<Highlight level="info">Body Parameter</Highlight>

<Highlight level="success" inline>Optional</Highlight>
<Highlight level="secondary" inline>String</Highlight>

If set, will use this for validating the usage of god mode (in case no session details are available, i.e., no logged-in
user).

### owner

<Highlight level="info">Body Parameter</Highlight>

<Highlight level="success" inline>Optional</Highlight>
<Highlight level="secondary" inline>String (MongoDB ObjectId)</Highlight>

If the logged-in user is a company, this is not required.

Otherwise, it specifies the company to link this offer to.

### title

<Highlight level="info" inline>Body Parameter</Highlight>
<Highlight level="danger" inline>Required</Highlight>
<br/>
<Highlight level="secondary" inline>String</Highlight>
<Highlight level="warning" inline>Max Length: 90</Highlight>

The title of the offer, used in search.

### publishDate

<Highlight level="info" inline>Body Parameter</Highlight>
<Highlight level="success" inline>Optional</Highlight>
<br/>
<Highlight level="warning" inline>Default: Now</Highlight>
<Highlight level="secondary" inline>Date (ISO8601 String)</Highlight>

The date when the offer will be made public (published).

### publishEndDate

<Highlight level="info" inline>Body Parameter</Highlight>
<Highlight level="danger" inline>Required</Highlight>

<Highlight level="secondary">Date (ISO8601 String)</Highlight>

The date when the offer will be "hidden" from the application (will be invisible to search).

* Must be after `now`.
* Must be after the [publishDate](#publishDate-body-parameter), if present.
* Must not exceed 6 months after [publishDate](#publishDate-body-parameter).

### jobMinDuration

<Highlight level="info">Body Parameter</Highlight>

<Highlight level="success" inline>Optional</Highlight>
<Highlight level="secondary" inline>Number</Highlight>

The duration of the work itself (in months).

* Must be an Integer (positive).
* Is Required if [jobMaxDuration](#jobMaxDuration-body-parameter) is set.

### jobMaxDuration

<Highlight level="info">Body Parameter</Highlight>

<Highlight level="success" inline>Optional</Highlight>
<Highlight level="secondary" inline>Number</Highlight>

The duration of the work itself (in months).

* Must be an Integer (positive).

### jobStartDate

<Highlight level="info">Body Parameter</Highlight>

<Highlight level="success" inline>Optional</Highlight>
<Highlight level="secondary" inline>Date (ISO8601 String)</Highlight>

The date when the job is expected to begin.

### description

<Highlight level="info" inline>Body Parameter</Highlight>
<Highlight level="danger" inline>Required</Highlight>
<br/>
<Highlight level="secondary" inline>String</Highlight>
<Highlight level="warning" inline>Max Length: 1500</Highlight>

The offer description. Text that is shown when users request info about a specific offer.

### contacts

<Highlight level="info" inline>Body Parameter</Highlight>
<Highlight level="danger" inline>Required</Highlight>
<br/>
<Highlight level="secondary" inline>Array</Highlight>
<Highlight level="warning" inline>Minimum: 1</Highlight>

List of contacts regarding offer information.

### isPaid

<Highlight level="info">Body Parameter</Highlight>

<Highlight level="success" inline>Optional</Highlight>
<Highlight level="secondary" inline>Boolean</Highlight>

Informs if the offer has paid compensation.

### vacancies

<Highlight level="info" inline>Body Parameter</Highlight>
<Highlight level="success" inline>Optional</Highlight>
<br/>
<Highlight level="secondary" inline>Number</Highlight>
<Highlight level="warning" inline>Minimum: 0</Highlight>

Number of vacancies available.

* Must be an Integer (positive)

### jobType

<Highlight level="info">Body Parameter</Highlight>

<Highlight level="danger" inline>Required</Highlight>
<Highlight level="secondary" inline>String</Highlight>

Type of the offer.

:::caution
Must be a valid Job Type (
currently `["FULL-TIME", "PART-TIME", "SUMMER INTERNSHIP", "CURRICULAR INTERNSHIP", "RESEARCH GRANT", "OTHER"]`).
:::

### fields

<Highlight level="info" inline>Body Parameter</Highlight>
<Highlight level="success" inline>Optional</Highlight>
<br/>
<Highlight level="secondary" inline>Array</Highlight>
<Highlight level="warning" inline>Minimum: 1</Highlight>
<Highlight level="warning" inline>Maximum: 5</Highlight>

Specifies the fields (areas) the offer corresponds to.

:::caution
Must be a valid Field Type (
see [list](https://github.com/NIAEFEUP/nijobs-be/blob/develop/src/models/constants/FieldTypes.js)).
:::

### technologies

<Highlight level="info" inline>Body Parameter</Highlight>
<Highlight level="success" inline>Optional</Highlight>
<br/>
<Highlight level="secondary" inline>Array</Highlight>
<Highlight level="warning" inline>Minimum: 1</Highlight>
<Highlight level="warning" inline>Maximum: 7</Highlight>

Specifies the technologies the offer is looking for.

:::caution
Must be a valid Technology Type (
see [list](https://github.com/NIAEFEUP/nijobs-be/blob/develop/src/models/constants/TechnologyTypes.js)).
:::

### isHidden

<Highlight level="info" inline>Body Parameter</Highlight>
<Highlight level="success" inline>Optional</Highlight>
<br/>
<Highlight level="warning" inline>Default: false</Highlight>
<Highlight level="secondary" inline>Boolean</Highlight>

If true, the offer will not show up in search by default. However, the owner and admins can still see it, by activating
the `showHidden` flag when searching.

### location

<Highlight level="info">Body Parameter</Highlight>

<Highlight level="danger" inline>Required</Highlight>
<Highlight level="secondary" inline>String</Highlight>

Where the work will be done (usually in `City, Country` format).

### coordinates

<Highlight level="info">Body Parameter</Highlight>

<Highlight level="success" inline>Optional</Highlight>
<Highlight level="secondary" inline>String</Highlight>

The coordinates of the workplace, so that a map can be shown in the UI.

### requirements

<Highlight level="info" inline>Body Parameter</Highlight>
<Highlight level="success" inline>Optional</Highlight>
<br/>
<Highlight level="secondary" inline>Array</Highlight>
<Highlight level="warning" inline>Minimum: 1</Highlight>

An array of strings containing job requirements in list form. Useful to list them in a more straightforward way.

### applyURL

<Highlight level="info">Body Parameter</Highlight>

<Highlight level="success" inline>Optional</Highlight>
<Highlight level="secondary" inline>String</Highlight>

URL that users can use to apply to the offer. Must use http, https or mailto protocol.

Must respect the following regex: `https?://S+.\S+`

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
  "contacts": [
    "contact@company.com"
  ],
  "location": "Porto, Portugal",
  "jobStartDate": "2022-06",
  "jobMinDuration": "2",
  "jobMaxDuration": "4",
  "publishEndDate": "2022-02-20T00:00:00+01:00",
  "title": "Software fixer",
  "description": "A nice description for this offer",
  "jobType": "SUMMER INTERNSHIP",
  "fields": [
    "DEVOPS",
    "MACHINE LEARNING"
  ],
  "technologies": [
    "Java",
    "C#"
  ],
  "requirements": [
    "A good hammer"
  ],
  "applyURL": "https://company.com/apply"
}
```

</TabItem>

<TabItem value="response">

```json
{
  "contacts": [
    "contact@company.com"
  ],
  "fields": [
    "DEVOPS",
    "MACHINE LEARNING"
  ],
  "technologies": [
    "Java",
    "C#"
  ],
  "isHidden": false,
  "_id": "600eb922c6fd54ac97a9b18c",
  "title": "Software fixer",
  "publishDate": "2022-01-25T12:27:14.112Z",
  "publishEndDate": "2022-02-19T23:00:00.000Z",
  "jobMinDuration": 2,
  "jobMaxDuration": 4,
  "jobStartDate": "2022-06-01T00:00:00.000Z",
  "jobType": "SUMMER INTERNSHIP",
  "description": "A nice description for this offer",
  "owner": "5ff38a150188759f34e69723",
  // This is automatically inferred from the logged-in account
  "ownerName": "Company Ltd.",
  // This is automatically inferred from the logged-in account
  "location": "Porto, Portugal",
  "applyURL": "https://company.com/apply",
  "requirements": [
    "A good hammer"
  ],
  "__v": 0
}
```

</TabItem>
</Tabs>

### Example 2 - Publish Date in the Past

**Condition** : If `publishDate` is in the past.

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
  "contacts": [
    "contact@company.com"
  ],
  "location": "Porto, Portugal",
  "jobStartDate": "2022-06",
  "jobMinDuration": "2",
  "jobMaxDuration": "4",
  "publishDate": "2022-02-20T00:00:00+01:00",
  "publishEndDate": "2022-08-19T00:00:00+01:00",
  "title": "Software fixer",
  "description": "A nice description for this offer",
  "jobType": "SUMMER INTERNSHIP",
  "fields": [
    "DEVOPS",
    "MACHINE LEARNING"
  ],
  "technologies": [
    "Java",
    "C#"
  ],
  "requirements": [
    "A good hammer"
  ],
  "applyURL": "https://company.com/apply"
}
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 1,
  "errors": [
    {
      "value": "2022-02-20T00:00:00+01:00",
      "msg": "date-already-past",
      "param": "publishDate",
      "location": "body"
    }
  ]
}
```

</TabItem>
</Tabs>

### Example 3 - Publish time over 6 month limit

**Condition** : If `publishEndDate` is more than 6 months after `publishDate`.

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
  "contacts": [
    "contact@company.com"
  ],
  "location": "Porto, Portugal",
  "jobStartDate": "2022-06",
  "jobMinDuration": "2",
  "jobMaxDuration": "4",
  "publishDate": "2022-05-20T00:00:00+01:00",
  "publishEndDate": "2022-12-20T00:00:00+01:00",
  "title": "Software fixer",
  "description": "A nice description for this offer",
  "jobType": "SUMMER INTERNSHIP",
  "fields": [
    "DEVOPS",
    "MACHINE LEARNING"
  ],
  "technologies": [
    "Java",
    "C#"
  ],
  "requirements": [
    "A good hammer"
  ],
  "applyURL": "https://company.com/apply"
}
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 1,
  "errors": [
    {
      "value": "2022-12-20T00:00:00+01:00",
      "msg": "must-be-before:2022-11-18T11:28:48.000Z",
      "param": "publishEndDate",
      "location": "body"
    }
  ]
}
```

</TabItem>
</Tabs>

### Example 4 - Maximum number of concurrent offers exceeded

**Condition** : If the owner has more than 5 offers active (published and non-hidden) at a same point in time.

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
  "contacts": [
    "contact@company.com"
  ],
  "location": "Porto, Portugal",
  "jobStartDate": "2022-06",
  "jobMinDuration": "2",
  "jobMaxDuration": "4",
  "publishDate": "2022-08-20T00:00:00+01:00",
  "publishEndDate": "2022-12-20T00:00:00+01:00",
  "title": "Software fixer",
  "description": "A nice description for this offer",
  "jobType": "SUMMER INTERNSHIP",
  "fields": [
    "DEVOPS",
    "MACHINE LEARNING"
  ],
  "technologies": [
    "Java",
    "C#"
  ],
  "requirements": [
    "A good hammer"
  ],
  "applyURL": "https://company.com/apply"
}
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 1,
  "errors": [
    {
      "msg": "max-concurrent-offers-reached:5"
    }
  ]
}
```

</TabItem>
</Tabs>

### Example 5 - Disabled company (Logged-in as Admin)

**Condition** : If the owner is disabled.

**Code** : <Highlight level="danger" inline>403 FORBIDDEN</Highlight>

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
  "contacts": [
    "contact@company.com"
  ],
  "location": "Porto, Portugal",
  "jobStartDate": "2022-06",
  "jobMinDuration": "2",
  "jobMaxDuration": "4",
  "publishDate": "2022-08-20T00:00:00+01:00",
  "publishEndDate": "2022-12-20T00:00:00+01:00",
  "title": "Software fixer",
  "description": "A nice description for this offer",
  "jobType": "SUMMER INTERNSHIP",
  "fields": [
    "DEVOPS",
    "MACHINE LEARNING"
  ],
  "technologies": [
    "Java",
    "C#"
  ],
  "requirements": [
    "A good hammer"
  ],
  "applyURL": "https://company.com/apply",
  "owner": "62601cb7cb39d3001b3664d9"
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

### Example 6 - Offer blocked (With god token)

**Condition** : If the offer has been blocked by an Admin.

**Code** : <Highlight level="danger" inline>403 FORBIDDEN</Highlight>

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
  "publishEndDate": "2021-12-20T00:00:00+01:00",
  "god_token": "token",
  "owner": "62601cb7cb39d3001b3664d9"
}
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 3,
  "errors": [
    {
      "msg": "offer-blocked-by-admin"
    }
  ]
}
```

</TabItem>
</Tabs>
