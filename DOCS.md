# Documentation Index

Welcome to the Virtual Try-On project documentation!

## Quick Navigation

### 🚀 Getting Started
- **[QUICKSTART.md](QUICKSTART.md)** - Get up and running in 5 minutes
- **[INSTALLATION.md](INSTALLATION.md)** - Detailed step-by-step installation guide

### 📚 Complete Documentation
- **[README.md](README.md)** - Complete project manual with all details
- **[VERSIONS.md](VERSIONS.md)** - Exact tool versions and dependencies

## Documentation Files Overview

| File | Purpose | When to Use |
|------|---------|-------------|
| `QUICKSTART.md` | Quick 5-minute setup | First time setup, quick reference |
| `INSTALLATION.md` | Detailed installation steps | Troubleshooting installation issues |
| `README.md` | Complete project manual | Full reference, development workflow |
| `VERSIONS.md` | Tool versions & compatibility | Checking versions, updating dependencies |
| `PROJECT_DOCUMENTATION.md` | Consolidated Project Docs | Full Data & Process Models, Presentation Slides |
| `documentation_export.html` | Printable Documentation | Use to generate PDF documentation |

## What's Included

### QUICKSTART.md
- Prerequisites checklist
- Quick setup commands
- Common commands reference
- Quick troubleshooting

### INSTALLATION.md
- Step-by-step installation for all platforms
- Verification checklist
- Post-installation configuration
- Detailed troubleshooting

### README.md
- Complete project overview
- System requirements
- Full setup instructions
- Running the application
- Development workflow
- API documentation
- Troubleshooting guide

### VERSIONS.md
- Exact tool versions
- All dependencies listed
- Platform-specific requirements
- Compatibility matrix
- Known issues and fixes
- Update maintenance guide

## Project Structure

```
Virtual-try-on/
├── backend/                # FastAPI Backend
│   ├── main.py
│   ├── requirements.txt
│   └── ...
├── frontend/              # React Native Frontend
│   ├── App.js
│   ├── package.json
│   ├── loader.mjs        # Windows ESM fix
│   └── src/
├── README.md             # Complete manual
├── QUICKSTART.md         # Quick start guide
├── INSTALLATION.md       # Installation guide
├── VERSIONS.md           # Version documentation
└── DOCS.md              # This file
```

## Key Information

### Tool Versions
- **Node.js**: v20.19.6
- **Python**: 3.11+
- **Expo SDK**: 54
- **React**: 19.1.0
- **React Native**: 0.81.5

### Quick Commands

**Start Backend:**
```bash
cd backend
venv\Scripts\activate
python -m uvicorn main:app --reload --host 0.0.0.0
```

**Start Frontend:**
```bash
cd frontend
npm start -- --tunnel
```

## Getting Help

1. Check the appropriate documentation file
2. Review error messages in terminal
3. Check troubleshooting sections
4. Verify tool versions match requirements

## Contributing

When updating documentation:
1. Keep information accurate and up-to-date
2. Test all commands before documenting
3. Update version numbers when dependencies change
4. Add troubleshooting entries for common issues

---

**Last Updated**: December 31, 2024  
**Documentation Version**: 1.0.0
