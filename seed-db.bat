@echo off
title Restaurant QR System - Database Seeder
echo Seeding Demo Restaurant Data...
cd /d "%~dp0"
npm.cmd run seed
pause
