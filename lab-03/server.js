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
  res.status(200).send("Welcome to Lab 3: REST API, Query Parameters, Validation and Debugging. Access /books/ to view books.");
});

// Endpoint 1: Get books with search, sort, pagination, and price filtering
// GET /books/?search_q=&order_by=&order=&limit=&offset=&min_price=&max_price=
app.get("/books/", async (req, res) => {
  try {
    const {
      search_q = "",
      order_by = "id",
      order = "ASC",
      limit = "10",
      offset = "0",
      min_price,
      max_price,
    } = req.query;

    // 1. Validate order_by against explicit allowlist
    const allowedColumns = ["id", "title", "author", "price", "pages"];
    const normalizedOrderBy = order_by.toLowerCase();
    if (!allowedColumns.includes(normalizedOrderBy)) {
      return res.status(400).json({
        message: `Invalid 'order_by' column. Allowed columns are: ${allowedColumns.join(", ")}`,
      });
    }

    // 2. Validate order (ASC or DESC)
    const normalizedOrder = order.toUpperCase();
    if (normalizedOrder !== "ASC" && normalizedOrder !== "DESC") {
      return res.status(400).json({
        message: "Invalid 'order' parameter. Must be 'ASC' or 'DESC'.",
      });
    }

    // 3. Validate limit (positive integer, max 100)
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 100 || String(parsedLimit) !== String(limit).trim()) {
      return res.status(400).json({
        message: "Invalid 'limit' parameter. Must be a positive integer between 1 and 100.",
      });
    }

    // 4. Validate offset (non-negative integer)
    const parsedOffset = parseInt(offset, 10);
    if (isNaN(parsedOffset) || parsedOffset < 0 || String(parsedOffset) !== String(offset).trim()) {
      return res.status(400).json({
        message: "Invalid 'offset' parameter. Must be a non-negative integer.",
      });
    }

    // 5. Validate min_price and max_price if provided
    let parsedMinPrice = null;
    let parsedMaxPrice = null;

    if (min_price !== undefined) {
      parsedMinPrice = parseFloat(min_price);
      if (isNaN(parsedMinPrice) || parsedMinPrice < 0) {
        return res.status(400).json({
          message: "Invalid 'min_price'. Must be a non-negative number.",
        });
      }
    }

    if (max_price !== undefined) {
      parsedMaxPrice = parseFloat(max_price);
      if (isNaN(parsedMaxPrice) || parsedMaxPrice < 0) {
        return res.status(400).json({
          message: "Invalid 'max_price'. Must be a non-negative number.",
        });
      }
    }

    if (parsedMinPrice !== null && parsedMaxPrice !== null && parsedMinPrice > parsedMaxPrice) {
      return res.status(400).json({
        message: "'min_price' cannot be greater than 'max_price'.",
      });
    }

    // Build dynamic SQL query safely with parameterization
    const conditions = [];
    const queryParams = [];

    // Search partial title match using LIKE
    if (search_q && search_q.trim() !== "") {
      conditions.push("title LIKE ?");
      queryParams.push(`%${search_q.trim()}%`);
    }

    // Price range conditions
    if (parsedMinPrice !== null && parsedMaxPrice !== null) {
      conditions.push("price BETWEEN ? AND ?");
      queryParams.push(parsedMinPrice, parsedMaxPrice);
    } else if (parsedMinPrice !== null) {
      conditions.push("price >= ?");
      queryParams.push(parsedMinPrice);
    } else if (parsedMaxPrice !== null) {
      conditions.push("price <= ?");
      queryParams.push(parsedMaxPrice);
    }

    let whereClause = "";
    if (conditions.length > 0) {
      whereClause = "WHERE " + conditions.join(" AND ");
    }

    const getBooksQuery = `
      SELECT * FROM book
      ${whereClause}
      ORDER BY ${normalizedOrderBy} ${normalizedOrder}
      LIMIT ? OFFSET ?;
    `;
    queryParams.push(parsedLimit, parsedOffset);

    const books = await db.all(getBooksQuery, queryParams);
    res.status(200).json(books);
  } catch (error) {
    console.error(`Error in GET /books/: ${error.message}`);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Endpoint 2: Get one book by ID
// GET /books/:bookId/
app.get("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;
    const parsedId = parseInt(bookId, 10);
    if (isNaN(parsedId) || String(parsedId) !== String(bookId).trim()) {
      return res.status(400).json({ message: "Invalid book ID. Must be an integer." });
    }

    const getBookQuery = "SELECT * FROM book WHERE id = ?;";
    const book = await db.get(getBookQuery, [parsedId]);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.status(200).json(book);
  } catch (error) {
    console.error(`Error in GET /books/:bookId/: ${error.message}`);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Endpoint 3: Add a new book (POST /books/)
app.post("/books/", async (req, res) => {
  try {
    const { title, author, price, pages } = req.body;

    // Validate required fields and types
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (!author || typeof author !== "string" || !author.trim()) {
      return res.status(400).json({ message: "Author is required" });
    }
    if (price === undefined || price === null || typeof price !== "number" || isNaN(price) || price < 0) {
      return res.status(400).json({ message: "Price must be a valid number" });
    }
    if (pages === undefined || pages === null || typeof pages !== "number" || isNaN(pages) || pages <= 0) {
      return res.status(400).json({ message: "Pages must be a positive number" });
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
      message: "Book added successfully",
      book: {
        id: result.lastID,
        title: title.trim(),
        author: author.trim(),
        price,
        pages,
      },
    });
  } catch (error) {
    console.error(`Error in POST /books/: ${error.message}`);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Endpoint 4: Update an existing book (PUT /books/:bookId/)
app.put("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;
    const parsedId = parseInt(bookId, 10);
    if (isNaN(parsedId) || String(parsedId) !== String(bookId).trim()) {
      return res.status(400).json({ message: "Invalid book ID. Must be an integer." });
    }

    const { title, author, price, pages } = req.body;

    // Validate required fields and types
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (!author || typeof author !== "string" || !author.trim()) {
      return res.status(400).json({ message: "Author is required" });
    }
    if (price === undefined || price === null || typeof price !== "number" || isNaN(price) || price < 0) {
      return res.status(400).json({ message: "Price must be a valid number" });
    }
    if (pages === undefined || pages === null || typeof pages !== "number" || isNaN(pages) || pages <= 0) {
      return res.status(400).json({ message: "Pages must be a positive number" });
    }

    // Check if book exists
    const checkBookQuery = "SELECT * FROM book WHERE id = ?;";
    const existingBook = await db.get(checkBookQuery, [parsedId]);
    if (!existingBook) {
      return res.status(404).json({ message: "Book not found" });
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
    console.error(`Error in PUT /books/:bookId/: ${error.message}`);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Endpoint 5: Delete a book by ID (DELETE /books/:bookId/)
app.delete("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;
    const parsedId = parseInt(bookId, 10);
    if (isNaN(parsedId) || String(parsedId) !== String(bookId).trim()) {
      return res.status(400).json({ message: "Invalid book ID. Must be an integer." });
    }

    // Check if book exists
    const checkBookQuery = "SELECT * FROM book WHERE id = ?;";
    const existingBook = await db.get(checkBookQuery, [parsedId]);
    if (!existingBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    const deleteBookQuery = "DELETE FROM book WHERE id = ?;";
    await db.run(deleteBookQuery, [parsedId]);

    res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error(`Error in DELETE /books/:bookId/: ${error.message}`);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Catch-all 404 handler for unknown paths
app.use((req, res) => {
  res.status(404).json({ message: "404 - Route Not Found" });
});

module.exports = app;

