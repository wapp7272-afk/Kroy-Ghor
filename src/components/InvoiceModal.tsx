import React from 'react';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  Store, 
  MapPin, 
  Phone, 
  Calendar, 
  FileText,
  QrCode
} from 'lucide-react';
import { Order } from '../types';
import Logo from './Logo';

export interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order?: Order | any | null;
  orderData?: any;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  order,
  orderData,
}) => {
  if (!isOpen) return null;

  // Normalize order data from either `order` or `orderData`
  const activeOrder = order || orderData || {};

  const orderId = activeOrder.id || 'ZP-88492';
  const orderDate = activeOrder.date || new Date().toLocaleDateString('bn-BD');
  const customerName = activeOrder.address?.fullName || activeOrder.customerName || 'সম্মানিত গ্রাহক';
  const customerPhone = activeOrder.address?.phone || activeOrder.phone || '01883-418309';
  const customerAddress = activeOrder.address?.fullAddress 
    ? `${activeOrder.address.fullAddress}, ${activeOrder.address.district || activeOrder.address.cityDivision || ''}`
    : (activeOrder.address || 'ধানমন্ডি, ঢাকা - ১২০৯');

  // Payment method label
  const getPaymentMethodDisplay = () => {
    const method = activeOrder.paymentMethod;
    if (method === 'cod' || method === 'Cash on Delivery') return 'ক্যাশ অন ডেলিভারি (Cash on Delivery)';
    if (method === 'bkash') return 'বিকাশ ডিজিটাল পেমেন্ট (bKash)';
    if (method === 'nagad') return 'নগদ ডিজিটাল পেমেন্ট (Nagad)';
    if (method === 'card') return 'ক্রেডিট / ডেবিট কার্ড (Card)';
    return activeOrder.paymentMethod || 'ক্যাশ অন ডেলিভারি (Cash on Delivery)';
  };

  const paymentStatus = activeOrder.paymentStatus || (activeOrder.paymentMethod === 'cod' ? 'ক্যাশ অন ডেলিভারি' : 'পরিশোধিত / পর্যালোচনাধীন');
  const orderStatus = activeOrder.status || 'Processing / নিশ্চিতকৃত';

  // Normalize items array
  const items: any[] = Array.isArray(activeOrder.items) && activeOrder.items.length > 0
    ? activeOrder.items
    : [
        {
          product: {
            title: activeOrder.productName || 'প্রিমিয়াম লাইফস্টাইল পণ্য',
            price: activeOrder.total || 1500,
            image: '',
          },
          quantity: 1,
          storeName: 'Kroy Ghor Official',
        }
      ];

  const subtotal = activeOrder.subtotal || items.reduce((sum, item) => {
    const price = item.product?.price || item.price || 0;
    const qty = item.quantity || 1;
    return sum + (price * qty);
  }, 0);

  const deliveryFee = typeof activeOrder.deliveryFee === 'number' ? activeOrder.deliveryFee : 60;
  const discount = activeOrder.discount || 0;
  const walletDeducted = activeOrder.walletDeducted || 0;
  const grandTotal = activeOrder.total || Math.max(0, subtotal + deliveryFee - discount - walletDeducted);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
      {/* Printable CSS styles */}
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

      <div className="relative w-full max-w-2xl my-6 bg-white rounded-2xl border border-gray-200 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Action Control Bar (Hidden on print) */}
        <div className="no-print p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                অফিসিয়াল ইনভয়েস ও মানি রিসিট
              </h3>
              <p className="text-[11px] text-gray-500">
                অর্ডার #{orderId} • Kroyghor (ক্রয় ঘর)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>প্রিন্ট করুন</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              aria-label="Close invoice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6" id="invoice-printable-area">
          {/* ================= Header: Brand & Meta ================= */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-gray-200">
            <div>
              <Logo variant="full" theme="light" size="md" />
              <p className="text-xs text-gray-500 mt-2">
                ঢাকা, বাংলাদেশ | হটলাইন: +880 1700-000000
              </p>
              <p className="text-xs text-gray-500">
                ইমেইল: support@kroyghor.com | ওয়েবসাইট: www.kroyghor.com
              </p>
            </div>

            <div className="sm:text-right space-y-1">
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-wider">
                ইনভয়েস
              </h2>
              <p className="text-sm font-semibold text-gray-700 font-mono">
                অর্ডার নং: #{orderId.replace('#', '')}
              </p>
              <p className="text-xs text-gray-500 flex items-center sm:justify-end gap-1">
                <Calendar className="w-3 h-3 text-gray-400" />
                <span>তারিখ: {orderDate}</span>
              </p>
              <p className="text-xs font-semibold text-emerald-700">
                স্ট্যাটাস: {orderStatus}
              </p>
            </div>
          </div>

          {/* ================= Customer & Order Details ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200 text-sm">
            <div>
              <h3 className="font-bold text-gray-800 mb-1.5 text-xs uppercase tracking-wider text-blue-600">
                গ্রাহকের তথ্য:
              </h3>
              <p className="font-bold text-gray-900">{customerName}</p>
              <p className="text-gray-600 mt-0.5 flex items-center gap-1.5 font-mono text-xs">
                <Phone className="w-3 h-3 text-blue-500" />
                <span>{customerPhone}</span>
              </p>
              <p className="text-gray-600 mt-1 flex items-start gap-1.5 text-xs leading-relaxed">
                <MapPin className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                <span>{customerAddress}</span>
              </p>
            </div>

            <div className="sm:text-right sm:border-l sm:border-gray-200 sm:pl-4">
              <h3 className="font-bold text-gray-800 mb-1.5 text-xs uppercase tracking-wider text-blue-600">
                পেমেন্ট মেথড:
              </h3>
              <p className="text-gray-800 font-semibold">{getPaymentMethodDisplay()}</p>
              <p className="text-xs text-emerald-600 font-semibold mt-1">
                পেমেন্ট স্ট্যাটাস: {paymentStatus}
              </p>
              {activeOrder.trxId && (
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  TrxID: {activeOrder.trxId}
                </p>
              )}
            </div>
          </div>

          {/* ================= Invoice Product Table ================= */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-800 border-b border-gray-200">
                  <th className="py-2.5 px-3 font-bold border">পণ্য (Item)</th>
                  <th className="py-2.5 px-3 font-bold border text-center">পরিমাণ</th>
                  <th className="py-2.5 px-3 font-bold border text-right">একক মূল্য</th>
                  <th className="py-2.5 px-3 font-bold border text-right">মোট</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const productTitle = item.product?.title || item.title || 'পণ্য';
                  const price = item.product?.price || item.price || 0;
                  const qty = item.quantity || 1;
                  const itemSubtotal = price * qty;
                  const storeName = item.storeName || item.product?.storeName || item.product?.sellerName || 'Kroy Ghor Official';

                  return (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="py-2.5 px-3 border">
                        <div className="font-medium text-gray-900">{productTitle}</div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <Store className="w-3 h-3 text-gray-400" />
                          <span>{storeName}</span>
                          {item.selectedSize && (
                            <span className="ml-1 text-blue-600 font-medium">({item.selectedSize})</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 border text-center font-mono font-medium">
                        {qty}
                      </td>
                      <td className="py-2.5 px-3 border text-right font-mono text-gray-700">
                        ৳ {price.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 border text-right font-mono font-bold text-gray-900">
                        ৳ {itemSubtotal.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ================= Calculations & Totals ================= */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-blue-700">
                <ShieldCheck className="w-4 h-4" />
                <span>১০০% অথেনটিক পণ্য নিশ্চয়তা</span>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                ক্রয় ঘর (Kroy Ghor)-এ শপিং করার জন্য ধন্যবাদ। আপনার অর্ডারকৃত সকল পণ্যে ৭ দিনের সহজ রিপ্লেসমেন্ট গ্যারান্টি প্রযোজ্য।
              </p>
            </div>

            <div className="space-y-1.5 text-xs text-right">
              <div className="flex justify-between text-gray-600">
                <span>উপমোট (Subtotal):</span>
                <span className="font-mono font-bold text-gray-900">৳ {subtotal.toLocaleString()}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>ডিসকাউন্ট (Discount):</span>
                  <span className="font-mono">-৳ {discount.toLocaleString()}</span>
                </div>
              )}

              {walletDeducted > 0 && (
                <div className="flex justify-between text-purple-600 font-semibold">
                  <span>ওয়ালেট বোনাস (Wallet):</span>
                  <span className="font-mono">-৳ {walletDeducted.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600">
                <span>ডেলিভারি চার্জ (Delivery):</span>
                <span className="font-mono font-bold text-gray-900">৳ {deliveryFee.toLocaleString()}</span>
              </div>

              <div className="pt-2 border-t-2 border-gray-300 flex justify-between items-baseline text-sm">
                <span className="font-black text-gray-900">সর্বমোট প্রদেয় (Grand Total):</span>
                <span className="text-lg font-black text-blue-600 font-mono">
                  ৳ {grandTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* ================= Actions & Footer Notice ================= */}
          <div className="no-print flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট করুন</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-sm font-medium transition-colors cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>

          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 gap-1 text-center">
            <span>এটি একটি কম্পিউটার জেনারেটেড ইনভয়েস, কোনো স্বাক্ষরের প্রয়োজন নেই।</span>
            <span className="font-mono text-gray-500">Kroy Ghor • ক্রয় ঘর</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
