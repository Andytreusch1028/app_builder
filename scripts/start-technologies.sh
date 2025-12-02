#!/bin/bash
# Bash script to start all required technologies for Application Builder
# This script checks and starts Ollama and other helper technologies

echo "🚀 Starting Application Builder Technologies..."
echo ""

# Function to check if a port is listening
check_port() {
    local port=$1
    if command -v nc &> /dev/null; then
        nc -z localhost $port 2>/dev/null
        return $?
    elif command -v lsof &> /dev/null; then
        lsof -i:$port &> /dev/null
        return $?
    else
        # Fallback: try to connect with timeout
        timeout 1 bash -c "cat < /dev/null > /dev/tcp/localhost/$port" 2>/dev/null
        return $?
    fi
}

# 1. Check and start Ollama
echo "📦 Checking Ollama..."
if check_port 11434; then
    echo "   ✅ Ollama is already running on port 11434"
else
    echo "   ⚠️  Ollama is not running. Attempting to start..."
    
    # Try to start Ollama
    if command -v ollama &> /dev/null; then
        nohup ollama serve > /dev/null 2>&1 &
        sleep 3
        
        if check_port 11434; then
            echo "   ✅ Ollama started successfully"
        else
            echo "   ❌ Failed to start Ollama. Please start it manually: ollama serve"
        fi
    else
        echo "   ❌ Ollama not found. Please install from: https://ollama.ai"
    fi
fi

# 2. Check Letta (optional)
echo ""
echo "🧠 Checking Letta Memory System..."
if check_port 8283; then
    echo "   ✅ Letta is already running on port 8283"
else
    echo "   ℹ️  Letta is not running (optional)"
    echo "   To enable: Install Python 3.12, then run: letta server --port 8283"
fi

# 3. Check Qwen model availability
echo ""
echo "🤖 Checking Qwen 2.5 Coder model..."
if check_port 11434; then
    if command -v curl &> /dev/null; then
        models=$(curl -s http://localhost:11434/api/tags 2>/dev/null)
        if echo "$models" | grep -q "qwen2.5-coder"; then
            echo "   ✅ Qwen 2.5 Coder model is available"
        else
            echo "   ⚠️  Qwen 2.5 Coder model not found"
            echo "   To install: ollama pull qwen2.5-coder:7b"
        fi
    fi
else
    echo "   ⚠️  Could not check models (Ollama may not be running)"
fi

echo ""
echo "✅ Technology startup check complete!"
echo ""
echo "Next steps:"
echo "  1. Run: npm start"
echo "  2. Open: http://localhost:3000/builder.html"
echo "  3. Click '🔧 Technologies' to view status"
echo ""

