import asyncio
from collections import defaultdict
from fastapi import WebSocket

class Hub:
    def __init__(self): self.connections = defaultdict(set)
    async def connect(self, channel: str, ws: WebSocket):
        await ws.accept(); self.connections[channel].add(ws)
    def disconnect(self, channel: str, ws: WebSocket): self.connections[channel].discard(ws)
    async def publish(self, channels: list[str], event: dict):
        for channel in channels:
            stale=[]
            for ws in self.connections[channel].copy():
                try: await ws.send_json(event)
                except Exception: stale.append(ws)
            for ws in stale: self.disconnect(channel, ws)

hub = Hub()
