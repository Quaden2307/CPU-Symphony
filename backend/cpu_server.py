#!/usr/bin/env python3
"""
CPU Monitor WebSocket Server
Streams real-time CPU data to the frontend
"""

import asyncio
import psutil
from aiohttp import web
import aiohttp_cors
import time

# Global CPU state for accurate readings
class CPUMonitor:
    def __init__(self):
        self.last_cpu_times = psutil.cpu_times()
        self.last_time = time.time()
        self.current_cpu = 0.0
        self.cpu_history = []
        self.buffer_size = 3

    def get_cpu_percent(self):
        """Calculate CPU percentage manually for accuracy"""
        current_times = psutil.cpu_times()
        current_time = time.time()

        time_delta = current_time - self.last_time

        if time_delta > 0:
            # Calculate the difference in CPU times
            user_delta = current_times.user - self.last_cpu_times.user
            system_delta = current_times.system - self.last_cpu_times.system
            idle_delta = current_times.idle - self.last_cpu_times.idle

            # Total CPU time
            total_delta = user_delta + system_delta + idle_delta

            if total_delta > 0:
                # Calculate percentage (user + system) / total
                cpu_percent = ((user_delta + system_delta) / total_delta) * 100
                cpu_percent = max(0, min(100, cpu_percent))  # Clamp to 0-100

                # Light smoothing
                self.cpu_history.append(cpu_percent)
                if len(self.cpu_history) > self.buffer_size:
                    self.cpu_history.pop(0)

                # Simple moving average
                self.current_cpu = sum(self.cpu_history) / len(self.cpu_history)

        self.last_cpu_times = current_times
        self.last_time = current_time

        return round(self.current_cpu, 1)

# Global monitor instance
cpu_monitor = CPUMonitor()

async def cpu_websocket_handler(request):
    """WebSocket handler for streaming CPU data"""
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    print("Client connected to CPU WebSocket")

    try:
        while not ws.closed:
            # Get accurate CPU percentage
            cpu_percent = cpu_monitor.get_cpu_percent()

            # Also get per-core for reference (using psutil's built-in)
            per_cpu = psutil.cpu_percent(interval=None, percpu=True)

            # Get memory info
            memory = psutil.virtual_memory()

            data = {
                "cpu": cpu_percent,
                "per_cpu": [round(c, 1) for c in per_cpu],
                "memory_percent": round(memory.percent, 1),
                "timestamp": time.time()
            }

            await ws.send_json(data)
            await asyncio.sleep(0.15)  # 150ms = ~7fps for slower, more compact updates

    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        print("Client disconnected from CPU WebSocket")

    return ws

async def cpu_http_handler(request):
    """HTTP endpoint for single CPU reading"""
    cpu_percent = cpu_monitor.get_cpu_percent()
    per_cpu = psutil.cpu_percent(interval=None, percpu=True)
    memory = psutil.virtual_memory()

    data = {
        "cpu": cpu_percent,
        "per_cpu": [round(c, 1) for c in per_cpu],
        "memory_percent": round(memory.percent, 1),
    }

    return web.json_response(data)

async def health_handler(request):
    """Health check endpoint"""
    return web.json_response({"status": "ok"})

def create_app():
    app = web.Application()

    # Setup CORS
    cors = aiohttp_cors.setup(app, defaults={
        "*": aiohttp_cors.ResourceOptions(
            allow_credentials=True,
            expose_headers="*",
            allow_headers="*",
            allow_methods="*"
        )
    })

    # Add routes
    app.router.add_get("/ws", cpu_websocket_handler)
    app.router.add_get("/cpu", cpu_http_handler)
    app.router.add_get("/health", health_handler)

    # Apply CORS to all routes except WebSocket
    for route in list(app.router.routes()):
        if route.resource.canonical != "/ws":
            cors.add(route)

    return app

if __name__ == "__main__":
    print("Starting CPU Monitor Server on http://localhost:8766")
    print("WebSocket endpoint: ws://localhost:8766/ws")
    print("HTTP endpoint: http://localhost:8766/cpu")
    app = create_app()
    web.run_app(app, host="localhost", port=8766)
