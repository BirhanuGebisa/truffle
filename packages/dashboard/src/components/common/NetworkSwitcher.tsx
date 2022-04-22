import { useWeb3React } from "@web3-react/core";
import { providers } from "ethers";
import { useEffect, useState } from "react";
import {
  forwardDashboardProviderRequest,
  getNetworkName
} from "src/utils/utils";

interface Props {
  chainId: number;
  publicChains?: object[];
}

function NetworkSwitcher({ chainId, publicChains }: Props) {
  const [networkName, setNetworkName] = useState<string>(`Chain ID ${chainId}`);
  const textColor = chainId === 1 ? "text-truffle-red" : "";
  const { library } = useWeb3React<providers.Web3Provider>();

  useEffect(() => {
    const updateNetwork = async (chainId: number) => {
      const connectedNetworkName = await getNetworkName(chainId);
      setNetworkName(connectedNetworkName);
      console.log(connectedNetworkName);
    };

    if (!chainId) return;
    updateNetwork(chainId);
  }, [chainId, publicChains]);

  async function addNetwork(chain: any) {
    if (!library) return; // handle better
    const provider = library.provider;
    const addNetworkPayload = {
      jsonrpc: "2.0",
      method: "wallet_addEthereumChain",
      params: [{ ...chain }],
      id: 0
    };
    const addNetworkResponse = await forwardDashboardProviderRequest(
      provider,
      addNetworkPayload
    );
    if (addNetworkResponse.error) {
      console.log(
        "add network error: " + JSON.stringify(addNetworkResponse.error)
      );
    } else {
      console.log("added network!" + JSON.stringify(addNetworkResponse));
    }
  }

  async function setOrAddNetwork(chain: any) {
    if (!library) return; // handle better
    const provider = library.provider;
    const switchNetworkPayload = {
      jsonrpc: "2.0",
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chain.chainId }],
      id: 0
    };
    const switchNetworkResponse = await forwardDashboardProviderRequest(
      provider,
      switchNetworkPayload
    );
    if (switchNetworkResponse.error) {
      // MetaMask's error for the network not being added to MetaMask
      if (switchNetworkResponse.error.code === 4902) {
        addNetwork(chain);
      } else {
        // handle other errors
        console.log(
          "some other switch network error: " + switchNetworkResponse.error
        );
      }
    } else {
      // we actually don't need to propagate this state change back up the chain
      // when the provider request to switch networks is fulfilled, the chainId
      // imported from web3React will be changed, which will call the useEffect
      // for all components that are dependent on that chainId
      console.log("switched network! " + JSON.stringify(switchNetworkResponse));
    }
  }
  const chainIdHex = `0x${chainId.toString(16)}`;
  const chainOptions = publicChains ? (
    publicChains.map((chain: any) => {
      return (
        <div
          key={chain.chainId}
          className={`rounded uppercase ${textColor}`}
          onClick={() => setOrAddNetwork(chain)}
        >
          {(chain.chainId === chainIdHex ? "Selected: " : "") + chain.chainName}
        </div>
      );
    })
  ) : (
    <div className={`rounded uppercase ${textColor}`}>{networkName}</div>
  );
  return <div>{chainOptions}</div>;
}

export default NetworkSwitcher;
