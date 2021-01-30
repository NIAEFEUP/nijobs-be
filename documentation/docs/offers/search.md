---
id: search
title: Search Offers
sidebar_label: Search Offers
slug: /offers/search
---


# Search Offers

Route description

**URL** : `/offer/search`

**Method** : `GET`

**Auth required** : MIXED - Auth is required to get hidden Offers. Only Admins or owners of hidden Offers will see them if `showHidden` is set to `true`

**Data Rules**

* **Query**

> These fields go in after the URL e.g. `api/?field1=foo&field2=bar`

value = "", offset = 0, limit = OfferService.MAX_OFFERS_PER_QUERY

* showHidden: 
    * Optional
    * Boolean
    * If active, will also return hidden offers, only for admin or offer owner
* limit:
    * Optional
    * Number
    * Default: 20
    * Limits the number of results returned
* offset:
    * Optional
    * Number
    * Default: 0
    * Specifies offset where to start returning results (often used with limit to have pagination)
* value:
    * Optional
    * String
    * Default: ""
    * Full-Text-Search query
* jobType:
    * Optional
    * String
    * Must be a valid Job Type (currently `["FULL-TIME", "PART-TIME", "SUMMER INTERNSHIP", "CURRICULAR INTERNSHIP", "OTHER"]`)
    * Filters the search results to only include ones of given type
* jobMinDuration:
    * Optional
    * Number
    * Filters the search results to only include Offers with a `jobMinDuration` greater than given value
* jobMaxDuration:
    * Optional
    * Number
    * Filters the search results to only include Offers with a `jobMaxDuration` lesser than given value
* fields:
    * Optional
    * String (Will be an array if passed multiple times, check example below)
    * Must be a valid Field Type (currently `["BACKEND", "FRONTEND", "DEVOPS", "BLOCKCHAIN", "MACHINE LEARNING", "OTHER"]`)
    * Filters the search results to only include Offers with at least one of `fields` being one of given values
* technologies :
    * Optional
    * String (Will be an array if passed multiple times, check example below)
    * Must be a valid Field Type (currently `["React","Angular","Vue","Node.js","Java","C++","C","C#","Clojure","Go","Haskell","Spring Boot","Android","Flutter","Dart","PHP","CSS","Other"]`)
    * Filters the search results to only include Offers with at least one of `technologies` being one of given values


**Request examples**

> If using query or URL params, specifiy the full URL, like so 
`/offers/?value=testcompany%20frontend&technologies=React&technologies=Node.js`

## Success Response

**Code** : `200 OK`

**Content example**

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

## Error Response

**Condition** : If jobType contains an invalid value (e.g. `jobType=fas`)

**Code** : `422 UNPROCESSABLE ENTITY`

**Content** :

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

**Condition** : If fields contains an invalid value (e.g. `fields=fas`)

**Code** : `422 UNPROCESSABLE ENTITY`

**Content** :

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

**Condition** : If technologies contains an invalid value (e.g. `technologies=fas`)

**Code** : `422 UNPROCESSABLE ENTITY`

**Content** :

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

**Condition** : If given a non-int to any of the numeric fields

**Code** : `422 UNPROCESSABLE ENTITY`

**Content** :

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
