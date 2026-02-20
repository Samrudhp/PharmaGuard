# 🪟 Windows Setup Guide - PharmaGuard

Complete setup guide specifically for Windows users.

---

## 📋 Prerequisites Installation

### 1. Install Python 3.8+

**Download:**
1. Go to https://www.python.org/downloads/
2. Download Python 3.11 (recommended)
3. Run installer

**Important:** Check "Add Python to PATH" during installation!

**Verify:**
```cmd
python --version
```
Should show: `Python 3.11.x` or higher

---

### 2. Install Node.js 16+

**Download:**
1. Go to https://nodejs.org/
2. Download LTS version (20.x recommended)
3. Run installer

**Verify:**
```cmd
node --version
npm --version
```

---

### 3. Install Git

**Download:**
1. Go to https://git-scm.com/download/win
2. Download and run installer
3. Use default settings

**Verify:**
```cmd
git --version
```

---

## 🚀 Project Setup

### Step 1: Clone Repository

```cmd
cd C:\Users\YourName\Documents
git clone <your-repo-url>
cd PharmaGuard
```

---

### Step 2: Backend Setup

```cmd
:: Navigate to backend
cd backend

:: Create virtual environment
python -m venv venv

:: Activate virtual environment
venv\Scripts\activate

:: Your prompt should now show (venv)

:: Upgrade pip
python -m pip install --upgrade pip

:: Install dependencies
pip install -r requirements.txt

:: Create .env file
copy .env.example .env

:: Edit .env file
notepad .env
```

**In .env, add:**
```
OPENAI_API_KEY=sk-your-key-here
PORT=8000
CORS_ORIGINS=http://localhost:3000
```

**Start backend:**
```cmd
python main.py
```

Keep this window open!

---

### Step 3: Frontend Setup

Open **new Command Prompt** window:

```cmd
cd C:\Users\YourName\Documents\PharmaGuard\frontend

:: Install dependencies
npm install

:: If you get errors, try:
npm install --legacy-peer-deps

:: Create .env file
copy .env.example .env

:: Edit .env
notepad .env
```

**In .env, add:**
```
REACT_APP_API_URL=http://localhost:8000
```

**Start frontend:**
```cmd
npm start
```

Browser will open automatically!

---

## 🐛 Common Windows Issues

### Issue 1: "python is not recognized"

**Solution:**
1. Find Python installation:
   - Usually: `C:\Users\YourName\AppData\Local\Programs\Python\Python311`
2. Add to PATH:
   - Right-click "This PC" → Properties
   - Advanced system settings → Environment Variables
   - Under "System variables", find "Path"
   - Click "Edit" → "New"
   - Add Python path
   - Also add: `C:\Users\YourName\AppData\Local\Programs\Python\Python311\Scripts`

---

### Issue 2: "cannot be loaded because running scripts is disabled"

**Solution:**
Open PowerShell as Administrator:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then try again:
```cmd
venv\Scripts\activate
```

---

### Issue 3: Virtual environment activation not working

**Alternative activation methods:**

**Command Prompt:**
```cmd
venv\Scripts\activate.bat
```

**PowerShell:**
```powershell
venv\Scripts\Activate.ps1
```

**Git Bash:**
```bash
source venv/Scripts/activate
```

---

### Issue 4: Port 8000 already in use

**Find process:**
```cmd
netstat -ano | findstr :8000
```

**Kill process:**
```cmd
taskkill /PID <PID_NUMBER> /F
```

---

### Issue 5: npm install fails

**Solutions:**

**Option 1: Clear cache**
```cmd
npm cache clean --force
npm install
```

**Option 2: Use legacy peer deps**
```cmd
npm install --legacy-peer-deps
```

**Option 3: Delete and reinstall**
```cmd
rmdir /s /q node_modules
del package-lock.json
npm install
```

---

### Issue 6: ENOENT error with npm

**Solution:**
```cmd
:: Make sure you're in frontend folder
cd frontend

:: Verify package.json exists
dir package.json

:: Install
npm install
```

---

### Issue 7: Permission denied errors

**Solution:**
Run Command Prompt as Administrator:
1. Search "cmd" in Start Menu
2. Right-click → "Run as administrator"
3. Navigate to project
4. Try commands again

---

## 🔧 Development Workflow (Windows)

### Using Command Prompt

**Terminal 1 (Backend):**
```cmd
cd C:\Users\YourName\Documents\PharmaGuard\backend
venv\Scripts\activate
python main.py
```

**Terminal 2 (Frontend):**
```cmd
cd C:\Users\YourName\Documents\PharmaGuard\frontend
npm start
```

---

### Using PowerShell

**Terminal 1 (Backend):**
```powershell
cd C:\Users\YourName\Documents\PharmaGuard\backend
.\venv\Scripts\Activate.ps1
python main.py
```

**Terminal 2 (Frontend):**
```powershell
cd C:\Users\YourName\Documents\PharmaGuard\frontend
npm start
```

---

### Using VS Code

1. Open PharmaGuard folder in VS Code
2. Open Terminal (Ctrl + `)
3. Split terminal (Ctrl + Shift + 5)

**Left Terminal:**
```cmd
cd backend
venv\Scripts\activate
python main.py
```

**Right Terminal:**
```cmd
cd frontend
npm start
```

---

## 📦 Recommended Tools for Windows

### 1. Windows Terminal
- Download from Microsoft Store
- Better than CMD
- Tabs and split panes
- Modern UI

### 2. VS Code
- Download from https://code.visualstudio.com/
- Best editor for this project
- Extensions to install:
  - Python
  - Pylance
  - ES7+ React/Redux/React-Native snippets
  - Tailwind CSS IntelliSense

### 3. Postman
- Test API endpoints
- Download from https://www.postman.com/

---

## 🧪 Testing on Windows

**Test Backend:**
```cmd
curl http://localhost:8000/health
```

If curl doesn't work, use PowerShell:
```powershell
Invoke-WebRequest -Uri http://localhost:8000/health
```

**Or use browser:**
```
http://localhost:8000/health
http://localhost:8000/
```

---

## 📁 File Paths on Windows

**Backend files:**
```
C:\Users\YourName\Documents\PharmaGuard\backend\
├── main.py
├── requirements.txt
├── .env
└── ...
```

**Sample VCF:**
```
C:\Users\YourName\Documents\PharmaGuard\backend\sample_vcf\sample_patient.vcf
```

**Frontend:**
```
C:\Users\YourName\Documents\PharmaGuard\frontend\
├── package.json
├── .env
└── src\
    └── App.js
```

---

## 🔄 Restart Everything (Windows)

**Stop servers:**
- Press `Ctrl + C` in both terminals

**Restart backend:**
```cmd
cd backend
venv\Scripts\activate
python main.py
```

**Restart frontend:**
```cmd
cd frontend
npm start
```

---

## 🗑️ Clean Installation (Windows)

If everything is broken:

```cmd
:: Stop all processes (Ctrl + C in terminals)

:: Delete virtual environment
cd backend
rmdir /s /q venv

:: Delete node modules
cd ..\frontend
rmdir /s /q node_modules
del package-lock.json

:: Recreate everything
cd ..\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

cd ..\frontend
npm install

:: Start again
:: Terminal 1:
cd backend
venv\Scripts\activate
python main.py

:: Terminal 2:
cd frontend
npm start
```

---

## 💡 Pro Tips for Windows Users

1. **Use Tab Completion**
   - Type part of file/folder name
   - Press Tab to autocomplete

2. **Quick Directory Navigation**
   ```cmd
   :: Go up one level
   cd ..
   
   :: Go to specific drive
   D:
   
   :: Go to user folder
   cd %USERPROFILE%
   ```

3. **View Hidden Files**
   - File Explorer → View → Hidden items

4. **Environment Variables**
   - Windows key + R → `sysdm.cpl`
   - Advanced → Environment Variables

5. **Find Open Ports**
   ```cmd
   netstat -ano
   ```

---

## 🆘 Getting Help

### Check Python is Active
```cmd
where python
python --version
```

### Check Virtual Environment
```cmd
:: Should show (venv) in prompt
where python
:: Should point to venv folder
```

### Check Node/NPM
```cmd
node --version
npm --version
where node
```

### Check Running Processes
```cmd
:: Backend
netstat -ano | findstr :8000

:: Frontend
netstat -ano | findstr :3000
```

---

## ✅ Windows Setup Checklist

- [ ] Python 3.8+ installed and in PATH
- [ ] Node.js 16+ installed
- [ ] Git installed
- [ ] Repository cloned
- [ ] Backend virtual environment created
- [ ] Backend dependencies installed
- [ ] Backend .env configured
- [ ] Backend starts successfully (port 8000)
- [ ] Frontend dependencies installed
- [ ] Frontend .env configured
- [ ] Frontend starts successfully (port 3000)
- [ ] Can access http://localhost:3000
- [ ] Can upload sample VCF file
- [ ] Can analyze and see results

---

**You're all set on Windows! 🎉**

If you still have issues, check the main [QUICKSTART.md](QUICKSTART.md) or troubleshooting section.
