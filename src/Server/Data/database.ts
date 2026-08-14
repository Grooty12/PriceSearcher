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

export interface Price {
    id: number;
    product_id: number;
    store_id: number;
    price: number;
    price_per_standard_quantity?: number;
    currency: string;
    recorded_at: string;
  }


  // Prepared statements
  const insertStore = db.prepare<string, { lastInsertRowid: number }>(
      'INSERT OR IGNORE INTO stores (name) VALUES (?)'
  );

  const getStoreByName = db.prepare<string, {id: number}>('SELECT id FROM stores where name = ?');

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

const insertPrice = db.prepare(`
    INSERT INTO prices (product_id, store_id, price, price_per_standard_quantity)
    VALUES (?, ?, ?, ?)
`);

const insertProductCategory = db.prepare(
    'INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES (?, ?)'
);

// Query statements
export const getProductByEan = db.prepare<string, ProductInterface>('SELECT * FROM products WHERE ean = ?');

export const getProductPriceById = db.prepare<[number, number], Price>('SELECT * FROM prices WHERE product_id = ? LIMIT ?');

export const getProductPriceByIdAndStore = db.prepare<[number, number, number], Price>('SELECT * FROM prices WHERE id = ? AND store_id = ? LIMIT ?');

export const getProductsByName = db.prepare<[string, number], ProductInterface>(`
    SELECT * FROM products
    WHERE name LIKE '%' || ? || '%'
    LIMIT ?;
`);

// Insert helpers
function getOrCreateStore(name: string): number {
  const result = insertStore.run(name);
  if (result.changes > 0) { // @ts-ignore
      return result.lastInsertRowid as Number;
  }

  const store = db.prepare<string, Store>('SELECT id FROM Stores WHERE name = ?').get(name);
  return store!.id;
}

function getStore(name: string): number {
    const row = getStoreByName.get(name.toLowerCase());
    if (!row) {
        throw new Error(`Store not found: ${name}`);
    }
    return row.id;
}

function getOrCreateCategory(name: string): number {
  const result = insertCategory.run(name);// @ts-ignore
    if (result.changes > 0) return result.lastInsertRowid;
  const category = db.prepare<string, Category>('SELECT id FROM categories WHERE name = ?').get(name);
  return category!.id;
}
function logPrice(
    productId: number,
    storeId: number,
    price: number,
    pricePerStandardQuantity?: number
): void {
  insertPrice.run(productId, storeId, price, pricePerStandardQuantity);
}

export const addProductWithPrice = db.transaction((
    ean: string,
    name: string,
    brand: string,
    imageUrl: string,
    quantityValue: number,
    quantityUnit: string,
    standardUnit: string,
    storeName: string,
    price: number,
    priceStandardUnit: number,
    categories: string[]
) => {
    insertProduct.run(
        ean, name, brand, imageUrl, quantityValue, quantityUnit, standardUnit
    );
    const product = getProductByEan.get(ean);
    if (!product) throw new Error('Product upsert failed');
    const productId = product.id;
    const storeId = getOrCreateStore(storeName);
    insertPrice.run(productId, storeId, price, priceStandardUnit);

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

export function getProductPrices(productId: number, storeId?: number, limit: number = 1): Price[] | undefined {
    if (storeId === undefined || storeId === null) {
        return getProductPriceById.all(productId, limit);
    } else {
        return getProductPriceByIdAndStore.all(productId, storeId, limit);
    }
}

export function searchProductsByName(name: string, stores?: string[], limit: number = 10) {
    const products = getProductsByName.all(name, limit);
    if (stores === undefined || stores.length === 0) {
        return products;
    }
    const results: ProductInterface[] = []
    const storesArray = stores.map(name => getStore(name));
    for (const product of products) {
        for (const store of storesArray) {
            const latestProductPriceForStore = getProductPrices(product.id, store);
            if (latestProductPriceForStore === undefined) {
                continue;
            } else {
                results.push(product);
                break;
            }
        }
    }
    return results;
}