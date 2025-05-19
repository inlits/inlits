/*
  # Content Management Tables

  1. New Tables
    - `articles`
      - `id` (uuid, primary key)
      - `title` (text)
      - `content` (text)
      - `excerpt` (text)
      - `cover_url` (text)
      - `author_id` (uuid, references profiles)
      - `status` (text)
      - `tags` (text[])
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `books`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `cover_url` (text)
      - `price` (numeric)
      - `author_id` (uuid, references profiles)
      - `status` (text)
      - `tags` (text[])
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `book_chapters`
      - `id` (uuid, primary key)
      - `book_id` (uuid, references books)
      - `title` (text)
      - `content` (text)
      - `order` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for creators to manage their content
    - Add policies for users to view published content
*/

-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  excerpt text,
  cover_url text,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create books table
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  cover_url text,
  price numeric DEFAULT 0,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create book chapters table
CREATE TABLE IF NOT EXISTS book_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  "order" integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_chapters ENABLE ROW LEVEL SECURITY;

-- Create policies for articles
CREATE POLICY "Creators can insert their own articles"
  ON articles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Creators can update their own articles"
  ON articles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Creators can delete their own articles"
  ON articles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Published articles are viewable by everyone"
  ON articles
  FOR SELECT
  USING (status = 'published' OR auth.uid() = author_id);

-- Create policies for books
CREATE POLICY "Creators can insert their own books"
  ON books
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Creators can update their own books"
  ON books
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Creators can delete their own books"
  ON books
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Published books are viewable by everyone"
  ON books
  FOR SELECT
  USING (status = 'published' OR auth.uid() = author_id);

-- Create policies for book chapters
CREATE POLICY "Creators can manage chapters of their own books"
  ON book_chapters
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM books
    WHERE books.id = book_id
    AND books.author_id = auth.uid()
  ));

CREATE POLICY "Users can view chapters of published books"
  ON book_chapters
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM books
    WHERE books.id = book_id
    AND (books.status = 'published' OR books.author_id = auth.uid())
  ));

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_book_chapters_updated_at
  BEFORE UPDATE ON book_chapters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();