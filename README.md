# Workspace Copilot

Workspace Copilot is designed to assist user to manage theur personal workspace.

## Features

- **Calendar Integration**: Schedule events and fetch calendar details using the Nylas API.
- **Date and Time Tools**: Retrieve the current date and time in various formats.
- **AI-Powered Assistant**: Use an AI agent to interact with the tools and provide intelligent responses to user queries.

## Project Structure
- `client.py`: The main client that interacts with the servers and the AI agent.
- `servers/`: Contains individual server scripts for calendar, date, and time functionalities.
  - `calendar.py`: Handles calendar-related operations using the Nylas API.
  - `date.py`: Provides the current date in ISO 8601 format.
  - `time.py`: Provides the current time in ISO 8601 and Unix timestamp formats.
- `.env`: Stores environment variables such as API keys.
- `requirements.txt`: Lists the Python dependencies for the project.


## Dependencies
- langchain-groq
- langchain-mcp-adapters
- mcp
- langgraph
- nylas
