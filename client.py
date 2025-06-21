from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.prebuilt import create_react_agent
from langchain_groq import ChatGroq

from dotenv import load_dotenv
load_dotenv()

import asyncio

async def main(msg: str):
    client = MultiServerMCPClient(
        {
            "calendar": {
                "command": "python3",
                "args": ["servers/calendar.py"],
                "transport": "stdio",
            },
            "time": {
                "command": "python3",
                "args": ["servers/time.py"],
                "transport": "stdio",
            },
            "date": {
                "command": "python3",
                "args": ["servers/date.py"],
                "transport": "stdio",
            }
        }
    )

    import os 
    os.environ["GROQ_API_KEY"] = os.getenv("GROQ_API_KEY")


    tools = await client.get_tools()
    model = ChatGroq(model = "meta-llama/llama-4-scout-17b-16e-instruct")

    agent = create_react_agent(
        model=model,
        tools=tools
    )


    response = await agent.ainvoke(
        {
            "messages": 
            [   
                { "role": "system", 
                 "content": "You are a helpful assistant that helps users to schedule events, based on the current time and date. Always get the current time and date from the tools provided. Never assume the current time or date. If the user asks for the current time or date, use the tools provided to get the current time and date. If the user asks for the current time or date in a specific format, use the tools provided to get the current time and date in that format."
                }, 
                { 
                "role": "user", 
                "content": msg
                }
            ]
        }
    )
    print("__________________________________________________________________")
    print("Response from agent:")
    print(response["messages"][-1].content)


# take response from console
while True:
    try:
        print("__________________________________________________________________")
        user_input = input("Enter your message: ")
        print("__________________________________________________________________")

        if user_input.lower() == "exit":
            break
        asyncio.run(main(user_input))

    except KeyboardInterrupt:
        print("\nExiting...")
        break

if __name__ == "__main__":
    asyncio.run(main())