const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 4000;

let TechPrices = null;
let cryptoData = null;
let topCryptoData = null;
let indexPrices = null;

// Enable CORS headers
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Create a proxy middleware for CoinGecko API
const coinGeckoProxy = createProxyMiddleware({
    target: 'https://api.coingecko.com',
    changeOrigin: true,
    secure: true,
    pathRewrite: {
        '^/coingecko/api/v3/coins/markets': '/api/v3/coins/markets',
    },
});

// Proxy requests to CoinGecko API
app.use('/coingecko', coinGeckoProxy);

async function fetchTopCryptoData() {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
            params: {
                vs_currency: 'usd',
                order: 'market_cap_desc',
                per_page: 249,
                page: 2,
                price_change_percentage: '1h,24h', // Include both 1-hour and 24-hour percentage changes
            },
        });

        topCryptoData = response.data;
        console.log('Top cryptocurrency data fetched and stored.');
    } catch (error) {
        console.error('Error fetching top cryptocurrency data:', error.message);
    }
}

async function fetchCryptoData() {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
            params: {
                vs_currency: 'usd',
                order: 'market_cap_desc',
                per_page: 9,
                page: 1,
                price_change_percentage: '1h,24h',
            },
        });

        cryptoData = response.data;
        console.log('Cryptocurrency data fetched and stored.');
    } catch (error) {
        console.error('Error fetching cryptocurrency data:', error.message);
    }

    await new Promise((resolve) => setTimeout(resolve, 60000));
}

async function fetchTechPrices() {
    const symbols = ['AAPL', 'MSFT', 'GOOG', 'AMZN', 'META', 'TSLA', 'LCID', 'RIVN', 'NIO', 'NKLA', 'NVDA', 'AMD', 'INTC', 'TSM', 'QCOM', 'XOM', 'WMT', 'JPM', 'UNH', 'ORCL', 'GFAI', 'MARA', 'AI', 'AMC', 'CVNA', 'V', 'ETSY', 'SHOP', 'DIS', 'NFLX'];
    const names = ['Apple', 'Microsoft', 'Google', 'Amazon', 'Meta', 'Tesla', 'Lucid', 'Rivian', 'NIO', 'Nikola', 'Nvidia', 'AMD', 'Intel', 'Taiwan SemiConductor', 'Qualcomm', 'Exxon', 'Walmart', 'JPMorgan', 'UnitedHealth', 'Oracle', 'Guardforce AI', 'Marathon Digital', 'C3.ai', 'AMC', 'Carvana', 'Visa', 'Etsy', 'Shopify', 'Disney', 'Netflix']
    const token = 'ciqtjq9r01qjff7cukf0ciqtjq9r01qjff7cukfg';

    try {
        const promises = symbols.map(async (symbol, stockName) => {
            const response = await axios.get('https://finnhub.io/api/v1/quote', {
                params: {
                    symbol: symbol,
                    token: token,
                },
            });

            const { c, pc, h, l } = response.data;
            const change_24h = ((c - pc) / pc) * 100; // Calculate the 24-hour change in percentage
            return {
                symbol: symbol,
                close: c,
                change_24h: change_24h,
                name: names[stockName],
                hod: h,
                lod: l,

            };
        });

        TechPrices = await Promise.all(promises);

        lastApiCallTime = new Date();
        console.log('Stock prices fetched and stored.');
    } catch (error) {
        console.error('Error fetching tech stock prices:', error.message);
    }

    await new Promise((resolve) => setTimeout(resolve, 60000));
}


async function fetchIndexPrices() {
    const symbols = ['SPY', 'DIA', 'QQQ', 'IWM', 'USO', 'UUP'];
    const token = 'ciqtjq9r01qjff7cukf0ciqtjq9r01qjff7cukfg';
    const names = ['S&P 500', 'Dow', 'Nasdaq', 'Russell 2000', 'Oil', 'US Dollar']

    try {
        const promises = symbols.map(async (symbol, index) => {
            const response = await axios.get('https://finnhub.io/api/v1/quote', {
                params: {
                    symbol: symbol,
                    token: token,
                },
            });

            const { c, pc } = response.data; // Get the current price (c) and the previous close (pc)
            const change_24h = ((c - pc) / pc) * 100; // Calculate the 24-hour change in percentage

            return {
                symbol: symbol,
                close: c,
                change_24h: change_24h,
                name: names[index],
            };
        });

        indexPrices = await Promise.all(promises);

        lastApiCallTime = new Date();
        console.log('Index prices fetched and stored.');
    } catch (error) {
        console.error('Error fetching index stock prices:', error.message);
    }

    await new Promise((resolve) => setTimeout(resolve, 60000));
}



fetchCryptoData();
fetchTopCryptoData();
fetchTechPrices();

setInterval(fetchCryptoData, 300000);
setInterval(fetchTechPrices, 300000);
setInterval(fetchTopCryptoData, 300000);

function fetchAndRefreshIndexPrices() {
    fetchIndexPrices();
    setInterval(fetchIndexPrices, 300000);
}

setTimeout(fetchAndRefreshIndexPrices, 62000);

app.use(express.static('public'));

app.get('/api/cryptodata', (req, res) => {
    res.json(cryptoData);
});

app.get('/api/topCryptoData', (req, res) => {
    res.json(topCryptoData);
});

app.get('/api/TechPrices', (req, res) => {
    res.json(TechPrices);
});

app.get('/api/indexPrices', (req, res) => {
    res.json(indexPrices);
})

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
