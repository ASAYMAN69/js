# req.js

A declarative, zero-boilerplate JavaScript library for handling HTTP requests (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) and binding responses directly to HTML elements.

## CDN Usage

Add `req.js` via jsDelivr CDN directly into your `<head>` or `<body>`:

```html
<script src="https://cdn.jsdelivr.net/gh/ASAYMAN69/js@main/req.js"></script>
```

## How It Works

Simply declare your configuration inside an inline `<script>` tag:

```html
<!-- Inputs -->
<input type="text" id="post_title" value="Hello World">
<button type="submit" id="btn_post">Submit</button>

<!-- Target for response -->
<h1 id="result_title"></h1>

<!-- Declarative Configuration -->
<script>
  const API_ENDPOINT = "https://jsonplaceholder.typicode.com/posts"
  const METHOD = POST
  const SUBMIT = #btn_post
  const BODY = { title: #post_title }
  const RESPONSE = { title: #result_title }
</script>
```

## Configuration Parameters

- **`API_ENDPOINT`** (or `ENDPOINT`, `API`): The URL of the API endpoint.
- **`METHOD`**: HTTP Method (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`). Defaults to `GET`.
- **`SUBMIT`**: Selector or ID of the submit trigger element (e.g. `#submit_btn`).
- **`QUERY`**: Object mapping query parameters to input field IDs (e.g. `{ ref: #input_id }`).
- **`BODY`**: Object mapping request body keys to input field IDs for JSON payload.
- **`RESPONSE`**: Object mapping response keys to target container element IDs for automatic insertion.

## Multi-Block Support

You can define multiple independent script blocks on the same page for different endpoints, buttons, and HTTP methods.

## License

MIT
