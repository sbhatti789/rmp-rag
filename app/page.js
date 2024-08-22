"use client"
// Import necessary components from Material UI and React
import { Box, Stack, TextField, Button } from "@mui/material";
import Image from "next/image";
import { useState } from "react";

// Main Home component
export default function Home() {
  // State to manage the conversation messages
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi, I'm the Rate My Professor support assistant. How can I help you today?"
    }
  ]);

  // State to manage the current message input
  const [message, setMessage] = useState('');

  // Function to handle sending a message
  const sendMessage = async () => {
    // Add the user's message and an empty assistant message to the messages state
    setMessages((messages) => [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: '' }
    ]);

    // Clear the input field
    setMessage('');

    // Send the user's message to the server
    const response = fetch('/api/chat', {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([...messages, { role: "user", content: message }])
    }).then(async (res) => {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let result = '';

      // Read the response from the server and update the assistant's message
      return reader.read().then(function processText({ done, value }) {
        if (done) {
          return result;
        }
        const text = decoder.decode(value || new Uint8Array(), { stream: true });
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1];
          let otherMessages = messages.slice(0, messages.length - 1);
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ];
        });

        return reader.read().then(processText);
      });
    });
  }

  // Render the chat interface
  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      {/* Main chat container */}
      <Stack
        direction="column"
        width="500px"
        height="700px"
        border="1px solid black"
        p={2}
        spacing={3}
      >
        {/* Message display area */}
        <Stack
          direction="column"
          spacing={2}
          flexGrow={1}
          overflow={'auto'}
          maxHeight={'100%'}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={
                message.role === 'assistant' ? 'flex-start' : 'flex-end'
              }
            >
              <Box
                bgcolor={
                  message.role === 'assistant' ? 'primary.main' : 'secondary.main'
                }
                color="white"
                borderRadius={36}
                p={3}
              >
                {message.content}
              </Box>
            </Box>
          ))}
        </Stack>

        {/* Message input area */}
        <Stack
          direction="row"
          spacing={2}
        >
          {/* Input field for the user's message */}
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
            }}
          />
          {/* Send button */}
          <Button variant='contained' onClick={sendMessage}>
            Send
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
