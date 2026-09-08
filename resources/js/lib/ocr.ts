/**
 * OCR module using Tesseract.js for browser-side payment screenshot parsing.
 * Loaded lazily to avoid bundle bloat.
 */

export interface ExtractedFields {
    amount: number | null;
    currency: string;
    date: string | null;
    time: string | null;
    merchant: string | null;
    reference: string | null;
    direction: 'incoming' | 'outgoing' | null;
    sourceApp: string | null;
    confidence: number;
    rawText: string;
}

/**
 * Process image and extract payment details.
 */
export async function processPaymentScreenshot(file: File): Promise<ExtractedFields> {
    // Lazy load Tesseract.js
    const { createWorker } = await import('tesseract.js');

    // Preprocess image
    const imageData = await preprocessImage(file);

    // Perform OCR
    const worker = await createWorker('eng');
    const { data } = await worker.recognize(imageData);
    await worker.terminate();

    const text = data.text;
    const ocrConfidence = data.confidence;

    // Detect source app
    const sourceApp = detectSourceApp(text);

    // Extract fields using appropriate parser
    const fields = parseFields(text, sourceApp);

    return {
        ...fields,
        sourceApp,
        confidence: calculateConfidence(fields, ocrConfidence),
        rawText: text,
    };
}

async function preprocessImage(file: File): Promise<string> {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // Convert to grayscale for better OCR
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                data[i] = data[i + 1] = data[i + 2] = gray;
            }
            ctx.putImageData(imageData, 0, 0);

            // Increase contrast
            ctx.filter = 'contrast(1.5)';
            ctx.drawImage(canvas, 0, 0);

            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL());
        };
        img.src = url;
    });
}

function detectSourceApp(text: string): string | null {
    const lower = text.toLowerCase();
    if (lower.includes('google pay') || lower.includes('gpay')) return 'googlepay';
    if (lower.includes('phonepe')) return 'phonepe';
    if (lower.includes('paytm')) return 'paytm';
    if (lower.includes('bhim')) return 'bhim';
    if (lower.includes('upi')) return 'generic_upi';
    return null;
}

function parseFields(text: string, sourceApp: string | null): Omit<ExtractedFields, 'sourceApp' | 'confidence' | 'rawText'> {
    return {
        amount: extractAmount(text),
        currency: extractCurrency(text),
        date: extractDate(text),
        time: extractTime(text),
        merchant: extractMerchant(text),
        reference: extractReference(text),
        direction: extractDirection(text),
    };
}

function extractAmount(text: string): number | null {
    const patterns = [
        /(?:Rs\.?|INR|₹)\s*([\d,]+\.?\d*)/i,
        /(?:paid|sent|received|credited|debited)\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i,
        /(?:amount|total)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i,
        /\$([\d,]+\.?\d*)/,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            const amount = parseFloat(match[1].replace(/,/g, ''));
            if (amount > 0 && amount < 10000000) {
                return Math.round(amount * 100); // Return in minor units
            }
        }
    }
    return null;
}

function extractCurrency(text: string): string {
    if (/(?:Rs\.?|INR|₹)/i.test(text)) return 'INR';
    if (/\$|USD/i.test(text)) return 'USD';
    if (/€|EUR/i.test(text)) return 'EUR';
    if (/£|GBP/i.test(text)) return 'GBP';
    return 'INR'; // Default for payment apps
}

function extractDate(text: string): string | null {
    const patterns = [
        /(\d{1,2})\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s*,?\s*(\d{2,4})/i,
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
        /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            try {
                const d = new Date(match[0]);
                if (!isNaN(d.getTime())) {
                    return d.toISOString().split('T')[0];
                }
            } catch { /* continue */ }
        }
    }
    return null;
}

function extractTime(text: string): string | null {
    const match = text.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
    if (match) return match[0];
    return null;
}

function extractMerchant(text: string): string | null {
    const patterns = [
        /(?:paid\s*to|sent\s*to|from|received\s*from)\s*:?\s*(.+?)(?:\n|$)/i,
        /(?:merchant|payee|beneficiary)\s*:?\s*(.+?)(?:\n|$)/i,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1].trim().length > 1) {
            return match[1].trim().substring(0, 100);
        }
    }
    return null;
}

function extractReference(text: string): string | null {
    const patterns = [
        /(?:UPI\s*(?:Ref|ID|Transaction)\s*(?:No\.?)?)\s*:?\s*(\w+)/i,
        /(?:UTR|Txn\s*ID|Transaction\s*ID|Reference)\s*:?\s*(\w+)/i,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) return match[1];
    }
    return null;
}

function extractDirection(text: string): 'incoming' | 'outgoing' | null {
    const lower = text.toLowerCase();
    if (/received|credited|from/.test(lower)) return 'incoming';
    if (/paid|sent|debited|to/.test(lower)) return 'outgoing';
    return null;
}

function calculateConfidence(fields: any, ocrConfidence: number): number {
    let score = 0;
    if (fields.amount) score += 30;
    if (fields.date) score += 25;
    if (fields.merchant) score += 20;
    if (fields.reference) score += 15;
    if (fields.direction) score += 10;

    // Weight by OCR engine confidence
    return Math.round(score * (ocrConfidence / 100));
}
