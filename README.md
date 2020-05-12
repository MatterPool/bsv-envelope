# bsv-envelope
> Bitcoin SV Envelope Protocol Javascript Library
> Based on and compatible with: https://github.com/tokenized/envelope

## Installation and Usage

**Installation**
```sh
npm install bsv-envelope --save
```

**Include**
```javascript
// Include the library
var bsvenvelope = require('bsv-envelope');
```

# Bitcoin SV Envelope

## Create Public File

```javascript
const bsvenvelope = require('bsv-envelope');
const result = await bsvenvelope.fromObject({

});
```

> The above command returns the raw bytes of the file

This endpoint retrieves bitcoin file at txid

### HTTP Request

`GET https://media.bitcoinfiles.org/408d3b99a06afd01e1717d78a7a9d2ee1c08f59003022429ae9b0a66075dfd40`

### URL Parameters

Parameter | Description
--------- | -----------
txid |  Txid of the file

## Any questions or feedback?

We love to hear from you!

https://www.BitcoinFiles.org

https://www.matterpool.io


