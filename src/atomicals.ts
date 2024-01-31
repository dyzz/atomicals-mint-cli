import { script, payments, networks } from "bitcoinjs-lib";
import { IWalletRecord } from "./wallet";

import { encode } from 'borc';

const getDmintPayload = function (ticker: string, time: number, bitworkc: string, bitworkr?: string): Buffer {
    const payload = {
        "args": {
            "time": time,
            "nonce": 0,
            "mint_ticker": ticker,
            "bitworkc": bitworkc,
        },
    };
    if (bitworkr) {
        payload.args["bitworkr"] = bitworkr;
    }
    console.log(payload);
    return encode(payload);
}

function chunkBuffer(buffer: Buffer, chunkSize: number) {
    const result: Buffer[] = [];
    const len = buffer.byteLength;
    let i = 0;
    while (i < len) {
        result.push(buffer.subarray(i, i += chunkSize));
    }
    return result;
}

const getAtomicalsEnvelope = function (opType: 'nft' | 'ft' | 'dft' | 'dmt' | 'sl' | 'x' | 'y' | 'mod' | 'evt', payload: Buffer, wallet: IWalletRecord): string {
    let ops = `${wallet.XOnlyPubkey.toString('hex')} OP_CHECKSIG OP_0 OP_IF `;
    ops += `${Buffer.from("atom", 'utf8').toString('hex')}`;
    ops += ` ${Buffer.from(opType, 'utf8').toString('hex')}`;
    const chunks = chunkBuffer(payload, 520);
    for (let chunk of chunks) {
        ops += ` ${chunk.toString('hex')}`;
    }
    ops += ` OP_ENDIF`;
    return ops;
}

export {
    getDmintPayload,
    getAtomicalsEnvelope,
}