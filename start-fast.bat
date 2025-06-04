@echo off
echo 🚀 Optimizing Web App Performance...
echo.

REM Kill existing node processes
echo 1. Cleaning up existing processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo ✅ Processes cleaned up
echo.

REM Set Node.js memory options
echo 2. Setting memory optimization...
set NODE_OPTIONS=--max-old-space-size=4096
echo ✅ Memory limit set to 4GB
echo.

REM Clear npm cache
echo 3. Clearing cache...
npm cache clean --force
echo ✅ Cache cleared
echo.

REM Start optimized development server
echo 4. Starting optimized development server...
echo 📋 Using Turbo mode for faster builds
echo 🔗 Access your app at: http://localhost:3000
echo.
echo 💡 PERFORMANCE TIPS:
echo   - Clear your browser cache (Ctrl+Shift+Delete)
echo   - Close other memory-intensive applications
echo   - Use Chrome DevTools Performance tab to monitor
echo.

npm run dev

pause