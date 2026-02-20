# Setup Instructions - Updated for API Integration

Complete setup guide for PharmaGuard with Groq, PharmVar, and Web Search integration.

---

## Prerequisites

- Python 3.10+
- Node.js 16+
- Git
- Text editor (VS Code recommended)

---

## Step 1: Clone & Navigate

```bash
git clone <your-repo-url>
cd PharmaGuard
```

---

## Step 2: Backend Setup

### 2.1 Create Virtual Environment

**Windows:**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
```

**Mac/Linux:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

### 2.2 Install Dependencies

```bash
pip install -r requirements.txt
```

**New dependencies include:**
- `groq==0.4.2` - Groq LLM client
- `requests==2.31.0` - HTTP for PharmVar API
- `cachetools==5.3.2` - API response caching
- `duckduckgo-search==4.1.1` - Web search

### 2.3 Configure Environment Variables

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Groq API Key (get from console.groq.com)
GROQ_API_KEY=your_groq_api_key_here

# Server Configuration
PORT=8000
CORS_ORIGINS=http://localhost:3000
```

**Get Groq API Key:**
1. Visit https://console.groq.com
2. Sign up (free)
3. Go to API Keys section
4. Create new API key
5. Copy and paste into `.env`

### 2.4 Verify Backend

```bash
python -c "from services.pharmvar_service import pharmvar_service; print('PharmVar OK')"
python -c "from services.web_search_service import web_search_service; print('Web Search OK')"
python -c "from services.llm_service import LLMService; print('Groq LLM OK')"
```

---

## Step 3: Frontend Setup

### 3.1 Install Dependencies

```bash
cd ../frontend
npm install
```

### 3.2 Configure Environment

Frontend automatically connects to `http://localhost:8000` (no config needed).

---

## Step 4: Start Development Servers

### 4.1 Start Backend

**Terminal 1:**
```bash
cd backend
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux
uvicorn main:app --reload --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

### 4.2 Start Frontend

**Terminal 2:**
```bash
cd frontend
npm start
```

Expected output:
```
Compiled successfully!
Local:            http://localhost:3000
```

---

## Step 5: Test the System

### 5.1 Open Browser

Navigate to: http://localhost:3000

### 5.2 Upload Sample VCF

Use the included `sample_patient.vcf` file in the root directory.

### 5.3 Select Drug

Choose from: codeine, warfarin, clopidogrel, simvastatin, tacrolimus, azathioprine, fluorouracil, tamoxifen, omeprazole, sertraline, escitalopram, voriconazole

### 5.4 Analyze

Click "Analyze" and wait 3-5 seconds.

---

## Step 6: Verify API Integrations

### Check Backend Logs

You should see:
```
INFO: Attempting to load star definitions from PharmVar API
INFO: Successfully loaded definitions from PharmVar API for 6 genes
INFO: Searching web for: CYP2D6 *1/*4 pharmacogenomics codeine CPIC guidelines
INFO: Found 3 web search results
```

### Check Response JSON

The analysis response should include:
- `llm_generated_explanation` with context from web search
- `pharmacogenomic_profile` with dynamically fetched alleles
- `quality_metrics` showing all steps successful

---

## Troubleshooting

### Issue: "Groq API Key not configured"

**Solution:**
1. Check `.env` file exists in `backend/`
2. Verify `GROQ_API_KEY=...` is set
3. Restart backend server

### Issue: "PharmVar API failed"

**Solution:**
- System automatically falls back to static JSON
- Check internet connection
- PharmVar may be under maintenance (rare)
- App will still work with cached/static data

### Issue: "Web search failed"

**Solution:**
- Non-critical error, analysis continues
- Check firewall settings
- DuckDuckGo may rate-limit (rare)
- LLM still generates explanation without web context

### Issue: CORS errors in browser

**Solution:**
```bash
# Check CORS_ORIGINS in .env
CORS_ORIGINS=http://localhost:3000
```

### Issue: Import errors

**Solution:**
```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt
```

---

## Architecture Verification

Run these commands to verify each service:

### PharmVar Service
```bash
cd backend
python -c "from services.pharmvar_service import pharmvar_service; result = pharmvar_service.get_gene_info('CYP2D6'); print('✅ PharmVar API working' if result else '❌ PharmVar failed')"
```

### Web Search Service
```bash
python -c "from services.web_search_service import web_search_service; results = web_search_service.search_drug_gene_interaction('codeine', 'CYP2D6'); print(f'✅ Found {len(results)} search results' if results else '❌ Web search failed')"
```

### Groq LLM Service
```bash
# Requires GROQ_API_KEY in .env
python -c "from services.llm_service import LLMService; llm = LLMService(); print('✅ Groq LLM configured' if llm.client else '❌ Groq key missing')"
```

---

## Performance Optimization

### Enable Caching

Caching is **enabled by default** in `pharmvar_service.py`:

```python
# Cache settings (already configured)
api_cache = TTLCache(maxsize=1000, ttl=3600)  # 1 hour
```

### Monitor Cache Hit Rate

Check backend logs for:
```
INFO: Cache hit for /alleles/CYP2D6*2
```

High cache hit rate = faster responses!

---

## Production Deployment

### Environment Variables for Production

```env
GROQ_API_KEY=your_production_key
PORT=8000
CORS_ORIGINS=https://yourfrontend.vercel.app
```

### Recommended Settings

- **Rate Limiting**: Use nginx or Cloudflare
- **Caching**: Consider Redis for distributed cache
- **Monitoring**: Add Sentry for error tracking
- **Logging**: Use structured logging (JSON format)

See `DEPLOYMENT.md` for full production guide.

---

## API Rate Limits Summary

| Service | Limit | Handled By |
|---------|-------|------------|
| PharmVar | 2 req/s | `pharmvar_service.py` rate limiter |
| Groq | 30 req/min (free) | Groq SDK |
| DuckDuckGo | ~100/min | duckduckgo-search library |

---

## Next Steps

1. ✅ Setup complete
2. Read `API_INTEGRATION.md` for architecture details
3. Review `ARCHITECTURE.md` for system design
4. Check `DEPLOYMENT.md` for hosting options
5. Test with real patient VCF files (anonymized!)

---

## Support

**Issues?**
- Check logs in both terminals
- Verify `.env` configuration
- Ensure all dependencies installed
- Review `TROUBLESHOOTING.md`

**Questions?**
- PharmVar API: https://www.pharmvar.org/api-service/
- Groq Console: https://console.groq.com
- Project README: `README.md`

---

**Setup Time**: ~10 minutes
**Cost**: $0 (all free APIs)
**Status**: Production-ready ✅
