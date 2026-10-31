const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Stable path to SQLite database file
const dbPath = path.join(__dirname, "database", "books.db");
let db = null;

// Asynchronous initialization function: opens DB first, then starts server
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    console.log("Connected to SQLite database successfully.");

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error(`Database initialization error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// Root route
app.get("/", (req, res) => {
  res.status(200).send("Welcome to Lab 2: SQLite Database and CRUD Routes. Access /books/ to view books.");
});

// Endpoint 1: Get all books
// GET /books/
app.get("/books/", async (req, res) => {
  try {
    const getBooksQuery = "SELECT * FROM book ORDER BY id ASC;";
    const books = await db.all(getBooksQuery);
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint 2: Get one book by ID
// GET /books/:bookId/
app.get("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;
    const parsedId = parseInt(bookId, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({ error: "Invalid book ID. Must be an integer." });
    }

    const getBookQuery = "SELECT * FROM book WHERE id = ?;";
    const book = await db.get(getBookQuery, [parsedId]);

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint 3: Add a new book
// POST /books/
app.post("/books/", async (req, res) => {
  try {
    const { title, author, price, pages } = req.body;

    // Validate required fields and types
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Valid 'title' (non-empty string) is required." });
    }
    if (!author || typeof author !== "string" || !author.trim()) {
      return res.status(400).json({ error: "Valid 'author' (non-empty string) is required." });
    }
    if (price === undefined || typeof price !== "number" || price < 0) {
      return res.status(400).json({ error: "Valid 'price' (non-negative number) is required." });
    }
    if (pages === undefined || typeof pages !== "number" || pages <= 0) {
      return res.status(400).json({ error: "Valid 'pages' (positive integer) is required." });
    }

    const addBookQuery = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `;
    const result = await db.run(addBookQuery, [
      title.trim(),
      author.trim(),
      price,
      pages,
    ]);

    res.status(201).json({
      id: result.lastID,
      message: "Book added successfully",
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint 4: Update a book by ID
// PUT /books/:bookId/
app.put("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;
    const parsedId = parseInt(bookId, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({ error: "Invalid book ID. Must be an integer." });
    }

    const { title, author, price, pages } = req.body;

    // Validate required fields and types
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Valid 'title' (non-empty string) is required." });
    }
    if (!author || typeof author !== "string" || !author.trim()) {
      return res.status(400).json({ error: "Valid 'author' (non-empty string) is required." });
    }
    if (price === undefined || typeof price !== "number" || price < 0) {
      return res.status(400).json({ error: "Valid 'price' (non-negative number) is required." });
    }
    if (pages === undefined || typeof pages !== "number" || pages <= 0) {
      return res.status(400).json({ error: "Valid 'pages' (positive integer) is required." });
    }

    // Check if the book exists first
    const checkBookQuery = "SELECT * FROM book WHERE id = ?;";
    const existingBook = await db.get(checkBookQuery, [parsedId]);
    if (!existingBook) {
      return res.status(404).json({ error: "Book not found" });
    }

    const updateBookQuery = `
      UPDATE book
      SET title = ?, author = ?, price = ?, pages = ?
      WHERE id = ?;
    `;
    await db.run(updateBookQuery, [
      title.trim(),
      author.trim(),
      price,
      pages,
      parsedId,
    ]);

    res.status(200).json({ message: "Book updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint 5: Delete a book by ID
// DELETE /books/:bookId/
app.delete("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;
    const parsedId = parseInt(bookId, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({ error: "Invalid book ID. Must be an integer." });
    }

    // Check if the book exists first
    const checkBookQuery = "SELECT * FROM book WHERE id = ?;";
    const existingBook = await db.get(checkBookQuery, [parsedId]);
    if (!existingBook) {
      return res.status(404).json({ error: "Book not found" });
    }

    const deleteBookQuery = "DELETE FROM book WHERE id = ?;";
    await db.run(deleteBookQuery, [parsedId]);

    res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Catch-all handler for undefined paths
app.use((req, res) => {
  res.status(404).json({ error: "404 - Route Not Found" });
});

module.exports = app;

