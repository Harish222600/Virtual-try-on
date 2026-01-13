# Virtual Try-On - Installation Guide

## Step-by-Step Installation Instructions

### Part 1: Install Core Tools (30 minutes)

#### Step 1: Install Node.js v20.19.6

**Windows:**
1. Open PowerShell as Administrator
2. Run:
   ```powershell
   winget install OpenJS.NodeJS.20 --version 20.19.6
   ```
3. Restart PowerShell
4. Verify: `node --version` should show `v20.19.6`

**macOS:**
1. Open Terminal
2. Install Homebrew (if not installed):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
3. Install Node.js:
   ```bash
   brew install node@20
   ```
4. Verify: `node --version`

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
```

#### Step 2: Install Python 3.11+

**Windows:**
1. Download from https://www.python.org/downloads/
2. Run installer
3. **IMPORTANT**: Check "Add Python to PATH"
4. Click "Install Now"
5. Verify: `python --version`

**macOS:**
```bash
brew install python@3.11
python3 --version
```

**Linux:**
```bash
sudo apt update
sudo apt install python3.11 python3.11-venv python3-pip
python3 --version
```

#### Step 3: Install Git

**Windows:**
```powershell
winget install Git.Git
```

**macOS:**
```bash
brew install git
```

**Linux:**
```bash
sudo apt install git
```

Verify: `git --version`

#### Step 4: Install Expo Go on Mobile Device

1. Open Google Play Store (Android) or App Store (iOS)
2. Search for "Expo Go"
3. Install the app
4. Open once to verify it works

---

### Part 2: Clone and Setup Project (15 minutes)

#### Step 1: Clone Repository

```bash
# Navigate to your projects folder
cd d:\  # Windows
# cd ~/Projects  # macOS/Linux

# Clone the repository
git clone <your-repository-url> Virtual-try-on
cd Virtual-try-on
```

#### Step 2: Setup Backend

```bash
# Navigate to backend folder
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate

# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Verify installation
python -m uvicorn main:app --reload
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

Press `Ctrl+C` to stop, then deactivate: `deactivate`

#### Step 3: Setup Frontend

```bash
# Navigate to frontend folder (from project root)
cd ../frontend

# Install dependencies
npm install --legacy-peer-deps
```

**This will take 3-5 minutes**

**Expected Output:**
```
added 683 packages in 3m
```

---

### Part 3: First Run (10 minutes)

#### Step 1: Start Backend

**Open Terminal/PowerShell 1:**
```bash
cd d:\Virtual-try-on\backend
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux
python -m uvicorn main:app --reload --host 0.0.0.0
```

**Keep this terminal open!**

#### Step 2: Start Frontend

**Open Terminal/PowerShell 2:**
```bash
cd d:\Virtual-try-on\frontend
npm start -- --tunnel
```

**Wait for QR code to appear (1-2 minutes)**

#### Step 3: Test on Mobile

1. Open **Expo Go** app on your phone
2. Scan the QR code from Terminal 2
3. Wait for app to download (30-60 seconds)
4. App should open successfully!

---

## Verification Checklist

After installation, verify everything works:

- [ ] `node --version` shows v20.19.6
- [ ] `python --version` shows 3.11.x or higher
- [ ] `git --version` shows a version number
- [ ] Backend starts without errors
- [ ] Frontend shows QR code
- [ ] App loads on mobile device
- [ ] No red error screens on mobile

---

## Post-Installation Configuration

### Optional: Configure Environment Variables

**Backend (.env file):**
```bash
cd backend
# Create .env file
echo "DATABASE_URL=sqlite:///./virtual_tryon.db" > .env
echo "SECRET_KEY=your-secret-key-change-this" >> .env
```

**Frontend (API URL):**
Edit `frontend/src/services/auth.js`:
```javascript
// Change this to your backend URL if deployed
export const API_URL = 'http://192.168.1.x:8000';  // Your computer's IP
```

### Optional: Install VS Code Extensions

1. Open VS Code
2. Press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (macOS)
3. Search and install:
   - Python
   - ES7+ React/Redux/React-Native snippets
   - Tailwind CSS IntelliSense

---

## Troubleshooting Installation Issues

### Issue: "python not found"
**Solution:**
- Reinstall Python and check "Add to PATH"
- Or manually add Python to PATH

### Issue: "npm install fails"
**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and try again
Remove-Item -Path "node_modules" -Recurse -Force
npm install --legacy-peer-deps
```

### Issue: "venv\Scripts\activate not working"
**Solution (Windows):**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue: "Port 8000 already in use"
**Solution:**
```bash
# Find process using port
netstat -ano | findstr :8000  # Windows
lsof -ti:8000  # macOS/Linux

# Kill the process or use different port
python -m uvicorn main:app --reload --port 8080
```

### Issue: "Expo Go shows SDK mismatch"
**Solution:**
- Update Expo Go app to latest version from app store
- Ensure it's SDK 54

---

## Next Steps

After successful installation:

1. ✅ Read `README.md` for full documentation
2. ✅ Check `QUICKSTART.md` for common commands
3. ✅ Review `VERSIONS.md` for tool versions
4. ✅ Start developing!

---

## Getting Help

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting-installation-issues) section
2. Review error messages carefully
3. Check terminal logs for both backend and frontend
4. Verify all tool versions match requirements

---

**Installation Guide Version**: 1.0.0  
**Last Updated**: December 31, 2024
