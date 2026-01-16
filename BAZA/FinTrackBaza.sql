CREATE TABLE users (
                       id INT GENERATED ALWAYS AS IDENTITY,
                       email VARCHAR(255) UNIQUE NOT NULL,
                       password_hash TEXT NOT NULL,
                       first_name VARCHAR(100),
                       last_name VARCHAR(100),
                       created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE categories (
                            id INT GENERATED ALWAYS AS IDENTITY,
                            user_id INT REFERENCES users(id) ON DELETE CASCADE,
                            name VARCHAR(100) NOT NULL,
                            type VARCHAR(10) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
                            UNIQUE (user_id, name)
);

CREATE TABLE transactions (
                              id INT GENERATED ALWAYS AS IDENTITY,
                              user_id INT REFERENCES users(id) ON DELETE CASCADE,
                              category_id INT REFERENCES categories(id),
                              amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
                              transaction_date DATE NOT NULL,
                              description TEXT,
                              created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE saving_goals (
                              id INT GENERATED ALWAYS AS IDENTITY,
                              user_id INT REFERENCES users(id) ON DELETE CASCADE,
                              name VARCHAR(100) NOT NULL,
                              target_amount NUMERIC(12,2) NOT NULL CHECK (target_amount > 0),
                              current_amount NUMERIC(12,2) DEFAULT 0 CHECK (current_amount >= 0),
                              deadline DATE,
                              created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_date
    ON transactions(user_id, transaction_date);

CREATE INDEX idx_transactions_category
    ON transactions(category_id);

