import Database from "better-sqlite3";
const db = new Database('prices')

import type { ProductSearchResult, ProductWithMetadata, Store, ProductSearchResultStores, ProductSearchResultPrices } from "./searchResultInterfaces.ts";

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
                                      name TEXT UNIQUE NOT NULL,
                                      display_name TEXT UNIQUE NOT NULL,
                                      favicon_url TEXT NOT NULL
                                      
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
  const insertStore = db.prepare<[string, string, string], { lastInsertRowid: number }>(
      'INSERT OR IGNORE INTO stores (name, display_name, favicon_url) VALUES (?, ?, ?)'
  );

  const getStoreByName = db.prepare<string, {id: number}>('SELECT id FROM stores where name = ?');

  const insertCategory = db.prepare<string, { lastInsertRowid: number }>(
      'INSERT OR IGNORE INTO categories (name) VALUES (?)'
  );


  const insertProduct = db.prepare(`
    INSERT OR IGNORE INTO products (ean, name, brand, image_url, quantity_value, quantity_unit, standard_quantity_unit)
    VALUES (?, ?, ?, ?, ?, ?, ?)

`);
//         ON CONFLICT(ean) DO UPDATE SET
//             name = excluded.name,
//             brand = excluded.brand,
//             quantity_unit = CASE WHEN quantity_unit = '' THEN excluded.quantity_unit ELSE quantity_unit END

const insertPrice = db.prepare(`
    INSERT INTO prices (product_id, store_id, price, price_per_standard_quantity)
    VALUES (?, ?, ?, ?)
`);

const insertProductCategory = db.prepare(
    'INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES (?, ?)'
);

const countProducts = db.prepare<[], number>('SELECT COUNT(*) FROM products').pluck();

const getAllStores = db.prepare<[], Store>('SELECT * FROM stores');

export const getProductByEan = db.prepare<string, ProductInterface>('SELECT * FROM products WHERE ean = ?');

export const getProductPriceById = db.prepare<[number, number], Price>('SELECT * FROM prices WHERE product_id = ? LIMIT ?');

export const getProductPriceByIdAndStore = db.prepare<[number, number, number], Price>('SELECT * FROM prices WHERE id = ? AND store_id = ? LIMIT ?');

const getProductSearchResultPricesByIdAndStore = db.prepare<[number, number, number], ProductSearchResultPrices[]>(`
    SELECT 
        price, 
        price_per_standard_quantity AS price_standard_unit, 
        currency,
        recorded_at AS date
    FROM prices WHERE product_id = ? AND store_id = ? LIMIT ?
`)

const getCurrentPriceForProductAndStore = db.prepare<[number, number], ProductSearchResultPrices>(`
    SELECT
        price,
        price_per_standard_quantity AS price_standard_unit,
        currency,
        recorded_at AS date
    FROM prices WHERE product_id = ? AND store_id = ?
    ORDER BY recorded_at DESC
    LIMIT 1
`)

export const getProductsByName = db.prepare<[string, number], ProductInterface>(`
    SELECT * FROM products
    WHERE name LIKE '%' || ? || '%'
    LIMIT ?;
`);


// Insert helpers
export function getOrCreateStore(name: string, realName: string, favicon: string): number {
  const result = insertStore.run(name, realName, favicon);
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

export function getStores(): Store[] {
    return getAllStores.all();
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

export function addProductWithPrice(ean: string, name: string, brand: string, imageUrl: string, quantityValue: number, quantityUnit: string, standardUnit: string, storeId: number, price: number, priceStandardUnit: number, categories: string[]) {
    insertProduct.run(
        ean, name.toLowerCase(), brand !== undefined ? brand.toLowerCase() : brand, imageUrl, quantityValue, quantityUnit, standardUnit
    );
    const product = getProductByEan.get(ean);
    if (!product) throw new Error('Product upsert failed');
    const productId = product.id;
    insertPrice.run(productId, storeId, price, priceStandardUnit);

    for (const category of categories) {
        const categoryId = getOrCreateCategory(category);
        insertProductCategory.run(productId, categoryId);
    }

}

export function updateProductPrice(ean: string, storeId: number, price: number, standardUnitPrice: number) {
    const product = getProductByEan.get(ean);
    if (product) {
        const productId = product.id;
        const oldPrice = getProductSearchResultPricesByIdAndStore.get(productId, storeId, 1)
        if (oldPrice === undefined || oldPrice[0] === undefined || oldPrice[0].price !== price) {
            logPrice(productId, storeId, price, standardUnitPrice);
        }
    }
}

export function searchProductsByName(name: string, limit: number = 10, pricesLimit: number = 50):ProductSearchResult | undefined {
    const products = getProductsByName.all(name.toLowerCase(), limit);
    return buildSearchResultsJSON(products, pricesLimit);
}

function getProductMetadata(product:ProductInterface, pricesLimit: number = 50) {
    const productStores: ProductSearchResultStores[] = [];
    let [cheapestPrice, cheapestPriceStandardQuantity, cheapestPriceStoreId, cheapestPriceStoreName, cheapestPriceStoreFavicon] = [0, 0, 0, "", ""];
    for (const store of getStores()) {
        const productStorePrices: ProductSearchResultPrices[] | undefined = getProductSearchResultPricesByIdAndStore.get(product.id, store.id, pricesLimit)
        const currentPrice: ProductSearchResultPrices | undefined = getCurrentPriceForProductAndStore.get(product.id, store.id);
        if (productStorePrices !== undefined && currentPrice !== undefined) {
            if (cheapestPrice === 0 || currentPrice.price < cheapestPrice) {
                cheapestPrice = currentPrice.price;
                cheapestPriceStandardQuantity = currentPrice.price_standard_unit;
                cheapestPriceStoreId = store.id;
                cheapestPriceStoreName = store.display_name;
                cheapestPriceStoreFavicon = store.favicon_url;
            }
            productStores.push({
                id: store.id,
                name: store.name,
                display_name: store.display_name,
                store_favicon: store.favicon_url,
                price: currentPrice.price,
                price_standard_unit: currentPrice.price_standard_unit,
                price_history: productStorePrices,
            })
        }
    }
    return {
        id: product.id,
        ean: product.ean,
        name: product.name,
        brand: product.brand,
        image_url: product.image_url,
        quantity_value: product.quantity_value,
        quantity_unit: product.quantity_unit,
        standard_quantity_unit: product.standard_quantity_unit,
        categories: [],
        cheapest_price: cheapestPrice,
        cheapest_price_standard_quantity: cheapestPriceStandardQuantity,
        cheapest_price_store_id: cheapestPriceStoreId,
        cheapest_price_store_name: cheapestPriceStoreName,
        cheapest_price_store_favicon: cheapestPriceStoreFavicon,
        stores: productStores

    }
}

export function findProductByEAN(ean: string, pricesLimit: number = 50):ProductWithMetadata | undefined {
    const product:ProductInterface | undefined = getProductByEan.get(ean);
    if (!product) {
        return undefined;
    }
    return getProductMetadata(product, pricesLimit);
}

function buildSearchResultsJSON(products: ProductInterface[], pricesLimit: number = 50):ProductSearchResult | undefined {
    const results: ProductWithMetadata[] = [];
    for (const product of products) {
        results.push(getProductMetadata(product, pricesLimit));
    }
    const response: ProductSearchResult = {
        nResults: results.length,
        nbResults: countProducts.get(),
        results: results
    }
    return response;
}