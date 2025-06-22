import os 
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP
import os
from nylas import Client


load_dotenv()

nylas = Client(
    os.environ.get('NYLAS_API_KEY')
)

grant_id = os.environ.get("NYLAS_GRANT_ID")


mcp = FastMCP("email")


@mcp.tool()
def get_latest_emails(n: int = 5):
    """
    Retrieves the n most recent emails from the connected email account.
    
    IMPORTANT FOR AI: This function fetches existing emails to provide email management and communication assistance.
    
    AI USAGE INSTRUCTIONS:
    1. Use this function to show users their recent emails when asked
    2. Use this to help users catch up on recent communications
    3. Use this to find specific emails by checking recent messages first
    4. Parse the returned emails to provide user-friendly summaries including sender, subject, and timestamp
    5. Help users prioritize emails by identifying important senders or urgent subjects
    6. Use this as a starting point before searching for specific emails or conversations
    
    Args:
        n (int): Number of recent emails to retrieve (default: 5, max: 50)
    
    Returns:
        List of recent email messages with details including sender, subject, body preview, timestamps, and other metadata
    """

    n = min(max(1, n), 5)
    
    messages = nylas.messages.list(
        grant_id,
        query_params={
            "limit": n
        }
    )

    return messages


if __name__ == "__main__":    
    mcp.run(transport="stdio")