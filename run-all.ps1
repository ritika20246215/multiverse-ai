$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Start-ProjectWindow {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,
        [Parameter(Mandatory = $true)]
        [string]$Command
    )

    Write-Host "Starting $Name..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$root`"; $Command"
}

Write-Host ""
Write-Host "Launching full hackanovate workspace..." -ForegroundColor Green
Write-Host ""

Start-ProjectWindow -Name "Main App Stack" -Command "npm.cmd run dev"
Start-ProjectWindow -Name "Chatbot Backend" -Command "cd chatbot\backend; `$env:PORT='3000'; node server.js"
Start-ProjectWindow -Name "Career Backend" -Command "cd career-guidance-system\backend; `$env:PORT='5001'; python app.py"
Start-ProjectWindow -Name "Career Frontend" -Command "cd career-guidance-system\frontend; npm.cmd run dev -- --port 3001"
Start-ProjectWindow -Name "Task Manager" -Command "cd task-management-system; `$env:PORT='4000'; node server.js"

Write-Host ""
Write-Host "All services launched in separate PowerShell windows." -ForegroundColor Green
Write-Host ""
Write-Host "Expected URLs:" -ForegroundColor Yellow
Write-Host "Main app:          http://localhost:5173"
Write-Host "Chatbot backend:   http://localhost:3000"
Write-Host "Career frontend:   http://localhost:3001"
Write-Host "Career backend:    http://localhost:5001"
Write-Host "Task manager:      http://localhost:4000"
Write-Host ""
Write-Host "Run with:" -ForegroundColor Yellow
Write-Host ".\run-all.ps1"
