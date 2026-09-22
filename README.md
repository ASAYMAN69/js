# 🚀 req.js

> **Zero-boilerplate, declarative HTTP requests in vanilla HTML/JS.**  
> Connect your frontend forms directly to backend APIs (Node.js, Python, n8n, FastAPI, Express, PHP, etc.) without writing `fetch()`, `async/await`, `event.preventDefault()`, or manual DOM manipulation.

---

## 📦 Quick Start (3 Easy Steps)

### 1. Add `req.js` via CDN
Add this script tag inside your HTML `<head>` or `<body>`:

```html
<script src="https://cdn.jsdelivr.net/gh/ASAYMAN69/js@main/req.js"></script>
```

---

### 2. Build Your HTML
Create your input fields, submit button, and a container tag to show the response:

```html
<form>
  <label>Name:</label>
  <input type="text" id="student_name" placeholder="Enter your name">

  <label>College ID:</label>
  <input type="text" id="college_id" placeholder="Enter your ID">

  <button type="submit" id="submit_btn">Submit Application</button>

  <!-- This is where the response from the server will appear -->
  <h2 id="response_message"></h2>
</form>
```

---

### 3. Add the Configuration Script
Add a `<script>` block describing how the frontend should communicate with your API:

```html
<script>
  const API_ENDPOINT = "https://your-api.com/api/students"
  const METHOD = POST
  const SUBMIT = #submit_btn
  const BODY = { "name": #student_name, "college_id": #college_id }
  const RESPONSE = { "message": #response_message }
</script>
```

**That's it!** When the user clicks the submit button:
1. `req.js` reads values from `#student_name` and `#college_id`.
2. Automatically prevents page reload.
3. Sends a JSON `POST` request to `API_ENDPOINT`.
4. Takes `"message"` from the server's JSON response and puts it inside `<h2 id="response_message"></h2>`.

---

## ⚙️ Configuration Reference

Inside your `<script>` block, you can configure:

| Variable | Description | Example |
|---|---|---|
| `API_ENDPOINT` | The backend API URL (also accepts `API` or `ENDPOINT`) | `"https://api.example.com/users"` |
| `METHOD` | HTTP method (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) | `POST` or `"GET"` |
| `SUBMIT` | Element ID or CSS selector of the button/form that triggers the request | `#submit_btn` or `"#submit_btn"` |
| `BODY` | Object mapping JSON payload keys to input element IDs (for `POST`/`PUT`/`PATCH`) | `{ "title": #title_input }` |
| `QUERY` | Object mapping URL query parameters to input element IDs (for `GET` requests) | `{ "userId": #user_search }` |
| `RESPONSE` | Object mapping keys from the server's JSON response to HTML element IDs | `{ "name": #display_name }` |

---

## 💡 Practical Examples

### Example 1: Sending Data to a Backend (`POST` Request)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>POST Example</title>
  <script src="https://cdn.jsdelivr.net/gh/ASAYMAN69/js@main/req.js"></script>
</head>
<body>

  <h2>Create New Post</h2>
  <input type="text" id="post_title" placeholder="Post Title">
  <textarea id="post_body" placeholder="Write something..."></textarea>
  <button type="submit" id="btn_save">Publish</button>

  <h3>Server Response:</h3>
  <p>Status: <span id="post_status">Waiting for submit...</span></p>
  <p>New Post ID: <span id="new_id"></span></p>

  <script>
    const API_ENDPOINT = "https://jsonplaceholder.typicode.com/posts"
    const METHOD = POST
    const SUBMIT = #btn_save
    const BODY = { "title": #post_title, "body": #post_body }
    const RESPONSE = { "id": #new_id }
  </script>

</body>
</html>
```

---

### Example 2: Searching / Querying Data (`GET` Request)

For `GET` requests, use `QUERY` to convert input values into URL query parameters (e.g. `https://api.com/users?id=5`):

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GET Example</title>
  <script src="https://cdn.jsdelivr.net/gh/ASAYMAN69/js@main/req.js"></script>
</head>
<body>

  <h2>Search User</h2>
  <input type="text" id="search_id" placeholder="Enter User ID (e.g. 1)">
  <button type="submit" id="btn_search">Search</button>

  <h3>User Details:</h3>
  <p>Name: <strong id="user_name">--</strong></p>
  <p>Email: <strong id="user_email">--</strong></p>

  <script>
    const API_ENDPOINT = "https://jsonplaceholder.typicode.com/users/1"
    const METHOD = GET
    const SUBMIT = #btn_search
    const QUERY = { "id": #search_id }
    const RESPONSE = { "name": #user_name, "email": #user_email }
  </script>

</body>
</html>
```

---

### Example 3: Multiple Independent Requests on One Page

You can have multiple `<script>` blocks for different endpoints and buttons on the same page. Each block works independently:

```html
<!-- Form 1: Create Product (POST) -->
<input type="text" id="item_name" placeholder="Item name">
<button type="submit" id="btn_add">Add Item</button>
<span id="add_status"></span>

<script>
  const API_ENDPOINT = "https://api.example.com/items"
  const METHOD = POST
  const SUBMIT = #btn_add
  const BODY = { "name": #item_name }
  const RESPONSE = { "status": #add_status }
</script>

<hr>

<!-- Form 2: Fetch Info (GET) -->
<input type="text" id="query_id" placeholder="Item ID">
<button type="submit" id="btn_lookup">Lookup</button>
<span id="lookup_result"></span>

<script>
  const API_ENDPOINT = "https://api.example.com/items"
  const METHOD = GET
  const SUBMIT = #btn_lookup
  const QUERY = { "id": #query_id }
  const RESPONSE = { "name": #lookup_result }
</script>
```

---

## 🎯 How `#id` Selectors Work

`req.js` makes working with HTML elements intuitive:

1. **For inputs (`<input>`, `<select>`, `<textarea>`)**:
   `req.js` automatically extracts `.value` (and boolean states for checkboxes/radios).
2. **For display tags (`<h1>`, `<p>`, `<span>`, `<div>`)**:
   `req.js` injects the response data into `.textContent`.
3. **For target inputs**:
   If the target element in `RESPONSE` is an input or textarea, `req.js` sets `.value`.
4. **Nested JSON properties**:
   If your server returns nested data like `{"user": {"profile": {"name": "Alice"}}}`, you can write:
   ```javascript
   const RESPONSE = { "user.profile.name": #user_name }
   ```

---

## 🔔 Events (Optional for Advanced Users)

`req.js` dispatches custom window events if you want to listen for success or errors with JavaScript:

```javascript
window.addEventListener('accreq:success', (e) => {
  console.log('Request succeeded:', e.detail.data);
});

window.addEventListener('accreq:error', (e) => {
  console.error('Request failed:', e.detail.error);
});
```

---

## 📄 License

MIT © [ASAYMAN69](https://github.com/ASAYMAN69)
