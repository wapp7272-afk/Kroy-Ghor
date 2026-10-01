import emailjs from '@emailjs/browser';
import { Order, CartItem } from '../types';

// EmailJS Configuration Credentials with import.meta.env best practices
export const EMAILJS_CONFIG = {
  SERVICE_ID: (import.meta as any).env?.VITE_EMAILJS_SERVICE_ID || 'service_swsa8ze',
  TEMPLATE_ID: (import.meta as any).env?.VITE_EMAILJS_TEMPLATE_ID || 'template_mu6ehtm',
  PUBLIC_KEY: (import.meta as any).env?.VITE_EMAILJS_PUBLIC_KEY || 'j1SIRfDJ1hwkk72EyNhwg',
} as const;

// Initialize EmailJS with Public Key
emailjs.init({
  publicKey: EMAILJS_CONFIG.PUBLIC_KEY,
});

/**
 * Send Gmail OTP during account registration
 */
export async function sendOtpEmail(toEmail: string, toName: string, otpCode: string): Promise<boolean> {
  try {
    const templateParams = {
      to_email: toEmail,
      to_name: toName,
      user_email: toEmail,
      user_name: toName,
      otp_code: otpCode,
      code: otpCode,
      message: `Your Zeropicbd 4-digit verification code is: ${otpCode}. It will expire in 10 minutes.`,
      subject: `[Zeropicbd] Your Security Verification OTP: ${otpCode}`,
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      templateParams,
      EMAILJS_CONFIG.PUBLIC_KEY
    );

    console.log('[EmailJS] OTP email sent successfully:', response.status, response.text);
    return true;
  } catch (error) {
    console.error('[EmailJS] Failed to send OTP email:', error);
    return false;
  }
}

/**
 * Send Order Confirmation Notification via EmailJS
 */
export async function sendOrderEmail(order: Order, customerEmail?: string): Promise<boolean> {
  try {
    const itemsSummary = order.items
      .map((item: CartItem) => `${item.product.title} (x${item.quantity}) - ৳${item.product.price * item.quantity}`)
      .join('\n');

    const targetEmail = customerEmail || (order.address as any).email || 'customer@zeropicbd.com';

    const templateParams = {
      to_email: targetEmail,
      to_name: order.address.fullName,
      customer_name: order.address.fullName,
      order_id: order.id,
      order_date: order.date,
      order_total: `৳${order.total}`,
      order_items: itemsSummary,
      payment_method: order.paymentMethod.toUpperCase() + (order.trxId ? ` (TrxID: ${order.trxId})` : ''),
      delivery_address: `${order.address.fullAddress} (${order.address.cityDivision})`,
      customer_phone: order.address.phone,
      message: `New Order Confirmed (#${order.id})! Total: ৳${order.total}. Items:\n${itemsSummary}`,
      subject: `[Zeropicbd] Order Confirmation - #${order.id}`,
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      templateParams,
      EMAILJS_CONFIG.PUBLIC_KEY
    );

    console.log('[EmailJS] Order email sent successfully:', response.status, response.text);
    return true;
  } catch (error) {
    console.error('[EmailJS] Failed to send Order email:', error);
    return false;
  }
}
