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

npx ts-node src/main.ts mint -t sophon -c 0000.f -r 6238 -m 100000 --target-addr bc1p4nk9kerawnsh62jlp8m6pwk4tp6tynqvy4kfnu5pujpp346u62aqcghc47 --batch 5
```

## TODO

- [ ] Sha256 Optimize
  - [ ] Use midstate
  
- [ ] Support NFT

