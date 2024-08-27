"use client"
import { Box, Stack, TextField, Button, Typography, AppBar, Toolbar } from "@mui/material";
import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi, I'm the Rate My Professor support assistant. How can I help you today?"
    }
  ]);

  const [message, setMessage] = useState('');

  const sendMessage = async () => {
    setMessages((messages) => [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: '' }
    ]);

    setMessage('');

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

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      bgcolor="#f0f2f5"
    >
      {/* Top Bar */}
      <AppBar position="static" color="primary">
        <Toolbar>
        <Box 
  width="100%" 
  display="flex" 
  justifyContent="center" 
  alignItems="center" 
  mb={2}
>
  <Typography variant="h6" component="div">
    RATE MY PROFESSOR APPLICATION
  </Typography>
</Box>

        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Box display="flex" flexGrow={1}>
        {/* Sidebar Description */}
        <Box
          width="250px"
          bgcolor="#1976d2"
          color="white"
          p={2}
        >
          <Typography variant="h6" gutterBottom>
            AI Chat Capabilities
          </Typography>
          <Typography variant="body1">
            - Find top professors based on your query
            </Typography>
            <Typography variant="body1">
            - Get detailed professor ratings
            </Typography>
            <Typography variant="body1">
            - Receive quick support for your inquiries
          </Typography>
        </Box>

        {/* Chat Area */}
        <Box
          display="flex"
          flexDirection="column"
          flexGrow={1}
          justifyContent="center"
          alignItems="center"
        >
          <Stack
            direction="column"
            width="500px"
            height="700px"
            border="1px solid #ddd"
            borderRadius={8}
            bgcolor="white"
            p={2}
            spacing={3}
            boxShadow="0px 4px 12px rgba(0, 0, 0, 0.1)"
          >
            {/* Message Display Area */}
            <Stack
              direction="column"
              spacing={2}
              flexGrow={1}
              overflow="auto"
              maxHeight="100%"
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
                      message.role === 'assistant' ? '#e3f2fd' : '#bbdefb'
                    }
                    color="black"
                    borderRadius={16}
                    p={2}
                    boxShadow="0px 2px 8px rgba(0, 0, 0, 0.1)"
                  >
                    {message.content}
                  </Box>
                </Box>
              ))}
            </Stack>

            {/* Message Input Area */}
            <Stack
              direction="row"
              spacing={2}
            >
              <TextField
                label="Message"
                fullWidth
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                variant="outlined"
              />
              <Button variant="contained" color="primary" onClick={sendMessage}>
                Send
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
