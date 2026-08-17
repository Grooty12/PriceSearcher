export interface ProductSearchResultPrices {
    date: string;
    price: number;
    price_standard_unit: number;
    currency: string;
}

export interface ProductSearchResultStores {
    id: number;
    name: string;
    store_favicon: string;
    display_name: string;
    price: number;
    price_standard_unit: number;
    price_history: ProductSearchResultPrices[];
}

export interface ProductWithMetadata {
    id: number;
    ean: string;
    name: string;
    brand?: string;
    image_url?: string;
    quantity_value?: number;
    quantity_unit?: string;
    standard_quantity_unit?: string;
    categories: string[];
    cheapest_price: number;
    cheapest_price_standard_quantity: number;
    cheapest_price_store_id: number;
    cheapest_price_store_name: string;
    cheapest_price_store_favicon: string;
    stores: ProductSearchResultStores[];
}

export interface ProductSearchResult {
    nResults: number;
    nbResults: number;
    results: ProductWithMetadata[];
    errorMessage?: string;
}

export interface Store {
    id: number;
    name: string;
    display_name: string;
    favicon_url: string;
}