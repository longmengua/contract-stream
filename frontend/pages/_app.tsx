import "../styles/globals.scss";
import type { AppProps } from "next/app";
import { Web3ReactProvider } from "@web3-react/core";
import { ethers } from "ethers";
import React from "react";

function MyApp({ Component, pageProps }: AppProps) {
  const getLibrary = (provider: any) => {
    const library = new ethers.providers.Web3Provider(provider);
    library.pollingInterval = 8000; // frequency provider is polling
    return library;
  };

  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <Component {...pageProps} />
    </Web3ReactProvider>
  );
}

export default MyApp;
