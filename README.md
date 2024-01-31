# Atomicals Mint Cli

A standalone atomicals mint cli that does not require a connection to the ElectrumX API.

Donation: [bc1plwteg9fd7cs50svdmtmg2pt6du3rr3upuw5p8qztteltatl98nhsvrvhfr](https://mempool.space/address/bc1plwteg9fd7cs50svdmtmg2pt6du3rr3upuw5p8qztteltatl98nhsvrvhfr)

## Install

```bash
npm install
```

## Mint ARC20

```
npx ts-node src/main.ts mint --help
Usage: Atomicals Mint Cli mint [options]

mint ARC20 tokens

Options:
  -t, --ticker <ticker>           token ticker
  -c, --bitworkc <bitworkc>       bitworkc
  -r, --bitworkr <bitworkr>       bitworkr
  -m, --mint-amount <mintAmount>  mint amount
  --target-addr <targetAddr>      target address
  --batch <batch>                 batch
  --quota <quota>                 quota
  --broadcast                     broadcast
  -h, --help                      display help for command

npx ts-node src/main.ts mint -t infinity -c 8888.f -r "" -m 9999 --batch 1

validate seed
primary address: xxx, funding address: xxx
initBalance: xxx
found 5 utxos
batch: 1
targetAddr: xxxx
broadcast: false
satsByte: 45
{
  args: {
    time: 1706710730,
    nonce: 0,
    mint_ticker: 'infinity',
    bitworkc: '8888.f'
  }
}
witness_size: 230
revealSize: 147
totalFee: 14400, commitFee: 7785, revealFee: 6615
prefix: 8888, ext: 15
Worker 2 Speed: 87183 hashes/sec
Worker 1 Speed: 87108 hashes/sec
Worker 0 Speed: 87108 hashes/sec
Worker 3 Speed: 86880 hashes/sec
Worker 2 Speed: 89126 hashes/sec
Worker 1 Speed: 89007 hashes/sec
Worker 0 Speed: 88928 hashes/sec
Worker 3 Speed: 88849 hashes/sec
Worker 2 Speed: 89874 hashes/sec
Worker 1 Speed: 89739 hashes/sec
Worker 0 Speed: 89712 hashes/sec
Worker 3 Speed: 89552 hashes/sec
{
  found: true,
  nonce: 1443926n,
  id: 2
}
```

## TODO

- [ ] Sha256 Optimize
  - [ ] Use midstate
  
- [ ] Support NFT

