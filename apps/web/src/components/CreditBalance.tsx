import * as React from "react";
import { useCreditBalance } from "@packages/ui-logic";
import { CreditDisplay } from "./CreditDisplay";

interface CreditBalanceProps {
  onBuyClick: () => void;
}

export function CreditBalance({ onBuyClick }: CreditBalanceProps) {
  const { data, isLoading } = useCreditBalance();

  const balance = data?.balance ?? 0;
  const isLow = balance < (data?.minimums.toPlay ?? 10);

  return (
    <CreditDisplay
      balance={balance}
      isLow={isLow}
      isLoading={isLoading}
      onBuyClick={onBuyClick}
      showAddButton={true}
    />
  );
}
