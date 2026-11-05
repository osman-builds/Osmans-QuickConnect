import express from 'express';
import type { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT: number = Number(process.env.PORT) || 3000;

type EncryptionType = 'WPA' | 'WEP' | 'nopass';

interface GenerateQrRequest {
  ssid?: string;
  password?: string;
  encryption?: EncryptionType;
  hidden?: boolean;
}

interface GenerateQrResponse {
  success: boolean;
  qrCode?: string;
  dataUrl?: string;
  base64?: string;
  ssid?: string;
  encryption?: EncryptionType;
  hidden?: boolean;
  error?: string;
}

// Middleware
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// Serve the single-page frontend from /public
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Escapes special characters in WiFi QR payloads according to the ZXing specification:
 * \, ;, ,, ", and : must be prefixed with a backslash.
 */
function escapeWifiValue(value: string): string {
  return value.replace(/([\\;,"':])/g, '\\$1');
}

/**
 * Builds the standard WIFI: QR code payload string.
 */
function buildWifiPayload(
  ssid: string,
  password: string,
  encryption: EncryptionType,
  hidden: boolean
): string {
  const escapedSsid = escapeWifiValue(ssid);
  const escapedPassword = encryption === 'nopass' ? '' : escapeWifiValue(password);
  const hiddenFlag = hidden ? 'true' : 'false';

  if (encryption === 'nopass') {
    return `WIFI:T:nopass;S:${escapedSsid};H:${hiddenFlag};;`;
  }

  return `WIFI:T:${encryption};S:${escapedSsid};P:${escapedPassword};H:${hiddenFlag};;`;
}

/**
 * POST /api/generate (also aliased at /api/create and /generate)
 * Generates a WiFi QR Code strictly in memory (Buffer) and returns it as a Base64 string.
 * PRIVACY FIRST: No files are ever written to the server disk.
 */
app.post(
  ['/api/generate', '/api/create', '/generate'],
  async (req: Request<Record<string, never>, GenerateQrResponse, GenerateQrRequest>, res: Response<GenerateQrResponse>) => {
    try {
      // Prevent caching of sensitive WiFi QR responses
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      const rawSsid = typeof req.body?.ssid === 'string' ? req.body.ssid.trim() : '';
      const rawPassword = typeof req.body?.password === 'string' ? req.body.password : '';
      const rawEncryption = req.body?.encryption;
      const hidden = Boolean(req.body?.hidden);

      if (!rawSsid) {
        res.status(400).json({
          success: false,
          error: 'Network Name (SSID) is required.',
        });
        return;
      }

      const encryption: EncryptionType =
        rawEncryption === 'WEP' || rawEncryption === 'nopass'
          ? rawEncryption
          : rawPassword
            ? 'WPA'
            : 'nopass';

      const wifiPayload = buildWifiPayload(rawSsid, rawPassword, encryption, hidden);

      // CRITICAL: Generate QR code strictly in memory as a Buffer (no disk I/O)
      const qrBuffer: Buffer = await QRCode.toBuffer(wifiPayload, {
        type: 'png',
        width: 360,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#04293A', // Deep Ocean Blue for high-contrast scanning
          light: '#FFFFFF',
        },
      });

      const base64String: string = qrBuffer.toString('base64');
      const dataUrl: string = `data:image/png;base64,${base64String}`;

      res.status(200).json({
        success: true,
        qrCode: dataUrl,
        dataUrl,
        base64: base64String,
        ssid: rawSsid,
        encryption,
        hidden,
      });
    } catch (error) {
      console.error('Error generating QR code in memory:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate WiFi QR code.',
      });
    }
  }
);

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'QuickConnect' });
});

// Fallback to index.html for root
app.get('/', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`QuickConnect server running on http://localhost:${PORT}`);
});
