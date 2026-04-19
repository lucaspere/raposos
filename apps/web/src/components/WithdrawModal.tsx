"use client";

import { TRPCClientError } from "@trpc/client";
import { useEffect, useRef, useState } from "react";
import { trpc } from "@/trpc/react";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultContractorId?: string;
}

export default function WithdrawModal({ isOpen, onClose, defaultContractorId }: WithdrawModalProps) {
  const [contractorId, setContractorId] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const pixOfframp = trpc.withdrawals.pixOfframp.useMutation();
  const seededDefaultForOpen = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      seededDefaultForOpen.current = false;
      return;
    }
    if (defaultContractorId && !seededDefaultForOpen.current) {
      setContractorId(defaultContractorId);
      seededDefaultForOpen.current = true;
    }
  }, [isOpen, defaultContractorId]);

  if (!isOpen) return null;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      await pixOfframp.mutateAsync({
        contractorId,
        amount: Number(amount),
      });

      setStatus("success");
      setTimeout(() => {
        onClose();
        setStatus("idle");
        setContractorId("");
        setAmount("");
      }, 2000);
    } catch (error: unknown) {
      setStatus("error");
      setErrorMessage(
        error instanceof TRPCClientError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Withdrawal failed",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pt-10 px-4 pb-20 text-center sm:block sm:p-0">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
      
      <div className="inline-block align-bottom bg-surface-container border border-outline-variant/20 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full relative">
        <div className="bg-surface-container px-6 pt-6 pb-4 sm:p-8 sm:pb-6 relative z-10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl leading-6 font-headline font-bold text-on-background">Withdraw via PIX</h3>
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          
          <form onSubmit={handleWithdraw}>
            <div className="space-y-4">
              <div>
                <label className="block text-[0.65rem] uppercase tracking-widest text-zinc-500 font-bold mb-2">Contractor UUID</label>
                <input
                  type="text"
                  required
                  value={contractorId}
                  onChange={(e) => setContractorId(e.target.value)}
                  className="w-full bg-surface-container-lowest border-0 ring-1 ring-outline-variant/30 focus:ring-primary rounded-lg px-4 py-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none"
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                />
              </div>
              
              <div>
                <label className="block text-[0.65rem] uppercase tracking-widest text-zinc-500 font-bold mb-2">Amount (USDC)</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-surface-container-lowest border-0 ring-1 ring-outline-variant/30 focus:ring-primary rounded-lg px-4 py-3 font-mono text-xl text-primary font-bold placeholder-zinc-600 focus:outline-none"
                    placeholder="0.00"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-zinc-500 font-mono text-sm">USDC</span>
                  </div>
                </div>
              </div>

              {status === "error" && (
                <div className="bg-error-container/20 text-error text-sm p-3 rounded border border-error/20 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[1.2rem]">error</span>
                  <p>{errorMessage}</p>
                </div>
              )}

              {status === "success" && (
                <div className="bg-secondary-container/20 text-secondary text-sm p-3 rounded border border-secondary/20 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[1.2rem]">check_circle</span>
                  <p>Withdrawal initiated! Awaiting PIX confirmation.</p>
                </div>
              )}
            </div>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-outline-variant/50 text-on-surface rounded-lg font-bold text-sm hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={status === "loading" || status === "success"}
                className="flex-1 px-4 py-3 bg-primary text-on-primary rounded-lg font-bold text-sm hover:bg-primary-container transition-colors shadow-lg disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {status === "loading" ? "Processing..." : "Confirm PIX"}
                {status === "idle" && <span className="material-symbols-outlined text-[1.2rem]">arrow_forward</span>}
              </button>
            </div>
          </form>
        </div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>
    </div>
  );
}
