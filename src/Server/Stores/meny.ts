import axios from "axios";
import { addProductWithPrice, updateProductPrice } from "../Data/database.ts";


export function meny () {
  const url =
    'https://longjohnapi-meny.azurewebsites.net/Relewise/search?merchantId=558155&pageNumber=0&pageSize=5000';
    console.log(url);
}

export class meny {
    url: string | undefined;
    store: string | undefined
    constructor() {
        this.url = "https://longjohnapi-meny.azurewebsites.net/Relewise/search?merchantId=558155&pageNumber=0&pageSize=5000";
        this.store = "meny";
    }
    async fetchJson(this: any) {
        const { data } = await axios.post(
            this.url,
        )
        return data;
    }

    async addProductsWithPrice(this: any) {
        const response = await this.fetchJson();
        const products = await response.results.flatMap((result: { products: any; }) => result.products);
        for (const product of products) {
            const ean = product.sku;
            const name = product.productDisplayName;
            const price = product.price;
            const [quantity, quantityUnit] = this.parseQuantityAndUnit(product.summary)
            const [standardUnitPrice, standardUnit] = this.calculateStandardUnitPrice(price, quantity, quantityUnit);
            const brand = "" // TODO: Find via OFF
            const imageURL = product.highResImg;
            addProductWithPrice(ean, name, brand, imageURL, quantity, quantityUnit, standardUnit, this.store, price, standardUnitPrice, [""]);
        }
    }

    async updateProductPrices(this: any) {
        const response = await this.fetchJson();
        const products = await response.results.flatMap((result: { products: any; }) => result.products);
        for (const product of products) {
            const ean = product.sku;
            const price = product.price;
            const [quantity, quantityUnit] = this.parseQuantityAndUnit(product.summary)
            const [standardUnitPrice] = this.calculateStandardUnitPrice(price, quantity, quantityUnit);
            updateProductPrice(ean, "meny", price, standardUnitPrice)
        }
    }

    parseQuantityAndUnit(this: any, quantityAndUnit: string) {
        const [qty, unit] = quantityAndUnit.split(" ");
        const quantity = qty as unknown as number;
        if (unit.toLowerCase() == "gr" || unit.toLowerCase() == "mg" || unit.toLowerCase() == "gl") { // Gram
            return [quantity, "g"];
        }
        if (unit.toLowerCase() == "kg") { // Kilogram
            return [quantity, "kg"];
        }
        if (unit.toLowerCase() == "cl") { // Centiliter
            return [quantity, "cl"];
        }
        if (unit.toLowerCase() == "lt" || unit.toLowerCase() == "l" || unit.toLowerCase() == "dl") { // Liter
            return [quantity, "l"]
        }
        if (unit.toLowerCase() == "st") { // Piece
            return [quantity, "st"]
        }
        if (unit.toLowerCase() == "bd" || unit.toLowerCase() == "bt") { // Bundt
            return [quantity, "bt"]
        }
        if (unit.toLowerCase() == "ml" || unit.toLowerCase() == "fl") {
            return [quantity, "ml"];
        }
        if (unit.toLowerCase() == "m" || unit.toLowerCase() == "mt") {
            return [quantity, "m"]
        }
        if (unit.toLowerCase() == "pt") { // Potte
            return [quantity, "pt"]
        }
        if (unit.toLowerCase() == "_") { // No unit. TODO: Try and guess unit
            return [quantity, "_"]
        }
    }

    calculateStandardUnitPrice(this: any, price: number, quantity: number, unit: string) {
        if (unit.toLowerCase() == "g") {
            return [(1000/quantity)*price, "kg"];
        }
        if (unit.toLowerCase() == "kg") {
            return [(1/quantity)*price, "kg"];
        }
        if (unit.toLowerCase() == "cl") {
            return [(100/quantity)*price, "l"];
        }
        if (unit.toLowerCase() == "l") {
            return [price/quantity, "l"]
        }
        if (unit.toLowerCase() == "st") {
            return [price/quantity, "st"]
        }
        if (unit.toLowerCase() == "bt") {
            return [price/quantity, "bt"]
        }
        if (unit.toLowerCase() == "ml") {
            return [(1000/quantity)*price, "l"];
        }
        if (unit.toLowerCase() == "m") {
            return [price/quantity, "m"]
        }
        if (unit.toLowerCase() == "pt") {
            return [price/quantity, "pt"]
        }
        if (unit.toLowerCase() == "_") {
            return [price, "_"]
        }
    }
}
