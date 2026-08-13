import express, {type Request, type Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
dotenv.config();
import {Netto} from "./Stores/netto.ts"
import {Fotex} from './Stores/fotex.ts'

import {
    getProductByEan,
    getProductPriceById,
    type ProductInterface,
    type Price,
    getProductByName
} from './Data/database.ts'

const firstRun = false;
const netto = new Netto();
const fotex = new Fotex();

if (firstRun) {
    await netto.addProductsToDB()
    console.log("Added Netto products")
    await fotex.addProductsToDB()
    console.log("Added Føtex products")
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

app.get('/api/prices/:ean', (req: SearchRequest, res: Response<Price>) => {
    const product = getProductByEan.get(req.params.ean);
    const price = getProductPriceById.get(product.id);
    res.json(price);
});

app.listen(3001, () => console.log('API running on http://localhost:3001'));