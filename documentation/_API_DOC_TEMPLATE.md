# <Route Title>

<Route description>

**URL** : `/.....`

**Method** : `<GET|POST|...>`

**Auth required** : <YES|NO>

**Data Rules**

* **Query**
> Change this to match the endpoint's query params. If it has no query params, remove this entry.


> These fields go in after the URL e.g. `api/?field1=foo&field2=bar`

* field1: 
    * Required
    * String
    * <Valid email | valid ISO8601 date | ...>
    * Some additional text note explaining more complex rules can come here
* field2:
    * Optional
    * Number


* **Body**

> Change these to match the endpoint's body. If it has no body, remove this entry.

* field1: 
    * Required
    * String
    * <Valid email | valid ISO8601 date | ...>
    * Some additional text note explaining more complex rules can come here
* field2:
    * Optional
    * Number


**Request examples**

> If using query or URL params, specifiy the full URL, like so 
`/api/example/endpoint/<A URL param, maybe an id>/?field1=examplevalue1&field2=examplevalue2`

## Success Response

**Code** : `200 OK`

**Content example**

```json
{
    "token": "93144b288eb1fdccbe46d6fc0f241a51766ecd3d"
}
```

## Error Response

**Condition** : If 'username' and 'password' combination is wrong.

**Code** : `400 BAD REQUEST`

**Content** :

```json
{
    "error_code": 1, // Validation Error
    "errors": [
        {
            "msg": "The error message goes here"
        }
    ]
}
```
