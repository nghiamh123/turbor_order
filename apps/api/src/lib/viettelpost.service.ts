import { config } from '../config/index.js';
import { logger } from './logger.js';
import type { ITrackingEvent } from '../models/Order.js';

// ─── VTP API Response Types (from Swagger: partnerdev.viettelpost.vn/v2/v2/api-docs) ───

interface VtpLoginResponse {
  status: number;
  error: boolean | null;
  message: string;
  data?: {
    token: string;
    expireDate?: string;    // Production API
    expired?: number;       // Dev API (unix ms timestamp)
    userId?: number;
    customerCode?: string;
    partner?: number;
  };
}

/** VTP order status data (from /core/orders/query and /order/detail-v2) */
interface VtpOrderData {
  ORDER_NUMBER?: string;
  ORDER_STATUS?: number;
  STATUS_NAME?: string;
  ORDER_STATUSDATE?: string;    // "dd/MM/yyyy HH:mm:ss"
  LOCATION_CURRENTLY?: string;
  LOCALION_CURRENTLY?: string;  // Typo exists in their API, handle both
  NOTE?: string;
  ORDER_NOTE?: string;
  DETAIL?: Array<{ CODE: string; VALUE: number }>;
  RECEIVER_FULLNAME?: string;
}

interface VtpQueryResponse {
  status: number;
  error: boolean;
  message: string;
  data?: VtpOrderData | null;
}

/** VTP detail-v2 response wraps data differently */
interface VtpDetailResponse {
  status: number;
  error: boolean;
  message: string;
  data?: VtpOrderData | null;
}

/**
 * ViettelPostService — Singleton managing VTP Partner API auth + order tracking.
 *
 * Endpoints used (from VTP Swagger v2 docs):
 *   POST /user/Login              → authenticate, get token
 *   GET  /core/orders/query?code= → query order by bill number (current status)
 *   GET  /order/detail-v2?o=      → detailed order info (fallback)
 *
 * ⚠️ Dev environment: Tracking only works with REAL bill numbers created via VTP.
 *    The dev sandbox may return empty/not-found for synthetic test numbers.
 */
class ViettelPostService {
  private tokenCache: {
    token: string;
    expiresAt: Date;
  } | null = null;

  private get baseUrl() {
    return config.viettelpost.apiUrl;
  }

  // ─── Authentication ───────────────────────────────────────────────────────

  /** Authenticate with VTP and return a valid token (cached in memory). */
  async getToken(): Promise<string> {
    // Return cached token if still valid (5-minute buffer)
    if (this.tokenCache && this.tokenCache.expiresAt > new Date(Date.now() + 5 * 60_000)) {
      return this.tokenCache.token;
    }

    logger.info('[VTP] Authenticating with Viettel Post API...');

    const res = await fetch(`${this.baseUrl}/user/Login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        USERNAME: config.viettelpost.username,
        PASSWORD: config.viettelpost.password,
      }),
    });

    if (!res.ok) {
      throw new Error(`[VTP] Login HTTP error: ${res.status} ${res.statusText}`);
    }

    const json: VtpLoginResponse = await res.json();

    if (!json.data?.token) {
      logger.error('[VTP] Login failed:', json.message);
      throw new Error(`[VTP] Authentication failed: ${json.message || 'Unknown error'}`);
    }

    // Dev API returns `expired` (unix ms), prod returns `expireDate` (string)
    let expiresAt: Date;
    if (json.data.expired) {
      expiresAt = new Date(json.data.expired);
    } else if (json.data.expireDate) {
      expiresAt = new Date(json.data.expireDate);
    } else {
      expiresAt = new Date(Date.now() + 23 * 60 * 60_000);
    }

    this.tokenCache = { token: json.data.token, expiresAt };
    logger.info(`[VTP] Authenticated. Token expires: ${expiresAt.toISOString()}`);

    return json.data.token;
  }

  // ─── Tracking ─────────────────────────────────────────────────────────────

  /**
   * Fetch tracking information for a VTP bill number.
   *
   * Strategy:
   *   1. Try GET /core/orders/query?code=<billNbr>  (primary — returns current status)
   *   2. Fallback: GET /order/detail-v2?o=<billNbr> (secondary)
   *
   * Returns an array of ITrackingEvent sorted oldest → newest.
   */
  async trackOrder(billNbr: string): Promise<ITrackingEvent[]> {
    const token = await this.getToken();
    logger.info(`[VTP] Fetching tracking for: ${billNbr}`);

    // Strategy 1: /core/orders/query
    try {
      const res = await fetch(
        `${this.baseUrl}/core/orders/query?code=${encodeURIComponent(billNbr)}`,
        { headers: { 'Token': token, 'Content-Type': 'application/json' } }
      );

      if (res.ok) {
        const json: VtpQueryResponse = await res.json();

        if (!json.error && json.data) {
          logger.info(`[VTP] Got order data for ${billNbr} via /core/orders/query`);
          return this.buildEventsFromOrderData(json.data);
        }

        logger.warn(`[VTP] /core/orders/query returned no data for ${billNbr}: ${json.message}`);
      }
    } catch (err) {
      logger.warn(`[VTP] /core/orders/query failed, trying fallback: ${err}`);
    }

    // Strategy 2: /order/detail-v2
    try {
      const res2 = await fetch(
        `${this.baseUrl}/order/detail-v2?o=${encodeURIComponent(billNbr)}`,
        { headers: { 'Token': token, 'Content-Type': 'application/json' } }
      );

      if (res2.ok) {
        const json2: VtpDetailResponse = await res2.json();

        if (!json2.error && json2.data) {
          logger.info(`[VTP] Got order data for ${billNbr} via /order/detail-v2`);
          return this.buildEventsFromOrderData(json2.data);
        }

        logger.warn(`[VTP] /order/detail-v2 returned no data for ${billNbr}: ${json2.message}`);
      }
    } catch (err) {
      logger.warn(`[VTP] /order/detail-v2 also failed: ${err}`);
    }

    logger.info(`[VTP] No tracking data found for ${billNbr} (bill may not exist in VTP system)`);
    return [];
  }

  /**
   * Build ITrackingEvent[] from VTP order data.
   *
   * VTP's order query returns the CURRENT status only (not full history).
   * DETAIL field contains breakdown codes (e.g., fees) not status history.
   * So we create a single event from the current status.
   */
  private buildEventsFromOrderData(data: VtpOrderData): ITrackingEvent[] {
    const events: ITrackingEvent[] = [];

    if (data.ORDER_STATUS !== undefined && data.STATUS_NAME) {
      events.push({
        status: String(data.ORDER_STATUS),
        statusName: data.STATUS_NAME,
        location: data.LOCATION_CURRENTLY || data.LOCALION_CURRENTLY || '',
        timestamp: data.ORDER_STATUSDATE
          ? this.parseVtpDate(data.ORDER_STATUSDATE)
          : new Date(),
        note: data.NOTE || data.ORDER_NOTE || '',
      });
    }

    return events;
  }

  /**
   * Parse Viettel Post date format: "dd/MM/yyyy HH:mm:ss"
   * Falls back to current time if parsing fails.
   */
  private parseVtpDate(dateStr: string): Date {
    try {
      // "12/05/2026 14:30:00"
      const [datePart, timePart] = dateStr.split(' ');
      const [day, month, year] = datePart.split('/');
      return new Date(`${year}-${month}-${day}T${timePart || '00:00:00'}+07:00`);
    } catch {
      logger.warn(`[VTP] Could not parse date: ${dateStr}`);
      return new Date();
    }
  }

  /**
   * Map VTP ORDER_STATUS numeric code → TurboOrder OrderStatus.
   * Reference: VTP status list (numeric, differs from text status codes)
   */
  mapToOrderStatus(vtpStatus: string): 'shipping' | 'completed' | 'cancelled' | null {
    const numericCode = parseInt(vtpStatus, 10);

    // Numeric status codes from VTP docs
    if (numericCode === 200 || numericCode === 201) return 'completed'; // Đã giao
    if (numericCode === 107 || numericCode === 300) return 'cancelled'; // Hoàn hàng
    if (numericCode >= 100 && numericCode < 200) return 'shipping';    // Đang vận chuyển

    // Text status codes (fallback for string-based status)
    const textMap: Record<string, 'shipping' | 'completed' | 'cancelled'> = {
      'Đang vận chuyển': 'shipping',
      'Đang phát': 'shipping',
      'Đã lấy hàng': 'shipping',
      'Đã giao hàng': 'completed',
      'Phát thành công': 'completed',
      'Hoàn hàng': 'cancelled',
    };

    for (const [key, val] of Object.entries(textMap)) {
      if (vtpStatus.includes(key)) return val;
    }

    return null;
  }

  /** Invalidate cached token (useful for testing or after auth errors). */
  clearTokenCache() {
    this.tokenCache = null;
    logger.info('[VTP] Token cache cleared');
  }
}

// Export singleton
export const viettelPostService = new ViettelPostService();
