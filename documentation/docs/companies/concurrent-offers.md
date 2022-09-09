---
id: concurrent-offers
title: Check Concurrent Offers
sidebar_label: Check Concurrent Offers
slug: concurrent-offers
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import Highlight from "../../src/highlight.js"

## Details

This endpoint verifies if the company specified by companyId has reached the maximum of concurrent offers between two dates

**URL** : `/company/:companyId/hasReachedMaxConcurrentOffersBetweenDates`

**Method** : <Highlight level="info" inline>GET</Highlight>

:::caution Authentication
Auth is required to check concurrent offers as the Company or Admin. Otherwise, if in god mode, 
[god_token](#god_token) must be provided.
:::

## Parameters

### god_token

<Highlight level="info">Body Parameter</Highlight>

<Highlight level="success" inline>Optional</Highlight>
<Highlight level="secondary" inline>String</Highlight>

If set, will use this for validating the usage of god mode (in case no session details are available, i.e., no logged-in
user).

### publishDate

<Highlight level="info" inline>Body Parameter</Highlight>
<Highlight level="success" inline>Optional</Highlight>
<br/>
<Highlight level="warning" inline>Default: Now</Highlight>
<Highlight level="secondary" inline>Date (ISO8601 String)</Highlight>

The start date to consider when calculating the maximum concurrent offers.

### publishEndDate

<Highlight level="info" inline>Body Parameter</Highlight>
<Highlight level="success" inline>Optional</Highlight>
<br/>
<Highlight level="warning" inline>Default: 6 months after publishDate</Highlight>
<Highlight level="secondary" inline>Date (ISO8601 String)</Highlight>

The end date to consider when calculating the maximum concurrent offers. Must be after [publishDate](#publishdate).

## Response

### maxOffersReached

<Highlight level="info" inline>Response Field</Highlight>
<Highlight level="secondary" inline>Boolean</Highlight>

Informs if the company has reached the maximum amount of concurrent offers between the specified dates.

## Request examples

### Example 1 - Valid Request (max concurrent offers reached)

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
  "publishDate": "2022-01-20T00:00:00+01:00",
  "publishEndDate": "2022-02-20T00:00:00+01:00"
}
```

</TabItem>

<TabItem value="response">

```json
{
  "maxOffersReached": false
}
```

</TabItem>
</Tabs>

### Example 2 - Valid Request (max concurrent offers not reached)

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
  "publishDate": "2022-01-20T00:00:00+01:00"
}
```

</TabItem>

<TabItem value="response">

```json
{
  "maxOffersReached": true
}
```

</TabItem>
</Tabs>

### Example 3 - Non-Existing Company

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
/company/431859ea531e53a45a443de0/hasReachedMaxConcurrentOffersBetweenDates
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 1,
  "errors": [
    {
      "value": "62601cb7cb39d3001b3664d9",
      "msg": "no-company-found-with-id:62601cb7cb39d3001b3664d9",
      "param": "companyId",
      "location": "params"
    }
  ]
}
```

</TabItem>
</Tabs>

### Example 4 - Logged-in as a Different Company

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
/company/62601cb7cb39d3001b3664d9/hasReachedMaxConcurrentOffersBetweenDates
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

### Example 5 - publishEndDate before publishDate

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
  "publishDate": "2022-02-20T00:00:00+01:00",
  "publishEndDate": "2022-01-20T00:00:00+01:00"
}
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 1,
  "errors": [
    {
      "value": "2022-01-19T23:00:00.000Z",
      "msg": "must-be-after:publishDate",
      "param": "publishEndDate",
      "location": "body"
    }
  ]
}
```

</TabItem>
</Tabs>
