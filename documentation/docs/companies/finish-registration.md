---
id: finish-registration
title: Finish Company Registration
sidebar_label: Finish Company Registration
slug: /company/finish-registration
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import Highlight from "../../src/highlight.js"

## Details

This endpoint finishes a previously created company application.

**URL** : `/company/application/finish`

**Method** : <Highlight level="info" inline>POST</Highlight>

:::caution Authentication
Auth as a Company is required to finish an Application.
:::

## Parameters (form data)

### bio

<Highlight level="info" inline>Form Parameter</Highlight>
<Highlight level="danger" inline>Required</Highlight>
<br/>
<Highlight level="secondary" inline>String</Highlight>
<Highlight level="warning" inline>Max Length: 1500</Highlight>

Description of the company.

### contacts

<Highlight level="info" inline>Form Parameter</Highlight>
<Highlight level="danger" inline>Required</Highlight>
<br/>
<Highlight level="secondary" inline>Array</Highlight>
<Highlight level="warning" inline>Minimum: 1</Highlight>
<Highlight level="warning" inline>Maximum: 10</Highlight>

List of contacts of the company.

### logo

<Highlight level="info">Form Parameter</Highlight>

<Highlight level="danger" inline>Required</Highlight>
<Highlight level="secondary" inline>File</Highlight>

Logo to be displayed in the company's profile and offers.

:::caution File types
The only valid file types are: png, jpeg and jpg.
:::

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

```
/company/application/finish

Form data
bio: We are a new and innovative contact hiring Software Engineers
contacts: contact@company.com
logo: logo.png
```

</TabItem>

<TabItem value="response">

```json
{}
```

</TabItem>
</Tabs>

### Example 2 - Logged-In as Admin

**Code** : <Highlight level="danger" inline>401 UNAUTHORIZED</Highlight>

<Tabs
defaultValue="request"
values={[
{label: 'Request', value: 'request'},
{label: 'Response', value: 'response'},
]}
>

<TabItem value="request">

```
/company/application/finish

Form data
bio: We are a new and innovative contact hiring Software Engineers
contacts: contact@company.com
logo: logo.png
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 3,
    "errors": [
    {
      "msg": "must-be-company"
    }
  ]
}
```

</TabItem>
</Tabs>

### Example 3 - Registration Already Finished

**Code** : <Highlight level="danger" inline>403 FORBIDDEN</Highlight>

<Tabs
defaultValue="request"
values={[
{label: 'Request', value: 'request'},
{label: 'Response', value: 'response'},
]}
>

<TabItem value="request">

```
/company/application/finish

Form data
bio: We are a new and innovative contact hiring Software Engineers
contacts: contact@company.com
logo: logo.png
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 3,
  "errors": [
    {
      "msg": "registration-already-finished"
    }
  ]
}
```

</TabItem>
</Tabs>

### Example 4 - Invalid logo file

**Code** : <Highlight level="danger" inline>422 UNPROCESSABLE ENTITY</Highlight>

<Tabs
defaultValue="request"
values={[
{label: 'Request', value: 'request'},
{label: 'Response', value: 'response'},
]}
>

<TabItem value="request">

```
/company/application/finish

Form data
bio: We are a new and innovative contact hiring Software Engineers
contacts: contact@company.com
logo: invalid.txt
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 1,
  "errors": [
    {
      "location": "body",
      "param": "logo",
      "msg": "formats-supported-png-jpeg-jpg"
    }
  ]
}
```

</TabItem>
</Tabs>

### Example 5 - Error when saving logo file

**Code** : <Highlight level="danger" inline>422 UNPROCESSABLE ENTITY</Highlight>

<Tabs
defaultValue="request"
values={[
{label: 'Request', value: 'request'},
{label: 'Response', value: 'response'},
]}
>

<TabItem value="request">

```
/company/application/finish

Form data
bio: We are a new and innovative contact hiring Software Engineers
contacts: contact@company.com
logo: logo.png
```

</TabItem>

<TabItem value="response">

```json
{
  "error_code": 2,
  "errors": [
    {
      "location": "body",
      "param": "logo",
      "msg": "failed-save"
    }
  ]
}
```

</TabItem>
</Tabs>

