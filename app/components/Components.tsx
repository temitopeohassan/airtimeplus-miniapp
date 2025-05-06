"use client";

import React, { type ReactNode, useCallback, useState } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { parseUnits } from "viem";
import data from "../data.json";

// Reusable Button component
type ButtonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  icon?: ReactNode;
};
export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  disabled = false,
  type = "button",
  icon,
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0052FF] disabled:opacity-50 disabled:pointer-events-none";

  const variantClasses = {
    primary:
      "bg-[var(--app-accent)] hover:bg-[var(--app-accent-hover)] text-[var(--app-background)]",
    secondary:
      "bg-[var(--app-gray)] hover:bg-[var(--app-gray-dark)] text-[var(--app-foreground)]",
    outline:
      "border border-[var(--app-accent)] hover:bg-[var(--app-accent-light)] text-[var(--app-accent)]",
    ghost:
      "hover:bg-[var(--app-accent-light)] text-[var(--app-foreground-muted)]",
  };

  const sizeClasses = {
    sm: "text-xs px-2.5 py-1.5 rounded-md",
    md: "text-sm px-4 py-2 rounded-lg",
    lg: "text-base px-6 py-3 rounded-lg",
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="flex items-center mr-2">{icon}</span>}
      {children}
    </button>
  );
}

// Card wrapper component
type CardProps = {
  title?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
};
function Card({ title, children, className = "", onClick }: CardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={`bg-[var(--app-card-bg)] backdrop-blur-md rounded-xl shadow-lg border border-[var(--app-card-border)] overflow-hidden transition-all hover:shadow-xl ${className} ${
        onClick ? "cursor-pointer" : ""
      }`}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : undefined}
    >
      {title && (
        <div className="px-5 py-3 border-b border-[var(--app-card-border)]">
          <h3 className="text-lg font-medium text-[var(--app-foreground)]">
            {title}
          </h3>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

// Features tab component
type FeaturesProps = { setActiveTab: (tab: string) => void };
export function Features({ setActiveTab }: FeaturesProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <Card title="Key Features">
        <ul className="space-y-3 mb-4">
          {[
            "Minimalistic and beautiful UI design",
            "Responsive layout for all devices",
            "Dark mode support",
            "OnchainKit integration",
          ].map((feat) => (
            <li className="flex items-start" key={feat}>
              <Icon name="check" className="text-[var(--app-accent)] mt-1 mr-2" />
              <span className="text-[var(--app-foreground-muted)]">{feat}</span>
            </li>
          ))}
        </ul>
        <Button variant="outline" onClick={() => setActiveTab("home")}>Back to Home</Button>
      </Card>
    </div>
  );
}

// Home tab
type HomeProps = { setActiveTab: (tab: string) => void };
export function Home({ setActiveTab }: HomeProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <Card title="AirtimePlus">
        <p className="text-[var(--app-foreground-muted)] mb-4">
          Please add your phone number
        </p>
        <Button onClick={() => setActiveTab("add number")} icon={<Icon name="arrow-right" size="sm" />}>Add A Number</Button>
      </Card>
    </div>
  );
}

// Add number form component
type AddNumberProps = { setActiveTab: (tab: string) => void };
export function AddNumber({ setActiveTab }: AddNumberProps) {
  const countries = data.countries as readonly string[];
  const networks = data.networks as Record<string, string[]>;

  const [country, setCountry] = useState<string>("");
  const [network, setNetwork] = useState<string>("");
  const [number, setNumber] = useState<string>("");

  const handleAdd = () => {
    console.log({ country, network, number });
    setActiveTab("home");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card title="Add Number">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Country</label>
            <select
              className="w-full border px-3 py-2 rounded"
              value={country}
              onChange={(e) => { setCountry(e.target.value); setNetwork(""); }}
            >
              <option value="">Select Country</option>
              {countries.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Network</label>
            <select
              className="w-full border px-3 py-2 rounded"
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              disabled={!country}
            >
              <option value="">Select Network</option>
              {country && networks[country]?.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Number</label>
            <input
              type="text"
              className="w-full border px-3 py-2 rounded"
              placeholder="Enter phone number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
          </div>
          <div className="text-right">
            <Button onClick={handleAdd} icon={<Icon name="plus" size="sm" />}>Add</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Confirm number component
type ConfirmNumberProps = { setActiveTab: (tab: string) => void };
export function ConfirmNumber({ setActiveTab }: ConfirmNumberProps) {
  const [otp, setOtp] = useState("");
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(cleaned);
  };
  const handleConfirm = useCallback(() => {
    console.log("Entered OTP:", otp);
    setActiveTab("success");
  }, [otp, setActiveTab]);

  return (
    <div className="space-y-6 animate-fade-in">
      <Card title="Confirm Number">
        <div className="space-y-4">
          <p className="text-[var(--app-foreground-muted)]">Please enter the OTP number sent to your phone</p>
          <input
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={6}
            className="w-full text-center tracking-widest text-lg border px-3 py-2 rounded"
            placeholder="••••••"
            value={otp}
            onChange={handleChange}
          />
          <div className="text-right">
            <Button onClick={handleConfirm} disabled={otp.length < 6}>Confirm</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Icon component
type IconProps = { name: "heart" | "star" | "check" | "plus" | "arrow-right"; size?: "sm" | "md" | "lg"; className?: string };
export function Icon({ name, size = "md", className = "" }: IconProps) {
  const sizeClasses = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-6 h-6" };
  const icons = {
    heart: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="{sizeClasses[size]}" aria-hidden="true"><title>Heart</title><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    star: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="{sizeClasses[size]}" aria-hidden="true"><title>Star</title><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    check: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="{sizeClasses[size]}" aria-hidden="true"><title>Check</title><polyline points="20 6 9 17 4 12"/></svg>,
    plus: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="{sizeClasses[size]}" aria-hidden="true"><title>Plus</title><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    "arrow-right": <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="{sizeClasses[size]}" aria-hidden="true"><title>Arrow Right</title><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  };
  return <span className={`inline-block ${sizeClasses[size]} ${className}`}>{icons[name]}</span>;
}

// Main BuyAirtime component with wagmi v1+ hooks
type BuyAirtimeProps = { setActiveTab: (tab: string) => void };
export function BuyAirtime({ setActiveTab }: BuyAirtimeProps) {
  const [amount, setAmount] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const CONTRACT_ADDRESS = "0xaF108Dd1aC530F1c4BdED13f43E336A9cec92B44";
  const CONTRACT_ABI = [
    "function processPayment(uint256 amount) external nonReentrant",
    "event PaymentProcessed(address indexed from, uint256 amount, uint256 timestamp)"
  ];

  const handleSubmitForm = () => {
    if (!amount) {
      alert("Please select an airtime amount.");
      return;
    }
    if (!recipientPhone) {
      alert("Please enter recipient phone number.");
      return;
    }
    if (!/^\d{11}$/.test(recipientPhone)) {
      alert("Please enter a valid 11-digit phone number.");
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmedSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (!walletClient || !isConnected || !address) {
        throw new Error("Wallet not connected");
      }
      if (!publicClient) {
        throw new Error("Public client not available");
      }
      const amountInWei = parseUnits(amount, 6);
      // Send on-chain transaction
      const txHash = await walletClient.writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "processPayment",
        args: [amountInWei],
        account: address,
      });
      // Wait for transaction to be mined
      await publicClient.waitForTransactionReceipt({ hash: txHash });

      // If blockchain transaction successful, proceed with API call
      const response = await fetch('/send-topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorId: "100",
          amount,
          recipientPhone,
          senderPhone: "08012345678",
          recipientEmail: "miniapp@aitimeplus.xyz"
        }),
      });
      if (!response.ok) throw new Error('Network response was not ok');
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

  return (
    <div className="space-y-6 animate-fade-in">
      <Card title="Buy Airtime">
        <div className="space-y-4">
          <p className="text-[var(--app-foreground-muted)]">Enter recipient details</p>
          <div>
            <label className="block text-sm font-medium mb-1">Recipient Phone Number</label>
            <input
              type="tel"
              className="w-full border px-3 py-2 rounded"
              placeholder="Enter 11-digit phone number"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              maxLength={11}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Airtime Amount</label>
            <select
              className="w-full border px-3 py-2 rounded"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            >
              <option value="">Select Amount</option>
              {["100","200","500","1000","2000"].map((amt) => (
                <option key={amt} value={amt}>₦{amt}</option>
              ))}
            </select>
          </div>
          <div className="text-right">
            <Button onClick={handleSubmitForm} disabled={isSubmitting}>{isSubmitting ? 'Processing...' : 'Buy'}</Button>
          </div>
        </div>
      </Card>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <p className="text-gray-700 mb-4">Please confirm the number you are sending the airtime to as airtime sent to the wrong number can not be reversed</p>
            <h4 className="text-xl font-bold mb-6 text-center">{recipientPhone}</h4>
            <div className="flex justify-end space-x-4">
              <Button variant="ghost" onClick={() => setShowConfirmModal(false)} disabled={isSubmitting}>Edit</Button>
              <Button onClick={handleConfirmedSubmit} disabled={isSubmitting}>{isSubmitting ? 'Processing...' : 'Submit'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <p className="text-red-600 mb-4">{errorMessage}</p>
            <div className="flex justify-end">
              <Button onClick={() => setShowErrorModal(false)}>Dismiss</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
