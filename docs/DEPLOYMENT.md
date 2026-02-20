# 🚀 Deployment Guide - PharmaGuard

This guide covers deployment to popular cloud platforms.

---

## 🎯 Pre-Deployment Checklist

- [ ] All tests passing locally
- [ ] Sample VCF file tested successfully
- [ ] Environment variables configured
- [ ] API keys secured
- [ ] CORS origins updated for production
- [ ] Frontend API URL points to production backend

---

## 🖥️ Backend Deployment

### Option 1: Railway (Recommended)

**Why Railway?**
- Zero-config Python deployment
- Automatic HTTPS
- Environment variable management
- Free tier available

**Steps:**

1. **Prepare Files**
   - Ensure `requirements.txt` is in backend root
   - Create `Procfile` (optional but recommended):
   ```
   web: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

2. **Deploy on Railway**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login
   railway login

   # Navigate to backend folder
   cd backend

   # Initialize project
   railway init

   # Deploy
   railway up
   ```

3. **Set Environment Variables**
   - Go to Railway dashboard
   - Add variables:
     ```
     OPENAI_API_KEY=your_key
     CORS_ORIGINS=https://your-frontend-url.vercel.app
     PORT=8000
     ```

4. **Get Public URL**
   - Railway provides: `https://your-app.railway.app`

---

### Option 2: Render

**Steps:**

1. **Create `render.yaml`** in project root:
   ```yaml
   services:
     - type: web
       name: pharmaguard-api
       env: python
       buildCommand: "cd backend && pip install -r requirements.txt"
       startCommand: "cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT"
       envVars:
         - key: OPENAI_API_KEY
           sync: false
         - key: CORS_ORIGINS
           value: https://your-frontend.vercel.app
   ```

2. **Deploy**
   - Connect GitHub repo to Render
   - Render auto-deploys on push

---

### Option 3: AWS EC2

**Steps:**

1. **Launch EC2 Instance**
   - Ubuntu 22.04 LTS
   - t2.micro (free tier)
   - Open ports: 22 (SSH), 80 (HTTP), 443 (HTTPS)

2. **SSH into Instance**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

3. **Setup**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Python
   sudo apt install python3 python3-pip python3-venv -y

   # Clone repo
   git clone https://github.com/your-repo/pharmaguard.git
   cd pharmaguard/backend

   # Setup virtual environment
   python3 -m venv venv
   source venv/bin/activate

   # Install dependencies
   pip install -r requirements.txt

   # Create .env file
   nano .env
   # Add your environment variables

   # Install nginx
   sudo apt install nginx -y

   # Configure nginx
   sudo nano /etc/nginx/sites-available/pharmaguard
   ```

4. **Nginx Configuration:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

5. **Enable and Start**
   ```bash
   sudo ln -s /etc/nginx/sites-available/pharmaguard /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx

   # Use systemd to run uvicorn
   sudo nano /etc/systemd/system/pharmaguard.service
   ```

6. **Systemd Service File:**
   ```ini
   [Unit]
   Description=PharmaGuard FastAPI
   After=network.target

   [Service]
   User=ubuntu
   WorkingDirectory=/home/ubuntu/pharmaguard/backend
   Environment="PATH=/home/ubuntu/pharmaguard/backend/venv/bin"
   ExecStart=/home/ubuntu/pharmaguard/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000

   [Install]
   WantedBy=multi-user.target
   ```

7. **Start Service**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl start pharmaguard
   sudo systemctl enable pharmaguard
   ```

---

## 🌐 Frontend Deployment

### Option 1: Vercel (Recommended)

**Why Vercel?**
- Optimized for React
- Automatic builds
- Global CDN
- Free tier with custom domains

**Steps:**

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Navigate to Frontend**
   ```bash
   cd frontend
   ```

3. **Update API URL**
   - Edit `.env`:
   ```
   REACT_APP_API_URL=https://your-backend.railway.app
   ```

4. **Deploy**
   ```bash
   vercel
   ```

5. **Production Deploy**
   ```bash
   vercel --prod
   ```

**Alternative: Vercel Dashboard**
- Connect GitHub repo
- Set build settings:
  - Build Command: `cd frontend && npm run build`
  - Output Directory: `frontend/build`
  - Environment Variable: `REACT_APP_API_URL`

---

### Option 2: Netlify

**Steps:**

1. **Create `netlify.toml`** in project root:
   ```toml
   [build]
     base = "frontend"
     command = "npm run build"
     publish = "build"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Deploy via CLI**
   ```bash
   npm install -g netlify-cli
   cd frontend
   npm run build
   netlify deploy --prod --dir=build
   ```

3. **Set Environment Variables**
   - Go to Netlify dashboard
   - Site settings → Environment variables
   - Add `REACT_APP_API_URL`

---

### Option 3: GitHub Pages

**Steps:**

1. **Update `package.json`**
   ```json
   {
     "homepage": "https://yourusername.github.io/pharmaguard",
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d build"
     }
   }
   ```

2. **Install gh-pages**
   ```bash
   npm install gh-pages --save-dev
   ```

3. **Deploy**
   ```bash
   npm run deploy
   ```

---

## 🔒 Security Considerations

### Environment Variables
- **Never commit** `.env` files
- Use platform-specific secret management
- Rotate API keys regularly

### CORS Configuration
```python
# In main.py
cors_origins = [
    "https://your-production-domain.com",
    "https://www.your-production-domain.com"
]
```

### File Upload Security
- Already implemented: 5MB limit
- Consider: Virus scanning for production
- Consider: Rate limiting (e.g., Cloudflare)

### API Keys
- Store OpenAI key in environment variables
- Use separate keys for dev/prod
- Monitor usage quotas

---

## 📊 Monitoring & Logging

### Backend Monitoring

**Railway/Render:**
- Built-in logging dashboard
- View real-time logs
- Set up alerts

**Custom Logging (Optional):**
```python
# In main.py
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

### Frontend Monitoring

**Add Error Tracking (Optional):**
- Sentry
- LogRocket
- Google Analytics

---

## 🧪 Post-Deployment Testing

### Backend Tests
```bash
# Health check
curl https://your-api.com/health

# Test analyze endpoint
curl -X POST https://your-api.com/api/analyze \
  -F "file=@sample_patient.vcf" \
  -F "drug=clopidogrel"
```

### Frontend Tests
1. Visit deployed URL
2. Upload sample VCF
3. Select drug
4. Verify results display
5. Test download/copy JSON
6. Check mobile responsiveness

---

## 🔄 Continuous Deployment

### GitHub Actions (Backend)

Create `.github/workflows/deploy-backend.yml`:
```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway link ${{ secrets.RAILWAY_PROJECT_ID }}
          railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### GitHub Actions (Frontend)

Create `.github/workflows/deploy-frontend.yml`:
```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./frontend
```

---

## 🌍 Custom Domain Setup

### Backend (Railway)
1. Go to Railway dashboard
2. Settings → Domains
3. Add custom domain
4. Update DNS records (CNAME)

### Frontend (Vercel)
1. Go to Vercel dashboard
2. Project → Settings → Domains
3. Add custom domain
4. Update DNS records
5. SSL automatically configured

---

## 📈 Scaling Considerations

### Backend Scaling
- **Vertical**: Upgrade server size
- **Horizontal**: Deploy multiple instances with load balancer
- **Database**: If adding user accounts, use PostgreSQL
- **Caching**: Redis for repeated analyses

### Frontend Scaling
- Vercel/Netlify handle this automatically
- CDN already included

---

## 💾 Backup Strategy

### Code
- GitHub repository (primary backup)
- Regular commits

### Data Files
- `backend/data/` folder backed up in repo
- Version control for guideline updates

### Environment Variables
- Document in team password manager
- Keep `.env.example` updated

---

## 🐛 Troubleshooting

### Backend Not Starting
```bash
# Check logs
railway logs  # for Railway
render logs   # for Render

# Common issues:
# - Missing environment variables
# - Wrong Python version
# - Port binding issues
```

### Frontend Can't Connect
```bash
# Check API URL
# Verify CORS settings in backend
# Check browser console for errors
# Ensure backend is running
```

### LLM Explanations Failing
```bash
# Check OPENAI_API_KEY is set
# Verify API key is valid
# Check OpenAI usage limits
# System falls back to templates automatically
```

---

## 📞 Support

If deployment issues persist:
1. Check platform status pages
2. Review error logs
3. Consult platform documentation
4. Open issue in repository

---

## ✅ Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Environment variables configured
- [ ] CORS properly set
- [ ] Sample VCF test successful
- [ ] All 12 drugs testable
- [ ] Error handling works
- [ ] JSON download works
- [ ] Mobile responsive
- [ ] SSL/HTTPS enabled
- [ ] Monitoring configured
- [ ] README updated with live URLs
- [ ] Team has access credentials

---

**You're now ready for production! 🚀**
