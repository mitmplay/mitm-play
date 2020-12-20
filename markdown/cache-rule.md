# Cache rule

<div class="details" title="Diagram">
<div class="mermaid">
sequenceDiagram
    participant Browser as Browser
    participant Route as Mitm-play
    participant Cached as Cached
    participant Server as Server
    Browser->>+Route: Request
    Route-->>+Server: no cache!
    Server-->>-Route: response
    Route-->>Cached: Save for future request
    Route->>-Browser: Response
    Browser->>+Route: Request
    Route-->>+Cached: cached!
    Cached-->>-Route: response
    Route->>-Browser: Response
</div>
</div>

"_Save the first request to your local disk so next request will serve from there._"

## Basic Usage

```js
'cache:_test~01': {
  '/css/_.+': {
    contentType: ['css']
  }
}
```

<div class="details" title="cache-01">

![Icon](./cache-01.png 'cache-01:att height=50% width=50%')

</div>
