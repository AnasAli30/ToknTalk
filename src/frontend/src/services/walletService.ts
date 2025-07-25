import { backendService } from './backendService';
import { Principal } from '@dfinity/principal';

// Backend response types
interface BackendWallet {
  user_id: Principal;
  account_id: string;
  balance: bigint;
  created_at: bigint;
}

interface BackendTransaction {
  id: bigint;
  from: Principal;
  to: Principal;
  amount: bigint;
  timestamp: bigint;
  transaction_type: { Transfer: null } | { Tip: null };
  status: { Pending: null } | { Completed: null } | { Failed: null };
}

type WalletResult = { Ok: BackendWallet } | { Err: string };
type WalletResult_7 = { Ok: BackendWallet } | { Err: string };
type BalanceResult = { Ok: bigint } | { Err: string };
type BalanceResult_5 = { Ok: bigint } | { Err: string };
type TransactionResult = { Ok: BackendTransaction } | { Err: string };

// Types for wallet operations
export interface Wallet {
  user_id: string;
  account_id: string;
  balance: bigint;
  created_at: bigint;
}

export interface Transaction {
  id: bigint;
  from: string;
  to: string;
  amount: bigint;
  timestamp: bigint;
  transaction_type: 'Transfer' | 'Receive' | 'Tip';
  status: 'Pending' | 'Completed' | 'Failed';
}

export interface TransferRequest {
  toUserId: string;
  amount: number;
}

export interface TipRequest {
  userId: string;
  amount: number;
}

/**
 * Service for handling all wallet-related operations
 */
export const walletService = {
  /**
   * Create a new wallet for the current user
   */
  async createWallet(): Promise<Wallet> {
    console.log("Creating wallet");
    try {
      const actor = await backendService.getAuthenticatedActor();
      const result = await actor.create_wallet() as WalletResult_7;
      
      if ('Ok' in result && result['Ok']) {
        const wallet = result['Ok'];
        return {
          user_id: wallet.user_id.toString(),
          account_id: wallet.account_id,
          balance: wallet.balance,
          created_at: wallet.created_at
        };
      } else if ('Err' in result) {
        throw new Error('Failed to create wallet: ' + result['Err']);
      } else {
        throw new Error('Unknown error creating wallet');
      }
    } catch (error) {
      console.error("Error creating wallet:", error);
      throw error;
    }
  },

  /**
   * Get the current user's wallet
   */
  async getWallet(): Promise<Wallet> {
    console.log("Getting wallet");
    try {
      const actor = await backendService.getAuthenticatedActor();
      const result = await actor.get_wallet() as WalletResult_7;
      
      if ('Ok' in result && result['Ok']) {
        const wallet = result['Ok'];
        return {
          user_id: wallet.user_id.toString(),
          account_id: wallet.account_id,
          balance: wallet.balance,
          created_at: wallet.created_at
        };
      } else if ('Err' in result) {
        throw new Error('Failed to get wallet: ' + result['Err']);
      } else {
        throw new Error('Unknown error getting wallet');
      }
    } catch (error) {
      console.error("Error getting wallet:", error);
      throw error;
    }
  },

  /**
   * Add test ICP to current user's wallet
   */
  async addTestICP(amount: number): Promise<bigint> {
    console.log("Adding test ICP:", amount);
    try {
      const actor = await backendService.getAuthenticatedActor();
      const result = await actor.add_test_icp(BigInt(amount)) as BalanceResult_5;
      
      if ('Ok' in result && result['Ok'] !== undefined) {
        return result['Ok'];
      } else if ('Err' in result) {
        throw new Error('Failed to add test ICP: ' + result['Err']);
      } else {
        throw new Error('Unknown error adding test ICP');
      }
    } catch (error) {
      console.error("Error adding test ICP:", error);
      throw error;
    }
  },

  /**
   * Get the current user's balance
   */
  async getBalance(): Promise<bigint> {
    console.log("Getting balance");
    try {
      const actor = await backendService.getAuthenticatedActor();
      const result = await actor.get_balance() as BalanceResult_5;
      
      if ('Ok' in result && result['Ok'] !== undefined) {
        return result['Ok'];
      } else if ('Err' in result) {
        throw new Error('Failed to get balance: ' + result['Err']);
      } else {
        throw new Error('Unknown error getting balance');
      }
    } catch (error) {
      console.error("Error getting balance:", error);
      throw error;
    }
  },

  /**
   * Transfer tokens to another user
   */
  async transferTokens(request: TransferRequest): Promise<Transaction> {
    console.log("Transferring tokens:", request);
    try {
      const actor = await backendService.getAuthenticatedActor();
      const result = await actor.transfer_tokens(
        Principal.fromText(request.toUserId),
        BigInt(request.amount)
      ) as TransactionResult;
      
      if ('Ok' in result && result['Ok']) {
        const transaction = result['Ok'];
        return {
          id: transaction.id,
          from: transaction.from.toString(),
          to: transaction.to.toString(),
          amount: transaction.amount,
          timestamp: transaction.timestamp,
          transaction_type: this.convertTransactionType(transaction.transaction_type),
          status: this.convertTransactionStatus(transaction.status)
        };
      } else if ('Err' in result) {
        throw new Error('Failed to transfer tokens: ' + result['Err']);
      } else {
        throw new Error('Unknown error transferring tokens');
      }
    } catch (error) {
      console.error("Error transferring tokens:", error);
      throw error;
    }
  },

  /**
   * Tip another user
   */
  async tipUser(request: TipRequest): Promise<Transaction> {
    console.log("Tipping user:", request);
    try {
      const actor = await backendService.getAuthenticatedActor();
      const result = await actor.tip_user(
        Principal.fromText(request.userId),
        BigInt(request.amount)
      ) as TransactionResult;
      
      if ('Ok' in result && result['Ok']) {
        const transaction = result['Ok'];
        return {
          id: transaction.id,
          from: transaction.from.toString(),
          to: transaction.to.toString(),
          amount: transaction.amount,
          timestamp: transaction.timestamp,
          transaction_type: this.convertTransactionType(transaction.transaction_type),
          status: this.convertTransactionStatus(transaction.status)
        };
      } else if ('Err' in result) {
        throw new Error('Failed to tip user: ' + result['Err']);
      } else {
        throw new Error('Unknown error tipping user');
      }
    } catch (error) {
      console.error("Error tipping user:", error);
      throw error;
    }
  },

  /**
   * Helper function to convert transaction type enum to string
   */
  convertTransactionType(type: { Transfer: null } | { Tip: null }): 'Transfer' | 'Tip' {
    if ('Transfer' in type) return 'Transfer';
    if ('Tip' in type) return 'Tip';
    return 'Transfer'; // fallback
  },

  /**
   * Helper function to convert transaction status enum to string
   */
  convertTransactionStatus(status: { Pending: null } | { Completed: null } | { Failed: null }): 'Pending' | 'Completed' | 'Failed' {
    if ('Pending' in status) return 'Pending';
    if ('Completed' in status) return 'Completed';
    if ('Failed' in status) return 'Failed';
    return 'Completed'; // fallback
  },

  /**
   * Get transaction history for the current user
   */
  async getTransactionHistory(limit: number = 50): Promise<Transaction[]> {
    console.log("Getting transaction history");
    try {
      const actor = await backendService.getAuthenticatedActor();
      const transactions = await actor.get_transaction_history(BigInt(limit)) as BackendTransaction[];
      const currentUser = await actor.whoami() as Principal;
      
      return transactions.map(transaction => {
        // Convert enum variants to strings
        const backendType = this.convertTransactionType(transaction.transaction_type);
        const backendStatus = this.convertTransactionStatus(transaction.status);
        
        // Determine if this is a receive transaction from user's perspective
        const isReceive = transaction.to.toString() === currentUser.toString();
        const displayType = isReceive ? 'Receive' : backendType;
        
        return {
          id: transaction.id,
          from: transaction.from.toString(),
          to: transaction.to.toString(),
          amount: transaction.amount,
          timestamp: transaction.timestamp,
          transaction_type: displayType,
          status: backendStatus
        };
      });
    } catch (error) {
      console.error("Error getting transaction history:", error);
      throw error;
    }
  },

  /**
   * Format balance for display
   */
  formatBalance(balance: bigint): string {
    // Convert from e8s (ICP has 8 decimal places)
    const icp = Number(balance) / 100000000;
    return icp.toFixed(8);
  },

  /**
   * Format amount for display
   */
  formatAmount(amount: bigint): string {
    const icp = Number(amount) / 100000000;
    return icp.toFixed(8);
  },

  /**
   * Convert ICP to e8s
   */
  icpToE8s(icp: number): bigint {
    return BigInt(Math.floor(icp * 100000000));
  },

  /**
   * Get transaction type display name
   */
  getTransactionTypeDisplay(type: 'Transfer' | 'Receive' | 'Tip'): string {
    switch (type) {
      case 'Transfer':
        return 'Sent';
      case 'Receive':
        return 'Received';
      case 'Tip':
        return 'Tip';
      default:
        return type;
    }
  },

  /**
   * Get transaction status color
   */
  getTransactionStatusColor(status: 'Pending' | 'Completed' | 'Failed'): string {
    switch (status) {
      case 'Pending':
        return 'text-yellow-500';
      case 'Completed':
        return 'text-green-500';
      case 'Failed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  }
}; 