import "dotenv/config";
import { loadWallet } from "./wallet";
import { createCommitTx, createRevealTx } from "./bitcoin";
import { fetchUTXOs, getBtcAddressBalance, getSatsByte, postTransaction } from "./mempoolApi";
import { Command } from 'commander';
import { parse } from "path";
import { saveRawTx } from "./utils";
const program = new Command();
program
  .name('Atomicals Mint Cli')
  .description('Command line utility for minting ARC20 tokens')
  .version('1.0.0');


program.command('mint')
  .description('mint ARC20 tokens')
  .requiredOption('-t, --ticker <ticker>', 'token ticker')
  .requiredOption('-c, --bitworkc <bitworkc>', 'bitworkc')
  .requiredOption('-r, --bitworkr <bitworkr>', 'bitworkr')
  .requiredOption('-m, --mint-amount <mintAmount>', 'mint amount')
  .option('--target-addr <targetAddr>', 'target address')
  .option('--batch <batch>', 'batch')
  .option('--quota <quota>', 'quota')
  .option('--broadcast', 'broadcast')
  .action(async (options) => {
    let wallet = await loadWallet();
    console.log(`primary address: ${wallet.primary.address}, funding address: ${wallet.funding.address}`);
    let initBalance = await getBtcAddressBalance(wallet.funding.address);
    console.log(`initBalance: ${initBalance}`);
    let utxos = await fetchUTXOs(wallet.funding.address, 1200000);
    console.log(`found ${utxos.length} utxos`);
    let batch = options.batch ? parseInt(options.batch) : 1;
    console.log(`batch: ${batch}`);
    let targetAddr = options.targetAddr ? options.targetAddr : wallet.primary.address;
    console.log(`targetAddr: ${targetAddr}`);
    let broadcast = options.broadcast ? true : false;
    console.log(`broadcast: ${broadcast}`);
    let quota = options.quota ? parseInt(options.quota) : 1e8;
    let quotaUsed = 0;
    for (let i = 0; i < batch; i++) {
      if (i > utxos.length - 1) {
        console.log(`not enough utxos`);
        break;
      }
      let utxo = utxos[i];
      let satsByte = await getSatsByte();
      console.log(`satsByte: ${satsByte}`);
      let { commitTx, commitTxId, commitValue, commitScript, controlBlock, btcUsed } = await createCommitTx(wallet, utxo, satsByte, options.ticker, options.bitworkc, options.bitworkr, parseInt(options.mintAmount));
      let { revealTx, revealTxId } = await createRevealTx(wallet, targetAddr, parseInt(options.mintAmount), options.bitworkr, commitTxId, commitValue, commitScript, controlBlock);
      console.log(`commitTxId: ${commitTxId}`);
      console.log(`commitTx: ${commitTx}`);
      console.log(`revealTxId: ${revealTxId}`);
      console.log(`revealTx: ${revealTx}`);
      console.log(`btcUsed: ${btcUsed}`);
      quotaUsed += btcUsed;
      if (quotaUsed > quota) {
        console.log(`quota used: ${quotaUsed}`);
        break;
      }
      await saveRawTx(commitTx);
      await saveRawTx(revealTx);
      if (broadcast) {
        console.log(`broadcasting commitTx`);
        let commitTxId = await postTransaction(commitTx);
        console.log(`broadcasting revealTx`);
        let revealTxId = await postTransaction(revealTx);
      }
    }
    console.log(`finished`);
    console.log(`quota used: ${quotaUsed}`);
  });

program.parse();
