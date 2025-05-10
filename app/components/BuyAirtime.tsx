import React, { useState, useEffect } from "react";
import { useAccount, useWalletClient, usePublicClient, useConnect } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { Button } from "./Button";
import { Card } from "./Card";
import { API_BASE_URL } from '../config';
import { injected } from 'wagmi/connectors';

type BuyAirtimeProps = { setActiveTab: (tab: string) => void };

type AirtimeService = {
  network_operator: string;
  operator_id: string;
  amount: number;
  currency: string;
  usdc_value: number;
};

type Country = {
  name: string;
  services: {
    airtime: AirtimeService[];
  };
};

// USDC Token Contract Details
const USDC_CONTRACT_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as `0x${string}`; // Mainnet USDC
const USDC_TOKEN_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "recipient", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  }
] as const;

export function BuyAirtime({ setActiveTab }: BuyAirtimeProps) {
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedOperator, setSelectedOperator] = useState<string>("");
  const [selectedAmount, setSelectedAmount] = useState<AirtimeService | null>(null);
  const [recipientPhone, setRecipientPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [transactionStatus, setTransactionStatus] = useState("");

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { connect } = useConnect();

  const CONTRACT_ADDRESS = "0xaF108Dd1aC530F1c4BdED13f43E336A9cec92B44" as `0x${string}`;
  const CONTRACT_ABI = [
    {
      name: "processPayment",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [{ name: "amount", type: "uint256" }],
      outputs: [],
    },
    {
      name: "PaymentProcessed",
      type: "event",
      inputs: [
        { name: "from", type: "address", indexed: true },
        { name: "amount", type: "uint256", indexed: false },
        { name: "timestamp", type: "uint256", indexed: false }
      ],
    }
  ] as const;

  // Auto connect wallet on component mount
  useEffect(() => {
    const autoConnect = async () => {
      try {
        if (!isConnected) {
          console.log("Attempting to auto-connect wallet...");
          await connect({ connector: injected() });
        }
      } catch (error) {
        console.error("Auto-connect failed:", error);
      }
    };
    autoConnect();
  }, [isConnected, connect]);

  // Fetch Countries and their services
  useEffect(() => {
    const fetchCountries = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/services-data`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        if (data && data.countries && Array.isArray(data.countries)) {
          setCountries(data.countries);
        } else {
          throw new Error('Invalid data format received from API');
        }
      } catch (err) {
        console.error("Failed to fetch countries:", err);
        setErrorMessage("Failed to load countries. Please try again later.");
        setShowErrorModal(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCountries();
  }, []);

  const handleSubmitForm = () => {
    console.log('Form submission started with values:', {
      selectedCountry,
      selectedOperator,
      selectedAmount,
      recipientPhone
    });

    if (!selectedCountry) return alert("Please select a country.");
    if (!selectedOperator) return alert("Please select an operator.");
    if (!selectedAmount) return alert("Please select an amount.");
    if (!recipientPhone) return alert("Please enter recipient phone number.");
    if (!/^\d{11}$/.test(recipientPhone)) return alert("Please enter a valid 11-digit phone number.");
    
    console.log('All validations passed, showing confirmation modal');
    setShowConfirmModal(true);
  };

  // Check the user's USDC balance
  const checkUsdcBalance = async () => {
    if (!address || !publicClient) {
      console.error("Missing address or publicClient");
      throw new Error("Wallet not connected");
    }
    
    try {
      console.log("Checking USDC balance for address:", address);
      
      // First check if we're on the correct network
      const chainId = await publicClient.getChainId();
      console.log("Current chain ID:", chainId);
      
      // Get the USDC contract address based on the network
      const usdcAddress = chainId === 1 ? 
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" : // Mainnet
        "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base
        
      console.log("Using USDC contract address:", usdcAddress);
      
      const balance = await publicClient.readContract({
        address: usdcAddress as `0x${string}`,
        abi: USDC_TOKEN_ABI,
        functionName: "balanceOf",
        args: [address]
      });
      
      const formattedBalance = formatUnits(balance, 6);
      console.log(`Raw USDC Balance: ${balance.toString()}`);
      console.log(`Formatted USDC Balance: ${formattedBalance} USDC`);
      
      return balance;
    } catch (error) {
      console.error("Error checking USDC balance:", error);
      if (error instanceof Error) {
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      throw new Error("Failed to check USDC balance. Please ensure you're connected to the correct network.");
    }
  };

  // Check if the contract has allowance to spend user's USDC
  const checkAllowance = async () => {
    if (!address || !publicClient) return BigInt(0);
    
    try {
      const allowance = await publicClient.readContract({
        address: USDC_CONTRACT_ADDRESS,
        abi: USDC_TOKEN_ABI,
        functionName: "allowance",
        args: [address, CONTRACT_ADDRESS]
      });
      
      console.log(`Current allowance: ${formatUnits(allowance, 6)} USDC`);
      return allowance;
    } catch (error) {
      console.error("Error checking allowance:", error);
      return BigInt(0);
    }
  };

  // Directly transfer USDC to the contract address
  const transferUsdcDirectly = async (amount: bigint) => {
    if (!walletClient || !address || !publicClient) throw new Error("Wallet not connected");
    
    setTransactionStatus("Transferring USDC...");
    console.log(`Transferring ${formatUnits(amount, 6)} USDC to contract ${CONTRACT_ADDRESS}`);
    
    try {
      // First check if we're on the correct network
      const chainId = await publicClient.getChainId();
      const usdcAddress = chainId === 1 ? 
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" : // Mainnet
        "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base

      // Check allowance first
      const allowance = await publicClient.readContract({
        address: usdcAddress as `0x${string}`,
        abi: USDC_TOKEN_ABI,
        functionName: "allowance",
        args: [address, CONTRACT_ADDRESS]
      });

      console.log(`Current allowance: ${formatUnits(allowance, 6)} USDC`);

      // If allowance is insufficient, approve first
      if (allowance < amount) {
        setTransactionStatus("Approving USDC spend...");
        const { request: approveRequest } = await publicClient.simulateContract({
          address: usdcAddress as `0x${string}`,
          abi: USDC_TOKEN_ABI,
          functionName: "approve",
          args: [CONTRACT_ADDRESS, amount],
          account: address
        });

        const approveTxHash = await walletClient.writeContract(approveRequest);
        console.log("Approval transaction hash:", approveTxHash);

        setTransactionStatus("Waiting for approval confirmation...");
        const approveReceipt = await publicClient.waitForTransactionReceipt({
          hash: approveTxHash,
          timeout: 60000
        });

        if (approveReceipt.status === 'reverted') {
          throw new Error("USDC approval transaction was reverted");
        }
      }

      // Now proceed with the transfer
      const { request: transferRequest } = await publicClient.simulateContract({
        address: usdcAddress as `0x${string}`,
        abi: USDC_TOKEN_ABI,
        functionName: "transfer",
        args: [CONTRACT_ADDRESS, amount],
        account: address
      });

      const transferTxHash = await walletClient.writeContract(transferRequest);
      console.log("Transfer transaction hash:", transferTxHash);

      setTransactionStatus("Waiting for transfer confirmation...");
      const transferReceipt = await publicClient.waitForTransactionReceipt({
        hash: transferTxHash,
        timeout: 60000
      });

      if (transferReceipt.status === 'reverted') {
        throw new Error("USDC transfer transaction was reverted");
      }

      console.log("USDC transfer successful");
      return transferTxHash;
    } catch (error) {
      console.error("Error transferring USDC:", error);
      throw error;
    }
  };

  // Call the contract's processPayment function
  const callProcessPayment = async (amount: bigint) => {
    if (!walletClient || !address || !publicClient) throw new Error("Wallet not connected");
    
    setTransactionStatus("Processing payment...");
    console.log(`Calling processPayment with amount: ${formatUnits(amount, 6)}`);
    
    try {
      const { request } = await publicClient.simulateContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "processPayment",
        args: [amount],
        account: address
      });
      
      const txHash = await walletClient.writeContract(request);
      console.log("processPayment transaction hash:", txHash);
      
      setTransactionStatus("Waiting for payment confirmation...");
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        timeout: 60000
      });
      
      if (receipt.status === 'reverted') {
        throw new Error("processPayment transaction was reverted");
      }
      
      console.log("Payment processing successful");
      return true;
    } catch (error) {
      console.error("Error calling processPayment:", error);
      throw error;
    }
  };

  const handleConfirmedSubmit = async () => {
    console.log('Confirmation modal submit started');
    console.log('Selected amount details:', selectedAmount);
    
    if (!selectedAmount) {
      console.error('No amount selected');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Ensure wallet is connected
      if (!isConnected) {
        console.log("Wallet not connected, attempting to connect...");
        await connect({ connector: injected() });
      }

      if (!walletClient || !address) {
        throw new Error("Wallet connection failed. Please try again.");
      }

      // Convert USDC value to wei (6 decimals for USDC)
      const usdcValue = selectedAmount.usdc_value;
      const amountInWei = parseUnits(usdcValue.toString(), 6);

      console.log('Payment details:', {
        usdcValue,
        amountInWei: amountInWei.toString(),
        operator: selectedAmount.network_operator,
        amount: selectedAmount.amount,
        currency: selectedAmount.currency,
        contractAddress: CONTRACT_ADDRESS
      });

      // Check USDC balance with better error handling
      setTransactionStatus("Checking your USDC balance...");
      let balance;
      try {
        balance = await checkUsdcBalance();
        const formattedBalance = formatUnits(balance, 6);
        console.log(`Current balance: ${formattedBalance} USDC`);
        console.log(`Required amount: ${usdcValue} USDC`);
        
        if (balance < amountInWei) {
          throw new Error(
            `Insufficient USDC balance. You have ${formattedBalance} USDC, but ${usdcValue} USDC is required.`
          );
        }
      } catch (error) {
        console.error("Balance check failed:", error);
        throw error;
      }

      // Process payment
      setTransactionStatus("Processing payment...");
      let txHash;
      try {
        // Try direct USDC transfer first
        txHash = await transferUsdcDirectly(amountInWei);
        console.log("Payment successful with transaction hash:", txHash);
      } catch (error) {
        console.error("Direct transfer failed:", error);
        throw new Error("Payment failed. Please try again.");
      }

      // Only proceed with airtime purchase if payment is successful
      if (txHash) {
        console.log('Payment successful, proceeding with airtime purchase...');
        setTransactionStatus("Sending airtime topup request...");
        const response = await fetch(`${API_BASE_URL}/send-topup`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            operatorId: selectedAmount.operator_id,
            amount: selectedAmount.amount,
            currency: selectedAmount.currency,
            recipientPhone,
            senderPhone: "08012345678",
            recipientEmail: "miniapp@aitimeplus.xyz",
            tx_hash: txHash
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('API response not ok:', errorData);
          throw new Error(errorData.error || "Network response was not ok");
        }
        
        const dataResp = await response.json();
        console.log("Topup Response:", dataResp);

        setShowConfirmModal(false);
        setActiveTab("success");
      }
    } catch (error) {
      console.error("Error processing transaction:", error);
      let errorMessage = "Transaction unsuccessful. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes("user rejected")) {
          errorMessage = "Transaction was rejected. Please try again.";
        } else if (error.message.includes("insufficient funds") || error.message.includes("Insufficient")) {
          errorMessage = error.message;
        } else if (error.message.includes("network")) {
          errorMessage = "Network error. Please check your connection and ensure you're on the correct network.";
        } else {
          errorMessage = error.message;
        }
      }
      
      setErrorMessage(errorMessage);
      setShowConfirmModal(false);
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
      setTransactionStatus("");
    }
  };

  const getSelectedCountryOperators = () => {
    const country = countries.find(c => c.name === selectedCountry);
    return country?.services.airtime || [];
  };

  const getOperatorAmounts = () => {
    return getSelectedCountryOperators().filter(
      service => service.network_operator === selectedOperator
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card title="Buy Airtime">
        <div className="space-y-4">
          <p className="text-[var(--app-foreground-muted)] dark:text-gray-400">Enter recipient details</p>
          
          {/* Country Selection */}
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">Country</label>
            <select
              className="w-full border px-3 py-2 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setSelectedOperator("");
                setSelectedAmount(null);
              }}
              disabled={isLoading}
            >
              <option value="">Select Country</option>
              {countries.map((country) => (
                <option key={country.name} value={country.name}>
                  {country.name}
                </option>
              ))}
            </select>
            {isLoading && (
              <p className="text-sm text-gray-500 mt-1">Loading countries...</p>
            )}
          </div>

          {/* Operator Selection */}
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">Operator</label>
            <select
              className="w-full border px-3 py-2 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              value={selectedOperator}
              onChange={(e) => {
                setSelectedOperator(e.target.value);
                setSelectedAmount(null);
              }}
              disabled={!selectedCountry || isLoading}
            >
              <option value="">Select Operator</option>
              {Array.from(new Set(getSelectedCountryOperators().map(op => op.network_operator))).map(operator => (
                <option key={operator} value={operator}>
                  {operator}
                </option>
              ))}
            </select>
          </div>

          {/* Amount Selection */}
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">Amount</label>
            <select
              className="w-full border px-3 py-2 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              value={selectedAmount?.amount.toString() || ""}
              onChange={(e) => {
                const amount = getOperatorAmounts().find(
                  service => service.amount.toString() === e.target.value
                );
                setSelectedAmount(amount || null);
              }}
              disabled={!selectedOperator || isLoading}
            >
              <option value="">Select Amount</option>
              {getOperatorAmounts().map((service) => (
                <option key={service.amount} value={service.amount}>
                  {service.amount} {service.currency} 
                </option>
              ))}
            </select>
          </div>

          {/* Phone Number Input */}
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">Recipient Phone Number</label>
            <input
              type="tel"
              className="w-full border px-3 py-2 rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              placeholder="Enter phone number"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              maxLength={11}
              disabled={isLoading}
            />
          </div>

          <div className="text-right">
            <Button onClick={handleSubmitForm} disabled={isSubmitting || isLoading}>
              {isSubmitting ? "Processing..." : "Buy"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedAmount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Please confirm the details of your airtime purchase:
            </p>
            <div className="space-y-2 mb-6">
              <p className="text-center dark:text-white">
                <span className="font-bold">Country:</span> {selectedCountry}
              </p>
              <p className="text-center dark:text-white">
                <span className="font-bold">Operator:</span> {selectedAmount.network_operator}
              </p>
              <p className="text-center dark:text-white">
                <span className="font-bold">Amount:</span> {selectedAmount.amount} {selectedAmount.currency}
              </p>
              <p className="text-center dark:text-white">
                <span className="font-bold">USDC Value:</span> ${selectedAmount.usdc_value}
              </p>
              <p className="text-center dark:text-white">
                <span className="font-bold">Recipient:</span> {recipientPhone}
              </p>
            </div>
            {transactionStatus && (
              <p className="text-blue-500 text-center mb-4">{transactionStatus}</p>
            )}
            <div className="flex justify-end space-x-4">
              <Button variant="ghost" onClick={() => {
                console.log('Edit button clicked, closing modal');
                setShowConfirmModal(false);
              }} disabled={isSubmitting}>Edit</Button>
              <Button onClick={() => {
                console.log('Confirm button clicked, starting payment process');
                handleConfirmedSubmit();
              }} disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Confirm Purchase"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
            <p className="text-red-600 dark:text-red-400 mb-4">{errorMessage}</p>
            <div className="flex justify-end">
              <Button onClick={() => setShowErrorModal(false)}>Dismiss</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}