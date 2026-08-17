import express, {type Request, type Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
dotenv.config();
import {Netto} from "./Stores/netto.ts"
import {Fotex} from './Stores/fotex.ts'
import {Meny} from "./Stores/meny.ts";
import {Rema1000} from "./Stores/rema1000.ts";

import {
    findProductByEAN,
    searchProductsByName,
    type Store,
    getStores,
    type ProductSearchResult,
    type ProductWithMetadata
} from './Data/database.ts'

const firstRun = false;
const updatePrice = false;
const netto = new Netto();
const fotex = new Fotex();
const meny = new Meny();
const rema1000 = new Rema1000();
if (firstRun) {
    await rema1000.addProductsToDB();
    console.log("Added Rema1000 products")
    await netto.addProductsToDB()
    console.log("Added Netto products")
    await fotex.addProductsToDB()
    console.log("Added Føtex products")
    await meny.addProductsToDB()
    console.log("Added Meny products")
}
if (updatePrice) {
    await netto.updateDBPrices();
    console.log("Updated Netto Price")
    await fotex.updateDBPrices();
    console.log("Updated Føtex Price")
    await rema1000.updateDBPrices();
    console.log("Updated Rema1000 prices")
    //await meny.updateDBPrices();
    //console.log("Updated Meny prices")
}

const app = express();
app.use(cors());
app.use(express.json());

interface SearchRequest extends Request<{ ean: string; }> {}
interface SearchRequestName {
    q?: string;
}

// Get product by EAN
app.get('/api/products/byEan/:ean', (req: SearchRequest, res: Response<ProductWithMetadata>) => {
    const product = findProductByEAN(req.params.ean);
    console.log(product);
    res.json(product);
});

app.get('/api/products/byName/search', (req: Request<{}, {}, {}, SearchRequestName>, res: Response<ProductSearchResult>) => {
    const query = req.query.q;
    if (!query) {
        return res.json({errorMessage: "Missing search query"});
    }
    const products = searchProductsByName(query);
    res.json(products)
})

app.get('/api/stores', (_req: Request, res: Response<Store[]>) => {
    const stores: Store[] = getStores();
    res.json(stores);
})

app.listen(3001, () => console.log('API running on http://localhost:3001'));