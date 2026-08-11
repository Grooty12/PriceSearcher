# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).


# Create sqlite database
```
sqlite3 prices
```
``` sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ean TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    brand TEXT,
    image_url TEXT,
    quantity_value REAL,
    quantity_unit TEXT,
    standard_quantity_unit TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    parent_id INTEGER REFERENCES categories(id)
);

CREATE TABLE product_stores (
    product_id INTEGER REFERENCES products(id),
    store_id INTEGER REFERENCES stores(id),
    store_product_id TEXT,
    current_price REAL,
    currency TEXT DEFAULT 'DKK',
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id, store_id)
);

CREATE TABLE prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER REFERENCES products(id),
    store_id INTEGER REFERENCES stores(id),
    price REAL NOT NULL,
    price_per_standard_quantity REAL,
    currency TEXT DEFAULT 'DKK',
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_categories (
    product_id INTEGER REFERENCES products(id),
    category_id INTEGER REFERENCES categories(id),
    PRIMARY KEY (product_id, category_id)
);

CREATE INDEX idx_prices_lookup ON prices(product_id, store_id, recorded_at DESC);
CREATE INDEX idx_products_ean ON products(ean);
```