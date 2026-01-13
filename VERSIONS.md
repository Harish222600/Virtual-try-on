# Virtual Try-On Project - Tool Versions & Dependencies

## Exact Tool Versions

### Core Development Tools

| Tool | Version | Purpose | Installation Command |
|------|---------|---------|---------------------|
| Node.js | v20.19.6 LTS | JavaScript runtime | `winget install OpenJS.NodeJS.20` |
| npm | 10.8.2 | Package manager | Included with Node.js |
| Python | 3.11+ | Backend runtime | `winget install Python.Python.3.11` |
| pip | 23.x+ | Python package manager | Included with Python |
| Git | Latest | Version control | `winget install Git.Git` |

### Frontend Dependencies (package.json)

```json
{
  "dependencies": {
    "expo": "~54.0.0",
    "expo-blur": "~15.0.8",
    "expo-image-picker": "~17.0.10",
    "expo-linear-gradient": "~15.0.8",
    "expo-status-bar": "~3.0.9",
    "lucide-react-native": "^0.446.0",
    "nativewind": "^4.2.1",
    "react": "19.1.0",
    "react-native": "0.81.5",
    "react-native-css-interop": "^0.2.1",
    "react-native-reanimated": "~3.16.1",
    "react-native-svg": "15.12.1",
    "tailwindcss": "^3.4.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "cross-env": "^10.1.0"
  }
}
```

### Backend Dependencies (requirements.txt)

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
pymongo==4.6.0
motor==3.3.2
python-multipart==0.0.6
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.0
supabase==2.3.0
email-validator==2.1.0
bcrypt==4.0.1
```

## Platform-Specific Requirements

### Windows
- **OS**: Windows 10/11 (64-bit)
- **PowerShell**: 5.1 or later
- **Visual C++ Redistributable**: 2015-2022 (for Python packages)
- **Windows Terminal**: Recommended for better terminal experience

### macOS
- **OS**: macOS 10.15 Catalina or later
- **Xcode**: Latest version (for iOS development)
- **Command Line Tools**: `xcode-select --install`
- **Homebrew**: Package manager (recommended)

### Linux
- **OS**: Ubuntu 20.04 LTS or later
- **Build essentials**: `sudo apt install build-essential`
- **Python dev headers**: `sudo apt install python3-dev`

## Mobile Development Requirements

### Android Development
- **Android Studio**: Latest version (optional, for emulator)
- **Android SDK**: API Level 33+ (automatically installed with Expo)
- **Expo Go**: SDK 54 (from Google Play Store)

### iOS Development (macOS only)
- **Xcode**: 14.0 or later
- **iOS Simulator**: iOS 15.0+
- **Expo Go**: SDK 54 (from App Store)
- **CocoaPods**: `sudo gem install cocoapods`

## Database Options

### Development (SQLite)
- **Version**: 3.x (built into Python)
- **File**: `virtual_tryon.db` (auto-created)
- **No additional installation required**

### Production (PostgreSQL)
- **Version**: 14.x or 15.x
- **Installation**: 
  - Windows: `winget install PostgreSQL.PostgreSQL`
  - macOS: `brew install postgresql@15`
  - Linux: `sudo apt install postgresql-15`

### Alternative (MongoDB)
- **Version**: 6.0+
- **Installation**:
  - Windows: `winget install MongoDB.Server`
  - macOS: `brew install mongodb-community`
  - Linux: Follow MongoDB official docs

## Network & Connectivity

### Expo Tunnel Service
- **Provider**: Expo (ngrok-based)
- **Purpose**: Remote device access
- **Included**: Automatically with Expo CLI
- **No additional setup required**

### Local Network Requirements
- **WiFi**: Both computer and mobile device on same network
- **Ports**: 
  - Backend: 8000 (configurable)
  - Frontend Metro: 8081 (default)
  - Expo DevTools: 19000-19001

## IDE & Editor Recommendations

### Visual Studio Code
- **Version**: Latest stable
- **Extensions**:
  - Python (ms-python.python)
  - Pylance (ms-python.vscode-pylance)
  - ES7+ React/Redux/React-Native snippets
  - Tailwind CSS IntelliSense
  - GitLens
  - Expo Tools

### Alternative IDEs
- **PyCharm**: For Python backend development
- **WebStorm**: For React Native frontend
- **Android Studio**: For Android-specific debugging

## Testing Tools

### Backend Testing
- **pytest**: `pip install pytest`
- **pytest-asyncio**: For async tests
- **httpx**: For API testing

### Frontend Testing
- **Jest**: Included with Expo
- **React Native Testing Library**: For component tests
- **Detox**: For E2E testing (optional)

## Build Tools

### Android Build
- **EAS CLI**: `npm install -g eas-cli`
- **Java JDK**: 17 (for local builds)

### iOS Build (macOS only)
- **EAS CLI**: `npm install -g eas-cli`
- **Fastlane**: `sudo gem install fastlane`

## Version Control

### Git Configuration
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Recommended .gitignore
Already included in project for:
- `node_modules/`
- `venv/`
- `.env`
- `__pycache__/`
- `.expo/`
- `*.pyc`

## Performance Monitoring (Optional)

### Frontend
- **Expo Application Services (EAS)**: Built-in analytics
- **React Native Performance**: Built-in profiler

### Backend
- **FastAPI Profiler**: Built-in `/docs` endpoint
- **Uvicorn Access Logs**: Enabled by default

## Security Tools

### Backend Security
- **python-jose**: JWT token handling
- **passlib**: Password hashing
- **bcrypt**: Encryption

### Frontend Security
- **Expo SecureStore**: For sensitive data storage
- **React Native Keychain**: Alternative secure storage

## Compatibility Matrix

| Component | Windows | macOS | Linux | iOS | Android |
|-----------|---------|-------|-------|-----|---------|
| Backend Development | ✅ | ✅ | ✅ | N/A | N/A |
| Frontend Development | ✅ | ✅ | ✅ | N/A | N/A |
| iOS Build | ❌ | ✅ | ❌ | ✅ | N/A |
| Android Build | ✅ | ✅ | ✅ | N/A | ✅ |
| Testing on Device | ✅ | ✅ | ✅ | ✅ | ✅ |

## Known Compatibility Issues & Fixes

### Issue 1: Windows ESM Loader
- **Problem**: Node.js v20+ ESM loader doesn't support Windows drive letters
- **Fix**: Custom `loader.mjs` included in project
- **Status**: ✅ Fixed

### Issue 2: React Native Reanimated
- **Problem**: v4.x requires worklets plugin
- **Fix**: Downgraded to v3.16.1
- **Status**: ✅ Fixed

### Issue 3: TailwindCSS v4
- **Problem**: NativeWind only supports v3
- **Fix**: Using TailwindCSS v3.4.0
- **Status**: ✅ Fixed

### Issue 4: Expo SDK Mismatch
- **Problem**: Expo Go app must match project SDK version
- **Fix**: Project uses Expo SDK 54 (latest)
- **Status**: ✅ Fixed

### Issue 5: Status Bar Overlap
- **Problem**: UI overlapping with device status bar
- **Fix**: SafeAreaView wrapper in App.js
- **Status**: ✅ Fixed

## Update & Maintenance

### Checking for Updates

**Frontend:**
```bash
npx expo-doctor
npx npm-check-updates
```

**Backend:**
```bash
pip list --outdated
```

### Recommended Update Schedule
- **Security patches**: Immediately
- **Minor versions**: Monthly
- **Major versions**: Quarterly (with testing)

## Support Resources

- **Node.js**: https://nodejs.org/docs/
- **Python**: https://docs.python.org/3/
- **Expo**: https://docs.expo.dev/
- **FastAPI**: https://fastapi.tiangolo.com/
- **React Native**: https://reactnative.dev/

---

**Document Version**: 1.0.0  
**Last Updated**: December 31, 2024  
**Maintained By**: Development Team
