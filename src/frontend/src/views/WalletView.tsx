import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  Send, 
  Download, 
  History, 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  RefreshCw,
  X
} from 'lucide-react';
import { walletService, Wallet as WalletType, Transaction, TransferRequest, TipRequest } from '../services/walletService';
import { backendService } from '../services/backendService';
import { useAuth } from '../context/AuthContext';

interface WalletViewProps {
  onNavigateToUserProfile?: (userId: string) => void;
}

const WalletView: React.FC<WalletViewProps> = ({ onNavigateToUserProfile }) => {
  const { authState } = useAuth();
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [balance, setBalance] = useState<bigint>(BigInt(0));
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferLoading, setTransferLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [transferForm, setTransferForm] = useState({ toUserId: '', amount: '' });
  const [copied, setCopied] = useState(false);
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});

  useEffect(() => {
    if (authState.isAuthenticated) {
      loadWalletData();
    }
  }, [authState.isAuthenticated]);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load wallet and balance in parallel
      const [walletData, balanceData, transactionsData] = await Promise.all([
        walletService.getWallet(),
        walletService.getBalance(),
        walletService.getTransactionHistory(20)
      ]);
      
      setWallet(walletData);
      setBalance(balanceData);
      setTransactions(transactionsData);
      
      // Load user profiles for transaction participants
      await loadUserProfiles(transactionsData);
    } catch (err: any) {
      console.error('Error loading wallet data:', err);
      setError('Failed to load wallet data: ' + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfiles = async (transactions: Transaction[]) => {
    try {
      const userIds = new Set<string>();
      
      // Collect all unique user IDs from transactions
      transactions.forEach(tx => {
        if (tx.from !== authState.principal) {
          userIds.add(tx.from);
        }
        if (tx.to !== authState.principal) {
          userIds.add(tx.to);
        }
      });
      
      // Load profiles for all unique users
      const profiles: Record<string, any> = {};
      for (const userId of userIds) {
        try {
          const result = await backendService.getUserProfile(userId);
          if (result && 'Ok' in result) {
            profiles[userId] = result.Ok;
          }
        } catch (err) {
          console.warn(`Failed to load profile for user ${userId}:`, err);
        }
      }
      
      setUserProfiles(profiles);
    } catch (err) {
      console.error('Error loading user profiles:', err);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.toUserId.trim() || !transferForm.amount.trim()) {
      setError('Please fill in all fields');
      return;
    }

    // Let the backend handle Principal ID validation for more accurate error messages

    const amount = parseFloat(transferForm.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setTransferLoading(true);
      setError(null);
      
      const request: TransferRequest = {
        toUserId: transferForm.toUserId.trim(),
        amount: Number(walletService.icpToE8s(amount))
      };
      
      await walletService.transferTokens(request);
      
      setSuccess('Transfer completed successfully!');
      setTransferForm({ toUserId: '', amount: '' });
      setShowTransferForm(false);
      
      // Reload wallet data
      await loadWalletData();
    } catch (err: any) {
      console.error('Error transferring tokens:', err);
      setError('Transfer failed: ' + (err.message || String(err)));
    } finally {
      setTransferLoading(false);
    }
  };



  const copyAccountId = async () => {
    if (wallet?.account_id) {
      try {
        await navigator.clipboard.writeText(wallet.account_id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy account ID:', err);
      }
    }
  };

  const handleGetTestICP = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Add 100 ICP (in e8s)
      const newBalance = await walletService.addTestICP(100_000_000_000); // 100 ICP
      setBalance(newBalance);
      
      setSuccess('Added 100 test ICP to your wallet!');
      
      // Reload wallet data to get updated transaction history
      await loadWalletData();
    } catch (err: any) {
      console.error('Error adding test ICP:', err);
      setError('Failed to add test ICP: ' + (err.message || String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000); // Convert from nanoseconds
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'Transfer':
        return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      case 'Receive':
        return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
      case 'Tip':
        return <Gift className="w-4 h-4 text-purple-500" />;
      default:
        return <Wallet className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleUserClick = (userId: string) => {
    if (onNavigateToUserProfile) {
      onNavigateToUserProfile(userId);
    }
  };

  const getUserDisplayName = (userId: string) => {
    const profile = userProfiles[userId];
    if (profile && profile.username) {
      return profile.username;
    }
    return userId.slice(0, 8) + '...';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-accent" />
          <p className="text-text-secondary">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient rounded-xl flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Wallet</h1>
            <p className="text-text-secondary">Manage your tokens and transactions</p>
          </div>
        </div>
        <button
          onClick={loadWalletData}
          className="flex items-center space-x-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error/Success Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center space-x-2 p-4 bg-green-50 border border-green-200 rounded-lg"
          >
            <CheckCircle className="w-5 h-5 text-green-500" />
            <p className="text-green-700">{success}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Balance Card */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Balance</h2>
          <div className="text-sm text-text-secondary">Account ID</div>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="text-3xl font-bold text-text-primary">
            {walletService.formatBalance(balance)} ICP
          </div>
          <button
            onClick={copyAccountId}
            className="flex items-center space-x-2 px-3 py-1 text-sm bg-background border border-border rounded-lg hover:bg-accent/10 transition-colors"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy ID</span>
              </>
            )}
          </button>
        </div>
        
        <div className="text-sm text-text-secondary break-all">
          {wallet?.account_id}
        </div>
        
        {/* Principal ID for sharing */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-primary">Your Principal ID</span>
            <button
              onClick={() => {
                if (authState.principal) {
                  navigator.clipboard.writeText(authState.principal);
                  setSuccess('Principal ID copied to clipboard!');
                }
              }}
              className="text-xs text-accent hover:text-accent/80 transition-colors"
            >
              Copy
            </button>
          </div>
          <div className="text-xs text-text-secondary break-all">
            {authState.principal}
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Share this Principal ID with others so they can send you tokens.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setShowTransferForm(true)}
          className="flex items-center justify-center space-x-2 p-4 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
        >
          <Send className="w-5 h-5" />
          <span>Send Tokens</span>
        </button>
        
        <button
          onClick={() => setShowReceiveModal(true)}
          className="flex items-center justify-center space-x-2 p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-5 h-5" />
          <span>Receive</span>
        </button>

        <button
          onClick={handleGetTestICP}
          disabled={isLoading}
          className="flex items-center justify-center space-x-2 p-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <RefreshCw className="w-5 h-5" />
          )}
          <span>Get Test ICP</span>
        </button>
      </div>

      {/* Transfer Form Modal */}
      <AnimatePresence>
        {showTransferForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowTransferForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-xl p-6 w-full max-w-md border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold mb-4">Send Tokens</h3>
              <form onSubmit={handleTransfer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Recipient Principal ID</label>
                  <input
                    type="text"
                    value={transferForm.toUserId}
                    onChange={(e) => setTransferForm({ ...transferForm, toUserId: e.target.value })}
                    className="w-full p-3 border border-border rounded-lg bg-background text-text-primary"
                    placeholder="e.g., ew5hu-icdri-umonc-5e5zu-ryl6i-tdszb-w7cit-l5jkk-y4nkg-2bhv4-5ae"
                  />
                  <p className="text-xs text-text-secondary mt-1">
                    Enter the recipient's Principal ID (not account ID). You can find this in their profile or ask them to share it.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Amount (ICP)</label>
                  <input
                    type="number"
                    step="0.00000001"
                    value={transferForm.amount}
                    onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                    className="w-full p-3 border border-border rounded-lg bg-background text-text-primary"
                    placeholder="0.00000001"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowTransferForm(false)}
                    className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-background transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={transferLoading}
                    className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
                  >
                    {transferLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      'Send'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* Receive Modal */}
      <AnimatePresence>
        {showReceiveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowReceiveModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-xl p-6 w-full max-w-md border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-text-primary">Receive Tokens</h3>
                <button
                  onClick={() => setShowReceiveModal(false)}
                  className="p-2 rounded-full hover:bg-background transition-colors"
                >
                  <X />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-text-primary">Your Principal ID</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={authState.principal || ''}
                      readOnly
                      className="flex-1 p-3 border border-border rounded-lg bg-background text-text-primary text-sm"
                    />
                    <button
                      onClick={() => {
                        if (authState.principal) {
                          navigator.clipboard.writeText(authState.principal);
                          setSuccess('Principal ID copied to clipboard!');
                        }
                      }}
                      className="px-3 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Share this Principal ID with others so they can send you tokens. 
                    You can also use the tip button on user profiles for easier sending.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction History */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Recent Transactions</h2>
          <History className="w-5 h-5 text-text-secondary" />
        </div>
        
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <motion.div
                key={tx.id.toString()}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 bg-background rounded-lg border border-border"
              >
                <div className="flex items-center space-x-3">
                  {getTransactionIcon(tx.transaction_type)}
                  <div>
                    <p className="font-medium text-text-primary">
                      {walletService.getTransactionTypeDisplay(tx.transaction_type)}
                    </p>
                    <div className="text-sm text-text-secondary">
                      {tx.transaction_type === 'Receive' ? (
                        <span>
                          From{' '}
                          <button
                            onClick={() => handleUserClick(tx.from)}
                            className="text-accent hover:text-accent/80 underline cursor-pointer"
                          >
                            {getUserDisplayName(tx.from)}
                          </button>
                        </span>
                      ) : (
                        <span>
                          To{' '}
                          <button
                            onClick={() => handleUserClick(tx.to)}
                            className="text-accent hover:text-accent/80 underline cursor-pointer"
                          >
                            {getUserDisplayName(tx.to)}
                          </button>
                        </span>
                      )}
                      {' • '}{formatDate(tx.timestamp)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${
                    tx.transaction_type === 'Receive' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {tx.transaction_type === 'Receive' ? '+' : '-'}{walletService.formatAmount(tx.amount)} ICP
                  </p>
                  <p className={`text-sm ${walletService.getTransactionStatusColor(tx.status)}`}>
                    {tx.status}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletView; 