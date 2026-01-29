export class BinanceAccountRequestDto {
  user_id: number;
  credential_id: number;
  api_key: string;
  secret_key: string;
}

export class BinanceBalanceDto {
  asset: string;
  free: number;
  locked: number;
  total: number;
}

export class BinanceAccountResponseDto {
  success: boolean;
  message: string;
  data: {
    makerCommission?: number;
    takerCommission?: number;
    canTrade?: boolean;
    canWithdraw?: boolean;
    canDeposit?: boolean;
    accountType?: string;
    balances?: Array<{
      asset: string;
      free: string;
      locked: string;
    }>;
    permissions?: string[];
  };
}
