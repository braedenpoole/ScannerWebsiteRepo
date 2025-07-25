const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 4000;

// These variables will store our fetched data in memory.
let cryptoData = null;
let techPrices = null;
let indexPrices = null;

// This is a helper function to create a pause between API calls.
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// This middleware allows your frontend to make requests to this backend.
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// --- THIS IS THE CRITICAL LINE TO SERVE YOUR HTML PAGES ---
// It tells Express to serve all files from the 'public' directory.
app.use(express.static('public'));


// --- Data Fetching Functions ---

async function fetchCryptoData() {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
            params: {
                vs_currency: 'usd',
                order: 'market_cap_desc',
                per_page: 250,
                page: 1,
                sparkline: false,
                price_change_percentage: '1h,24h'
            },
        });
        cryptoData = response.data;
        console.log('Cryptocurrency data fetched successfully.');
    } catch (error) {
        console.error('Error fetching cryptocurrency data:', error.message);
    }
}

async function fetchTechPrices() {
    const symbols = ['AAPL', 'MSFT', 'GOOG', 'AMZN', 'META', 'TSLA', 'LCID', 'RIVN', 'NIO', 'HYLN', 'NVDA', 'AMD', 'INTC', 'TSM', 'QCOM', 'MARA', 'CLSK', 'RIOT', 'CIFR', 'BITF', 'PLTR', 'IBM', 'AI', 'CRWD', 'SOUN', 'XOM', 'SHEL', 'COP', 'NEE', 'BP', 'JPM', 'BAC', 'WFC', 'MS', 'GS', 'UNH', 'ELV', 'CI', 'CVS', 'HCA'];
    const names = ['Apple', 'Microsoft', 'Google', 'Amazon', 'Meta', 'Tesla', 'Lucid', 'Rivian', 'NIO', 'Hyliion', 'Nvidia', 'AMD', 'Intel', 'Taiwan Semi', 'Qualcomm', 'Marathon Digital', 'Cleanspark', 'Riot Platforms', 'Cipher Mining', 'Bitfarms', 'Palantir', 'IBM', 'C3.ai', 'Crowdstrike', 'SoundHound AI', 'Exxon Mobil', 'Shell', 'ConocoPhillips', 'NextEra Energy', 'BP', 'JPMorgan Chase', 'Bank of America', 'Wells Fargo', 'Morgan Stanley', 'Goldman Sachs', 'UnitedHealth', 'Elevance Health', 'Cigna Group', 'CVS Health', 'HCA Healthcare'];
    const token = 'ciqtjq9r01qjff7cukf0ciqtjq9r01qjff7cukfg';

    const results = [];
    try {
        // This loop fetches one stock at a time with a delay to prevent rate-limiting.
        for (let i = 0; i < symbols.length; i++) {
            const symbol = symbols[i];
            const response = await axios.get('https://finnhub.io/api/v1/quote', {
                params: { symbol, token },
            });

            const { c, pc, h, l } = response.data;
            const change_24h = ((c - pc) / pc) * 100;
            results.push({
                symbol, name: names[i],
                close: c, change_24h, hod: h, lod: l,
            });

            // Wait for 1.1 seconds before the next request.
            await delay(1100);
        }

        techPrices = results;
        console.log('Tech stock prices fetched successfully.');
    } catch (error) {
        console.error('Error fetching tech stock prices:', error.message);
    }
}

async function fetchIndexPrices() {
    const symbols = ['SPY', 'DIA', 'QQQ', 'IWM', 'USO', 'UUP'];
    const names = ['S&P 500', 'Dow', 'Nasdaq', 'Russell 2000', 'Oil', 'US Dollar'];
    const token = 'ciqtjq9r01qjff7cukf0ciqtjq9r01qjff7cukfg';

    const results = [];
    try {
        // This loop fetches one index at a time with a delay.
        for (let i = 0; i < symbols.length; i++) {
            const symbol = symbols[i];
            const response = await axios.get('https://finnhub.io/api/v1/quote', {
                params: { symbol, token },
            });

            const { c, pc } = response.data;
            const change_24h = ((c - pc) / pc) * 100;
            results.push({ symbol, name: names[i], close: c, change_24h });

            // Wait for 1.1 seconds before the next request.
            await delay(1100);
        }

        indexPrices = results;
        console.log('Index prices fetched successfully.');
    } catch (error) {
        console.error('Error fetching index prices:', error.message);
    }
}


// --- API Endpoints ---
// These are the routes that your scanner.html page will call for data.
app.get('/api/crypto', (req, res) => res.json(cryptoData));
app.get('/api/TechPrices', (req, res) => res.json(techPrices));
app.get('/api/indices', (req, res) => res.json(indexPrices));


// --- Server Startup Logic ---
function fetchAllData() {
    fetchCryptoData();
    fetchTechPrices();
    fetchIndexPrices();
}

fetchAllData(); // Fetch all data once immediately when the server starts.
setInterval(fetchAllData, 300000); // Then, refresh the data every 5 minutes.

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});