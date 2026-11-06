# Lab 3: REST API, Query Parameters, Validation and Debugging

## Student Details
- **Name:** Botka Yashwanth
- **Registration Number:** 252U1R8011
- **Section:** S-13

---

## Live Link
https://lab-03-rest-api-server.onrender.com/

---

## Project Description
This project enhances the book management backend into a full-featured, professional RESTful API. Built with **Node.js**, **Express**, and **SQLite** (using `sqlite` and `sqlite3`), this lab introduces advanced features including:
- **Noun-based RESTful routing** (`/books/`) using standard HTTP methods (`GET`, `POST`, `PUT`, `DELETE`).
- **Dynamic query parameters** for partial title search (`search_q` with SQL `LIKE`), multi-column sorting (`order_by`), ascending/descending order (`order=ASC|DESC`), pagination (`limit` & `offset`), and price-range filtering (`min_price` & `max_price`).
- **Strict input validation** for JSON request bodies and query parameters with clear, uniform error messages.
- **Consistent HTTP status codes** (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `500 Internal Server Error`).
- **Comprehensive debugging analysis** for common backend issues (`EADDRINUSE`, broken import paths, database table typos, and missing `await`).

---

## Technologies Used
- **Runtime:** Node.js (v24.14.0)
- **Package Manager:** npm (v11.9.0)
- **Dependencies:**
  - `express`: Core web application framework for routing and JSON parsing
  - `sqlite`: Promise-based wrapper around sqlite3 enabling async/await queries
  - `sqlite3`: Native SQLite3 driver
- **DevDependencies:**
  - `nodemon`: Development tool for automatic server restarts upon file changes

---

## How to Install and Run

### 1. Installation
Navigate to the `lab-03` directory and install dependencies:
```bash
cd lab-03
npm install
```

### 2. Development Mode (with Nodemon)
Start the server with live auto-reloading:
```bash
npm run dev
```

### 3. Production Start
Start the application using standard Node.js:
```bash
npm start
```

### 4. Environment Variables
No `.env` file is required. The server automatically uses `process.env.PORT` if available (for cloud hosting like Render) or defaults to port `3000`.

---

## Database Configuration

- **Database File:** `database/books.db`
- **Schema & Seed Script:** `database/init.sql`

### Table Schema: `book`
```sql
CREATE TABLE book (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    price INTEGER NOT NULL,
    pages INTEGER NOT NULL
);
```

### Pre-Seeded Sample Records
The database contains 10 initial records:
1. *Harry Potter and the Sorcerer's Stone* — J.K. Rowling (Price: 450, Pages: 309)
2. *The Hobbit* — J.R.R. Tolkien (Price: 399, Pages: 310)
3. *To Kill a Mockingbird* — Harper Lee (Price: 350, Pages: 281)
4. *1984* — George Orwell (Price: 299, Pages: 328)
5. *The Great Gatsby* — F. Scott Fitzgerald (Price: 250, Pages: 180)
6. *Pride and Prejudice* — Jane Austen (Price: 280, Pages: 279)
7. *The Catcher in the Rye* — J.D. Salinger (Price: 320, Pages: 214)
8. *Clean Code* — Robert C. Martin (Price: 650, Pages: 464)
9. *The Pragmatic Programmer* — Andrew Hunt (Price: 720, Pages: 352)
10. *Introduction to Algorithms* — Thomas H. Cormen (Price: 999, Pages: 1312)

### Inspecting via SQLite CLI
```bash
sqlite3 database/books.db
```
Inside the prompt:
```sql
.schema book
SELECT * FROM book;
.exit
```

---

## API Endpoints

| Method | Endpoint Path | Description | Expected Status |
|---|---|---|---|
| `GET` | `/books/` | Retrieve books with optional search, sort, filter & pagination | `200 OK` (or `400` on invalid query param) |
| `GET` | `/books/:bookId/` | Retrieve a single book by ID | `200 OK` (or `404 Not Found`, `400 Bad Request`) |
| `POST` | `/books/` | Add a new book | `201 Created` (or `400 Bad Request`) |
| `PUT` | `/books/:bookId/` | Update an existing book | `200 OK` (or `404 Not Found`, `400 Bad Request`) |
| `DELETE` | `/books/:bookId/` | Remove a book | `200 OK` (or `404 Not Found`, `400 Bad Request`) |

---

## Query Parameters (`GET /books/`)

| Parameter | Purpose | Allowed Values / Validation | Default | Example |
|---|---|---|---|---|
| `search_q` | Partial title matching | Any text (SQL `LIKE %...%`) | *None* | `?search_q=Potter` |
| `order_by` | Column to sort by | Whitelist: `id`, `title`, `author`, `price`, `pages` | `id` | `?order_by=price` |
| `order` | Sort direction | `ASC` or `DESC` (case-insensitive) | `ASC` | `?order=DESC` |
| `limit` | Max records per page | Positive integer (1 to 100) | `10` | `?limit=5` |
| `offset` | Records to skip | Non-negative integer ($\ge 0$) | `0` | `?offset=5` |
| `min_price` | Minimum price filter | Non-negative number | *None* | `?min_price=300` |
| `max_price` | Maximum price filter | Non-negative number ($\ge \text{min\_price}$) | *None* | `?max_price=600` |

### Combined Query Example
```text
GET /books/?search_q=The&order_by=price&order=DESC&limit=5&offset=0&min_price=200&max_price=1000
```

---

## Request & Response Examples

### Successful Book Creation (`POST /books/`)
**Request Body:**
```json
{
  "title": "Clean Architecture",
  "author": "Robert C. Martin",
  "price": 550,
  "pages": 350
}
```
**Response (`201 Created`):**
```json
{
  "message": "Book added successfully",
  "book": {
    "id": 11,
    "title": "Clean Architecture",
    "author": "Robert C. Martin",
    "price": 550,
    "pages": 350
  }
}
```

### Validation Error (`POST /books/` missing title)
**Response (`400 Bad Request`):**
```json
{
  "message": "Title is required"
}
```

### Record Not Found (`GET /books/99999/`)
**Response (`404 Not Found`):**
```json
{
  "message": "Book not found"
}
```

---

## Debugging Exercises (Common Backend Errors)

### Problem 1: Port Conflict (`EADDRINUSE`)
- **Error:** `Error: listen EADDRINUSE: address already in use :::3000`
- **Cause:** Another background Node.js process or earlier server instance is already bound to port 3000.
- **Identification:** Checked active port bindings with `netstat -ano | findstr :3000` (or PowerShell `Get-NetTCPConnection -LocalPort 3000`).
- **Solution:** Identified the conflicting PID and terminated it using `Stop-Process -Id <PID> -Force`, or configured a fallback dynamic port via `process.env.PORT || 3000`.

### Problem 2: Wrong Import Path (`Cannot find module`)
- **Error:** `Error: Cannot find module './database/books.db'` or incorrect module relative path.
- **Cause:** Using fragile relative paths like `./database/books.db` that depend on the directory from which `node` was launched, or mistyping module names.
- **Identification:** The Node runtime throws `MODULE_NOT_FOUND`.
- **Solution:** Used Node's built-in `path.join(__dirname, 'database', 'books.db')` to guarantee absolute resolution regardless of working directory.

### Problem 3: Table-Name Typo (`SQLITE_ERROR: no such table`)
- **Error:** `SQLITE_ERROR: no such table: books`
- **Cause:** Pluralizing the table name in SQL queries (e.g. `SELECT * FROM books`) when the SQLite schema defined the singular `book`.
- **Identification:** SQLite error returned indicating table does not exist. Checked schema via SQLite CLI `.tables`.
- **Solution:** Standardized all SQL queries in `server.js` to strictly reference `book`.

### Problem 4: Missing `await` in Asynchronous Database Calls
- **Error:** `TypeError: Cannot read properties of undefined` or `Promise { <pending> }` sent in responses, or server starting before database connection completes.
- **Cause:** Calling `open(...)` or `db.all(...)` without `await`, causing the function to proceed synchronously with a pending promise rather than resolved data.
- **Identification:** Route handlers returned empty or pending objects, and queries failed with null references.
- **Solution:** Made `initializeDBAndServer` and all route handlers `async`, systematically using `await` for all database interactions.

---

## Screenshots

### 1. Get All Books (`GET /books/`)
![Get All Books](screenshots/get-all-books.png)

### 2. Search Books by Title (`GET /books/?search_q=Potter`)
![Search Books](screenshots/search-books.png)

### 3. Sort Ascending by Price (`GET /books/?order_by=price&order=ASC`)
![Sort Ascending](screenshots/sort-ascending.png)

### 4. Sort Descending by Price (`GET /books/?order_by=price&order=DESC`)
![Sort Descending](screenshots/sort-descending.png)

### 5. Pagination with Limit and Offset (`GET /books/?limit=5&offset=0`)
![Pagination](screenshots/pagination.png)

### 6. Price Range Filtering (`GET /books/?min_price=300&max_price=500`)
![Price Filter](screenshots/price-filter.png)

### 7. Combined Query Parameters
![Combined Query Parameters](screenshots/combined-query-parameters.png)

### 8. Get Single Book by ID (`GET /books/1/`)
![Get Single Book](screenshots/get-single-book.png)

### 9. Create Book (`POST /books/`)
![Create Book](screenshots/post-book.png)

### 10. Update Book (`PUT /books/11/`)
![Update Book](screenshots/put-book.png)

### 11. Delete Book (`DELETE /books/11/`)
![Delete Book](screenshots/delete-book.png)

### 12. Book Not Found 404 Route (`GET /books/99999/`)
![Invalid Book 404](screenshots/invalid-book-404.png)

### 13. Invalid Input Body 400 Route (`POST /books/` invalid body)
![Postman Invalid Input](screenshots/postman-invalid-input.png)

### 14. Invalid Query Parameter 400 Route (`GET /books/?order_by=invalid`)
![Invalid Query Parameters](screenshots/invalid-query-parameters.png)

### 15. SQLite Database Verification (CLI)
![SQLite Database](screenshots/sqlite-database.png)

---

## Viva Questions & Answers

**1. Query parameter vs path parameter?**
> - **Path Parameters** (e.g. `/books/:bookId/`) identify a specific, distinct resource entity in the hierarchical URI structure.
> - **Query Parameters** (e.g. `/books/?search_q=harry&order_by=price`) are optional key-value pairs appended after `?` to sort, filter, search, or paginate the collection without changing the resource identity.

**2. What does stateless mean?**
> In REST architecture, statelessness means each HTTP request from the client must contain all the information necessary for the server to understand and process it. The server does not store client session context between requests, improving scalability, reliability, and cacheability.

**3. Which status code is used for bad input versus a missing record?**
> - **HTTP 400 Bad Request:** Returned when the client sends malformed, incomplete, or invalid data (e.g., missing book title, non-numeric price, or invalid query parameters).
> - **HTTP 404 Not Found:** Returned when the request format is valid, but the target resource does not exist on the server (e.g., requesting book ID `99999`).

**4. Why are endpoints named using nouns rather than verbs?**
> REST models the system as resources (nouns, e.g. `/books`). Actions performed on those resources are communicated by standardized HTTP methods (`GET` = Read, `POST` = Create, `PUT` = Update, `DELETE` = Delete), avoiding redundant URLs like `/addBook` or `/getBooks`.

**5. How do parameterized queries prevent SQL injection?**
> Placing user inputs into SQL strings via concatenation allows attackers to inject malicious SQL syntax. Parameterized queries (`?` placeholders) send the query template and values separately to the database engine. SQLite treats parameter values purely as literal data, preventing user input from ever being executed as SQL instructions.

---

## Notes
- All SQL queries use parameterized `?` placeholders.
- Dynamic sorting columns (`order_by`) are strictly validated against an in-code allowlist (`id`, `title`, `author`, `price`, `pages`) before being interpolated into SQL, completely closing SQL injection vectors through identifiers.
- The original 10 sample records are preserved and isolated from test mutation.

