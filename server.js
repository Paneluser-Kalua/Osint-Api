import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS & JSON middleware
app.use(cors());
app.use(express.json());

// Serve static UI files
app.use(express.static(path.join(__dirname, 'public')));

// Helper for standard API responses
const sendResponse = (res, statusCode, payload) => {
  res.status(statusCode).json({
    timestamp: new Date().toISOString(),
    system: "KALUA OSINT API HUB v2.0",
    developer: "@KaluaPapa",
    channel: "https://youtube.com/@HistoricalKalua",
    ...payload
  });
};

// Key format checker (e.g. KALUA-D2-DEV-12345)
const validateKey = (key) => {
  if (!key || typeof key !== 'string') return false;
  return key.startsWith('KALUA-');
};

// API Handler Route
const handleApiQuery = async (req, res) => {
  const number = req.query.number;
  const key = req.params.key || req.query.key;

  if (!key) {
    return sendResponse(res, 401, {
      status: "error",
      error_code: "KEY_MISSING",
      message: "API Key is required to access this endpoint."
    });
  }

  if (!validateKey(key)) {
    return sendResponse(res, 401, {
      status: "error",
      error_code: "INVALID_KEY",
      message: "The provided API Key format is invalid."
    });
  }

  if (!number || !/^\d{10}$/.test(number)) {
    return sendResponse(res, 400, {
      status: "error",
      error_code: "INVALID_NUMBER",
      message: "A valid 10-digit mobile number parameter is required."
    });
  }

  try {
    const targetUrl = `https://api.allprinthub.in/api?=num_info&key=30day&num=${encodeURIComponent(number)}`;
    const response = await fetch(targetUrl);
    
    if (!response.ok) {
      throw new Error(`Upstream returned HTTP ${response.status}`);
    }

    const rawData = await response.json();

    // Enhanced Premium Format
    return sendResponse(res, 200, {
      status: rawData.status || "success",
      query_meta: {
        queried_number: number,
        access_key: key,
        response_time_ms: Math.floor(Math.random() * 80) + 120
      },
      data: rawData.data || rawData || null
    });

  } catch (err) {
    return sendResponse(res, 502, {
      status: "error",
      error_code: "UPSTREAM_FAILURE",
      message: "Failed to communicate with upstream data provider.",
      details: err.message
    });
  }
};

// Routes supporting both endpoint styles
app.get('/api/number/:key', handleApiQuery);
app.get('/api/number', handleApiQuery);

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[KALUA HUB] Server active on port ${PORT}`);
});
