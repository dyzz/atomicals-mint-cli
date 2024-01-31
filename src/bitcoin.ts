import {
    Psbt,
    networks,
    payments,
    script,
} from "bitcoinjs-lib";
import { IValidatedWalletInfo } from "./wallet";
import { fetchUTXOs, Utxo } from "./mempoolApi";
import { getAtomicalsEnvelope, getDmintPayload } from "./atomicals";
import { mining } from "./cpuMining";
import { parseBitwork } from "./utils";

// strip tx for txid calculation
function stripCommitTx(rawHex: string): string {
    let part1 = rawHex.substring(0, 8);
    let part2 = rawHex.substring(12);
    let removalStartIndex = part2.length - 132 - 8;
    let processedString = part1 + part2.substring(0, removalStartIndex) + part2.substring(removalStartIndex + 132);
    return processedString;
}

// strip tx for txid calculation
function stripRevealTx(rawHex: string): string {
    let part1 = rawHex.substring(0, 8);
    let part2 = rawHex.substring(12);
    let keepPart2Length = (1 + 32 + 4 + 1 + 4 + 1 + 8 + 1 + 34 + 19) * 2;
    let processedString = part1 + part2.substring(0, keepPart2Length) + "00000000";
    return processedString;
}

const BASE_BYTES = 12; // version + locktime + nIn + nOut + flag(0001)
const INPUT_BYTES_BASE = 41;
const OUTPUT_BYTES_BASE = 36;

function calcFee(satsByte: number, script: Buffer, hasBitworkr: boolean = false) {
    let commitTxSize = 173;
    const witness_size =
        1 //  witness count
        + 3 // 3 witness length
        + 64 // signature
        + 33
        + script.length + 21;
    console.log(`witness_size: ${witness_size}`)
    let revealBaseSize = BASE_BYTES + INPUT_BYTES_BASE + OUTPUT_BYTES_BASE;
    let revealTxTotalSize = revealBaseSize + witness_size;
    let revealSize = Math.floor((3 * revealBaseSize + revealTxTotalSize) / 4 + 0.5);
    if (hasBitworkr) {
        revealSize += 19;
    }
    console.log(`revealSize: ${revealSize}`);
    let totalSize = commitTxSize + revealSize;
    let fee = totalSize * satsByte;
    return {
        totalFee: fee,
        commitFee: commitTxSize * satsByte,
        revealFee: revealSize * satsByte,
    }
}

async function createCommitTx(wallet: IValidatedWalletInfo, utxo: Utxo, satsByte: number, ticker: string, bitworkc: string, bitworkr: string, mintAmount: number) {
    let time = Math.floor(Date.now() / 1000);
    let payload = getDmintPayload(ticker, time, bitworkc, bitworkr);
    let envelope = getAtomicalsEnvelope("dmt", payload, wallet.funding);
    const hashscript = script.fromASM(envelope);

    const scriptTree = {
        output: hashscript,
    };
    const hash_lock_script = hashscript;
    const hashLockRedeem = {
        output: hash_lock_script,
        redeemVersion: 192,
    };
    const hashLockP2TR = payments.p2tr({
        internalPubkey: wallet.funding.XOnlyPubkey,
        scriptTree,
        redeem: hashLockRedeem,
        network: networks.bitcoin,
    });
    let commitAddr = hashLockP2TR.address;

    let { totalFee, commitFee, revealFee } = calcFee(satsByte, hashscript, bitworkr != "");
    console.log(`totalFee: ${totalFee}, commitFee: ${commitFee}, revealFee: ${revealFee}`);
    const input = {
        hash: utxo.txid,
        index: utxo.index,
        witnessUtxo: {
            value: utxo.value,
            script: wallet.funding.output,
        },
        tapInternalKey: wallet.funding.XOnlyPubkey,
    };
    const output0 = {
        address: commitAddr,
        value: mintAmount + revealFee,
    }
    const output2 = {
        address: wallet.funding.address,
        value: utxo.value - totalFee - mintAmount,
    }
    let psbt = new Psbt();
    psbt.setVersion(1);
    psbt.addInput(input);
    psbt.addOutput(output0);
    let data = Buffer.alloc(8);
    let embed = payments.embed({ data: [data] });
    psbt.addOutput({
        script: embed.output!,
        value: 0,
    });
    psbt.addOutput(output2);
    psbt.signInput(0, wallet.funding.tweakedChildNode);
    psbt.finalizeAllInputs();
    let tx = psbt.extractTransaction();
    let processedRawHex = stripCommitTx(tx.toHex());
    console.log(`processedRawHex: ${processedRawHex}`);
    let { prefix, ext } = parseBitwork(bitworkc);
    console.log(`prefix: ${prefix}, ext: ${ext}`);
    let miningResult = await mining(processedRawHex, 101, prefix, ext, 4);
    console.log(miningResult);
    let nonce = miningResult.nonce;
    data.writeBigUint64BE(nonce, 0);
    let finalPsbt = new Psbt();
    finalPsbt.setVersion(1);
    finalPsbt.addInput(input);
    finalPsbt.addOutput(output0);
    embed = payments.embed({ data: [data] });
    finalPsbt.addOutput({
        script: embed.output!,
        value: 0,
    });
    finalPsbt.addOutput(output2);
    finalPsbt.signInput(0, wallet.funding.tweakedChildNode);
    finalPsbt.finalizeAllInputs();
    tx = finalPsbt.extractTransaction();
    return {
        commitTx: tx.toHex(),
        commitTxId: tx.getId(),
        commitScript: hashscript,
        commitOutput: hashLockP2TR.output,
        commitValue: mintAmount + revealFee,
        controlBlock: hashLockP2TR.witness![hashLockP2TR.witness!.length - 1],
        btcUsed: totalFee + mintAmount,
    };
}

async function createRevealTx(wallet: IValidatedWalletInfo, targetAddr: string, mintAmount: number, bitworkr: string, commitTxId: string, commitValue: number, commitScript: Buffer, commitOutput: Buffer, controlBlock: Buffer) {
    const tapLeafScript = {
        leafVersion: 192,
        script: commitScript,
        controlBlock: controlBlock,
    };
    const input = {
        hash: commitTxId,
        index: 0,
        witnessUtxo: { script: commitOutput, value: commitValue },
        tapLeafScript: [
            tapLeafScript
        ],
    };
    const output = {
        address: targetAddr,
        value: mintAmount,
    };
    let psbt = new Psbt();
    psbt.setVersion(1);
    psbt.addInput(input);
    psbt.addOutput(output);
    let data = Buffer.alloc(8);
    let embed = payments.embed({ data: [data] });
    if (bitworkr != "") {
        psbt.addOutput({
            script: embed.output!,
            value: 0,
        });
    }
    psbt.signInput(0, wallet.funding.childNode);
    psbt.finalizeAllInputs();
    let tx = psbt.extractTransaction();
    if (bitworkr != "") {
        let processedRawHex = stripRevealTx(tx.toHex());
        let { prefix, ext } = parseBitwork(bitworkr);
        console.log(`prefix: ${prefix}, ext: ${ext}`);
        let miningResult = await mining(processedRawHex, 101, prefix, ext, 4);
        console.log(miningResult);
        let nonce = miningResult.nonce;
        data.writeBigUint64BE(nonce, 0);
        let finalPsbt = new Psbt();
        finalPsbt.setVersion(1);
        finalPsbt.addInput(input);
        finalPsbt.addOutput(output);
        embed = payments.embed({ data: [data] });
        finalPsbt.addOutput({
            script: embed.output!,
            value: 0,
        });
        finalPsbt.signInput(0, wallet.funding.childNode);
        finalPsbt.finalizeAllInputs();
        tx = finalPsbt.extractTransaction();
    }
    return {
        revealTx: tx.toHex(),
        revealTxId: tx.getId(),
    }
}

export {
    createCommitTx,
    createRevealTx,
}

