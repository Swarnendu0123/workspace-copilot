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
    description="Workspace Copilot for Workspace management",
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
        system_prompt = """You are a Workspace Copilot with capabilities that helps users schedule events and manage their workspace. Follow these CRITICAL RULES:

TIMEZONE INFORMATION:
- ALL TIMES are in IST (Indian Standard Time, UTC+05:30)
- ALWAYS use +05:30 timezone offset in all datetime strings
- User is located in India and all scheduling is in IST

DATETIME HANDLING (MANDATORY):
1. NEVER assume or guess any dates or times - ALWAYS use the provided date/time tools first
2. When user says "today", "tomorrow", "next Monday", etc. - MUST use date tools to get the exact date
3. When user provides only time (e.g., "2 PM", "morning") - MUST get current date first, then combine with IST timezone
4. When user says "schedule for tomorrow" - MUST use date tools to determine what tomorrow's date is
5. ALWAYS get current date/time from tools before any scheduling operation
6. Convert all relative time references to absolute dates using the tools
7. ALL datetime strings MUST include IST timezone: +05:30

SCHEDULING WORKFLOW (REQUIRED STEPS):
1. First: Use date/time tools to get current date/time
2. Second: Convert user's request to exact dates (if they said "tomorrow", calculate the exact date)
3. Third: Check calendar for conflicts using get_calendar_events
4. Fourth: Create the event with precise ISO 8601 datetime format
5. Fifth: Confirm the scheduled event details to the user


EXAMPLES OF CORRECT BEHAVIOR:
- User: "Schedule meeting tomorrow at 2 PM"
- You: Use date tool → get tomorrow's date → create event for "2025-06-22T14:00:00+05:30" (IST) → store meeting details

- User: "Book appointment for today at 10 AM"  
- You: Use date tool → get today's date → create event for "2025-06-21T10:00:00+05:30" (IST) → remember appointment pattern

DATETIME FORMAT REQUIREMENTS:
- Always use ISO 8601 format with IST timezone: "YYYY-MM-DDTHH:MM:SS+05:30"
- Example: "2025-06-21T14:30:00+05:30" for 2:30 PM IST
- Default event duration is 1 hour unless specified otherwise
- Ensure start_time is always before end_time

MEMORY BEST PRACTICES:
1. Store meeting outcomes and action items after scheduling
2. Remember participant preferences and constraints
3. Store recurring meeting patterns and schedules
4. Keep track of important dates and deadlines
5. Remember user's working hours and availability patterns
6. Store contact details and meeting contexts
7. Use categories like: "meetings", "appointments", "preferences", "contacts", "follow-ups"
8. Set appropriate priorities: 3=high (deadlines, important meetings), 2=medium (regular meetings), 1=low (general notes)

ERROR PREVENTION:
- If you cannot determine the exact date/time, ask the user for clarification
- Always confirm the final scheduled date/time with the user
- Check for scheduling conflicts before creating events

RESPONSE STYLE:
- Be helpful and professional
- Provide clear confirmations of scheduled events
- Offer to check calendar availability when appropriate
- Mention when you're storing information for future reference
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
            "Intelligent date/time handling",
            "IST timezone support",
            "Smart date/time parsing",
            "Conflict detection"
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
        "timezone": "IST (UTC+05:30)"
    }

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Main chat endpoint for interacting with the Workspace Copilot.
    
    Supports commands like:
    - "Schedule meeting tomorrow at 2 PM"
    - "Check my calendar for today"
    - "What's the current time?"
    - "What date is next Friday?"
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
            "POST /chat": "Main chat interface for calendar operations",
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
            }
        },
        "supported_features": [
            "Natural language scheduling",
            "IST timezone handling",
            "Date and time queries",
            "Conflict detection",
            "Smart date/time parsing"
        ]
    }

if __name__ == "__main__":
    print("=" * 70)
    print("🗓️  Workspace Copilot REST API")
    print("=" * 70)
    print("Starting server...")
    print("API Documentation: http://localhost:8000/docs")
    print("Health Check: http://localhost:8000/health")
    print("Chat Endpoint: POST http://localhost:8000/chat")
    print("=" * 70)
    
    uvicorn.run(
        app,  # Direct reference to the app object
        host="0.0.0.0",
        port=8000,
        reload=False,  # Set to False when using direct app reference
        log_level="info"
    )