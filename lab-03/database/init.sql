-- Create the book table if it does not already exist
CREATE TABLE IF NOT EXISTS book (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    price INTEGER NOT NULL,
    pages INTEGER NOT NULL
);

-- Insert 10 initial sample book records safely
INSERT OR IGNORE INTO book (id, title, author, price, pages) VALUES
(1, 'Harry Potter and the Sorcerer''s Stone', 'J.K. Rowling', 450, 309),
(2, 'The Hobbit', 'J.R.R. Tolkien', 399, 310),
(3, 'To Kill a Mockingbird', 'Harper Lee', 350, 281),
(4, '1984', 'George Orwell', 299, 328),
(5, 'The Great Gatsby', 'F. Scott Fitzgerald', 250, 180),
(6, 'Pride and Prejudice', 'Jane Austen', 280, 279),
(7, 'The Catcher in the Rye', 'J.D. Salinger', 320, 214),
(8, 'Clean Code', 'Robert C. Martin', 650, 464),
(9, 'The Pragmatic Programmer', 'Andrew Hunt', 720, 352),
(10, 'Introduction to Algorithms', 'Thomas H. Cormen', 999, 1312);

