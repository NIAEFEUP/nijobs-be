---
id: search
title: Search Offers
sidebar_label: Search Offers
slug: /offers/search
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

import  "./search.module.css";

import Highlight from "../../src/highlight.js"

## Details 

This endpoint returns offers based on search criteria. It allows for _Full-Text Search_ as well as results filtering. Perfect for a search component!

**URL** : `/offers/search`

**Method** : <Highlight level="info" inline>GET</Highlight>

:::caution Authentication
Auth is required to get hidden Offers. Only Admins or owners of hidden Offers will see them if `showHidden` is set to `true`
:::

## Parameters 

### showHidden <Highlight level="info" inline>Query Parameter</Highlight>

<Highlight level="success">Optional</Highlight>

<Highlight level="secondary">Boolean</Highlight>

If active, will also return hidden offers, only for admin or offer owner 

### limit <Highlight level="info" inline>Query Parameter</Highlight>

<Highlight level="success" inline>Optional</Highlight> 
<Highlight level="warning" inline>Default: 20</Highlight>

<Highlight level="secondary">Number</Highlight>

Limits the number of results returned

### offset <Highlight level="info" inline>Query Parameter</Highlight>

<Highlight level="success" inline>Optional</Highlight> 
<Highlight level="warning" inline>Default: 0</Highlight>

<Highlight level="secondary">Number</Highlight>

Specifies offset where to start returning results (often used with [limit](#limit-query-parameter) to have pagination)

### value <Highlight level="info" inline>Query Parameter</Highlight>

<Highlight level="success" inline>Optional</Highlight> 
<Highlight level="warning" inline>Default: ""</Highlight>

<Highlight level="secondary">String</Highlight>

Full-Text-Search query

### jobType <Highlight level="info" inline>Query Parameter</Highlight>

<Highlight level="success">Optional</Highlight> 

<Highlight level="secondary">String</Highlight>

Filters the search results to only include ones of given type

:::caution
Must be a valid Job Type (currently `["FULL-TIME", "PART-TIME", "SUMMER INTERNSHIP", "CURRICULAR INTERNSHIP", "OTHER"]`)
:::

### jobMinDuration <Highlight level="info" inline>Query Parameter</Highlight>

<Highlight level="success">Optional</Highlight> 

<Highlight level="secondary">Number</Highlight>

Filters the search results to only include Offers with a `jobMinDuration` greater than given value

### jobMaxDuration <Highlight level="info" inline>Query Parameter</Highlight>

<Highlight level="success">Optional</Highlight> 

<Highlight level="secondary">Number</Highlight>

Filters the search results to only include Offers with a `jobMinDuration` lower than given value

### fields <Highlight level="info" inline>Query Parameter</Highlight>

<Highlight level="success">Optional</Highlight> 

<Highlight level="secondary" inline>String</Highlight>
<Highlight level="secondary" inline>Array</Highlight>

Filters the search results to only include Offers with at least one of `fields` being one of given values

:::caution
Must be a valid Field Type (currently `["BACKEND", "FRONTEND", "DEVOPS", "BLOCKCHAIN", "MACHINE LEARNING", "OTHER"]`)
:::

:::info
If you pass multiple values like: `<url>/?fields=field1&fields=field2` it will be parsed as a String array 
:::

### technologies <Highlight level="info" inline>Query Parameter</Highlight>

<Highlight level="success">Optional</Highlight> 

<Highlight level="secondary" inline>String</Highlight>
<Highlight level="secondary" inline>Array</Highlight>

Filters the search results to only include Offers with at least one of `technologies` being one of given values

:::caution
Must be a valid Technology Type (currently `["React","Angular","Vue","Node.js","Java","C++","C","C#","Clojure","Go","Haskell","Spring Boot","Android","Flutter","Dart","PHP","CSS","Other"]`):::
:::

:::info
If you pass multiple values like: `<url>/?technologies=tech1&technologies=tech2` it will be parsed as a String array 
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

```bash
/offers/?value=testcompany%20frontend&technologies=React&technologies=Node.js
```

</TabItem>

<TabItem value="response">

```json
[
    {
        "contacts": [
            "contact@company.com"
        ],
        "fields": [
            "BACKEND",
            "FRONTEND"
        ],
        "technologies": [
            "React",
            "Node.js",
            "CSS"
        ],
        "isHidden": false,
        "_id": "5ff390335f65ee2ada9f95e8",
        "title": "Software Engineer - Fullstack",
        "publishDate": "2021-01-04T22:01:23.097Z",
        "publishEndDate": "2021-02-19T23:00:00.000Z",
        "jobStartDate": "2020-06-14T23:00:00.000Z",
        "description": "I love cheese, especially fromage frais gouda. Mascarpone when the cheese comes out everybody's happy say cheese cheese triangles caerphilly cheesecake gouda smelly cheese. Cheese and wine bocconcini lancashire pecorino stilton gouda port-salut cauliflower cheese. Cut the cheese squirty cheese rubber cheese cow boursin caerphilly cheesy grin cut the cheese. Camembert de normandie dolcelatte roquefort queso red leicester ricotta everyone loves fromage. Cream cheese ricotta cheese triangles croque monsieur everyone loves smelly cheese pepper jack pepper jack. Stilton st. agur blue cheese. Port-salut rubber cheese halloumi. Airedale queso halloumi emmental fromage frais when the cheese comes out everybody's happy airedale stinking bishop. Stinking bishop red leicester who moved my cheese fondue manchego swiss cheddar cow. Edam queso rubber cheese swiss parmesan pepper jack cheese strings cheese on toast. Fondue caerphilly croque monsieur red leicester jarlsberg roquefort chalk and cheese halloumi. Queso jarlsberg cut the cheese caerphilly. Stilton macaroni cheese babybel. Blue castello fromage frais cheesecake cheese and biscuits cheesy feet smelly cheese port-salut cut the cheese.",
        "jobType": "FULL-TIME",
        "owner": "5ff38a150188759f34e69723",
        "location": "Porto",
        "ownerName": "companyname",
        "__v": 0
    },
    {
        "contacts": [
            "contact@company.com"
        ],
        "fields": [
            "BACKEND",
        ],
        "technologies": [
            "React",
            "Node.js",
            "C++"
        ],
        "isHidden": false,
        "_id": "5ff390335f65ee2ada9f95e8",
        "title": "Software Engineer - Backend",
        "publishDate": "2021-01-04T22:01:23.097Z",
        "publishEndDate": "2021-02-19T23:00:00.000Z",
        "jobStartDate": "2020-06-14T23:00:00.000Z",
        "description": "I love cheese, especially fromage frais gouda. Mascarpone when the cheese comes out everybody's happy say cheese cheese triangles caerphilly cheesecake gouda smelly cheese. Cheese and wine bocconcini lancashire pecorino stilton gouda port-salut cauliflower cheese. Cut the cheese squirty cheese rubber cheese cow boursin caerphilly cheesy grin cut the cheese. Camembert de normandie dolcelatte roquefort queso red leicester ricotta everyone loves fromage. Cream cheese ricotta cheese triangles croque monsieur everyone loves smelly cheese pepper jack pepper jack. Stilton st. agur blue cheese. Port-salut rubber cheese halloumi. Airedale queso halloumi emmental fromage frais when the cheese comes out everybody's happy airedale stinking bishop. Stinking bishop red leicester who moved my cheese fondue manchego swiss cheddar cow. Edam queso rubber cheese swiss parmesan pepper jack cheese strings cheese on toast. Fondue caerphilly croque monsieur red leicester jarlsberg roquefort chalk and cheese halloumi. Queso jarlsberg cut the cheese caerphilly. Stilton macaroni cheese babybel. Blue castello fromage frais cheesecake cheese and biscuits cheesy feet smelly cheese port-salut cut the cheese.",
        "jobType": "FULL-TIME",
        "owner": "5ff38a150188759f34e69723",
        "location": "Porto",
        "ownerName": "companyname - a subsidiary",
        "__v": 0
    },
]
```

</TabItem>
</Tabs>

### Example 2 - Invalid job type

**Condition** : If jobType contains an invalid value (e.g. `jobType=fas`)

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
/offers/?jobType=fas
```

</TabItem>

<TabItem value="response">

```json
{
    "error_code": 1,
    "errors": [
        {
            "value": "fas",
            "msg": "must-be-in:[FULL-TIME,PART-TIME,SUMMER INTERNSHIP,CURRICULAR INTERNSHIP,OTHER]",
            "param": "jobType",
            "location": "query"
        }
    ]
}
```

</TabItem>
</Tabs>

### Example 3 - Invalid fields

**Condition** : If fields contains an invalid value (e.g. `fields=fas`)

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
/offers/?fields=fas
```

</TabItem>

<TabItem value="response">

```json
{
    "error_code": 1,
    "errors": [
        {
            "value": [
                "fas"
            ],
            "msg": "must-be-in:[BACKEND,FRONTEND,DEVOPS,BLOCKCHAIN,MACHINE LEARNING,OTHER]",
            "param": "fields",
            "location": "query"
        }
    ]
}
```

</TabItem>
</Tabs>

### Example 4 - Invalid technologies

**Condition** : If technologies contains an invalid value (e.g. `technologies=fas`)

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
/offers/?technologies=fas
```

</TabItem>

<TabItem value="response">

```json
{
    "error_code": 1,
    "errors": [
        {
            "value": [
                "fas"
            ],
            "msg": "must-be-in:[React,Angular,Vue,Node.js,Java,C++,C,C#,Clojure,Go,Haskell,Spring Boot,Android,Flutter,Dart,PHP,CSS,Other]",
            "param": "technologies",
            "location": "query"
        }
    ]
}
```

</TabItem>
</Tabs>

### Example 5 - Invalid numeric fields

**Condition** : If given a non-int to any of the numeric fields

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
/offers/?limit=fas
```

</TabItem>

<TabItem value="response">

```json
{
    "error_code": 1,
    "errors": [
        {
            "value": "fas",
            "msg": "must-be-int",
            "param": "limit",
            "location": "query"
        }
    ]
}
```

</TabItem>
</Tabs>
