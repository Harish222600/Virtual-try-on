# Virtual Try-On - Quick Start Guide

## Prerequisites Checklist

- [ ] Node.js v20.19.6 installed
- [ ] Python 3.11+ installed
- [ ] Git installed
- [ ] Expo Go app installed on mobile device (SDK 54)

## Quick Setup (5 Minutes)

### 1. Clone & Install

```bash
# Clone the repository
git clone <repository-url>
cd Virtual-try-on

# Backend setup
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install --legacy-peer-deps
```

### 2. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
venv\Scripts\activate
python -m uvicorn main:app --reload --host 0.0.0.0
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start -- --tunnel
```

### 3. Test on Mobile

1. Open **Expo Go** app on your phone
2. Scan the QR code from Terminal 2
3. Wait for app to load

## Common Commands

```bash
# Clear cache and restart
npm start -- --clear

# Reload app on device
# Press 'r' in terminal or shake device → "Reload"

# View API docs
# Open http://localhost:8000/docs in browser
```

## Troubleshooting Quick Fixes

| Issue | Solution |
|-------|----------|
| ESM Error | Already fixed with `loader.mjs` |
| SDK Mismatch | Update Expo Go to latest |
| Cache Issues | Run `npm start -- --clear` |
| Network Error | Use `npm start -- --tunnel` |
| Port in Use | Expo will auto-suggest new port |

## Tool Versions

- **Node.js**: v20.19.6
- **Python**: 3.11+
- **Expo SDK**: 54
- **React**: 19.1.0
- **React Native**: 0.81.5

## Need Help?

See full manual: `README.md`
