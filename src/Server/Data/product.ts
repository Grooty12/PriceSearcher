
export class Product {
    // @ts-ignore
    productID: number;
    // @ts-ignore
    constructor(private readonly ean: number, private readonly productName: string, private readonly productPrice: number, private readonly quantity: number, private readonly quantityUnit: string, private readonly imageURL: string, private readonly storeProductID: number, private readonly stores: string[], private readonly brand: string, private readonly standardUnit: string) {
        this.ean = ean;
        this.productName = productName;
        this.productPrice = productPrice;
        this.quantity = quantity;
        this.quantityUnit = quantityUnit;
        this.imageURL = imageURL;
        this.storeProductID = storeProductID;
        this.brand = brand;
        this.stores = stores;
        this.standardUnit = standardUnit;
    }

    addProductID(productId: number) {
        this.productID = productId;
    }
    getEAN() {
        return this.ean
    }
    getProductName() {
        return this.productName;
    }
    getProductPrice() {
        return this.productPrice;
    }
    getQuantity() {
        return this.quantity;
    }
    getQuantityUnit() {
        return this.quantityUnit;
    }
    getImageURL() {
        return this.imageURL;
    }
    getStoreProductID() {
        return this.storeProductID;
    }
    getStores() {
        return this.stores;
    }
    getBrand() {
        return this.brand;
    }

    getStandardUnit() {
        return this.standardUnit;
    }
}