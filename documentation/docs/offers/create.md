---
id: create
title: Create Offers
sidebar_label: Create Offers
slug: /offers/create
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import  "./search.module.css";

import Highlight from "../../src/highlight.js"

## Details 

This endpoint is used to create offers. Both Admins and Companies will use it.

:::info
If the logged in user is a Company, that account will be the Offer owner. Otherwise, the creation will be done in admin/god mode, which requires permissions.
:::

**URL** : `/offer/new`

**Method** : <Highlight level="info" inline>POST</Highlight>

:::caution Authentication
Auth is required to create an Offer as a Company. Otherwise, [owner](#owner-body-parameter) and (if in god mode) [god_token](#god_token-body-parameter) must be provided.
:::

## Parameters 

### god_token <Highlight level="info" inline>Body Parameter</Highlight>

<Highlight level="success">Optional</Highlight>

<Highlight level="secondary">String</Highlight>

If set, will use this for validating the usage of god mode (in case no session details are available, i.e., no logged-in user)

### owner <Highlight level="info" inline>Body Parameter</Highlight>

<Highlight level="success">Optional</Highlight>

<Highlight level="secondary">String (MongoDB ObjectId)</Highlight>

If the logged-in user is a company, this is not required.

Otherwise, it specifies the company to link this offer to.

### title <Highlight level="info" inline>Body Parameter</Highlight>

<Highlight level="danger">Required</Highlight>

<Highlight level="secondary" inline>String</Highlight>
<Highlight level="warning" inline>Max Length: 90</Highlight>

The title of the offer, used in search.

### publishDate <Highlight level="info" inline>Body Parameter</Highlight>

<Highlight level="success" inline>Optional</Highlight>
<Highlight level="warning" inline>Default: Now</Highlight>

<Highlight level="secondary">Date (ISO8601 String)</Highlight>

The date when the offer will be made public (published).

### publishEndDate <Highlight level="info" inline>Body Parameter</Highlight>

<Highlight level="danger">Required</Highlight>

<Highlight level="secondary">Date (ISO8601 String)</Highlight>

The date when the offer will be "hidden" from the application (will be invisible to search).

* Must be after `now`.
* Must be after the [publishDate](#publishDate-body-parameter), if present.

### jobMinDuration <Highlight level="info" inline>Body Parameter</Highlight>

<Highlight level="success">Optional</Highlight>

<Highlight level="secondary">Number</Highlight>

The duration of the work itself (in months)

* Must be an Integer (positive).
* Is Required if [jobMaxDuration](#jobMaxDuration-body-parameter) is set.

### jobMaxDuration <Highlight level="info" inline>Body Parameter</Highlight>

<Highlight level="success">Optional</Highlight>

<Highlight level="secondary">Number</Highlight>

The duration of the work itself (in months)

* Must be an Integer (positive).

### jobStartDate <Highlight level="info" inline>Body Parameter</Highlight>

<Highlight level="success">Optional</Highlight>

<Highlight level="secondary">Date (ISO8601 String)</Highlight>

The date when the work is expected to begin.

### description <Highlight level="info" inline>Body Parameter</Highlight>

<Highlight level="danger">Required</Highlight>

<Highlight level="secondary" inline>String</Highlight>
<Highlight level="warning" inline>Max Length: 1500</Highlight>

The offer description. Text that is shown when users request info about a specific offer.

### contacts <Highlight level="info" inline>Body Parameter</Highlight>

<Highlight level="danger">Required</Highlight>

<Highlight level="secondary" inline>Array</Highlight>
<Highlight level="warning" inline>Minimum: 1</Highlight>

List of contacts regarding offer information.

### isPaid <Highlight level="info" inline>Body Parameter</Highlight>

<Highlight level="success">Optional</Highlight>

<Highlight level="secondary">Boolean</Highlight>

Does the offer imply compensation?

### vacancies <Highlight level="info" inline>Body Parameter</Highlight>

<Highlight level="success">Optional</Highlight>

<Highlight level="secondary">Number</Highlight>

Number of vacancies available.

* Must be an Integer (positive)

### jobType <Highlight level="info" inline>Body Parameter</Highlight>

<Highlight level="danger">Required</Highlight>

<Highlight level="secondary">String</Highlight>

Type of offer.

:::caution
Must be a valid Job Type (currently `["FULL-TIME","PART-TIME","SUMMER INTERNSHIP","CURRICULAR INTERNSHIP","OTHER"]`)
:::

### fields <Highlight level="info" inline>Body Parameter</Highlight>

<Highlight level="danger">Required</Highlight> 

<Highlight level="secondary">Array</Highlight>

Specifies the fields (areas) the offer corresponds to.

:::caution
Must be a valid Field Type (currently `["BACKEND", "FRONTEND", "DEVOPS", "BLOCKCHAIN", "MACHINE LEARNING", "OTHER"]`)
:::

### technologies <Highlight level="info" inline>Body Parameter</Highlight>

<Highlight level="danger">Required</Highlight> 

<Highlight level="secondary">Array</Highlight>

Specifies the technologies the offer is looking for.

:::caution
Must be a valid Technology Type (currently `["React","Angular","Vue","Node.js","Java","C++","C","C#","Clojure","Go","Haskell","Spring Boot","Android","Flutter","Dart","PHP","CSS","Other"]`):::
:::

### isHidden <Highlight level="info" inline>Body Parameter</Highlight>

<Highlight level="success">Optional</Highlight> 

<Highlight level="secondary">Boolean</Highlight>

If true, the offer will not show up in search by default. However, the owner and admins can still see it, by activating the `showHidden` flag when searching.

### location <Highlight level="info" inline>Body Parameter</Highlight>

<Highlight level="danger">Required</Highlight> 

<Highlight level="secondary">String</Highlight>

Where the work will be done (usually in `City, Country` format)

### coordinates <Highlight level="info" inline>Body Parameter</Highlight>

<Highlight level="success">Optional</Highlight> 

<Highlight level="secondary">String</Highlight>

> This is still TBD

The coordinates of the workplace, so that a map can be shown in the UI.

### requirements <Highlight level="info" inline>Body Parameter</Highlight>

<Highlight level="danger">Required</Highlight> 

<Highlight level="secondary">Array</Highlight>

An array of strings containing job requirements in list form. Useful to list them in a more straightforward way.



## Request examples

> TBD