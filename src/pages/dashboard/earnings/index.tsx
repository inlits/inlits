import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { DollarSign, TrendingUp, CreditCard, Clock, Eye, ArrowUp, ArrowDown, BookOpen, Headphones, Mic, Users } from 'lucide-react';

interface EarningsOverview {
  total_earnings: number;
  earnings_growth: number;
  monthly_revenue: number;
  monthly_growth: number;
  pending_payouts: number;
  available_balance: number;
}

interface EarningsSource {
  source_type: string;
  amount: number;
  percentage: number;
}

interface Transaction {
  id: string;
  amount: number;
  source_type: string;
  earned_at: string;
  source_details: {
    title?: string;
    price?: number;
  };
}

export function EarningsPage() {
  const { profile } = useAuth();
  const [overview, setOverview] = useState<EarningsOverview | null>(null);
  const [sources, setSources] = useState<EarningsSource[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEarningsData = async () => {
      if (!profile) return;

      try {
        // Get earnings overview
        const { data: overviewData, error: overviewError } = await supabase.rpc(
          'get_earnings_overview',
          { creator_id: profile.id }
        );

        if (overviewError) throw overviewError;
        if (overviewData) {
          setOverview(overviewData[0]);
        }

        // Get earnings by source
        const { data: sourcesData, error: sourcesError } = await supabase.rpc(
          'get_earnings_by_source',
          { creator_id: profile.id }
        );

        if (sourcesError) throw sourcesError;
        setSources(sourcesData || []);

        // Get transaction history
        const { data: historyData, error: historyError } = await supabase.rpc(
          'get_earnings_history',
          { creator_id: profile.id, page_size: 10, page_number: 1 }
        );

        if (historyError) throw historyError;
        setTransactions(historyData || []);
      } catch (error) {
        console.error('Error loading earnings data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEarningsData();
  }, [profile]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatGrowth = (value: number) => {
    if (!value) return '+0%';
    return value > 0 ? `+${value.toFixed(1)}%` : `${value.toFixed(1)}%`;
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'book_sale':
        return <BookOpen className="w-4 h-4" />;
      case 'audiobook_sale':
        return <Headphones className="w-4 h-4" />;
      case 'subscription':
        return <Users className="w-4 h-4" />;
      case 'session':
        return <Clock className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const formatSourceType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#1a1d24] rounded-lg p-6 h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#1a1d24] rounded-lg p-6 h-64" />
          <div className="bg-[#1a1d24] rounded-lg p-6 h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1a1d24] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-400">Total Earnings</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-2xl font-semibold">
                  {formatMoney(overview?.total_earnings || 0)}
                </p>
                <p className="ml-2 text-sm text-blue-500">
                  {formatGrowth(overview?.earnings_growth || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1d24] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-400">Monthly Revenue</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-2xl font-semibold">
                  {formatMoney(overview?.monthly_revenue || 0)}
                </p>
                <p className="ml-2 text-sm text-blue-500">
                  {formatGrowth(overview?.monthly_growth || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1d24] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-400">Pending Payouts</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-2xl font-semibold">
                  {formatMoney(overview?.pending_payouts || 0)}
                </p>
                <p className="ml-2 text-sm text-gray-400">Processing</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1d24] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-400">Available Balance</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-2xl font-semibold">
                  {formatMoney(overview?.available_balance || 0)}
                </p>
                <button className="ml-2 text-sm text-blue-500 hover:underline">
                  Withdraw
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <div className="bg-[#1a1d24] rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-6">Revenue Breakdown</h2>
          <div className="space-y-6">
            {sources.map((source) => (
              <div key={source.source_type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getSourceIcon(source.source_type)}
                    <span>{formatSourceType(source.source_type)}</span>
                  </div>
                  <span>{formatMoney(source.amount)}</span>
                </div>
                <div className="h-2 bg-[#2a2f38] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${source.percentage}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400">
                  {source.percentage.toFixed(1)}% of total revenue
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-[#1a1d24] rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-6">Transaction History</h2>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-[#2a2f38]">
                <div>
                  <div className="flex items-center gap-2">
                    {getSourceIcon(transaction.source_type)}
                    <span className="font-medium">
                      {transaction.source_details.title || formatSourceType(transaction.source_type)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {new Date(transaction.earned_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatMoney(transaction.amount)}</p>
                  <p className="text-sm text-blue-500">Completed</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}