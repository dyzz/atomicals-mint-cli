import {
    networks,
} from "bitcoinjs-lib";
import * as bip39 from 'bip39';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
const bitcoin = require('bitcoinjs-lib');
import { BIP32Interface, Signer } from "bip32/types/bip32";
const bip32 = BIP32Factory(ecc);
bitcoin.initEccLib(ecc);

export interface IWalletRecord {
    address: string,
    WIF: string,
    output: Buffer,
    childNode: BIP32Interface,
    tweakedChildNode: Signer,
    XOnlyPubkey: Buffer,
}

export interface IValidatedWalletInfo {
    primary: IWalletRecord;
    funding: IWalletRecord;
}

const toXOnly = (publicKey) => {
    return publicKey.slice(1, 33);
}

async function loadWallet(): Promise<IValidatedWalletInfo> {
    let network = networks.bitcoin;
    let mnemonic = process.env.SEED;
    let validated = bip39.validateMnemonic(mnemonic);
    if (!validated) {
        throw new Error("Invalid seed");
    }
    console.log(`validate seed`);
    let seed = await bip39.mnemonicToSeed(mnemonic);
    let root = bip32.fromSeed(seed, network);
    let childNodePrimary = root.derivePath("m/86'/0'/0'/0/0");
    const childNodeXOnlyPubkeyPrimary = toXOnly(childNodePrimary.publicKey);
    const p2trPrimary = bitcoin.payments.p2tr({
        internalPubkey: childNodeXOnlyPubkeyPrimary,
        network: network,
    });
    const tweakedChildNodePrimary = childNodePrimary.tweak(
        bitcoin.crypto.taggedHash('TapTweak', childNodeXOnlyPubkeyPrimary),
    );

    const childNodeFunding = root.derivePath("m/86'/0'/0'/1/0");
    const childNodeXOnlyPubkeyFunding = toXOnly(childNodeFunding.publicKey);
    const p2trFunding = bitcoin.payments.p2tr({
        internalPubkey: childNodeXOnlyPubkeyFunding,
        network: network,
    });
    const tweakedChildNodeFunding = childNodeFunding.tweak(
        bitcoin.crypto.taggedHash('TapTweak', childNodeXOnlyPubkeyFunding),
    );

    const walletInfo: IValidatedWalletInfo = {
        primary: {
            address: p2trPrimary.address,
            WIF: childNodePrimary.toWIF(),
            childNode: childNodePrimary,
            tweakedChildNode: tweakedChildNodePrimary,
            output: p2trPrimary.output,
            XOnlyPubkey: childNodeXOnlyPubkeyPrimary,
        },
        funding: {
            address: p2trFunding.address,
            WIF: childNodeFunding.toWIF(),
            childNode: childNodeFunding,
            tweakedChildNode: tweakedChildNodeFunding,
            output: p2trFunding.output,
            XOnlyPubkey: childNodeXOnlyPubkeyFunding,
        }
    };
    return walletInfo;
}


export {
    loadWallet,
}