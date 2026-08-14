import axios from 'axios';
import fs from 'fs';
import { addProductWithPrice, updateProductPrice } from "../Data/database.ts";
import {response} from "express";
import * as dotenv from 'dotenv';
import * as path from 'path';

interface Header {
  "Accept-Encoding": string,
  "Content-type": string,
  'X-Algolia-Application-Id': string,
  'X-Algolia-API-Key': string,
  'x-algolia-agent': string,
}

interface Body {
  requests: [
    {
      indexName: string,
      query: string,
      hitsPerPage: number,
      page: number,
      attributesToRetrieve: string[],
    }
  ]
}
interface ProductResult {
    "storeData": {
        [storeId: string]: {
            "inStock": boolean,
            "multipromo": string,
            "offerDescription": string,
            "offerFrom": string,
            "offerUntil": string,
            "offerMax": number,
            "offerMaxDescription": string,
            "offerCount": number,
            "price": number,
            "beforePrice": number,
            "multiPromoPrice": string,
            "unitsOfMeasurePrice": number,
            "unitsOfMeasurePriceUnit": string,
            "unitsOfMeasureOfferPrice": number,
            "unitsOfMeasureShowPrice": number
        }
    },
    "article": string,
    "isInCurrentLeaflet": boolean,
    "name": string,
    "description": string,
    "brand": string,
    "units": number,
    "unitsOfMeasure": string,
    "properties": [],
    "attributes": [{
        "attributeID": string,
        "attributeName": string,
        "attributeIconID": string,
        "attributeNameAndIcon": string
    }],
    "images": [string],
    "categories": {
        "lvl0": [string],
        "lvl1": [string],
        "lvl2": [string]
    },
    "cpOffer": boolean,
    "cpOfferPrice": number,
    "cpOfferAmount": number,
    "erp_product_id": string,
    "objectID": string,
    "_highlightResult": {
        "searchHierachy": [{ "value": string, "matchLevel": string, "matchedWords": [] }, {
            "value": string,
            "matchLevel": string,
            "matchedWords": []
        }, { "value": string, "matchLevel": string, "matchedWords": [] }, {
            "value": string,
            "matchLevel": string,
            "matchedWords": []
        }, { "value": string, "matchLevel": string, "matchedWords": [] }],
        "gtin": { "value": string, "matchLevel": string, "matchedWords": [] },
        "name": { "value": string, "matchLevel": string, "matchedWords": [] },
        "manufacturer": { "value": string, "matchLevel": string, "matchedWords": [] },
        "brand": { "value": string, "matchLevel": string, "matchedWords": [] },
        "subBrand": { "value": string, "matchLevel": string, "matchedWords": [] },
        "productName": { "value": string, "matchLevel": string, "matchedWords": [] }
    }
}

interface Response {
  results: [{
      hits: [ProductResult],
      "nbHits": number,
      "page": number,
      "ngPage": number,
      "hitsPerPage": number,
      "exhaustiveNbHits": boolean,
      "exhaustiveType": boolean,
      "exhaustive": {
        "nbHits": boolean,
        "typo": boolean,
      },
    "query": string,
    "params": string,
    "index": string,
    "renderingContent": {},
    "extensions": {
        "queryCategorization": {}
    },
    "processingTimeMS": 1,
    "processingTimingsMS":{"_request":
          {
            "roundTrip":number,
            "afterFetch": {
              "format": {
                "decompress":number,
                "highlighting":number,
                "total":number
              }
              },
            "total":number
          },
      "serverTimeMS":number
      }
    }]
}


export class SallingLib {
  url: string | undefined;
  headers: Header | undefined;
  body: Body | undefined;
  pages: number | undefined;
  store = "salling";
  apiKey: string = "0";
  apiStore: string = "SALLING";

  constructor(store: string, pageNR: number) {
    this.url = "https://f9vbjlr1bk-dsn.algolia.net/1/indexes/*/queries";
    this.apiKey = process.env[`${store.toUpperCase()}_API_KEY`];
    this.pages = pageNR;
    this.store = store;
    this.apiStore = store == "fotex" ? "FOETEX" : store.toUpperCase();
    this.headers = {
      'Accept-Encoding': 'gzip',
      'Content-type': 'application/json; charset=UTF-8',
      'X-Algolia-Application-Id': 'F9VBJLR1BK',
      'X-Algolia-API-Key': this.apiKey,
      'x-algolia-agent': 'Algolia for JavaScript (5.49.2); Search (5.49.2); Browser',
    }

    this.body = {
      requests: [
        {
          indexName: `prod_${this.apiStore}_PRODUCTS`,
          query: '',
          hitsPerPage: 1000,
          page: 0,
          attributesToRetrieve: [
            'objectID',
            'article',
            'erp_product_id',
            'name',
            'description',
            'price',
            'image',
            'images',
            'brand',
            'units',
            'unitsOfMeasure',
            'storeData',
            'attributes',
            'isInCurrentLeaflet',
            'categories',
            'cpOfferPrice',
            'cpOffer',
            'cpOfferAmount',
            'properties',
          ],
        },
      ],
    }
  }

  async fetchPageJsonResponse (this: any, pageNumber: number): Promise<Response> { // Returns JSON response for a page (1000 products)
    this.body['requests'][0]['page'] = pageNumber;
    const { data } = await axios.post(
        this.url,
        this.body,
        { headers: this.headers }
    )
    return data;
  }

    async addProductsToDB(this: any) {
        for (let i = 0; i < this.pages; i++) {
            const response = await this.fetchPageJsonResponse(i);
            const allHits: ProductResult[] = response.results.flatMap((result: { hits: any; }) => result.hits);
            for (const hit of allHits) {
                // @ts-ignore
                if (hit.name == "") {
                    continue;
                }
                const ean = hit?._highlightResult?.gtin?.value ?? "";
                const name = hit.name;
                const storeData = Object.values(hit.storeData)
                let price = storeData[0]['price'] / 1000;
                const quantity = hit.units;
                const quantityUnit = hit.unitsOfMeasure;
                const imageURL = hit.images[0];
                const brand = hit.brand;
                const standardUnit = storeData[0].unitsOfMeasurePriceUnit;
                const priceStandardUnit = storeData[0]['unitsOfMeasureShowPrice'] / 1000;
                if (storeData[0]['price'] < 1000) {
                    price = this.convertStandardUnitPriceToNormalPrice(quantity, quantityUnit, priceStandardUnit);
                }
                addProductWithPrice(ean, name, brand, imageURL, quantity, quantityUnit, standardUnit, this.store, price, priceStandardUnit, [""]); // TODO (DONE): Handle price not always being correct amount of digits (sometimes 3 and other times 4), also handle incorrect unitsOfMeasurePrice. Use unitsOfMeasureShowPrice or unitsOfMeasureOfferPrice
            }
        }
  }

    async updateProductPrices(this: any) {
        for (let i = 0; i < this.pages; i++) {
            const response = await this.fetchPageJsonResponse(i);
            const allHits: ProductResult[] = response.results.flatMap((result: { hits: any; }) => result.hits);
            for (const hit of allHits) {
                const ean = hit['_highlightResult']['gtin'].value;
                const storeData = Object.values(hit.storeData)
                const price = storeData[0]['price'] / 1000;
                const standardUnitPrice = storeData[0]['unitsOfMeasureOfferPrice'] / 1000;
                updateProductPrice(ean, this.store, price, standardUnitPrice)
            }
        }
  }

  convertStandardUnitPriceToNormalPrice(this: any, quantity: number, unit: string, standardUnitPrice: number) {
      if (unit == "stk" || unit == "kg" || unit == "l" || unit == "m" || unit == "Vaske" || unit == "L.B") {
          return standardUnitPrice * quantity;
      }
      if (unit == "g" || unit == "ml" || unit == "mm") {
          return standardUnitPrice * (quantity / 1000);
      }
      if (unit == "cl" || unit == "cm") {
          return standardUnitPrice * (quantity / 100);
      }
  }
}