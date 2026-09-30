import { Order, NotificationLog } from '../types';
import {
  interpolateSmsTemplate,
  BD_SMS_TEMPLATES,
  dispatchBdSms,
  SmsTemplateVariables,
} from '../services/smsGatewayService';

const NOTIFICATIONS_STORAGE_KEY = 'primevault_notification_logs';

/**
 * Reads all persisted notification logs from localStorage
 */
export const getNotificationLogs = (): NotificationLog[] => {
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to read notification logs', e);
  }
  return [];
};

/**
 * Persists an array of notification logs to localStorage
 */
export const saveNotificationLogs = (logs: NotificationLog[]): void => {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save notification logs', e);
  }
};

/**
 * Generates an authentic Bangladesh Telco SMS message with dynamic template fields:
 * {orderId}, {total}, {courierName}, {trackingNumber}, {trackingUrl}, {customerName}, {helpline}
 */
export const generateSmsContent = (
  order: Order,
  eventType: 'placed' | 'confirmed' | 'shipped' | 'out_for_delivery' | 'delivered',
  customTemplate?: string
): string => {
  const customerName = order.address.fullName.split(' ')[0] || 'Customer';
  const orderId = order.id;
  const total = `৳${order.total.toLocaleString()}`;
  const courierName = order.courierName || 'Pathao Express';
  const trackingNumber = order.trackingNumber || `PT-${order.id.replace(/\D/g, '') || '918'}BD`;
  const trackingUrl = `https://primevault.bd/track/${order.id.replace('#', '')}`;
  const helpline = '01883-418309';

  const template = customTemplate || BD_SMS_TEMPLATES[eventType] || BD_SMS_TEMPLATES.confirmed;
  return interpolateSmsTemplate(template, {
    orderId,
    total,
    courierName,
    trackingNumber,
    trackingUrl,
    customerName,
    helpline,
    status: order.status,
  });
};

/**
 * Generates branded HTML Email body for transaction receipts and shipping updates
 */
export const generateEmailContent = (
  order: Order,
  eventType: 'placed' | 'confirmed' | 'shipped' | 'out_for_delivery' | 'delivered'
): { subject: string; html: string } => {
  const customerName = order.address.fullName || 'Valued Customer';
  const orderId = order.id;
  const courier = order.courierName || 'Pathao Express';
  const trackingNumber = order.trackingNumber || `PT-${order.id.replace(/\D/g, '') || '918'}BD`;

  const itemsList = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
        <strong style="color: #0f172a; font-size: 13px;">${item.product.title}</strong>
        ${item.selectedSize ? `<br/><span style="color: #64748b; font-size: 11px;">Size: ${item.selectedSize}</span>` : ''}
        <br/><span style="color: #4f46e5; font-size: 11px;">Merchant: ${item.storeName || 'Prime Vault Official'}</span>
      </td>
      <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: center; color: #475569; font-size: 13px;">
        ${item.quantity}x
      </td>
      <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: bold; color: #0f172a; font-size: 13px;">
        ৳${(item.product.price * item.quantity).toLocaleString()}
      </td>
    </tr>
  `
    )
    .join('');

  const subject = 
    eventType === 'placed'
      ? `Order Confirmation: #${orderId} — PRIME VAULT ZONE 🇧🇩`
      : eventType === 'shipped'
      ? `Your Parcel #${orderId} has been Dispatched via ${courier} 🚚`
      : `Delivery Update: #${orderId} — ${order.status}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
      <div style="background: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 1px; color: #ffffff;">PRIME VAULT ZONE</h1>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">Bangladesh Premier Lifestyle & Luxury Perfume Marketplace</p>
      </div>

      <div style="padding: 24px;">
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 16px; color: #0f172a; margin: 0 0 4px 0;">Hello ${customerName},</h2>
          <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">
            ${
              eventType === 'placed'
                ? `Thank you for shopping with us! Your order <strong>#${orderId}</strong> has been logged in our secure ledger.`
                : eventType === 'shipped'
                ? `Great news! Your package is in transit with <strong>${courier}</strong> (Consignment: <strong>${trackingNumber}</strong>).`
                : `We have updated the progress for your order <strong>#${orderId}</strong>.`
            }
          </p>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid #cbd5e1; text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b;">
                <th style="padding-bottom: 6px;">Product</th>
                <th style="padding-bottom: 6px; text-align: center;">Qty</th>
                <th style="padding-bottom: 6px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding-top: 12px; font-size: 12px; color: #64748b;">Subtotal</td>
                <td style="padding-top: 12px; text-align: right; font-size: 12px; font-weight: bold; color: #0f172a;">৳${order.subtotal.toLocaleString()}</td>
              </tr>
              ${order.discount > 0 ? `
              <tr>
                <td colspan="2" style="font-size: 12px; color: #059669;">Promo Discount</td>
                <td style="text-align: right; font-size: 12px; font-weight: bold; color: #059669;">-৳${order.discount.toLocaleString()}</td>
              </tr>` : ''}
              ${order.walletDeducted > 0 ? `
              <tr>
                <td colspan="2" style="font-size: 12px; color: #4f46e5;">Wallet Bonus Applied</td>
                <td style="text-align: right; font-size: 12px; font-weight: bold; color: #4f46e5;">-৳${order.walletDeducted.toLocaleString()}</td>
              </tr>` : ''}
              <tr>
                <td colspan="2" style="font-size: 12px; color: #64748b;">Delivery Charge (${order.address.cityDivision})</td>
                <td style="text-align: right; font-size: 12px; font-weight: bold; color: #0f172a;">৳${order.deliveryFee.toLocaleString()}</td>
              </tr>
              <tr style="border-top: 2px solid #cbd5e1;">
                <td colspan="2" style="padding-top: 8px; font-size: 14px; font-weight: 800; color: #0f172a;">Total Payable (${order.paymentMethod.toUpperCase()})</td>
                <td style="padding-top: 8px; text-align: right; font-size: 15px; font-weight: 800; color: #4f46e5;">৳${order.total.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 24px; font-size: 12px; color: #475569;">
          <strong style="color: #0f172a; display: block; margin-bottom: 4px;">Delivery Destination:</strong>
          ${order.address.fullAddress}<br/>
          Contact: <strong>${order.address.phone}</strong>
        </div>

        <div style="text-align: center;">
          <a href="https://primevault.bd/track/${orderId}" style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: bold; font-size: 13px; letter-spacing: 0.5px;">
            Track Order Live GPS 🚚
          </a>
        </div>
      </div>

      <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
        24/7 Helpline: <strong>+880 1883-418309</strong> | Email: <strong>support@primevaultzone.com</strong><br/>
        House #42, Road #11, Banani / Uttara Sector 3, Dhaka-1230, Bangladesh
      </div>
    </div>
  `;

  return { subject, html };
};

/**
 * Dispatches simulated SMS and Email notifications and persists to logs
 */
export const triggerOrderNotifications = (
  order: Order,
  eventType: 'placed' | 'confirmed' | 'shipped' | 'out_for_delivery' | 'delivered'
): { smsLog: NotificationLog; emailLog?: NotificationLog } => {
  const now = new Date();
  const timeFormatted = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // SMS Gateway Selection based on Bangladeshi Phone Prefix (017=GP/Greenweb, 018=Robi/BulkSMS, 019=Banglalink/SSL)
  const phone = order.address.phone || '';
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  let gatewayChannel: NotificationLog['channel'] = 'GP_BULK_SMS';
  if (cleanPhone.startsWith('018') || cleanPhone.startsWith('88018')) {
    gatewayChannel = 'BULKSMS_BD';
  } else if (cleanPhone.startsWith('019') || cleanPhone.startsWith('88019')) {
    gatewayChannel = 'SSL_WIRELESS_SMS';
  } else if (cleanPhone.startsWith('017') || cleanPhone.startsWith('88017')) {
    gatewayChannel = 'GREENWEB_SMS';
  }

  const smsText = generateSmsContent(order, eventType);

  // Dispatch asynchronous real BD SMS API payload
  dispatchBdSms(order.address.phone, smsText).catch(() => {});

  const smsLog: NotificationLog = {
    id: `notif-sms-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    orderId: order.id,
    recipientName: order.address.fullName,
    recipientPhone: order.address.phone,
    type: 'sms',
    channel: gatewayChannel,
    title: `SMS Dispatch: Order #${order.id} (${eventType.toUpperCase()})`,
    message: smsText,
    status: 'Delivered',
    sentAt: timeFormatted,
    gatewayTrxId: `GW-${gatewayChannel.split('_')[0]}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
  };

  const currentLogs = getNotificationLogs();
  const updatedLogs = [smsLog, ...currentLogs];

  let emailLog: NotificationLog | undefined;

  // If user has email or order has address email, generate email log too
  const customerEmail = 'customer@example.com';
  if (customerEmail) {
    const { subject, html } = generateEmailContent(order, eventType);
    emailLog = {
      id: `notif-eml-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      orderId: order.id,
      recipientName: order.address.fullName,
      recipientPhone: order.address.phone,
      recipientEmail: customerEmail,
      type: 'email',
      channel: 'SENDGRID_EMAIL',
      title: subject,
      message: html,
      status: 'Delivered',
      sentAt: timeFormatted,
      gatewayTrxId: `EML-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    };
    updatedLogs.unshift(emailLog);
  }

  saveNotificationLogs(updatedLogs);

  return { smsLog, emailLog };
};
