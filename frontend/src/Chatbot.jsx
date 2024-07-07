import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './Chatbot.css';

const Chatbot = () => {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [responseCount, setResponseCount] = useState(0);

  const handleInputChange = (event) => {
    setInput(event.target.value);
  };

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    if(selectedFiles.length>5){
        alert("Maximum 5 Image files can be processed Once!!")
    }
    setFiles(prevFiles => [...prevFiles, ...selectedFiles].slice(0, 5)); // Limit to 5 files
  };

  const handleSendMessage = async () => {
    if (input.trim() === '' && files.length === 0) return;
    const formData = new FormData();
    formData.append('prompt', input);
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('http://localhost:3001/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      const newMessage = { text: data.response, sender: 'bot', files: files };

      setMessages([...messages, newMessage]);
      setInput('');
      setFiles([]);
      setResponseCount(responseCount + 1);
    } catch (error) {
      console.error('Error sending message:', error.message);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            <ReactMarkdown
              children={message.text}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline && match ? (
                    <div style={{ position: 'relative' }}>
                      <SyntaxHighlighter
                        children={String(children).replace(/\n$/, '')}
                        style={darcula}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      />
                      <button
                        className="copy-button"
                        onClick={() => copyToClipboard(String(children).replace(/\n$/, ''))}
                      >
                        Copy
                      </button>
                    </div>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  )
                }
              }}
            />
            {message.files && (
              <div className="message-files">
                {message.files.map((file, fileIndex) => (
                  <img key={fileIndex} src={URL.createObjectURL(file)} alt={`File ${fileIndex + 1}`} className="uploaded-file" />
                ))}
              </div>
            )}
            <div className="response-number">Response {index + 1}</div>
          </div>
        ))}
      </div>
      <div className="chatbot-input">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Type your message..."
        />
        <label htmlFor="file-upload" className="upload-label">
          <svg className="upload-icon" xmlns="http://www.w3.org/2000/svg" height="50px" viewBox="0 0 24 24" width="50px" fill="#000000">
            <path d="M0 0h24v24H0V0z" fill="none"/>
            <path d="M14.59 7.41L12 10l-2.59-2.59L8 9l4 4 4-4-1.41-1.41zM12 17c-1.1 0-2-.9-2-2h4c0 1.1-.9 2-2 2z" opacity=".3"/>
            <path d="M16.59 8.58L13 12.17l-3.59-3.59L8 10l4 4 4-4zM12 18c-1.1 0-2-.9-2-2h4c0 1.1-.9 2-2 2z"/>
          </svg>
        </label>
        <input
          id="file-upload"
          type="file"
          onChange={handleFileChange}
          accept="image/*"
          multiple
          style={{ display: 'none' }} // Hide the input
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chatbot;
