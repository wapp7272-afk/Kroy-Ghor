import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  Store, 
  MapPin, 
  Phone, 
  Calendar, 
  CreditCard,
  Building2,
  FileText,
  Sparkles,
  QrCode
} from 'lucide-react';
import { Order } from '../types';
import { VaultLogo } from './VaultLogo';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalItemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  // Helper to determine payment method label
  const getPaymentLabel = () => {
    if (order.paymentMethod === 'cod') return 'Cash on Delivery (COD)';
    if (order.paymentMethod === 'bkash') return 'bKash Digital Payment';
    if (order.paymentMethod === 'nagad') return 'Nagad Digital Payment';
    if (order.paymentMethod === 'card') return 'Credit / Debit Card (SSL)';
    return 'Cash on Delivery (COD)';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
      {/* Printable styles for clean print output */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-printable-area, #invoice-printable-area * {
            visibility: visible;
          }
          #invoice-printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-3xl my-6 bg-white rounded-3xl border border-[#E5E7EB] shadow-2xl max-h-[94vh] flex flex-col overflow-hidden">
        {/* Modal Top Control Bar (Hidden on print) */}
        <div className="no-print p-4 sm:p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#EDE9FE] text-[#5B21B6] border border-purple-200">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#171717] text-sm sm:text-base">
                Official Invoice & Money Receipt
              </h3>
              <p className="text-[11px] text-[#525252]">
                Order {order.id} • ZeropicBD Bangladesh
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-[#171717] hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Close invoice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6" id="invoice-printable-area">
          {/* ================= Header: Brand & Meta ================= */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-purple-100">
            <div>
              <VaultLogo size="md" showText={true} />
              <p className="text-xs text-[#525252] mt-2 font-medium">
                Premium Lifestyle & Multi-Vendor Marketplace
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Dhaka, Bangladesh • Hotline: 01883418309 • support@zeropicbd.com
              </p>
            </div>

            <div className="sm:text-right space-y-1">
              <div className="inline-block px-3 py-1 rounded-md bg-[#EDE9FE] text-[#5B21B6] font-mono font-black text-xs uppercase tracking-wider border border-purple-200">
                TAX INVOICE / MEMO
              </div>
              <div className="font-mono text-base font-black text-[#171717]">
                Invoice #{order.id.replace('#', '')}
              </div>
              <div className="text-xs text-gray-500 flex items-center sm:justify-end gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>Date: {order.date}</span>
              </div>
              <div className="text-xs font-semibold text-emerald-700">
                Status: {order.status}
              </div>
            </div>
          </div>

          {/* ================= Bill To / Ship To Grid ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-gray-50 border border-[#E5E7EB] text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">
                Customer / Shipping Details (প্রাপকের তথ্য):
              </span>
              <p className="font-extrabold text-[#171717] text-sm">
                {order.address.fullName}
              </p>
              <p className="text-[#525252] mt-0.5 flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-[#5B21B6]" />
                <span className="font-mono font-bold">{order.address.phone}</span>
              </p>
              <p className="text-[#525252] mt-1 flex items-start gap-1.5 leading-relaxed">
                <MapPin className="w-3 h-3 text-[#5B21B6] shrink-0 mt-0.5" />
                <span>
                  {order.address.fullAddress}, {order.address.district || order.address.cityDivision}
                </span>
              </p>
            </div>

            <div className="sm:text-right space-y-1 sm:border-l sm:border-gray-200 sm:pl-4">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">
                Payment & Fulfillment Details:
              </span>
              <p className="font-bold text-[#171717]">
                Method: <span className="text-[#5B21B6]">{getPaymentLabel()}</span>
              </p>
              {order.trxId && (
                <p className="text-gray-600 font-mono text-[11px]">
                  TrxID: <span className="font-bold text-gray-900">{order.trxId}</span>
                </p>
              )}
              <p className="text-gray-600 text-[11px]">
                Shipping Zone: <strong>{order.address.cityDivision}</strong>
              </p>
              <p className="text-[11px] text-emerald-700 font-bold">
                Payment Status: {order.paymentMethod === 'cod' ? 'Pay on Delivery' : 'Verified & Paid'}
              </p>
            </div>
          </div>

          {/* ================= Itemized Product Table ================= */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-100 text-[#171717]">
                  <th className="py-2.5 px-3 font-extrabold">Item Description</th>
                  <th className="py-2.5 px-3 font-extrabold">Merchant / Store</th>
                  <th className="py-2.5 px-3 font-extrabold text-right">Price</th>
                  <th className="py-2.5 px-3 font-extrabold text-center">Qty</th>
                  <th className="py-2.5 px-3 font-extrabold text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.items.map((item, idx) => {
                  const storeName = item.storeName || item.product.storeName || item.product.sellerName || 'ZeropicBD Official';
                  return (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={item.product.image}
                            alt={item.product.title}
                            className="w-9 h-9 rounded-lg object-cover bg-gray-50 border border-gray-200 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-[#171717]">{item.product.title}</p>
                            {item.selectedSize && (
                              <span className="text-[10px] text-[#5B21B6] bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                Variant: {item.selectedSize}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-gray-600">
                        <div className="flex items-center gap-1">
                          <Store className="w-3 h-3 text-[#5B21B6]" />
                          <span>{storeName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium">
                        ৳{item.product.price.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center font-bold">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#171717]">
                        ৳{(item.product.price * item.quantity).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ================= Financial Totals & Sign-off ================= */}
          <div className="pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#5B21B6]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authorized Merchant Guarantee</span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Thank you for shopping with ZeropicBD. All items are verified for 100% authenticity. You are entitled to 7 days replacement guarantee for manufacturing issues.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <div className="w-16 h-16 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center p-1 shrink-0">
                  <QrCode className="w-full h-full text-gray-700" />
                </div>
                <div className="text-[10px] text-gray-500">
                  <span className="font-mono font-bold text-[#171717] block">SCAN TO VERIFY RECEIPT</span>
                  <span>ID: {order.id}</span>
                  <span className="block mt-0.5">Automated Digital Order Slip</span>
                </div>
              </div>
            </div>

            {/* Calculations Table */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({totalItemsCount} items):</span>
                <span className="font-mono font-bold text-[#171717]">৳{order.subtotal.toLocaleString()}</span>
              </div>

              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon Discount:</span>
                  <span className="font-mono">-৳{order.discount.toLocaleString()}</span>
                </div>
              )}

              {order.walletDeducted > 0 && (
                <div className="flex justify-between text-purple-700 font-semibold">
                  <span>Wallet Bonus Deducted:</span>
                  <span className="font-mono">-৳{order.walletDeducted.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600">
                <span>Delivery Charge ({order.address.cityDivision}):</span>
                <span className="font-mono font-bold text-[#171717]">৳{order.deliveryFee.toLocaleString()}</span>
              </div>

              <div className="pt-2 border-t-2 border-purple-200 flex justify-between items-baseline">
                <span className="text-sm font-extrabold text-[#171717]">Total Payable (সর্বমোট):</span>
                <span className="text-xl font-black text-[#5B21B6]">
                  ৳{order.total.toLocaleString()}
                </span>
              </div>

              <p className="text-[10px] text-right text-gray-400 italic">
                * Prices are inclusive of all applicable VAT & SD.
              </p>
            </div>
          </div>

          {/* ================= Footer Signature / Notice ================= */}
          <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 gap-2">
            <span>This is a computer generated invoice and requires no physical signature.</span>
            <span className="font-mono text-gray-500">ZeropicBD • www.zeropicbd.com</span>
          </div>
        </div>
      </div>
    </div>
  );
};
