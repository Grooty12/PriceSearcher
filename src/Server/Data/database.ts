import Database from "better-sqlite3";
const db = new Database('prices')

db.exec(`
    CREATE TABLE IF NOT EXISTS products (
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

    CREATE TABLE IF NOT EXISTS stores (
                                          id INTEGER PRIMARY KEY AUTOINCREMENT,
                                          name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
                                              id INTEGER PRIMARY KEY AUTOINCREMENT,
                                              name TEXT UNIQUE NOT NULL,
                                              parent_id INTEGER REFERENCES categories(id)
        );

    CREATE TABLE IF NOT EXISTS product_stores (
                                                  product_id INTEGER REFERENCES products(id),
        store_id INTEGER REFERENCES stores(id),
        store_product_id TEXT,
        current_price REAL,
        currency TEXT DEFAULT 'DKK',
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (product_id, store_id)
        );

    CREATE TABLE IF NOT EXISTS prices (
                                          id INTEGER PRIMARY KEY AUTOINCREMENT,
                                          product_id INTEGER REFERENCES products(id),
        store_id INTEGER REFERENCES stores(id),
        price REAL NOT NULL,
        price_per_standard_quantity REAL,
        currency TEXT DEFAULT 'DKK',
        recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

    CREATE TABLE IF NOT EXISTS product_categories (
                                                      product_id INTEGER REFERENCES products(id),
        category_id INTEGER REFERENCES categories(id),
        PRIMARY KEY (product_id, category_id)
        );

    CREATE INDEX IF NOT EXISTS idx_prices_lookup ON prices(product_id, store_id, recorded_at DESC);
    CREATE INDEX IF NOT EXISTS idx_products_ean ON products(ean);
`);

  export interface ProductInterface {
    id: number;
    ean: string;
    name: string;
    brand?: string;
    image_url?: string;
    quantity_value?: number;
    quantity_unit?: string;
    standard_quantity_unit?: string;
    created_at: string;
  }

  interface Store {
    id: number;
    name: string;
  }

  interface Category {
    id: number;
    name: string;
    parent_id?: number;
  }

  interface Price {
    id: number;
    product_id: number;
    store_id: number;
    price: number;
    price_per_standard_quantity?: number;
    currency: string;
    recorded_at: string;
  }

  interface ProductStore {
    product_id: number;
    store_id: number;
    store_product_id?: string;
    current_price?: number;
    currency: string;
    last_updated: string;
  }

  // Prepared statements
  const insertStore = db.prepare<string, { lastInsertRowid: number }>(
      'INSERT OR IGNORE INTO stores (name) VALUES (?)'
  );

  const insertCategory = db.prepare<string, { lastInsertRowid: number }>(
      'INSERT OR IGNORE INTO categories (name) VALUES (?)'
  );


  const insertProduct = db.prepare(`
    INSERT INTO products (ean, name, brand, image_url, quantity_value, quantity_unit, standard_quantity_unit)
    VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(ean) DO UPDATE SET
        name = excluded.name,
                                brand = excluded.brand,
                                image_url = excluded.image_url
`);

const insertProductStore = db.prepare(`
    INSERT INTO product_stores (product_id, store_id, store_product_id, current_price)
    VALUES (?, ?, ?, ?)
        ON CONFLICT(product_id, store_id) DO UPDATE SET
        current_price = excluded.current_price,
                                                 last_updated = CURRENT_TIMESTAMP
`);

const insertPrice = db.prepare(`
    INSERT INTO prices (product_id, store_id, price, price_per_standard_quantity)
    VALUES (?, ?, ?, ?)
`);

const insertProductCategory = db.prepare(
    'INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES (?, ?)'
);

// Query statements
export const getProductByEan = db.prepare<string, ProductInterface>('SELECT * FROM products WHERE ean = ?');


// Insert helpers
function getOrCreateStore(name: string): number {
  const result = insertStore.run(name);
  if (result.changes > 0) { // @ts-ignore
      return result.lastInsertRowid as Number;
  }

  const store = db.prepare<string, Store>('SELECT id FROM Stores WHERE name = ?').get(name);
  return store!.id;
}

function getOrCreateCategory(name: string): number {
  const result = insertCategory.run(name);// @ts-ignore
    if (result.changes > 0) return result.lastInsertRowid;
  const category = db.prepare<string, Category>('SELECT id FROM categories WHERE name = ?').get(name);
  return category!.id;
}

function upsertProduct(product: Omit<ProductInterface, 'id' | 'created_at'>): number {
  const result = insertProduct.run(
      product.ean,
      product.name,
      product.brand,
      product.image_url,
      product.quantity_value,
      product.quantity_unit,
      product.standard_quantity_unit
  );
  return result.lastInsertRowid;
}

function linkProductToStore(
    productId: number,
    storeId: number,
    storeProductId: string | undefined,
    currentPrice: number
): void {
  insertProductStore.run(productId, storeId, storeProductId, currentPrice);
}

function logPrice(
    productId: number,
    storeId: number,
    price: number,
    pricePerStandardQuantity?: number
): void {
  insertPrice.run(productId, storeId, price, pricePerStandardQuantity);
}

/*function linkProductToCategory(productId: number, categoryId: number): void {
  insertProductCategory.run(productId, categoryId);
}*/

export const addProductWithPrice = db.transaction((
    ean: string,
    name: string,
    brand: string,
    imageUrl: string,
    quantityValue: number,
    quantityUnit: string,
    standardUnit: string,
    storeName: string,
    storeProductId: string,
    price: number,
    categories: string[]
) => {
    insertProduct.run(
        ean, name, brand, imageUrl, quantityValue, quantityUnit, standardUnit
    );
    const product = getProductByEan.get(ean);
    if (!product) throw new Error('Product upsert failed');
    const productId = product.id;
    const storeId = getOrCreateStore(storeName);
    insertProductStore.run(productId, storeId, storeProductId, price);
    insertPrice.run(productId, storeId, price, price);

    for (const category of categories) {
        const categoryId = getOrCreateCategory(category);
        insertProductCategory.run(productId, categoryId);
    }

    return productId;
});

export const updateProductPrice = db.transaction((
    ean: string,
    storeName: string,
    price: number,
    standardUnitPrice: number
)=> {
    const product = getProductByEan.get(ean);
    if (product) {
        const productId = product.id;
        const storeId = getOrCreateStore(storeName);
        logPrice(productId, storeId, price, standardUnitPrice);
    }

})
