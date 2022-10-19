/* eslint-disable node/no-missing-import */
/* eslint-disable node/no-unpublished-import */
/* eslint-disable node/no-extraneous-import */
/* eslint-disable node/no-unsupported-features/es-syntax */
import stream from "../../../artifacts/contracts/Stream.sol/Stream.json";
import token from "../../../artifacts/contracts/TestToken.sol/TestToken.json";
import { Button, CircularProgress, TextField } from "@mui/material";
import css from "./index.module.scss";
import React, { useState } from "react";
import Connector from "../connector";
import { useWeb3React } from "@web3-react/core";
import { BigNumber, Contract, ethers, Signer } from "ethers";
import { TransactionResponse } from "@ethersproject/abstract-provider";
import { DatePicker, LocalizationProvider } from "@mui/lab";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

const milliseconds = 1000 * 60 * 60 * 24; // a day

const TokenInfo = {
  name: "Prajna Token",
  symbol: "PRT",
  supply: "1000000000",
};

const Home = () => {
  const currentTimestamp = new Date(new Date().toLocaleDateString()).getTime();
  const { library, account } = useWeb3React();
  const [state, setState] = useState({
    open: false,
    start: currentTimestamp,
    end: currentTimestamp + milliseconds,
    token: "", //
    contract: "", //
    quantity: "0",
    total: "0",
    totalReward: "0",
    availableReward: "0",
    claimedReward: "0",
    remainReward: "0",
    balance: "0",
    allowance: "0",
  });

  const [loading, setLoading] = useState({
    deploy: false,
    init: false,
    check: false,
    claim: false,
    activate: false,
    approve: false,
  });

  const open = () => setState((prevState) => ({ ...prevState, open: true }));

  const close = () => setState((prevState) => ({ ...prevState, open: false }));

  const deploy = async (tokenAddress: string): Promise<string | void> => {
    try {
      const singer: Signer = library.getSigner(account);

      const factory = new ethers.ContractFactory(
        stream.abi,
        stream.bytecode,
        singer
      );

      const deployedContract: Contract = await factory.deploy(tokenAddress);
      console.log("deployedContract", deployedContract);

      await deployedContract.deployed();

      setState((prevState) => ({
        ...prevState,
        contract: deployedContract.address,
      }));
    } catch (e) {
      console.error(e);
    }
    return undefined;
  };

  const deployToken = async (): Promise<string | undefined> => {
    try {
      const singer: Signer = library.getSigner(account);

      const factory = new ethers.ContractFactory(
        token.abi,
        token.bytecode,
        singer
      );

      const deployedContract: Contract = await factory.deploy(
        TokenInfo.name,
        TokenInfo.symbol,
        TokenInfo.symbol
      );
      console.log("deployedContract", deployedContract);

      await deployedContract.deployed();

      setState((prevState) => ({
        ...prevState,
        token: deployedContract.address,
      }));
      return deployedContract.address;
    } catch (e) {
      console.error(e);
    }
    return undefined;
  };

  const initList = async () => {
    const users: Array<{
      account: string;
      reward: string;
    }> = [
      {
        account: "0x2F7D279Ea312Ab0F5a0DB844B8D1B24F8356D25e",
        reward: "30000",
      },
      {
        account: "0x4Fc40510041cd1dd4f674fFb8F5aEB81a23AAeF6",
        reward: "20000",
      },
    ];

    try {
      const singer: Signer = library.getSigner(account);
      const contract: Contract = new Contract(
        state.contract,
        stream.abi,
        singer
      );
      const transactionResponse: TransactionResponse = await contract.init(
        users
      );
      await transactionResponse.wait();

      const quantity: BigNumber = await contract.quantity();
      const total: BigNumber = await contract.total();
      setState((prevState) => ({
        ...prevState,
        total: total.toString(),
        quantity: quantity.toString(),
      }));
    } catch (e) {
      console.error(e);
    }
  };

  const checkReward = async () => {
    const singer: Signer = library.getSigner(account);
    const contract: Contract = new Contract(state.contract, stream.abi, singer);

    // todo: For Irene
    try {
      const information: any = await contract.information();
      const informationReward: any = await contract.informationReward(account);

      setState((prevState) => ({
        ...prevState,
        totalReward: informationReward[0].toString(),
        availableReward: informationReward[1].toString(),
        claimedReward: informationReward[2].toString(),
        remainReward: informationReward[3].toString(),
      }));

      console.log("information", information);
      console.log("informationReward", informationReward);
    } catch (e) {
      console.error(e);
    }

    try {
      const tokenContract: Contract = new Contract(
        state.token,
        token.abi,
        singer
      );
      tokenContract.balanceOf(account).then((balance: BigNumber) => {
        // console.log('balance', balance);
        setState((prevState) => ({
          ...prevState,
          balance: balance.toString(),
        }));
      });
      tokenContract
        .allowance(account, state.contract)
        .then((allowance: BigNumber) => {
          // console.log('allowance', allowance);
          setState((prevState) => ({
            ...prevState,
            allowance: allowance.toString(),
          }));
        });
    } catch (e) {
      console.error(e);
    }
  };

  const claim = async () => {
    const singer: Signer = library.getSigner(account);
    const contract: Contract = new Contract(state.contract, stream.abi, singer);

    try {
      await contract.claim();
    } catch (e) {
      console.error(e);
    }
  };

  const approve = async () => {
    const singer: Signer = library.getSigner(account);
    const contract: Contract = new Contract(state.token, token.abi, singer);

    try {
      // max_int https://forum.openzeppelin.com/t/using-the-maximum-integer-in-solidity/3000
      // uint256 MAX_INT = 115792089237316195423570985008687907853269984665640564039457584007913129639935
      const t = await contract.approve(
        state.contract,
        "115792089237316195423570985008687907853269984665640564039457584007913129639935"
      );
      await t.wait();
    } catch (e) {
      console.error(e);
    }
  };

  const activateContract = async () => {
    const singer: Signer = library.getSigner(account);
    const contract: Contract = new Contract(state.contract, stream.abi, singer);

    try {
      const t = await contract.activate(state.start / 1000, state.end / 1000);
      await t.wait();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={css.home}>
      <Connector open={state.open} onClose={close} />
      <h1>Deploy at frontend by MetaMask</h1>
      <div>Token: {state.token}</div>
      <div style={{ padding: "5px" }} />
      {account && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div>Wallet: {account}</div>
          <div style={{ padding: "5px" }} />
          <div style={{ padding: "5px" }} />
          <div>balance: {state.balance}</div>
          <div style={{ padding: "5px" }} />
          <div>allowance: {state.allowance}</div>
          <div style={{ padding: "5px" }} />
          <div>totalReward: {state.totalReward}</div>
          <div style={{ padding: "5px" }} />
          <div>availableReward: {state.availableReward}</div>
          <div style={{ padding: "5px" }} />
          <div>claimedReward: {state.claimedReward}</div>
          <div style={{ padding: "5px" }} />
          <div>remainReward: {state.remainReward}</div>
          <div style={{ padding: "5px" }} />
          <div>start timestamp: {state.start}</div>
          <div style={{ padding: "5px" }} />
          <div>end timestamp: {state.end}</div>
        </div>
      )}
      <div style={{ padding: "5px" }} />
      {!account && (
        <Button variant="outlined" onClick={open}>
          Connect to MetaMask
        </Button>
      )}
      <div style={{ padding: "5px" }} />
      {account &&
        (loading.deploy ? (
          <CircularProgress />
        ) : state.token !== "" ? (
          <Button
            variant="outlined"
            onClick={async () => {
              setLoading((prevState) => ({ ...prevState, deploy: true }));
              await deploy(state.token);
              setLoading((prevState) => ({ ...prevState, deploy: false }));
            }}
          >
            Deploy airdrop contract
          </Button>
        ) : (
          <Button
            variant="outlined"
            onClick={async () => {
              setLoading((prevState) => ({ ...prevState, deploy: true }));
              await deployToken();
              setLoading((prevState) => ({ ...prevState, deploy: false }));
            }}
          >
            Deploy token contract
          </Button>
        ))}
      {state.contract && account && (
        <div>
          <div
            style={{
              padding: "10px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="start"
                value={state.start}
                onChange={(value) => {
                  const start = value
                    ? new Date(value).getTime()
                    : currentTimestamp;
                  const end = state.end < start ? start : state.end;
                  setState((prevState) => ({ ...prevState, start, end }));
                }}
                renderInput={(params) => <TextField {...params} />}
              />
            </LocalizationProvider>
            <div style={{ padding: "5px" }} />
            <div>TO</div>
            <div style={{ padding: "5px" }} />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="end"
                value={state.end}
                onChange={(value) => {
                  const end = value
                    ? new Date(value).getTime()
                    : currentTimestamp;
                  const start = end < state.start ? end : state.start;
                  setState((prevState) => ({ ...prevState, start, end }));
                }}
                renderInput={(params) => <TextField {...params} />}
              />
            </LocalizationProvider>
          </div>
          {loading.check ? (
            <CircularProgress />
          ) : (
            <Button
              variant="outlined"
              onClick={async () => {
                setLoading((prevState) => ({ ...prevState, check: true }));
                await checkReward();
                setLoading((prevState) => ({ ...prevState, check: false }));
              }}
            >
              reload
            </Button>
          )}
          <span style={{ padding: "5px" }} />
          {loading.init ? (
            <CircularProgress />
          ) : (
            <Button
              variant="outlined"
              onClick={async () => {
                setLoading((prevState) => ({ ...prevState, init: true }));
                await initList();
                setLoading((prevState) => ({ ...prevState, init: false }));
              }}
            >
              Init
            </Button>
          )}
          <span style={{ padding: "5px" }} />
          {loading.approve ? (
            <CircularProgress />
          ) : (
            <Button
              variant="outlined"
              onClick={async () => {
                setLoading((prevState) => ({ ...prevState, approve: true }));
                await approve();
                setLoading((prevState) => ({ ...prevState, approve: false }));
              }}
            >
              Approve
            </Button>
          )}
          <span style={{ padding: "5px" }} />
          {loading.activate ? (
            <CircularProgress />
          ) : (
            <Button
              variant="outlined"
              onClick={async () => {
                setLoading((prevState) => ({ ...prevState, activate: true }));
                await activateContract();
                setLoading((prevState) => ({ ...prevState, activate: false }));
              }}
              disabled={BigNumber.from(state.allowance).lte(0)}
            >
              Activate
            </Button>
          )}
          <span style={{ padding: "5px" }} />
          {loading.claim ? (
            <CircularProgress />
          ) : (
            <Button
              variant="outlined"
              onClick={async () => {
                setLoading((prevState) => ({ ...prevState, claim: true }));
                await claim();
                setLoading((prevState) => ({ ...prevState, claim: false }));
              }}
            >
              Claim
            </Button>
          )}
          <div style={{ padding: "10px" }} />
          <div>Contract: {state.contract}</div>
          <div style={{ padding: "5px" }} />
          <div>quantity: {state.quantity}</div>
          <div style={{ padding: "5px" }} />
          <div>total: {state.total}</div>
          <div style={{ padding: "5px" }} />
        </div>
      )}
    </div>
  );
};

export default Home;
