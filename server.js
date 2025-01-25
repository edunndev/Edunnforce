import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import { promises as fs } from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Proxy route for CoinGecko API
app.get('/api/prices', async (req, res) => {
    try {
        const [btcResponse, ethResponse] = await Promise.all([
            fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'),
            fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
        ]);

        const [btcData, ethData] = await Promise.all([
            btcResponse.json(),
            ethResponse.json()
        ]);

        
        const prices = {
            bitcoin: { usd: btcData?.bitcoin?.usd || 40000 },
            ethereum: { usd: ethData?.ethereum?.usd || 2000 }
        };

        res.json(prices);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch prices' });
    }
});


app.get('/api/btc/balance/:address', async (req, res) => {
    try {
        const response = await fetch(`https://blockchain.info/balance?active=${req.params.address}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch BTC balance' });
    }
});


app.get('/api/eth/balance/:address', async (req, res) => {
    try {
        const response = await fetch(`https://api.etherscan.io/api?module=account&action=balance&address=${req.params.address}&tag=latest`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch ETH balance' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


app.get('/api/words', async (req, res) => {
    try {
        const content = await fs.readFile(path.join(__dirname, 'bips.txt'), 'utf-8');
        const words = content.trim().split('\n');
        res.json(words);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch words' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
s(500).json({ error: 'Failed to fetch words' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
