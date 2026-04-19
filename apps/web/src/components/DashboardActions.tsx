"use client";

import { useState } from "react";
import WithdrawModal from "./WithdrawModal";

interface DashboardActionsProps {
  defaultContractorId?: string;
}

export default function DashboardActions({ defaultContractorId }: DashboardActionsProps) {
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap gap-4">
        <button 
          onClick={() => setIsWithdrawModalOpen(true)}
          className="px-8 py-3.5 bg-primary text-on-primary rounded-lg font-bold text-sm hover:bg-primary-container transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-[1.2rem]">payments</span>
          Withdraw via PIX
        </button>
        <button className="px-8 py-3.5 border border-outline-variant text-on-background rounded-lg font-bold text-sm hover:bg-surface-container-high transition-all active:scale-95 flex items-center gap-2">
          <span className="material-symbols-outlined text-[1.2rem]">send</span>
          Send to Wallet
        </button>
      </div>

      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        defaultContractorId={defaultContractorId}
      />
    </>
  );
}
