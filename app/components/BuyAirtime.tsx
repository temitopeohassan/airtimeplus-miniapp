import React, { useState, useEffect } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { parseUnits } from "viem";
import { Button } from "./Button";
import { Card } from "./Card";
import { API_BASE_URL } from '../config';

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

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const CONTRACT_ADDRESS = "0xaF108Dd1aC530F1c4BdED13f43E336A9cec92B44";
  const CONTRACT_ABI = [
    "function processPayment(uint256 amount) external nonReentrant",
    "event PaymentProcessed(address indexed from, uint256 amount, uint256 timestamp)",
  ];

  // Fetch Countries and their services
  useEffect(() => {
    const fetchCountries = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/countries`);
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
    if (!selectedCountry) return alert("Please select a country.");
    if (!selectedOperator) return alert("Please select an operator.");
    if (!selectedAmount) return alert("Please select an amount.");
    if (!recipientPhone) return alert("Please enter recipient phone number.");
    if (!/^\d{11}$/.test(recipientPhone)) return alert("Please enter a valid 11-digit phone number.");
    setShowConfirmModal(true);
  };

  const handleConfirmedSubmit = async () => {
    if (!selectedAmount) return;
    
    setIsSubmitting(true);
    try {
      if (!walletClient || !isConnected || !address) throw new Error("Wallet not connected");
      if (!publicClient) throw new Error("Public client not available");

      const amountInWei = parseUnits(selectedAmount.usdc_value.toString(), 6);
      const txHash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "processPayment",
        args: [amountInWei],
        account: address,
      });

      await publicClient.waitForTransactionReceipt({ hash: txHash });

      const response = await fetch("/send-topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operatorId: selectedAmount.operator_id,
          amount: selectedAmount.amount,
          currency: selectedAmount.currency,
          recipientPhone,
          senderPhone: "08012345678",
          recipientEmail: "miniapp@aitimeplus.xyz",
        }),
      });

      if (!response.ok) throw new Error("Network response was not ok");
      const dataResp = await response.json();
      console.log("Topup Response:", dataResp);

      setShowConfirmModal(false);
      setActiveTab("success");
    } catch (error) {
      console.error("Error processing transaction:", error);
      setErrorMessage(error instanceof Error ? error.message : "Transaction unsuccessful. Please try again.");
      setShowConfirmModal(false);
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
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
                  {service.amount} {service.currency} (${service.usdc_value} USDC)
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
            <div className="flex justify-end space-x-4">
              <Button variant="ghost" onClick={() => setShowConfirmModal(false)} disabled={isSubmitting}>Edit</Button>
              <Button onClick={handleConfirmedSubmit} disabled={isSubmitting}>
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
