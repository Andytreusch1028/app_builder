# PowerShell script to start all required technologies for Application Builder
# This script checks and starts Ollama and other helper technologies

Write-Host "🚀 Starting Application Builder Technologies..." -ForegroundColor Cyan
Write-Host ""

# Function to check if a process is running
function Test-ProcessRunning {
    param([string]$ProcessName)
    return (Get-Process -Name $ProcessName -ErrorAction SilentlyContinue) -ne $null
}

# Function to check if a port is listening
function Test-PortListening {
    param([int]$Port)
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue -InformationLevel Quiet
    return $connection
}

# 1. Check and start Ollama
Write-Host "📦 Checking Ollama..." -ForegroundColor Yellow
if (Test-PortListening -Port 11434) {
    Write-Host "   ✅ Ollama is already running on port 11434" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Ollama is not running. Attempting to start..." -ForegroundColor Yellow
    
    # Try to start Ollama
    try {
        Start-Process "ollama" -ArgumentList "serve" -WindowStyle Hidden
        Start-Sleep -Seconds 3
        
        if (Test-PortListening -Port 11434) {
            Write-Host "   ✅ Ollama started successfully" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Failed to start Ollama. Please start it manually: ollama serve" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ❌ Ollama not found. Please install from: https://ollama.ai" -ForegroundColor Red
    }
}

# 2. Check Letta (optional)
Write-Host ""
Write-Host "🧠 Checking Letta Memory System..." -ForegroundColor Yellow
if (Test-PortListening -Port 8283) {
    Write-Host "   ✅ Letta is already running on port 8283" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  Letta is not running (optional)" -ForegroundColor Gray
    Write-Host "   To enable: Install Python 3.12, then run: letta server --port 8283" -ForegroundColor Gray
}

# 3. Check Qwen model availability
Write-Host ""
Write-Host "🤖 Checking Qwen 2.5 Coder model..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -ErrorAction SilentlyContinue
    $hasQwen = $response.models | Where-Object { $_.name -like "qwen2.5-coder*" }
    
    if ($hasQwen) {
        Write-Host "   ✅ Qwen 2.5 Coder model is available" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Qwen 2.5 Coder model not found" -ForegroundColor Yellow
        Write-Host "   To install: ollama pull qwen2.5-coder:7b" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ⚠️  Could not check models (Ollama may not be running)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Technology startup check complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run: npm start" -ForegroundColor White
Write-Host "  2. Open: http://localhost:3000/builder.html" -ForegroundColor White
Write-Host "  3. Click '🔧 Technologies' to view status" -ForegroundColor White
Write-Host ""

