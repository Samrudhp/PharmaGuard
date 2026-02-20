# ⚡ Quick Start Guide - PharmaGuard

Get PharmaGuard running in **5 minutes**!

---

## 🎯 Prerequisites

Before starting, ensure you have:
- ✅ Python 3.8 or higher ([Download](https://www.python.org/downloads/))
- ✅ Node.js 16 or higher ([Download](https://nodejs.org/))
- ✅ Git ([Download](https://git-scm.com/))
- ⚠️ OpenAI API Key (Optional, for LLM explanations - [Get one](https://platform.openai.com/api-keys))

---

## 🚀 Step 1: Clone Repository

```bash
git clone <your-repo-url>
cd PharmaGuard
```

---

## 🔧 Step 2: Setup Backend (2 minutes)

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
copy .env.example .env    # Windows
cp .env.example .env      # Mac/Linux

# Edit .env and add your OpenAI API key (optional)
# OPENAI_API_KEY=sk-your-key-here

# Start the server
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

✅ **Backend is now running at http://localhost:8000**

Keep this terminal window open!

---

## 🎨 Step 3: Setup Frontend (2 minutes)

Open a **new terminal window**:

```bash
# Navigate to frontend (from project root)
cd frontend

# Install dependencies
npm install

# Setup environment variables
copy .env.example .env    # Windows
cp .env.example .env      # Mac/Linux

# Start development server
npm start
```

Your browser will automatically open to `http://localhost:3000`

✅ **Frontend is now running!**

---

## 🧪 Step 4: Test the Application (1 minute)

1. **Upload VCF File**
   - Use the sample file: `backend/sample_vcf/sample_patient.vcf`
   - Drag and drop or click to upload

2. **Select Drug**
   - Type "clopidogrel" in the search box
   - Click to select

3. **Analyze**
   - Click the "Analyze Pharmacogenomics" button
   - Wait 2-3 seconds

4. **View Results**
   - See color-coded risk assessment
   - Expand gene profiles
   - Read LLM explanation
   - Download or copy JSON

---

## 🎉 You're Done!

Your PharmaGuard system is now fully operational.

---

## 🐛 Troubleshooting

### Backend Issues

**Problem:** `ModuleNotFoundError: No module named 'fastapi'`
```bash
# Ensure virtual environment is activated
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

**Problem:** `Port 8000 is already in use`
```bash
# Change port in backend/.env
PORT=8001

# Or kill the process using port 8000
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F
# Mac/Linux:
lsof -ti:8000 | xargs kill -9
```

**Problem:** Backend starts but API requests fail
```bash
# Check CORS settings in backend/main.py
# Ensure frontend URL is in cors_origins
```

---

### Frontend Issues

**Problem:** `npm ERR! code ENOENT`
```bash
# Navigate to correct directory
cd frontend

# Verify package.json exists
ls package.json    # Mac/Linux
dir package.json   # Windows

# Install dependencies
npm install
```

**Problem:** "Cannot connect to server" error
```bash
# Verify backend is running (terminal 1)
# Check backend URL in frontend/.env
REACT_APP_API_URL=http://localhost:8000

# Restart frontend
npm start
```

**Problem:** TailwindCSS styles not loading
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json    # Mac/Linux
rmdir /s node_modules & del package-lock.json    # Windows

npm install
npm start
```

---

### LLM Explanation Issues

**Problem:** Explanation shows template text
```bash
# This is normal! LLM is optional
# To enable LLM:
1. Get OpenAI API key from https://platform.openai.com
2. Add to backend/.env:
   OPENAI_API_KEY=sk-your-key-here
3. Restart backend
```

**Problem:** OpenAI API errors
```bash
# Check API key is valid
# Check you have credits in OpenAI account
# System automatically falls back to templates if LLM fails
```

---

## 📚 Next Steps

1. **Read Full Documentation**
   - [README.md](README.md) - Complete overview
   - [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API details
   - [DEPLOYMENT.md](DEPLOYMENT.md) - Deploy to production

2. **Test All Drugs**
   - Try different drug combinations
   - Upload different VCF files
   - Explore all features

3. **Customize**
   - Modify drug rules in `backend/data/drug_rules.json`
   - Update star allele definitions
   - Customize frontend styling

4. **Deploy**
   - Follow [DEPLOYMENT.md](DEPLOYMENT.md)
   - Deploy to Railway + Vercel
   - Get a live URL for your hackathon submission

---

## 💡 Quick Tips

### Development Workflow

```bash
# Terminal 1: Backend with auto-reload
cd backend
python main.py

# Terminal 2: Frontend with hot reload
cd frontend
npm start

# Any changes to code will auto-refresh!
```

### Testing Multiple Drugs

All supported drugs:
- azathioprine
- atorvastatin
- capecitabine
- clopidogrel
- codeine
- escitalopram
- fluorouracil
- mercaptopurine
- phenytoin
- simvastatin
- tramadol
- warfarin

### Sample VCF File Location

```
backend/sample_vcf/sample_patient.vcf
```

This file contains variants for all 6 genes!

---

## 🆘 Still Having Issues?

1. **Check Prerequisites**
   - Python version: `python --version` (3.8+)
   - Node version: `node --version` (16+)
   - Pip version: `pip --version`

2. **Fresh Installation**
   ```bash
   # Delete everything and start over
   rm -rf backend/venv frontend/node_modules
   
   # Follow steps 2 and 3 again
   ```

3. **Check Logs**
   - Backend: Look at terminal 1 for errors
   - Frontend: Check browser console (F12)

4. **Verify File Structure**
   ```
   PharmaGuard/
   ├── backend/
   │   ├── main.py
   │   ├── requirements.txt
   │   └── ...
   └── frontend/
       ├── package.json
       └── ...
   ```

---

## ✅ System Check Command

Run these to verify everything:

```bash
# Backend health
curl http://localhost:8000/health

# Should return:
# {"status":"healthy","service":"PharmaGuard API"}

# Frontend (open in browser)
# http://localhost:3000
# Should see PharmaGuard interface
```

---

## 🎓 Learning Resources

- **FastAPI:** https://fastapi.tiangolo.com/
- **React:** https://react.dev/
- **TailwindCSS:** https://tailwindcss.com/
- **CPIC Guidelines:** https://cpicpgx.org/

---

**Happy Hacking! 🚀**

Need help? Check the full README or open an issue!
