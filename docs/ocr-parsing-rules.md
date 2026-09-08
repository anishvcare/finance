# LifeLedger Pro - OCR Parsing Rules

## 1. Overview

Browser-side OCR extracts transaction details from payment screenshots using:
- Tesseract.js (Web Worker, no server upload)
- Canvas API for image preprocessing
- Regex-based field extraction
- Parser adapters per payment app

## 2. Supported Payment Apps

| App | Detection Pattern | Key Fields |
|-----|-------------------|------------|
| Google Pay | "Google Pay", "GPay", "google.com" | Amount, To/From, Date, UPI Ref |
| PhonePe | "PhonePe", "phonepe" | Amount, To/From, Date, UTR |
| Paytm | "Paytm", "paytm.com" | Amount, Paid to, Date, Order ID |
| BHIM | "BHIM", "UPI" | Amount, To/From, Date, Txn ID |
| Generic UPI | "UPI", "Transaction ID" | Amount, Merchant, Date, Ref |
| Generic Bank | "credited", "debited", "balance" | Amount, Date, Ref, A/C |

## 3. Image Preprocessing Pipeline

```typescript
async function preprocessImage(file: File): Promise<ImageData> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = await loadImage(file);

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  // 1. Convert to grayscale
  applyGrayscale(ctx, canvas.width, canvas.height);

  // 2. Increase contrast
  applyContrast(ctx, canvas.width, canvas.height, 1.5);

  // 3. Apply threshold (binarize)
  applyThreshold(ctx, canvas.width, canvas.height, 128);

  // 4. Scale up if too small (improves OCR accuracy)
  if (canvas.width < 1000) {
    scaleCanvas(canvas, 2.0);
  }

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
```

## 4. OCR Execution

```typescript
import { createWorker } from 'tesseract.js';

async function performOCR(imageData: ImageData): Promise<string> {
  const worker = await createWorker('eng');
  await worker.setParameters({
    tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,/-:@ ',
  });

  const { data: { text, confidence } } = await worker.recognize(imageData);
  await worker.terminate();

  return { text, confidence };
}
```

## 5. Field Extraction Patterns

### Amount Extraction
```typescript
const amountPatterns = [
  /(?:Rs\.?|INR|₹)\s*([\d,]+\.?\d*)/i,
  /(?:paid|sent|received|credited|debited)\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i,
  /(?:amount|total)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+\.?\d*)/i,
  /\$([\d,]+\.?\d*)/,
  /([\d,]+\.?\d*)\s*(?:USD|EUR|GBP|AUD)/i,
];
```

### Date Extraction
```typescript
const datePatterns = [
  /(\d{1,2})\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s*(\d{2,4})/i,
  /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
  /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
  /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s*(\d{1,2}),?\s*(\d{2,4})/i,
];
```

### Reference/Transaction ID
```typescript
const refPatterns = [
  /(?:UPI\s*(?:Ref|ID|Transaction)\s*(?:No\.?)?)\s*:?\s*(\w+)/i,
  /(?:UTR|Txn\s*ID|Transaction\s*ID|Reference)\s*:?\s*(\w+)/i,
  /(?:Order\s*ID)\s*:?\s*(\w+)/i,
  /([A-Z0-9]{12,})/,  // Fallback: long alphanumeric string
];
```

### Merchant/Person Name
```typescript
const merchantPatterns = [
  /(?:paid\s*to|sent\s*to|from|received\s*from)\s*:?\s*(.+?)(?:\n|$)/i,
  /(?:merchant|payee|beneficiary)\s*:?\s*(.+?)(?:\n|$)/i,
  /(?:to|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
];
```

### Payment Status
```typescript
const statusPatterns = [
  /\b(success(?:ful)?|completed|paid|received|sent|failed|pending)\b/i,
];
```

## 6. App-Specific Parsers

### Google Pay Parser
```typescript
function parseGooglePay(text: string): ExtractedFields {
  // Google Pay format: Amount at top, "Paid to" or "Received from", date, UPI ref
  const amount = extractFirst(text, [/₹\s*([\d,]+)/]);
  const merchant = extractFirst(text, [/(?:Paid to|Received from)\s+(.+)/i]);
  const date = extractDate(text);
  const ref = extractFirst(text, [/UPI transaction ID\s*(\w+)/i]);
  const direction = /received/i.test(text) ? 'incoming' : 'outgoing';

  return { amount, merchant, date, ref, direction, source: 'googlepay' };
}
```

### PhonePe Parser
```typescript
function parsePhonePe(text: string): ExtractedFields {
  const amount = extractFirst(text, [/₹\s*([\d,]+)/]);
  const merchant = extractFirst(text, [/(?:Paid to|Sent to|From)\s+(.+)/i]);
  const date = extractDate(text);
  const ref = extractFirst(text, [/UTR\s*:?\s*(\w+)/i, /Transaction ID\s*:?\s*(\w+)/i]);
  const direction = /received|credited/i.test(text) ? 'incoming' : 'outgoing';

  return { amount, merchant, date, ref, direction, source: 'phonepe' };
}
```

## 7. Confidence Scoring

```typescript
function calculateConfidence(fields: ExtractedFields): number {
  let score = 0;
  const weights = { amount: 30, date: 25, merchant: 20, ref: 15, direction: 10 };

  if (fields.amount) score += weights.amount;
  if (fields.date) score += weights.date;
  if (fields.merchant) score += weights.merchant;
  if (fields.ref) score += weights.ref;
  if (fields.direction) score += weights.direction;

  return score; // 0-100
}
```

## 8. Duplicate Detection

Before saving an OCR import:
```typescript
async function checkDuplicate(fields: ExtractedFields, workspaceId: string): Promise<boolean> {
  // Check by reference number (strongest match)
  if (fields.ref) {
    const existing = await api.get('/transactions', {
      params: { reference: fields.ref, workspace_id: workspaceId }
    });
    if (existing.data.length > 0) return true;
  }

  // Check by amount + date + merchant (fuzzy match)
  if (fields.amount && fields.date) {
    const existing = await api.get('/transactions', {
      params: {
        amount: fields.amount,
        date: fields.date,
        description_like: fields.merchant,
        workspace_id: workspaceId
      }
    });
    if (existing.data.length > 0) return true; // Flag for review
  }

  return false;
}
```

## 9. User Review Flow

1. User uploads/captures screenshot
2. Image preprocessed in browser
3. Tesseract.js extracts text
4. Parser adapter identifies app and extracts fields
5. Confidence score calculated
6. **Review Screen shown** with:
   - Extracted amount (editable)
   - Extracted date (editable)
   - Extracted merchant (editable)
   - Extracted reference (editable)
   - Direction (paid/received)
   - Confidence indicator
   - Duplicate warning (if detected)
   - Link to: invoice, bill, customer, supplier, or new transaction
7. User confirms or corrects
8. Record created only after user confirmation

## 10. Security Notes

- Image processed entirely in browser (no server upload by default)
- Raw OCR text not sent to server unless user saves the import record
- Image file not retained unless user explicitly opts to save it
- If saved, stored in private storage with workspace isolation
- OCR text may contain sensitive bank details - handle with care in logs
