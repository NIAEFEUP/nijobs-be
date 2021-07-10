---
id: how-to-docs
title: How to write documentation
sidebar_label: How to write documentation
slug: /intro/how-to-docs
---

import Highlight from "../../src/highlight.js"


## Structure and relevant files

The documentation is built from the `documentation/` folder in the [repository](https://github.com/NIAEFEUP/nijobs-be). The most important things there are the `docusaurus.config.js`, the `docs-index.js`, and the `docs/` folder.

The `docs/` folder contains all the content of these pages. The `docusaurus.config.js` contains configuration values but, in general, you shouldn't need to touch those. The `docs-index.js`, however, should be changed every time you add or remove a page, since it controls what is shown on the left index of the website. The `docs/` folder contains sub-folders according to the separation of topics. When referencing a page, it will have its folder path, followed by its id defined in the beginning of the document, e.g., the `search.md` file, which has an id of `search` and is on `docs/offers/` will be referenced (reflected in the url) by `offers/search`.

## Guidelines

In general, you should separate the documentation according to the Route area. Offer related routes go into the offer sub-folder, Company related routes go into the company sub-folder, and so on...

In order to use special components such as the `<Highlight>` or the `<Tabs>`, you'll need to import them in your .md file:

```js
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

// This one depends on where your file is located
import Highlight from "../../src/highlight.js"
```

Each file should only contain documentation for a specific endpoint, and it should contain, at least, the following sections:

* Details
    * Explain what the route does and some main capabilities
* Parameters
    * Create a sub-section for each parameter of the endpoint with the name of the parameter, followed by its type, using a `<Highlight level="info" inline>` component. The type can be "Query Parameter", "URL Parameter", or "Body Parameter".

    ```jsx
    // Example parameter subsection
    ### myParameter <Highlight level="info" inline>Query Parameter</Highlight>
    ```
    * Additionally, you should specify if the parameter is optional <Highlight level="success" inline noPadding>level=success</Highlight> or required <Highlight level="danger" inline noPadding>level=danger</Highlight>, and its type <Highlight level="secondary" inline noPadding>level=secondary</Highlight>, like so (again, using the Highlight component)

    ```jsx
    <Highlight level="success">Optional</Highlight>
    <Highlight level="secondary">Boolean</Highlight>
    ``` 
    If the field has some default value (in the optional case), you should show it side by side with the "optional" tag, like this <Highlight level="warning" inline noPadding>level=warning</Highlight>:
    ```jsx
    // Notice the `inline` usage to make them appear side-by-side
    <Highlight level="success" inline>Optional</Highlight> 
    <Highlight level="warning" inline>Default: 20</Highlight>
    ```
    * Finally, describe what the parameter does/triggers and if you have some small note or consideration, you can use the notes to emphasize your point. 
    ```md
    :::note
    The content and title *can* include markdown.
    :::

    :::tip You can specify an optional title
    Heads up! Here's a pro-tip.
    :::

    :::info
    Useful information.
    :::

    :::caution
    Warning! You better pay attention!
    :::

    :::danger
    Danger danger, mayday!
    :::
    ```
    :::note
    The content and title *can* include markdown.
    :::

    :::tip You can specify an optional title
    Heads up! Here's a pro-tip.
    :::

    :::info
    Useful information.
    :::

    :::caution
    Warning! You better pay attention!
    :::

    :::danger
    Danger danger, mayday!
    :::
* Requests/Responses
    * Here you should have as many subsections as you want, considering that you must at least show ine successfull request and an error one. Each example in its subsection.

    Each subsection should have a title like "Example #x - `<brief description>` and then have a response code associated with that example and the request and response, in separated Tabs for better readability. Below is an example from the [search offers](offers/search) docs:

    ```jsx
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

    Request in a code block goes here

    </TabItem>

    <TabItem value="response">

    Response in a code block goes here

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

    Request in a code block goes here

    </TabItem>

    <TabItem value="response">

    Response in a code block goes here

    </TabItem>
    </Tabs>
    ```

Any additional documentation is provided in docusaurus docs themselves, [here](https://v2.docusaurus.io/docs/).