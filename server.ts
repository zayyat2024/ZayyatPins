import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Log environment status (without secrets)
  console.log("Server starting...");
  console.log("PAYSTACK_PUBLIC_KEY:", process.env.PAYSTACK_PUBLIC_KEY ? "Set" : "MISSING");
  console.log("PAYSTACK_SECRET_KEY:", process.env.PAYSTACK_SECRET_KEY ? "Set" : "MISSING");
  console.log("NAIJA_API_KEY:", process.env.NAIJA_API_KEY ? "Set" : "MISSING (Simulation Mode Active)");

  // Config endpoint to share public keys with client
  app.get("/api/config", (req, res) => {
    res.json({
      paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || process.env.VITE_PAYSTACK_PUBLIC_KEY || ""
    });
  });

  // Mock API for Nigerian Exam Data
  app.get("/api/exams/info", (req, res) => {
    res.json([
      {
        id: "waec",
        name: "WAEC",
        fullName: "West African Examinations Council",
        description: "The premier examination body in West Africa, providing quality and reliable educational assessment.",
        color: "blue",
        officialUrl: "https://www.waecdirect.org",
        pinPrice: 3600
      },
      {
        id: "neco",
        name: "NECO",
        fullName: "National Examinations Council",
        description: "Nigeria's national examination body for secondary school students.",
        color: "green",
        officialUrl: "https://result.neco.gov.ng",
        pinPrice: 2400
      },
      {
        id: "nabteb",
        name: "NABTEB",
        fullName: "National Business and Technical Examinations Board",
        description: "Focused on craft and technical level examinations in Nigeria.",
        color: "orange",
        officialUrl: "https://eworld.nabteb.gov.ng",
        pinPrice: 1000
      },
      {
        id: "waec-verification",
        name: "WAEC Verification",
        fullName: "WAEC Result Verification PIN",
        description: "Used for verifying WAEC results for institutions and organizations.",
        color: "purple",
        officialUrl: "https://www.waecdirect.org",
        pinPrice: 3800
      }
    ]);
  });

  // Paystack Verification and Pin Purchase
  app.post("/api/verify-payment", async (req, res) => {
    const { reference, examType, quantity, email, naijaApiKey: userNaijaKey, naijaBaseUrl: userBaseUrl } = req.body;

    console.log(`Verifying payment: ${reference} for ${quantity} x ${examType}`);

    if (!reference || !examType || !quantity || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // 1. Verify payment with Paystack
      const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
      if (!paystackSecret) {
        console.warn("PAYSTACK_SECRET_KEY is missing. Simulating success for demo.");
      } else {
        try {
          const paystackRes = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: { Authorization: `Bearer ${paystackSecret}` }
          });

          if (paystackRes.data.data.status !== 'success') {
            return res.status(400).json({ error: `Payment verification failed: ${paystackRes.data.data.gateway_response}` });
          }
          console.log("Paystack verification successful");
        } catch (err: any) {
          console.error("Paystack API error:", err.response?.data || err.message);
          return res.status(400).json({ error: "Could not verify payment with Paystack" });
        }
      }

      // 2. Purchase PIN from NaijaResultPins API
      const naijaApiKey = userNaijaKey || process.env.NAIJA_API_KEY || "_lWUc2TxNWFwAT2e5cNZafb_CiGxcMEM0N2D-ToksoihXftgF_ey6Kvb2wmxXqGrWyaJyIPTN-29knjtdTOUmHtHGqTiCG3AsV2P_1771713315";
      const naijaBaseUrl = userBaseUrl || process.env.NAIJA_API_BASE_URL || "https://www.naijaresultpins.com/api/v1/exam-card/buy";

      // Service ID mapping (Guessing based on common patterns)
      const serviceMap: Record<string, string> = {
        waec: "1",
        neco: "2",
        nabteb: "3",
        "waec-verification": "4"
      };

      let pins = [];
      if (!naijaApiKey || naijaApiKey === "your_api_key_here") {
        console.log("Using simulation mode for PIN purchase");
        pins = Array.from({ length: quantity }).map(() => ({
          pin: Math.random().toString().substring(2, 14),
          serial: examType.includes('waec') ? "WRC" + Math.random().toString(36).substring(2, 10).toUpperCase() : undefined,
          examType
        }));
      } else {
        // Sanitize URL: remove trailing slashes
        const base = naijaBaseUrl.replace(/\/+$/, "");
        // Use the URL as is if it already looks like a full endpoint (ends with buy or purchase)
        const targetUrl = (base.toLowerCase().endsWith("buy") || base.toLowerCase().endsWith("purchase")) 
          ? base 
          : `${base}/purchase`;
        
        console.log(`Attempting real purchase from: ${targetUrl}`);
        console.log(`Service ID: ${serviceMap[examType] || examType}, Quantity: ${quantity}`);
        
        try {
          const examId = serviceMap[examType] || examType;
          // Most Nigerian APIs use POST with these fields
          const naijaRes = await axios.post(targetUrl, {
            api_key: naijaApiKey,
            token: naijaApiKey,
            service_id: examId,
            card_type_id: examId, // Added based on error message
            quantity: quantity,
          }, {
            headers: {
              'Authorization': `Bearer ${naijaApiKey}`,
              'Accept': 'application/json'
            }
          });

          console.log("NaijaResultPins purchase response:", JSON.stringify(naijaRes.data, null, 2));

          const isSuccess = 
            naijaRes.data.status === 'success' || 
            naijaRes.data.status === true || 
            naijaRes.data.code === '200' || 
            naijaRes.data.code === 200 ||
            naijaRes.data.success === true;

          if (isSuccess) {
            pins = naijaRes.data.pins || naijaRes.data.data?.pins || [];
            if (pins.length === 0 && (naijaRes.data.pin || naijaRes.data.data?.pin)) {
              // Handle single pin response
              pins = [{
                pin: naijaRes.data.pin || naijaRes.data.data?.pin,
                serial: naijaRes.data.serial || naijaRes.data.data?.serial,
                examType
              }];
            }
          } else {
            const providerMsg = naijaRes.data.message || naijaRes.data.error || naijaRes.data.msg;
            const finalMsg = providerMsg || `Unknown Error (Raw: ${JSON.stringify(naijaRes.data)})`;
            return res.status(500).json({ 
              error: `Provider Error: ${finalMsg}`,
              details: naijaRes.data 
            });
          }
        } catch (err: any) {
          console.error("Full PIN Provider Error:", err.response?.data || err.message);
          if (err.response?.status === 404) {
            return res.status(500).json({ 
              error: `PIN Provider Error: The URL ${targetUrl} was not found (404). Please check the Base URL.` 
            });
          }
          const errorDetail = err.response?.data?.message || err.response?.data?.error || err.message;
          return res.status(500).json({ 
            error: `PIN Provider Error: ${errorDetail}. Please check your NAIJA_API_KEY and balance.` 
          });
        }
      }

      const examPrices: Record<string, number> = { 
        waec: 3600, 
        neco: 2400, 
        nabteb: 1000,
        "waec-verification": 3800
      };
      const price = examPrices[examType] || 0;

      res.json({
        success: true,
        transactionId: reference,
        pins,
        totalAmount: price * quantity
      });

    } catch (error: any) {
      console.error("Internal server error:", error);
      res.status(500).json({ error: "Internal server error during processing" });
    }
  });

  app.post("/api/check-balance", async (req, res) => {
    const { naijaApiKey: userNaijaKey, naijaBaseUrl: userBaseUrl } = req.body;
    const naijaApiKey = userNaijaKey || process.env.NAIJA_API_KEY || "_lWUc2TxNWFwAT2e5cNZafb_CiGxcMEM0N2D-ToksoihXftgF_ey6Kvb2wmxXqGrWyaJyIPTN-29knjtdTOUmHtHGqTiCG3AsV2P_1771713315";
    
    // Construct account URL from base URL
    let base = userBaseUrl || "https://www.naijaresultpins.com/api/v1";
    base = base.replace(/\/+$/, "");
    
    // Try to find the root version path if they provided the buy URL
    const rootBase = base.replace(/\/exam-card\/buy/i, "").replace(/\/buy$/i, "").replace(/\/purchase$/i, "");
    
    const endpoints = [
      `${rootBase}/user`,
      `${rootBase}/account`,
      `${rootBase}/wallet`,
      `${rootBase}/profile`,
      `${rootBase}/details`,
      `${rootBase}/balance`,
      `${rootBase}/user/profile`,
      `${rootBase}/user/details`,
      `${rootBase}/wallet/balance`,
      `${rootBase}/account/balance`
    ];

    let lastError = null;
    let successData = null;

    for (const url of endpoints) {
      try {
        console.log(`Trying balance check at: ${url}`);
        const response = await axios.get(url, {
          headers: { 
            'Authorization': `Bearer ${naijaApiKey}`,
            'Accept': 'application/json'
          },
          params: { 
            api_key: naijaApiKey,
            token: naijaApiKey 
          },
          timeout: 5000
        });
        
        if (response.data) {
          console.log(`Success at ${url}:`, JSON.stringify(response.data));
          successData = response.data;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.log(`Failed at ${url}: ${err.message}`);
      }
    }

    if (successData) {
      res.json(successData);
    } else {
      console.error("All balance endpoints failed");
      res.status(500).json({ 
        error: lastError?.response?.data?.message || lastError?.response?.data?.error || lastError?.message || "Could not fetch balance from any endpoint",
        details: lastError?.response?.data
      });
    }
  });

  app.post("/api/check-result", (req, res) => {
    const { examType, examNumber, examYear, pin, serial } = req.body;
    
    // Simulate a result check
    // Real implementation would involve a POST to the respective portal
    // and parsing the response or using a paid API service.
    
    if (!examNumber || !pin) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // For demo purposes, we return a simulated success or specific error
    setTimeout(() => {
      if (pin === "1234567890") {
        res.json({
          success: true,
          candidate: {
            name: "CHUKWUMA ADEBAYO MUSA",
            examNumber,
            examYear,
            school: "GOVERNMENT SECONDARY SCHOOL, LAGOS",
          },
          results: [
            { subject: "English Language", grade: "B2" },
            { subject: "Mathematics", grade: "A1" },
            { subject: "Physics", grade: "C4" },
            { subject: "Chemistry", grade: "B3" },
            { subject: "Biology", grade: "C5" },
            { subject: "Economics", grade: "B2" },
            { subject: "Civic Education", grade: "A1" },
            { subject: "Geography", grade: "C6" },
            { subject: "Data Processing", grade: "B3" }
          ]
        });
      } else {
        res.status(401).json({ error: "Invalid Scratch Card PIN or Serial Number" });
      }
    }, 1500);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    console.log("Production mode: serving static files from", distPath);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
