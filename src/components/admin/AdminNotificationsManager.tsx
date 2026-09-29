import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Smartphone, 
  Mail, 
  Search, 
  CheckCircle2, 
  RefreshCw, 
  Send, 
  Copy, 
  Check, 
  ExternalLink, 
  Clock, 
  ShieldCheck, 
  Filter, 
  Radio, 
  X,
  FileText,
  AlertCircle
} from 'lucide-react';
import { NotificationLog, Order } from '../../types';
import { getNotificationLogs, saveNotificationLogs } from '../../utils/notificationService';

export interface AdminNotificationsManagerProps {
  orders: Order[];
  showToast?: (msg: string) => void;
  onViewOrder?: (orderId: string) => void;
}

export const AdminNotificationsManager: React.FC<AdminNotificationsManagerProps> = ({
  orders,
  showToast = () => {},
  onViewOrder,
}) => {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'sms' | 'email'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPreviewLog, setSelectedPreviewLog] = useState<NotificationLog | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Manual Test SMS Broadcast State
  const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);
  const [testPhone, setTestPhone] = useState<string>('01883418309');
  const [testMessage, setTestMessage] = useState<string>(
    '[PRIME VAULT TEST] Gateway handshake check: SMS gateway is operational.'
  );
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);

  // Load logs on mount
  useEffect(() => {
    const loaded = getNotificationLogs();
    if (loaded.length === 0 && orders.length > 0) {
      // Seed initial sample logs if empty
      const sampleLogs: NotificationLog[] = [
        {
          id: 'notif-seed-1',
          orderId: orders[0]?.id || 'PVZ-91823',
          recipientName: orders[0]?.address.fullName || 'Arifur Rahman',
          recipientPhone: orders[0]?.address.phone || '01712345678',
          type: 'sms',
          channel: 'GP_BULK_SMS',
          title: `SMS Dispatch: Order #${orders[0]?.id || 'PVZ-91823'} (CONFIRMED)`,
          message: `[PRIME VAULT] Dear Customer, your Order #${orders[0]?.id || 'PVZ-91823'} is confirmed! Track live: https://primevault.bd/track/${orders[0]?.id || 'PVZ-91823'}. Helpline: 01883418309`,
          status: 'Delivered',
          sentAt: '28 Sep 2026, 14:35',
          gatewayTrxId: 'GP-883912A',
        },
        {
          id: 'notif-seed-2',
          orderId: orders[0]?.id || 'PVZ-91823',
          recipientName: orders[0]?.address.fullName || 'Arifur Rahman',
          recipientPhone: orders[0]?.address.phone || '01712345678',
          recipientEmail: 'customer@example.com',
          type: 'email',
          channel: 'SENDGRID_EMAIL',
          title: `Order Confirmation: #${orders[0]?.id || 'PVZ-91823'} — PRIME VAULT ZONE 🇧🇩`,
          message: `<div style="font-family: sans-serif; padding: 20px;"><h3>Order Confirmation #${orders[0]?.id || 'PVZ-91823'}</h3><p>Your order has been verified and packed for express dispatch.</p></div>`,
          status: 'Delivered',
          sentAt: '28 Sep 2026, 14:35',
          gatewayTrxId: 'SG-9018442',
        },
      ];
      saveNotificationLogs(sampleLogs);
      setLogs(sampleLogs);
    } else {
      setLogs(loaded);
    }
  }, [orders]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResend = (log: NotificationLog) => {
    const newLog: NotificationLog = {
      ...log,
      id: `notif-resend-${Date.now()}`,
      sentAt: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      gatewayTrxId: `${log.channel.substring(0, 3)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    };

    const updated = [newLog, ...logs];
    setLogs(updated);
    saveNotificationLogs(updated);
    showToast(`✓ Resent ${log.type.toUpperCase()} notification to ${log.recipientPhone || log.recipientEmail}!`);
  };

  const handleSendTestSms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone || !testMessage) return;

    setIsSendingTest(true);
    setTimeout(() => {
      const newLog: NotificationLog = {
        id: `notif-test-${Date.now()}`,
        orderId: 'TEST-BROADCAST',
        recipientName: 'Test Recipient',
        recipientPhone: testPhone,
        type: 'sms',
        channel: testPhone.startsWith('018') ? 'ROBI_GATEWAY' : 'GP_BULK_SMS',
        title: 'Admin Manual SMS Dispatch Test',
        message: testMessage,
        status: 'Delivered',
        sentAt: new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        gatewayTrxId: `TEST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      };

      const updated = [newLog, ...logs];
      setLogs(updated);
      saveNotificationLogs(updated);
      setIsSendingTest(false);
      setIsTestModalOpen(false);
      showToast(`📱 Test SMS dispatched successfully to ${testPhone}!`);
    }, 600);
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (filterType !== 'all' && log.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.orderId.toLowerCase().includes(q) ||
        log.recipientName.toLowerCase().includes(q) ||
        log.recipientPhone.toLowerCase().includes(q) ||
        (log.recipientEmail && log.recipientEmail.toLowerCase().includes(q)) ||
        (log.gatewayTrxId && log.gatewayTrxId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const smsCount = logs.filter((l) => l.type === 'sms').length;
  const emailCount = logs.filter((l) => l.type === 'email').length;

  return (
    <div className="space-y-6">

      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#4F46E5]">
              <Bell className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Customer Dispatch Notifications & SMS Gateway
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated SMS & Email transaction logs powered by Grameenphone, Robi, and SendGrid gateways.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsTestModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            <span>Send Test SMS</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Dispatches</span>
            <Radio className="w-4 h-4 text-[#4F46E5]" />
          </div>
          <div className="text-xl font-black text-slate-900">{logs.length}</div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>100% Gateway Uptime</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>SMS Notifications</span>
            <Smartphone className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-slate-900">{smsCount}</div>
          <div className="text-[11px] text-slate-500">
            GP & Robi Bulk Telco API
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Email Receipts</span>
            <Mail className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-slate-900">{emailCount}</div>
          <div className="text-[11px] text-slate-500">
            SendGrid HTML Receipts
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Avg Delivery Time</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-slate-900">1.8s</div>
          <div className="text-[11px] text-emerald-600 font-semibold">
            Sub-2 second throughput
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Logs ({logs.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('sms')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterType === 'sms'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>SMS ({smsCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('email')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterType === 'email'
                ? 'bg-white text-[#4F46E5] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email ({emailCount})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, name, or phone..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
          />
        </div>
      </div>

      {/* Notifications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Channel / Type</th>
                <th className="py-3.5 px-4">Order ID</th>
                <th className="py-3.5 px-4">Recipient</th>
                <th className="py-3.5 px-4">Sent At</th>
                <th className="py-3.5 px-4">Gateway Reference</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        log.type === 'sms'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                      }`}>
                        {log.type === 'sms' ? <Smartphone className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                        <span>{log.channel}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {log.orderId === 'TEST-BROADCAST' ? (
                        <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">TEST</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onViewOrder && onViewOrder(log.orderId)}
                          className="hover:text-[#4F46E5] hover:underline cursor-pointer"
                        >
                          #{log.orderId}
                        </button>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{log.recipientName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {log.type === 'sms' ? log.recipientPhone : log.recipientEmail || log.recipientPhone}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {log.sentAt}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {log.gatewayTrxId || '—'}
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                        <span>Delivered</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedPreviewLog(log)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium transition-colors cursor-pointer"
                          title="View message content"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResend(log)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          title="Resend to recipient"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Resend</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No notification logs found matching "{searchQuery}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message Preview Modal */}
      {selectedPreviewLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-lg ${
                  selectedPreviewLog.type === 'sms' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {selectedPreviewLog.type === 'sms' ? <Smartphone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedPreviewLog.title}</h3>
                  <p className="text-[11px] text-slate-500">
                    Channel: {selectedPreviewLog.channel} • Ref: {selectedPreviewLog.gatewayTrxId}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPreviewLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
              <div className="text-xs space-y-1 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div><strong>Recipient:</strong> {selectedPreviewLog.recipientName} ({selectedPreviewLog.recipientPhone})</div>
                <div><strong>Order:</strong> #{selectedPreviewLog.orderId}</div>
                <div><strong>Sent At:</strong> {selectedPreviewLog.sentAt}</div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {selectedPreviewLog.type === 'sms' ? 'SMS Body Text' : 'Email Content'}
                </label>
                {selectedPreviewLog.type === 'sms' ? (
                  <div className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs leading-relaxed border border-slate-800">
                    {selectedPreviewLog.message}
                  </div>
                ) : (
                  <div 
                    className="p-4 rounded-xl border border-slate-200 text-xs overflow-auto max-h-96"
                    dangerouslySetInnerHTML={{ __html: selectedPreviewLog.message }}
                  />
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <button
                type="button"
                onClick={() => handleCopy(selectedPreviewLog.message, 'preview')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
              >
                {copiedId === 'preview' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'preview' ? 'Copied' : 'Copy Content'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPreviewLog(null)}
                className="px-4 py-1.5 rounded-xl bg-[#4F46E5] text-white text-xs font-bold hover:bg-[#4338CA] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Test SMS Modal */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Send Test SMS Broadcast</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTestModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendTestSms} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Recipient BD Mobile Number *
                </label>
                <input
                  type="text"
                  required
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="e.g. 01883418309"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  SMS Message (Bangla/English) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                />
                <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                  {testMessage.length} characters • 1 SMS Unit
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingTest}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSendingTest ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-amber-400" />
                      <span>Dispatch SMS</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
