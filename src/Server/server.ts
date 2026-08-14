import express, {type Request, type Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
dotenv.config();
import {Netto} from "./Stores/netto.ts"
import {Fotex} from './Stores/fotex.ts'
import {Meny} from "./Stores/meny.ts";

import {
    getProductByEan,
    searchProductsByName,
    type ProductInterface,
    type Price,
} from './Data/database.ts'

const firstRun = false;
const updatePrice = false;
const netto = new Netto();
const fotex = new Fotex();
const meny = new Meny();

if (firstRun) {
    await netto.addProductsToDB()
    console.log("Added Netto products")
    await fotex.addProductsToDB()
    console.log("Added Føtex products")
}
if (updatePrice) {
    await netto.updateProductPrices();
    console.log("Updated Netto Price")
    await fotex.updateProductPrices();
    console.log("Updated Føtex Price")
}

const app = express();
app.use(cors());
app.use(express.json());

interface SearchRequest extends Request<{ ean: string; }> {}
interface SearchRequestName extends Request<{ name: string; }> {}

// Get product by EAN
app.get('/api/products/:ean', (req: SearchRequest, res: Response<ProductInterface>) => {
    const product = getProductByEan.get(req.params.ean);
    res.json(product);
});

app.get('/api/productsName/:name', (req: SearchRequestName, res: Response<ProductInterface[]>) => {
    const products = searchProductsByName(req.params.name);
    res.json(products)
})

app.listen(3001, () => console.log('API running on http://localhost:3001'));