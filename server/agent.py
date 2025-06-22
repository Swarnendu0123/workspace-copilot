from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.prebuilt import create_react_agent
from langchain_groq import ChatGroq
from dotenv import load_dotenv
import asyncio
import os
import uvicorn
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware


load_dotenv()

app = FastAPI(
    title="Workspace Copilot API",
    description="Workspace Copilot for Workspace and Email management",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    status: str = "success"

# Global client instance (will be initialized on startup)
mcp_client = None
agent = None

async def initialize_agent():
    """Initialize the MCP client and agent"""
    global mcp_client, agent
    
    try:
        mcp_client = MultiServerMCPClient(
            {
                "calendar": {
                    "command": "python3",
                    "args": ["mcp_servers/nylas_calendar.py"],
                    "transport": "stdio",
                },
                "time": {
                    "command": "python3",
                    "args": ["mcp_servers/time.py"],
                    "transport": "stdio",
                },
                "date": {
                    "command": "python3",
                    "args": ["mcp_servers/date.py"],
                    "transport": "stdio",
                },
                "email": {
                    "command": "python3",
                    "args": ["mcp_servers/nylas_email.py"],
                    "transport": "stdio",
                },
                'personal_details': {
                    "command": "python3",
                    "args": ["mcp_servers/personal_details.py"],
                    "transport": "stdio",
                }
            }
        )

        # Set up Groq API key
        os.environ["GROQ_API_KEY"] = os.getenv("GROQ_API_KEY")
        
        if not os.getenv("GROQ_API_KEY"):
            raise ValueError("GROQ_API_KEY not found in environment variables")

        # Get tools and initialize model
        tools = await mcp_client.get_tools()
        model = ChatGroq(model="meta-llama/llama-4-scout-17b-16e-instruct")

        # Create the agent
        agent = create_react_agent(
            model=model,
            tools=tools
        )
        
        print("✅ Workspace Copilot API initialized successfully")
        
    except Exception as e:
        print(f"❌ Failed to initialize agent: {e}")
        raise

async def process_chat_message(message: str) -> str:
    """Process a chat message and return the agent's response"""
    global agent
    
    if agent is None:
        raise HTTPException(status_code=500, detail="Agent not initialized")
    
    try:
        system_prompt = """
# You are Workspace Copilot - Calendar & Email Assistant

**TIMEZONE**: All times in IST (UTC+05:30). Format: `2025-06-21T14:30:00+05:30`

**MANDATORY WORKFLOW**:
1. Use date/time tools first - never assume dates
2. Convert "tomorrow"/"next week" to exact dates  
3. Check calendar conflicts → Create event → Confirm

**SCHEDULING**:
- Always get current date/time from tools before scheduling
- Default 1-hour duration
- ISO 8601 format with +05:30 timezone required

**EMAIL**:
- Use `get_latest_emails` (default 5, max 50)
- Summarize: sender, subject, time, key points
- Highlight urgent emails

**MEMORY**:
- Categories: "meetings", "appointments", "contacts", "emails"
- Priority 3=urgent, 2=normal, 1=low

**RULES**:
- Ask for clarification if unclear
- Always confirm scheduled details
- Professional, organized responses
"""

        response = await agent.ainvoke(
            {
                "messages": [
                    {
                        "role": "system",
                        "content": system_prompt
                    },
                    {
                        "role": "user",
                        "content": message
                    }
                ]
            }
        )
        
        return response["messages"][-1].content
        
    except Exception as e:
        print(f"Error processing message: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process message: {str(e)}")

@app.on_event("startup")
async def startup_event():
    """Initialize the agent when the API starts"""
    await initialize_agent()

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources when the API shuts down"""
    global mcp_client
    if mcp_client:
        # Close the MCP client if it has a close method
        try:
            await mcp_client.close()
        except:
            pass

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Workspace Copilot API is running",
        "status": "healthy",
        "features": [
            "Schedule meetings and appointments",
            "Email management and summaries",
            "Intelligent date/time handling",
            "IST timezone support",
            "Smart date/time parsing",
            "Conflict detection",
            "Email prioritization",
            "Communication insights"
        ]
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    global agent, mcp_client
    return {
        "status": "healthy" if agent is not None else "unhealthy",
        "agent_initialized": agent is not None,
        "mcp_client_initialized": mcp_client is not None,
        "timezone": "IST (UTC+05:30)",
        "capabilities": ["calendar", "email", "time", "date"]
    }

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Main chat endpoint for interacting with the Workspace Copilot.
    
    Supports commands like:
    Calendar:
    - "Schedule meeting tomorrow at 2 PM"
    - "Check my calendar for today"
    - "What's the current time?"
    - "What date is next Friday?"
    
    Email:
    - "Show me my latest emails"
    - "Any urgent emails?"
    - "What are my recent emails from last 10?"
    - "Summarize my email inbox"
    """
    try:
        response_text = await process_chat_message(request.message)
        return ChatResponse(response=response_text)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api-info")
async def api_info():
    """Get API usage information"""
    return {
        "api_name": "Workspace Copilot",
        "version": "1.0.0",
        "endpoints": {
            "POST /chat": "Main chat interface for calendar and email operations",
            "GET /": "API status and features",
            "GET /health": "Detailed health check",
            "GET /api-info": "This endpoint"
        },
        "example_requests": {
            "schedule_meeting": {
                "message": "Schedule a team meeting tomorrow at 3 PM"
            },
            "check_calendar": {
                "message": "What meetings do I have today?"
            },
            "get_time": {
                "message": "What time is it now?"
            },
            "get_date": {
                "message": "What date is next Monday?"
            },
            "latest_emails": {
                "message": "Show me my latest emails"
            },
            "urgent_emails": {
                "message": "Any urgent emails I need to see?"
            },
            "email_summary": {
                "message": "Summarize my last 10 emails"
            }
        },
        "supported_features": [
            "Natural language scheduling",
            "IST timezone handling",
            "Date and time queries",
            "Conflict detection",
            "Smart date/time parsing",
            "Email retrieval and summarization",
            "Email prioritization",
            "Communication management",
            "Cross-platform workspace integration"
        ]
    }

if __name__ == "__main__":
    print("=" * 70)
    print("📧🗓️  Workspace Copilot REST API")
    print("=" * 70)
    print("Starting server...")
    print("API Documentation: http://localhost:8000/docs")
    print("Health Check: http://localhost:8000/health")
    print("Chat Endpoint: POST http://localhost:8000/chat")
    print("Features: Calendar Management + Email Management")
    print("=" * 70)
    
    uvicorn.run(
        app,  # Direct reference to the app object
        host="0.0.0.0",
        port=8000,
        reload=False,  # Set to False when using direct app reference
        log_level="info"
    )