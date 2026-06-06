import { useLocale } from '@/providers/LocaleContext';
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { propertyTokenStore, blockchainTransactionStore, web3WalletStore } from '@/services/stores';
import { formatQAR, formatDate, formatDecimal, formatPercent } from '@/lib/format';
import {
  Coins, Zap, Wallet, Shield, ExternalLink, TrendingUp,
} from 'lucide-react';
import type { PropertyToken, BlockchainTransaction, Web3Wallet, Blockchain, PropertyTokenStatus } from '@/types/phase8';

// ── Labels ────────────────────────────────────────────────────

const BLOCKCHAIN_LABELS: Record<Blockchain, string> = {
  solana: 'Solana',
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  avalanche: 'Avalanche',
};

const BLOCKCHAIN_COLORS: Record<Blockchain, string> = {
  solana: 'bg-emerald-100 text-emerald-700',
  ethereum: 'bg-[rgba(83,58,253,0.10)] text-[#533afd]',
  polygon: 'bg-violet-100 text-violet-700',
  avalanche: 'bg-red-100 text-[#ea2261]',
};

const TOKEN_STATUS_LABELS: Record<PropertyTokenStatus, string> = {
  draft: t.hr.draft || tt('hr.draft','مسودة'),
  minted: 'مُسك',
  listed: 'مُدرج',
  sold: 'مُباع',
  transferred: 'مُحوَّل',
  burned: 'مُحترق',
};

const TOKEN_STATUS_COLORS: Record<PropertyTokenStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  minted: 'bg-[rgba(83,58,253,0.10)] text-[#533afd]',
  listed: 'bg-amber-100 text-[#9b6829]',
  sold: 'bg-emerald-100 text-emerald-700',
  transferred: 'bg-violet-100 text-violet-700',
  burned: 'bg-red-100 text-[#ea2261]',
};

const TX_TYPE_LABELS: Record<string, string> = {
  mint: 'سك',
  transfer: 'تحويل',
  sale: 'بيع',
  burn: 'حرق',
  stake: 'تخزين',
};

const TX_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-[#9b6829]',
  confirmed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-[#ea2261]',
};

const TX_STATUS_LABELS: Record<string, string> = {
  pending: 'مُعلّق',
  confirmed: 'مُؤكَّد',
  failed: 'فاشل',
};

function truncate(str: string, len = 14): string {
  if (!str) return '-';
  return str.length > len ? `${str.slice(0, len)}...` : str;
}

// ── Component ────────────────────────────────────────────────

export default function BlockchainPage() {
  const { dir } = useLocale();
  const [tokens, setTokens] = useState<PropertyToken[]>(() => propertyTokenStore.getAll());
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>(() => blockchainTransactionStore.getAll());
  const [wallets, setWallets] = useState<Web3Wallet[]>(() => web3WalletStore.getAll());
  const [activeTab, setActiveTab] = useState('tokens');

  const refresh = () => {
    setTokens(propertyTokenStore.getAll());
    setTransactions(blockchainTransactionStore.getAll());
    setWallets(web3WalletStore.getAll());
  };

  const stats = useMemo(() => {
    const totalTokens = tokens.length;
    const mintedOrSold = tokens.filter(t => t.status === 'minted' || t.status === 'sold' || t.status === 'listed').length;
    const totalValue = tokens.reduce((s, t) => s + t.property_value_usd, 0);
    const totalWallets = wallets.length;
    return { totalTokens, mintedOrSold, totalValue, totalWallets };
  }, [tokens, wallets]);

  // ── KPI Cards ──────────────────────────────────────────────

  const kpiCards = (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <KpiCard label="إجمالي الرموز" value={stats.totalTokens} icon={<Coins className="h-5 w-5" />} color="blue" />
      <KpiCard label="مباع/مُسك" value={stats.mintedOrSold} icon={<Zap className="h-5 w-5" />} color="emerald" />
      <KpiCard label="قيمة الأصول" value={formatQAR(stats.totalValue)} icon={<Wallet className="h-5 w-5" />} color="violet" />
      <KpiCard label="المحافظ" value={stats.totalWallets} icon={<Shield className="h-5 w-5" />} color="orange" />
    </div>
  );

  // ── Tokens Tab ─────────────────────────────────────────────

  const tokensTab = (
    <TabsContent value="tokens">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tokens.map(token => {
          const fractionPct = token.total_supply > 0 ? (token.fractions_sold / token.total_supply) * 100 : 0;
          return (
            <Card key={token.id} className="hover:shadow-[rgba(50,50,93,0.25)_0px_13px_27px_-5px] transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base truncate">{token.token_name}</CardTitle>
                    <p className="text-xs text-[#64748d] font-mono mt-0.5">{token.token_symbol}</p>
                  </div>
                  <Badge className={BLOCKCHAIN_COLORS[token.blockchain] + ' shrink-0'}>
                    {BLOCKCHAIN_LABELS[token.blockchain]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Total supply + price */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-[#f6f9fc] rounded-lg">
                    <p className="text-xs text-[#64748d]">إجمالي العرض</p>
                    <p className="text-sm font-bold">{token.total_supply.toLocaleString('en-US')}</p>
                  </div>
                  <div className="text-center p-2 bg-[#f6f9fc] rounded-lg">
                    <p className="text-xs text-[#64748d]">سعر التقدير</p>
                    <p className="text-sm font-bold text-[#533afd]">{formatQAR(token.token_price_est)}</p>
                  </div>
                </div>

                {/* Fractional ownership badge */}
                {token.fractional_ownership && (
                  <Badge className="bg-indigo-100 text-indigo-700 w-fit">ملكية جزئية</Badge>
                )}

                {/* Fractions progress bar */}
                <div>
                  <div className="flex justify-between text-xs text-[#64748d] mb-1">
                    <span>الكسور المُباعة</span>
                    <span>{token.fractions_sold} / {token.total_supply}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${fractionPct}%` }}
                    />
                  </div>
                </div>

                {/* Status badge */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={TOKEN_STATUS_COLORS[token.status]}>
                    {TOKEN_STATUS_LABELS[token.status]}
                  </Badge>
                </div>

                {/* Property value & owner wallet */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-[#f6f9fc] rounded-lg">
                    <p className="text-xs text-[#64748d]">قيمة العقار</p>
                    <p className="text-sm font-bold">{formatQAR(token.property_value_usd)}</p>
                  </div>
                  <div className="text-center p-2 bg-[#f6f9fc] rounded-lg">
                    <p className="text-xs text-[#64748d]">المالك</p>
                    <p className="text-xs font-mono truncate">{truncate(token.owner_wallet, 12)}</p>
                  </div>
                </div>

                {/* Tx hash & IPFS */}
                <div className="space-y-1 pt-2 border-t text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748d]">معاملة السك:</span>
                    <code className="font-mono text-[12px]">{truncate(token.mint_tx_hash || '-', 16)}</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748d]">IPFS:</span>
                    <code className="font-mono text-[12px]">{truncate(token.metadata_ipfs_hash, 16)}</code>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </TabsContent>
  );

  // ── Transactions Tab ───────────────────────────────────────

  const transactionsTab = (
    <TabsContent value="transactions">
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">{tt('equipment.equipmentType', 'النوع')}</TableHead>
                <TableHead className="text-right">المعاملات</TableHead>
                <TableHead className="text-right">من</TableHead>
                <TableHead className="text-right">{tt('common.to', 'إلى')}</TableHead>
                <TableHead className="text-right">{tt('common.amount', 'المبلغ')}</TableHead>
                <TableHead className="text-right">الرسوم</TableHead>
                <TableHead className="text-right">{tt('common.date', 'التاريخ')}</TableHead>
                <TableHead className="text-right">{tt('legal.status', 'الحالة')}</TableHead>
                <TableHead className="text-right">رابط</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map(tx => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <Badge className={`text-xs ${
                      tx.tx_type === 'mint' ? 'bg-[rgba(83,58,253,0.10)] text-[#533afd]' :
                      tx.tx_type === 'sale' ? 'bg-emerald-100 text-emerald-700' :
                      tx.tx_type === 'transfer' ? 'bg-violet-100 text-violet-700' :
                      tx.tx_type === 'burn' ? 'bg-red-100 text-[#ea2261]' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {TX_TYPE_LABELS[tx.tx_type] || tx.tx_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs font-mono">{truncate(tx.tx_hash, 10)}</code>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs font-mono">{truncate(tx.from_wallet || '-', 10)}</code>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs font-mono">{truncate(tx.to_wallet, 10)}</code>
                  </TableCell>
                  <TableCell className="text-xs">{tx.amount.toLocaleString('en-US')}</TableCell>
                  <TableCell className="text-xs font-mono">{tx.gas_fee} {tx.gas_currency}</TableCell>
                  <TableCell className="text-xs">{formatDate(tx.block_timestamp)}</TableCell>
                  <TableCell>
                    <Badge className={TX_STATUS_COLORS[tx.status] || 'bg-gray-100 text-gray-700'}>
                      {TX_STATUS_LABELS[tx.status] || tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {tx.explorer_url && (
                      <a href={tx.explorer_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-[#533afd] hover:text-blue-800">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>
  );

  // ── Wallets Tab ────────────────────────────────────────────

  const walletsTab = (
    <TabsContent value="wallets">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {wallets.map(w => (
          <Card key={w.id} className="hover:shadow-[rgba(50,50,93,0.25)_0px_13px_27px_-5px] transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-[#533afd]" />
                    {w.wallet_name}
                  </CardTitle>
                  <code className="text-xs text-[#64748d] mt-1 block truncate">{w.wallet_address}</code>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge className={BLOCKCHAIN_COLORS[w.blockchain]}>
                    {BLOCKCHAIN_LABELS[w.blockchain]}
                  </Badge>
                  <Badge className={w.is_multisig ? 'bg-amber-100 text-[#9b6829]' : 'bg-gray-100 text-gray-700'}>
                    {w.is_multisig ? 'متعدد التوقيع' : 'فردي'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Balance */}
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2 bg-[#f6f9fc] rounded-lg">
                  <p className="text-xs text-[#64748d]">{tt('common.balance', 'الرصيد')}</p>
                  <p className="text-sm font-bold">{w.balance.toLocaleString('en-US')}</p>
                </div>
                <div className="text-center p-2 bg-[#f6f9fc] rounded-lg">
                  <p className="text-xs text-[#64748d]">القيمة بالدولار</p>
                  <p className="text-sm font-bold text-[#533afd]">{formatQAR(w.balance_usd)}</p>
                </div>
              </div>

              {/* Multisig signers */}
              {w.is_multisig && (
                <div className="p-2 bg-amber-50 rounded-lg">
                  <p className="text-xs font-medium text-amber-800 mb-1">
                    الموقعون ({w.required_signatures} مطلوب)
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {w.signers.map((s, i) => (
                      <code key={i} className="text-[12px] font-mono bg-white px-1.5 py-0.5 rounded border">
                        {truncate(s, 12)}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {/* Dapp & last activity */}
              <div className="flex items-center justify-between pt-2 border-t text-xs text-[#64748d]">
                <span>
                  {w.connected_dapp ? (
                    <Badge variant="secondary" className="text-xs">{w.connected_dapp}</Badge>
                  ) : (
                    'غير متصل'
                  )}
                </span>
                <span>آخر نشاط: {formatDate(w.last_activity_at)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </TabsContent>
  );

  // ── Main ───────────────────────────────────────────────────

  return (
    <div className="min-h-full bg-[#f6f9fc] p-6" dir={dir}>
      <PageHeader
        title="البلوكتشين والعقارات الرقمية (Web3)"
        description="ترميز الأصول العقارية، المعاملات اللامركزية، وإدارة المحافظ الرقمية"
      />

      {kpiCards}

      <Tabs value={activeTab} onValueChange={setActiveTab} dir={dir}>
        <TabsList className="mb-4">
          <TabsTrigger value="tokens">الرموز العقارية ({tokens.length})</TabsTrigger>
          <TabsTrigger value="transactions">المعاملات ({transactions.length})</TabsTrigger>
          <TabsTrigger value="wallets">المحافظ ({wallets.length})</TabsTrigger>
        </TabsList>

        {tokensTab}
        {transactionsTab}
        {walletsTab}
      </Tabs>
    </div>
  );
}
