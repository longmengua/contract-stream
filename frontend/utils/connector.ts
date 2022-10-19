import { InjectedConnector } from "@web3-react/injected-connector";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";
import { WalletLinkConnector } from "@web3-react/walletlink-connector";
import { AbstractConnector } from "@web3-react/abstract-connector";

const bsc_testnet = {
  url: "https://data-seed-prebsc-1-s1.binance.org:8545",
  chainId: 97,
};

const injected = new InjectedConnector({
  supportedChainIds: [1, 3, 4, 5, 42, bsc_testnet.chainId, 80001],
});

const walletconnect = new WalletConnectConnector({
  supportedChainIds: [bsc_testnet.chainId],
  rpc: {
    [bsc_testnet.chainId]: bsc_testnet.url,
  },
  bridge: "https://bridge.walletconnect.org",
  qrcode: true,
});

const walletlink = new WalletLinkConnector({
  supportedChainIds: [bsc_testnet.chainId],
  url: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
  appName: "airdrop-demo",
});

export interface ConnectorI {
  name: string;
  connector: AbstractConnector;
}

export const connectors: Array<ConnectorI> = [
  {
    name: "MetaMask",
    connector: injected,
  },
  {
    name: "Wallet Connect",
    connector: walletconnect,
  },
  {
    name: "Coinbase Wallet",
    connector: walletlink,
  },
];
