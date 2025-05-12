"use client";

import {
  useMiniKit,
  useAddFrame,
} from "@coinbase/onchainkit/minikit";
import {
  Name,
  Identity,
  Address,
  Avatar,
  EthBalance,
} from "@coinbase/onchainkit/identity";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "./components/Button";
import { Icon } from "./components/Icon";
import { BuyAirtime } from "./components/BuyAirtime";
import { useAccount, useConnect, useWalletClient, usePublicClient } from "wagmi";
import { farcasterFrame as miniAppConnector } from '@farcaster/frame-wagmi-connector';

export default function App() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const [frameAdded, setFrameAdded] = useState(false);
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();

  const { addFrame } = useAddFrame();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Auto connect wallet on component mount
  useEffect(() => {
    const autoConnect = async () => {
      try {
        if (!isConnected) {
          console.log("Attempting to auto-connect wallet...");
          const frameConnector = connectors.find(connector => connector.id === 'farcasterFrame');
          if (frameConnector) {
            await connect({ connector: frameConnector });
          }
        }
      } catch (error) {
        console.error("Auto-connect failed:", error);
      }
    };
    autoConnect();
  }, [isConnected, connect, connectors]);

  const handleAddFrame = useCallback(async () => {
    const frameAdded = await addFrame({ id: 'airtimeplus' });
    setFrameAdded(Boolean(frameAdded));
  }, [addFrame]);

  const saveFrameButton = useMemo(() => {
    if (context && !context.client.added) {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddFrame}
          className="text-[var(--app-accent)] p-4"
          icon={<Icon name="plus" size="sm" />}
        >
          Save Frame
        </Button>
      );
    }

    if (frameAdded) {
      return (
        <div className="flex items-center space-x-1 text-sm font-medium text-[#0052FF] animate-fade-out">
          <Icon name="check" size="sm" className="text-[#0052FF]" />
          <span>Saved</span>
        </div>
      );
    }

    return null;
  }, [context, frameAdded, handleAddFrame]);

  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <div className="w-full max-w-md mx-auto px-4 py-3">
        <header className="flex justify-between items-center mb-3 h-11">
          <div>
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <div className="flex items-center space-x-2">
                  <div className="text-sm font-medium">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => connect({ connector: connectors[0] })}
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const frameConnector = connectors.find(connector => connector.id === 'farcasterFrame');
                    if (frameConnector) {
                      connect({ connector: frameConnector });
                    }
                  }}
                >
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>
          <div>{saveFrameButton}</div>
        </header>

        <main className="flex-1">
          <BuyAirtime />
        </main>

        <footer className="mt-2 pt-4 flex justify-center">
          AirtimePlus
        </footer>
      </div>
    </div>
  );
}
