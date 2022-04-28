import { Button, Dialog } from "@mui/material";
import React from "react";
import { ConnectorI, connectors } from "../../utils/connector";
import { useWeb3React } from "@web3-react/core";

export interface ConnectorPropsI {
  open: boolean;
  onClose: () => void | Promise<void>;
}

const Connector = (p: ConnectorPropsI) => {
  const { open, onClose } = p;
  const { activate } = useWeb3React();

  const connect = async (connector: ConnectorI) => {
    await activate(
      connector.connector,
      (error: Error, throwErrors?: boolean) => {
        console.log(error, throwErrors);
      }
    );
    onClose();
  };

  return (
    <Dialog onClose={onClose} open={open}>
      <div style={{ padding: "20px 40px" }}>
        <h2>Choose wallet connection</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {connectors.map((connector, index) => (
            <Button
              variant="outlined"
              onClick={() => connect(connector)}
              key={connector.name}
            >
              {connector.name}
            </Button>
          ))}
        </div>
      </div>
    </Dialog>
  );
};

export default Connector;
