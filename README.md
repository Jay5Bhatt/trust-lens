
<div align="center">

<img src="https://s6.imgcdn.dev/YT51NN.png" alt="TrustLens Logo" border="0">

# 🔍 TRUSTLENS  
### **Digital Content Forensics for Everyone**

**Detect. Verify. Trust.**  
A next-generation platform built to verify the authenticity of images, screenshots, videos, and digital documents in a world where manipulation is effortless.

---

</div>

## 🚨 Why TrustLens?

The line between *real* and *fake* has never been thinner.

AI tools like Sora, VEO, Midjourney, and Runway can generate hyper-realistic content.  
Fake UPI receipts, edited WhatsApp chats, AI-generated videos, and fabricated school notices are spreading faster than truth.

> **The world has tools to CREATE fake content — TrustLens is the tool that verifies it.**

---

## 🧠 What TrustLens Does

When a user uploads content, TrustLens produces:

| Feature | Description |
|--------|------------|
| **🧪 Authenticity Score** | Probability of content being real, edited, or fully generated. |
| **⚠️ Anomaly Highlights** | Detects pixel inconsistencies, UI spacing errors, AI fingerprints, and more. |
| **🧬 Reality Trace™** | Reconstructs how the content was likely created (camera → edit → screenshot → AI → export…). |
| **🛡 TruthScore+™** | Shows risk impact (financial/social/identity/reputation). |
| **🔁 Source Match Shield™** | Checks web presence, template matching, metadata, perceptual hash similarity. |

---

## ✨ Core Capability Highlights

- ✔ Image forensic analysis  
- ✔ Video frame-level consistency detection  
- ✔ Screenshot authenticity verification  
- ✔ Document & UPI receipt template matching  
- ✔ Deepfake + AI trace detection  
- ✔ Metadata & recompression signature analysis  

---

## 🚀 Why TrustLens Is Different

Most tools answer:

> ❓ “Is this AI?”

TrustLens answers:

> 🧬 “How was this created?”
> ⚠️ “Can it cause harm?”
> 🛡 “Should it be trusted?”

TrustLens combines:

- Forensic image science  
- Computer vision  
- AI artifact detection  
- Context-aware rule systems  
- Creation-path reconstruction  
- Risk intelligence scoring  

No existing AI detectors do this.

---

## 👥 Who Is This For?

- Students & teachers  
- Small businesses & sellers  
- Parents & communities  
- Investigators & journalists  
- Social media users  
- Anyone who wants certainty before sharing or believing content  

Manipulation affects **everyone** — TrustLens protects everyone.

---

## 🧩 Technology Stack (Concept)

⚙️ TrustLens Forensics Stack

🔍 Visual Integrity Engine — ELA, FFT, lighting physics checks

🤖 Synthetic Artifact Scanner — Hybrid CNN + Transformer detection

🧩 UI & Document Pattern Analyzer — Fonts, layout rules, timestamp logic

🪪 Metadata & Signature Intelligence — Compression + device trace analysis

🧬 Reality Trace™ Constructor — Creation path probability mapping

🌐 Source Match Shield™ — OCR, perceptual hash matching, known format recognition

Latency Goal: **2–5s images | 6–12s video clips**  
False positives target: **≤10%**

---

## 📦 Project Status

| Stage | Status |
|-------|--------|
| Concept | ✅ Completed |
| MVP Build | ✅ Completed  |
| Dataset Curation | 🛠 In Progress |
| UI/UX Prototype | ✅ Completed  |
| API/SDK | 📌 Future |

---

## 🛣 Roadmap

- [ ] MVP Web Scanner  
- [ ] Screenshot Authentication Engine  
- [ ] UPI & Document Template Dataset  
- [ ] Browser Extension  
- [ ] Mobile App  
- [ ] API for Trust Badges & Verification  
- [ ] Enterprise Dashboard  

---

## 🏛 Ethics & Governance

TrustLens is built with a **security-first moral framework**:

- 🔒 User content is never stored unless permission is granted  
- 🚫 No detection-bypass assistance  
- 🛑 Restricted use for harassment or unauthorized surveillance  
- 🧭 Transparency and consent are mandatory  

---

## 🧭 Vision

While the world is building tools to **forge reality**, TrustLens builds the shield that protects it.

> **Truth shouldn’t be a guessing game.**  
> TrustLens makes it verifiable.

---

---

## 🔍 Plagiarism & AI Detection API

### API Endpoints

#### Health Check
```bash
curl https://your-deploy.vercel.app/api/health
```

#### Check Plagiarism
```bash
curl -X POST https://your-deploy.vercel.app/api/check-plagiarism \
  -H "Content-Type: application/json" \
  -d '{"text":"This is a short test text to check plagiarism detection."}'
```

### Environment Variables

Required for production:
- `GEMINI_API_KEY` - Google Gemini API key for AI analysis
- `SEARCH_API_KEY` - SerpAPI key for web search (optional, but recommended)

Optional:
- `REDIS_URL` - Redis connection string for caching (optional)
- `DAILY_REQUEST_LIMIT` - Daily request limit per user (optional)

### API Response Format

**Success Response:**
```json
{
  "success": true,
  "data": {
    "normalizedTextLength": 1234,
    "plagiarismPercentage": 15.5,
    "riskLevel": "low",
    "suspiciousSegments": [],
    "aiGeneratedLikelihood": 0.3,
    "aiVerdict": "likely_human",
    "explanation": "...",
    "analysisStatus": "success"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "errorType": "extraction_error" | "analysis_error" | "upstream_error" | "bad_request",
  "message": "User-friendly error message",
  "details": "Optional internal details (sanitized)"
}
```

### Supported File Types

- **PDF** - Extracted using Gemini AI
- **DOCX** - Extracted using Gemini AI  
- **TXT** - Direct text extraction
- **Raw Text** - Paste directly

### Features

- ✅ Text extraction from PDF/DOCX using Gemini
- ✅ Web search for plagiarism detection (SerpAPI)
- ✅ AI-generated text detection (Gemini)
- ✅ Caching for performance (LRU + optional Redis)
- ✅ Retry logic with exponential backoff
- ✅ Concurrency control (max 3 parallel chunks)
- ✅ Rate limiting and delays
- ✅ 45s timeout enforcement
- ✅ Comprehensive error handling

---

<div align="center">

### ⭐ If you believe digital truth deserves protection, give this repo a star.

Built for the next era of the internet —  
Where trust is a feature, not an assumption.

</div>
