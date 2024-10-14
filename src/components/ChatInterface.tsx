import React, { useState, useEffect } from 'react';
import { Send, Mic, Paperclip, StopCircle, VolumeX, Volume2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  currentChat: string | null;
  onClearChat: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ currentChat, onClearChat }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    setMessages([]);
  }, [currentChat]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8080/ask_bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationsNew: messages.map(msg => ({ messages: [{ sender: msg.role, text: msg.content }] })),
          question: input,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const assistantMessage: Message = { role: 'assistant', content: data.response };
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred while fetching the response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('File uploaded:', file.name);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Implement voice recording logic here
  };

  const speakMessage = (message: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
    } else {
      console.error('Speech synthesis not supported');
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0A1930]">
      {currentChat ? (
        <>
          <div className="flex-grow overflow-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`p-3 rounded-lg max-w-[70%] ${
                    message.role === 'user'
                      ? 'bg-[#1A2B4B] text-white'
                      : 'bg-[#FFD700] text-[#0A1930]'
                  }`}
                >
                  <div className="flex items-start">
                    {message.role === 'assistant' && (
                      <>
                        <img
                          src="https://images.unsplash.com/photo-1587614382346-4ec70e388b28?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80"
                          alt="AI Avatar"
                          className="w-8 h-8 rounded-full mr-2"
                        />
                        <button
                          onClick={() => speakMessage(message.content)}
                          className="ml-2 text-[#0A1930] hover:text-[#1A2B4B] transition-colors"
                        >
                          {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </button>
                      </>
                    )}
                    <div>{message.content}</div>
                    {message.role === 'user' && (
                      <img
                        src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1160&q=80"
                        alt="User Avatar"
                        className="w-8 h-8 rounded-full ml-2"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FFD700]"></div>
              </div>
            )}
            {error && (
              <div className="text-red-500 text-center">{error}</div>
            )}
          </div>
          <form onSubmit={handleSubmit} className="p-4 border-t border-[#1A2B4B]">
            <div className="flex items-center space-x-2 bg-[#1A2B4B] rounded-full p-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your legal question..."
                className="flex-grow p-2 bg-transparent focus:outline-none text-white"
              />
              <label className="cursor-pointer">
                <Paperclip size={20} className="text-gray-400 hover:text-[#FFD700] transition-colors" />
                <input type="file" className="hidden" onChange={handleFileUpload} />
              </label>
              <button
                type="button"
                onClick={toggleRecording}
                className="text-gray-400 hover:text-[#FFD700] transition-colors"
              >
                {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-[#FFD700] text-[#0A1930] p-2 rounded-full hover:bg-[#FFC000] transition-colors disabled:opacity-50"
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </>
      ) : (
        <div className="flex-grow flex flex-col items-center justify-center p-4">
          <h2 className="text-4xl font-serif font-bold mb-8 text-[#FFD700]">Legal-Eaze</h2>
          <div className="text-center text-white mb-8">
            <p>AI Legal Research Assistant</p>
          </div>
          <div className="grid grid-cols-3 gap-4 max-w-3xl w-full">
            <FeatureCard
              title="Examples"
              items={[
                '"Explain contract law in simple terms"',
                '"What are the key elements of a valid will?"',
                '"How do I file a small claims lawsuit?"',
              ]}
              suggestions={[
                "Summarize the basics of tort law",
                "Explain the difference between civil and criminal law",
                "What are the steps in a typical legal proceeding?"
              ]}
            />
            <FeatureCard
              title="Capabilities"
              items={[
                "Provides legal information and guidance",
                "Assists with legal research and case analysis",
                "Helps draft legal documents and contracts",
              ]}
              suggestions={[
                "Help me understand the terms in this contract",
                "What are the key legal precedents for my case?",
                "Draft a simple non-disclosure agreement"
              ]}
            />
            <FeatureCard
              title="Limitations"
              items={[
                "May not have knowledge of recent legal changes",
                "Cannot provide personalized legal advice",
                "Should not replace consultation with a licensed attorney",
              ]}
              suggestions={[
                "What are the ethical considerations for AI in law?",
                "How can I find a qualified attorney for my case?",
                "Explain the importance of professional legal advice"
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
};

interface FeatureCardProps {
  title: string;
  items: string[];
  suggestions: string[];
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, items, suggestions }) => (
  <div className="bg-[#1A2B4B] p-4 rounded-lg shadow-md border border-[#FFD700]">
    <h3 className="text-lg font-semibold mb-2 text-[#FFD700]">{title}</h3>
    <ul className="space-y-2 mb-4">
      {items.map((item, index) => (
        <li key={index} className="text-sm text-white">{item}</li>
      ))}
    </ul>
    <h4 className="text-md font-semibold mb-2 text-[#FFD700]">Try asking:</h4>
    <ul className="space-y-2">
      {suggestions.map((suggestion, index) => (
        <li key={index} className="text-sm text-white cursor-pointer hover:text-[#FFD700] transition-colors">
          {suggestion}
        </li>
      ))}
    </ul>
  </div>
);

export default ChatInterface;