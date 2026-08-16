import axios from 'axios';
import { addProductWithPrice, updateProductPrice } from "../Data/database.ts";

interface ResponseData {
    "id": number,
    "name": string,
    "underline": string,
    "department": {
        "id": number,
        "name": string,
        "important_information": string,
        "slug": string,
        "products_last_modified_at": string
    },
    "category": {
        "id": number,
        "name": string,
        "important_information": string,
        "slug": string,
        "is_hidden": boolean
    },
    "age_limit": number,
    "barcodes": [string],
    "search_words": [string],
    "hazard_precaution_statements": [],
    "labels": [{
        "id": number,
        "name": string,
        "image": string
    }],
    "description": string,
    "info": string,
    "declaration": string,
    "images": [{
        "small": string,
        "medium": string,
        "large": string
    }],
    "prices": [{
        "price": number,
        "price_over_max_quantity": number,
        "max_quantity": number,
        "is_advertised": boolean,
        "is_campaign": boolean,
        "starting_at": string,
        "ending_at": string,
        "deposit": number,
        "compare_unit": string,
        "compare_unit_price": number,
        "consumption_unit": string,
        "consumption_quantity": number
    }],
    "warnings": [],
    "gpsr": string,
    "surface_treatments": string,
    "produce": string,
    "temperature_zone": string,
    "is_self_scale_item": boolean,
    "is_weight_item": boolean,
    "is_available_in_all_stores": boolean,
    "is_batch_item": boolean,
    "origin_country": string,
    "wine_labels": []
}

interface Rema1000JSONResponse {
    "data": ResponseData;
    "meta": {
        "pagination": {
            "current_page": number,
            "from": number,
            "last_page": number,
            "links": {
                "first": string,
                "last": string,
                "prev": string,
                "next": string
            },
            "path": string,
            "per_page": number,
            "to": number,
            "total": number
        }
    }
}

export class Rema1000 {
    url:string;
    pages: number;
    store:string;
    constructor() {
        this.url = "https://api.digital.rema1000.dk/api/search/products?query=&per_page=1000&page="
        this.pages = 4;
        this.store = "rema1000";
    }

    async fetchPageJsonResponse (this: any, pageNumber: number): Promise<Response> { // Returns JSON response for a page (1000 products)
        this.body['requests'][0]['page'] = pageNumber;
        const { data } = await axios.post(
            this.url+pageNumber
        )
        return data;
    }
    async addProductsWithPrice(this: any) {
        for (let i = 1; i <= this.pages; i++) {
            const response = this.fetchPageJsonResponse(i);
            for (const result of response.data) {
                const name = result.name;
                const ean = result.barcodes[0];
                const price = result.prices[0].price;
                const standardUnit = this.standardizeUnit(result.prices[0].compare_unit);
                const standardUnitPrice = result.prices[0].compare_unit_price;
                const [quantity, quantityUnit, brand] = this.getQuantityAndBrand(result.underline)
                const imageURL = result.images[0].large
                addProductWithPrice(ean, name, brand, imageURL, quantity, quantityUnit, standardUnit, "rema1000", price, standardUnitPrice, [""]);
            }
        }
    }
    async updateProductPrices(this: any) {
        for (let i = 1; i <= this.pages; i++) {
            const response = this.fetchPageJsonResponse(i);
            for (const result of response.data) {
                const ean = result.barcodes[0];
                const price = result.prices[0].price;
                const standardUnitPrice = result.prices[0].compare_unit_price;
                updateProductPrice(ean, "rema1000", price, standardUnitPrice);
            }
        }
    }

    getQuantityAndBrand(this: any, quantityAndBrand: string): [number, string, string] {
        const [quantityWithUnit, brand] = quantityAndBrand.split(" / ")
        const [quantity, unit] = quantityWithUnit.split(" ");
        return [quantity as number, this.standardizeUnit(unit.toLowerCase().replaceAll("'","")), brand]
    }

    standardizeUnit(unit: string) {
        if (["", "kg", "ml", "sæt", "stk", "rl", "par", "cl"].includes(unit)) {
            return unit;
        }
        if (unit == "ltr") {
            return "l"
        }
        if (unit == "mtr") {
            return "m"
        }
        if (unit == "gr") {
            return "g";
        }
        return ""
    }
}