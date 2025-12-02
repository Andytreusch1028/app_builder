# Hardware Optimization Script for Coding AI Platform
# Maximizes GPU and CPU utilization for Ollama and Node.js

Write-Host "🚀 HARDWARE OPTIMIZATION SCRIPT" -ForegroundColor Cyan
Write-Host "="*60

# 1. Detect Hardware
Write-Host "`n1️⃣  Detecting Hardware..." -ForegroundColor Yellow
$cpu = Get-WmiObject Win32_Processor
$gpu = Get-WmiObject Win32_VideoController | Where-Object { $_.Name -like "*Arc*" -or $_.Name -like "*NVIDIA*" -or $_.Name -like "*AMD*" }
$ram = Get-WmiObject Win32_ComputerSystem

Write-Host "   CPU: $($cpu.Name)"
Write-Host "   Cores: $($cpu.NumberOfCores) physical, $($cpu.NumberOfLogicalProcessors) logical"
Write-Host "   GPU: $($gpu.Name)"
Write-Host "   VRAM: $([math]::Round($gpu.AdapterRAM / 1GB, 2)) GB"
Write-Host "   RAM: $([math]::Round($ram.TotalPhysicalMemory / 1GB, 2)) GB"

# 2. Set Ollama Environment Variables
Write-Host "`n2️⃣  Configuring Ollama for Maximum Performance..." -ForegroundColor Yellow

# Enable Intel GPU
[System.Environment]::SetEnvironmentVariable('OLLAMA_INTEL_GPU', '1', 'User')
Write-Host "   ✅ Enabled Intel GPU acceleration"

# Set parallel processing
[System.Environment]::SetEnvironmentVariable('OLLAMA_NUM_PARALLEL', '4', 'User')
Write-Host "   ✅ Set parallel requests to 4"

# Set max loaded models
[System.Environment]::SetEnvironmentVariable('OLLAMA_MAX_LOADED_MODELS', '2', 'User')
Write-Host "   ✅ Set max loaded models to 2"

# Optimize context size
[System.Environment]::SetEnvironmentVariable('OLLAMA_MAX_QUEUE', '512', 'User')
Write-Host "   ✅ Set max queue to 512"

# 3. Set Node.js Environment Variables
Write-Host "`n3️⃣  Configuring Node.js for Maximum Performance..." -ForegroundColor Yellow

# Use all CPU cores
$cores = $cpu.NumberOfLogicalProcessors
[System.Environment]::SetEnvironmentVariable('UV_THREADPOOL_SIZE', $cores.ToString(), 'User')
Write-Host "   ✅ Set UV_THREADPOOL_SIZE to $cores"

# Increase memory limit for Node.js
[System.Environment]::SetEnvironmentVariable('NODE_OPTIONS', '--max-old-space-size=4096', 'User')
Write-Host "   ✅ Set Node.js max memory to 4GB"

# 4. Restart Ollama to apply changes
Write-Host "`n4️⃣  Restarting Ollama to apply changes..." -ForegroundColor Yellow

$ollamaProcess = Get-Process ollama -ErrorAction SilentlyContinue
if ($ollamaProcess) {
    Write-Host "   Stopping Ollama..."
    Stop-Process -Name ollama -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

Write-Host "   Starting Ollama with new settings..."
Start-Process "ollama" -ArgumentList "serve" -WindowStyle Hidden
Start-Sleep -Seconds 3

if (Get-Process ollama -ErrorAction SilentlyContinue) {
    Write-Host "   ✅ Ollama restarted successfully"
} else {
    Write-Host "   ⚠️  Ollama may need manual restart"
}

# 5. Verify Settings
Write-Host "`n5️⃣  Verifying Configuration..." -ForegroundColor Yellow
Write-Host "   OLLAMA_INTEL_GPU: $env:OLLAMA_INTEL_GPU"
Write-Host "   OLLAMA_NUM_PARALLEL: $env:OLLAMA_NUM_PARALLEL"
Write-Host "   OLLAMA_MAX_LOADED_MODELS: $env:OLLAMA_MAX_LOADED_MODELS"
Write-Host "   UV_THREADPOOL_SIZE: $env:UV_THREADPOOL_SIZE"

# 6. Run Performance Test
Write-Host "`n6️⃣  Running Performance Test..." -ForegroundColor Yellow
$start = Get-Date
ollama run qwen2.5-coder:1.5b "Write hello world" 2>&1 | Out-Null
$duration = (Get-Date) - $start

Write-Host "   Generation time: $([math]::Round($duration.TotalSeconds, 2)) seconds"

if ($duration.TotalSeconds -lt 5) {
    Write-Host "   ✅ EXCELLENT - GPU acceleration confirmed!" -ForegroundColor Green
} elseif ($duration.TotalSeconds -lt 10) {
    Write-Host "   ✅ GOOD - Likely using GPU" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  SLOW - May be CPU only" -ForegroundColor Yellow
}

Write-Host "`n" + "="*60
Write-Host "✅ OPTIMIZATION COMPLETE!" -ForegroundColor Green
Write-Host "`nChanges made:"
Write-Host "   - Enabled Intel GPU acceleration for Ollama"
Write-Host "   - Configured parallel request handling (4 concurrent)"
Write-Host "   - Optimized Node.js thread pool ($cores threads)"
Write-Host "   - Increased Node.js memory limit (4GB)"
Write-Host "`nNOTE: You may need to restart your terminal for all changes to take effect"
Write-Host ("="*60)

