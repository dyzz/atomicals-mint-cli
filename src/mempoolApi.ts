import axios from 'axios';

export interface Utxo {
    txid: string,
    index: number,
    value: number,
    confirmed: boolean,
}

async function fetchUTXOs(address: string, minValue: number = 0, confirmed: boolean = false): Promise<Utxo[]> {
    const url = `https://mempool.space/api/address/${address}/utxo`;

    try {
        const response = await axios.get(url);
        let utxos = response.data.map(utxo => ({
            txid: utxo.txid,
            index: utxo.vout,
            value: utxo.value,
            confirmed: utxo.status.confirmed,
        }));
        utxos = utxos.sort((a, b) => b.value - a.value);
        if (confirmed) {
            return utxos.filter(utxo => utxo.confirmed && utxo.value >= minValue);
        } else {
            return utxos.filter(utxo => utxo.value >= minValue);
        }
    } catch (error) {
        console.error("Error fetching UTXOs:", error);
        return [];
    }
}

async function getSatsByte(): Promise<number> {
    const url = `https://mempool.space/api/v1/fees/recommended`;

    try {
        const response = await axios.get(url);
        return response.data.fastestFee as number;
    } catch (error) {
        return 0;
    }
}

async function getHeight(): Promise<number> {
    const url = `https://mempool.space/api/blocks/tip/height`;
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error("Error fetching height:", error);
        return -1;
    }
}

async function getBtcAddressBalance(address): Promise<number> {
    try {
        const url = `https://mempool.space/api/address/${address}`;
        const response = await axios.get(url);

        const data = response.data;
        const confirmedBalance = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
        const unconfirmedBalance = data.mempool_stats.funded_txo_sum - data.mempool_stats.spent_txo_sum;

        const totalBalance = confirmedBalance + unconfirmedBalance;
        return totalBalance / 100000000; // converting satoshi to BTC
    } catch (error) {
        console.error("Error fetching data:", error);
        return -1;
    }
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function postTransaction(hexData) {
    const url = 'https://mempool.space/api/tx';
    const maxRetries = 3;
    let attempts = 0;

    while (attempts < maxRetries) {
        try {
            const response = await axios.post(url, hexData, {
                headers: {
                    'Content-Type': 'text/plain'
                }
            });
            // Wait for mempool.space to have the transaction in mempool
            await sleep(1500);
            return true;
        } catch (error) {
            console.error(`Attempt ${attempts + 1}: Error posting transaction`, error);
            attempts++;
            if (attempts === maxRetries) {
                return false; // Max retries reached, return false
            }
            await sleep(1000);
        }
    }
}

export { fetchUTXOs, getSatsByte, getHeight, getBtcAddressBalance, postTransaction };