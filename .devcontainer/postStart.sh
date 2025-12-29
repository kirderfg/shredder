#!/bin/bash
# Runs every time container starts
set -e

BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[Start]${NC} $1"; }

# Ensure Tailscale is running (if installed)
if command -v tailscale &> /dev/null; then
    if ! pgrep -x tailscaled > /dev/null; then
        log "Starting Tailscale daemon..."
        sudo tailscaled --state=/var/lib/tailscale/tailscaled.state --socket=/run/tailscale/tailscaled.sock > /tmp/tailscaled.log 2>&1 &
        sleep 2
    fi
    if tailscale status &> /dev/null; then
        TS_IP=$(tailscale ip -4 2>/dev/null || echo "unknown")
        log "Tailscale connected: $TS_IP"
    fi
fi

log "Ready!"
