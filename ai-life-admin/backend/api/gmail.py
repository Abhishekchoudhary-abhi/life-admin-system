from fastapi import APIRouter, HTTPException
from backend.tools.gmail_tool import GmailTool
import asyncio

router = APIRouter(prefix="/gmail", tags=["Gmail"])

@router.get("/unread")
async def get_unread():
    try:
        tool = GmailTool()
        emails = await asyncio.to_thread(tool.get_unread_emails, 5)
        return {"emails": emails}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recent")
async def get_recent():
    try:
        tool = GmailTool()
        emails = await asyncio.to_thread(tool.get_recent_emails, 10)
        return {"emails": emails}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/read/{message_id}")
async def mark_read(message_id: str):
    try:
        tool = GmailTool()
        await asyncio.to_thread(tool.mark_as_read, message_id)
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
