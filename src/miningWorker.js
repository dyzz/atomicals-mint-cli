const { parentPort, workerData } = require('worker_threads');
const CryptoJS = require('crypto-js');

// reverse hex string by byte
function reverseHex(hex) {
    let reversed = '';
    for (let i = hex.length - 2; i >= 0; i -= 2) {
        reversed += hex.substr(i, 2);
    }
    return reversed;
}

function doubleSha256(data) {
    const wordArray = CryptoJS.lib.WordArray.create(data);
    const hash = CryptoJS.SHA256(CryptoJS.SHA256(wordArray));
    const hex = hash.toString(CryptoJS.enc.Hex);
    const result = reverseHex(hex);
    return result;
}

let nonce = BigInt(workerData.nonceStart);
const message = Buffer.from(workerData.message, 'hex');
const prefix = workerData.prefix;
const step = BigInt(workerData.nonceStep);

let hashCount = 0n;
const startTime = Date.now();

while (true) {
    // write nonce to message at payloadAt
    message.writeBigUint64BE(nonce, workerData.payloadAt);
    const hash = doubleSha256(message);
    if (hash.startsWith(prefix)) {
        let flag = true;
        if (workerData.ext > -1) {
            const hashExt = hash.charAt(prefix.length);
            if (parseInt(hashExt, 16) < workerData.ext) {
                flag = false;
            }
        }
        if (flag) {
            parentPort.postMessage({ found: true, hash, nonce, message: message.toString('hex'), id: workerData.id });
            break;
        }
    }
    nonce = nonce + step;
    hashCount = hashCount + 1n;
    if (hashCount % 100000n == 0) {
        const mseconds = (Date.now() - startTime);
        const hashesPerSecond = (hashCount * 1000n / BigInt(mseconds));
        parentPort.postMessage({ speed: hashesPerSecond, id: workerData.id });
    }
}