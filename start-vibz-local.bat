@echo off
title Vibz+ - Serveur local
cd /d "G:\Users\Stylax\Documents\Vibz+"
start "" cmd /c "timeout /t 5 /nobreak >nul && start "" http://localhost:3000"
npm run dev
