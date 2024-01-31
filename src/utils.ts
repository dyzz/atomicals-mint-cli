const fs = require('fs').promises;

async function saveRawTx(txHex: string) {
    const filePath = 'rawTx.txt';
    // Get current timestamp
    const timestamp = new Date().toISOString();
    // Append timestamp and hexData to file
    await fs.appendFile(filePath, `${timestamp}: ${txHex}\n`, 'utf8');
}

function parseBitwork(bitwork: string): { prefix: string, ext: number } {
    const dotIndex = bitwork.indexOf('.');
    let prefix: string;
    let ext: number;
    if (dotIndex === -1) {
        prefix = bitwork;
        ext = -1;
    } else {
        prefix = bitwork.substring(0, dotIndex);
        ext = parseInt(bitwork.substring(dotIndex + 1), 16);
    }
    return { prefix, ext };
}

export { saveRawTx, parseBitwork };