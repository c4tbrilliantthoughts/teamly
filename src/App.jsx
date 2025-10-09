import React, { useState, useEffect, useRef } from "react";
import { Layout, Input, Button, message, Switch, Tooltip } from "antd";
import {
  SendOutlined,
  DeleteOutlined,
  CopyOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import themeConfig from "./themeConfig";

const { Sider, Content } = Layout;

function ResponseRenderer({ msg, onSuggestionClick, theme }) {
  if (msg.suggestions) {
    return (
      <div style={{ fontSize: "12px" }}>
        🤔 I couldn't find an exact match.
        <br />
        Did you mean one of these?
        <div
          style={{
            marginTop: 8,
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {msg.suggestions.map((sug, idx) => (
            <Button
              key={idx}
              size="small"
              type="primary"
              ghost
              style={{
                backgroundColor: theme.suggestionButton,
                color: theme.suggestionText,
              }}
              onClick={() => onSuggestionClick(sug)}
            >
              {sug}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  const text = msg.text || "";
  const linkifiedText = text.replace(
    /(?<!href=['"])(https?:\/\/[^\s'"]+)/g,
    (url) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#1677ff;text-decoration:underline;">${url}</a>`
  );

  return (
    <div
      className="chat-response"
      dangerouslySetInnerHTML={{ __html: linkifiedText }}
      style={{
        fontSize: "14px",
        lineHeight: "1.6",
        width: "100%",
        wordBreak: "break-word",
        color: theme.textBot,
      }}
    />
  );
}

export default function App() {
  const [commands, setCommands] = useState([]);
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const chatEndRef = useRef(null);

  // ✅ Favicon setup
  useEffect(() => {
    const link =
      document.querySelector("link[rel*='icon']") ||
      document.createElement("link");
    link.type = "image/x-icon";
    link.rel = "icon";
    link.href = "/PromptNext/favicon.ico";
    document.getElementsByTagName("head")[0].appendChild(link);
  }, []);

  useEffect(() => {
    // fetch("/commands.json")
    fetch(`${import.meta.env.BASE_URL}commands.json`)
      .then((res) => res.json())
      .then((data) => setCommands(data.commands || []))
      .catch(() => console.error("Failed to load commands.json"));
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("chatHistory");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(history));
    scrollToBottom();
  }, [history]);

  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const findCommandByQuery = (query) => {
    if (!query || !commands) return null;
    const q = query.toLowerCase().trim();

    for (const cmd of commands) {
      for (const trig of cmd.triggers || []) {
        if (q === trig.toLowerCase()) return cmd;
      }
    }

    const suggestions = commands
      .flatMap((cmd) => cmd.triggers)
      .filter((t) => t.toLowerCase().includes(q.split(" ")[0]));

    if (suggestions.length > 0) return { id: "suggestions", suggestions };
    return null;
  };

  // ✅ Handle “Yes” + Command not found + Slack link
  const handleSend = (customQuery) => {
    const input = customQuery || query.trim();
    if (!input) return;

    let newHistory = [...history, { role: "user", text: input }];
    const lastMsg = history[history.length - 1];

    // Handle user saying "yes" after a suggestion
    if (
      lastMsg &&
      lastMsg.suggestions &&
      /^(yes|yeah|yep|sure|ok)$/i.test(input)
    ) {
      const firstSuggestion = lastMsg.suggestions[0];
      if (firstSuggestion) {
        newHistory.push({
          role: "bot",
          text: `Got it! Fetching results for: "${firstSuggestion}"...`,
        });
        setHistory(newHistory);
        setQuery("");
        setTimeout(() => handleSend(firstSuggestion), 800);
        return;
      }
    }

    const cmd = findCommandByQuery(input);

    if (cmd) {
      if (cmd.suggestions)
        newHistory.push({ role: "bot", suggestions: cmd.suggestions });
      else newHistory.push({ role: "bot", text: cmd.answer });
    } else {
      const suggestions = commands
        .flatMap((cmd) => cmd.triggers)
        .filter((t) => t.toLowerCase().includes(input.split(" ")[0]));

      if (suggestions.length > 0) {
        newHistory.push({ role: "bot", suggestions });
      } else {
        // ⚠️ Custom “Command not found” with Slack link
        newHistory.push({
          role: "bot",
          text: `⚠️ Command not found.<br><br>
          💬 Need help? <a href="https://slack.com/creator-sumanth" target="_blank" rel="noopener noreferrer" style="color:#1677ff;text-decoration:underline;">Connect with the creator on Slack</a>.`,
        });
      }
    }

    setHistory(newHistory);
    setQuery("");
  };

  const clearChat = () => {
    setHistory([]);
    localStorage.removeItem("chatHistory");
  };

  const theme = darkMode ? themeConfig.dark : themeConfig.light;

  return (
    <Layout
      style={{
        minHeight: "100vh",
        background: darkMode ? "#000000" : "#ffffff",
        transition: "background 0.3s ease",
      }}
    >
      {/* Sidebar */}
      {!collapsed && (
        <Sider
          width={220}
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 0,
            overflow: "hidden",
            background: "none",
          }}
        >
          {/* Background Image */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "url('/PromptNext/sidebar-bg.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              filter: darkMode ? "brightness(0.6)" : "brightness(0.9)",
              zIndex: 0,
            }}
          />
          {/* Overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: darkMode
                ? "rgba(0,0,0,0.4)"
                : "rgba(255,255,255,0.4)",
              backdropFilter: "blur(2px)",
              zIndex: 1,
            }}
          />
          {/* Sidebar content */}
          <div
            style={{
              position: "relative",
              zIndex: 2,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "24px 12px",
              color: darkMode ? "#fff" : "#000",
            }}
          >
            {/* Logo */}
            <div
              style={{
                textAlign: "center",
                position: "relative",
                display: "inline-block",
              }}
            >
              <img
                src={
                  darkMode ? "/promptnext-light.png" : "/promptnext-light.png"
                }
                alt="PromptNext Logo"
                style={{
                  height: 60,
                  objectFit: "contain",
                  marginBottom: 10,
                  cursor: "pointer",
                }}
                className="promptnect-logo"
              />
              <span className="promptnect-tooltip">PromptNext</span>

              <style>
                {`
                  .promptnect-tooltip {
                    visibility: hidden;
                    opacity: 0;
                    background: #5160E3;
                    color: white;
                    text-align: center;
                    border-radius: 8px;
                    padding: 6px 10px;
                    position: absolute;
                    z-index: 10;
                    bottom: 80%;
                    left: 50%;
                    transform: translateX(-50%) translateY(10px);
                    white-space: nowrap;
                    font-size: 0.85rem;
                    pointer-events: none;
                    transition: opacity 0.3s ease, transform 0.3s ease;
                  }

                  /* Hover trigger */
                  .promptnect-logo:hover + .promptnect-tooltip {
                    visibility: visible;
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                    animation: PromptNect 1.2s ease-in-out infinite;
                  }

                  /* Unique tooltip animation */
                  @keyframes PromptNect {
                    0%   { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; }
                    25%  { transform: translateX(-50%) translateY(-3px) scale(1.05); opacity: 0.95; }
                    50%  { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; }
                    75%  { transform: translateX(-50%) translateY(3px) scale(1.05); opacity: 0.95; }
                    100% { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; }
                  }
                `}
              </style>
            </div>

            {/* Welcome Text */}
            <div
              style={{
                textAlign: "left",
                fontWeight: "bold",
                lineHeight: 1.4,
                padding: "20px 10px",
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: darkMode ? "#fff" : "#000",
                }}
              >
                Welcome to{" "}
                <span
                  style={{
                    fontSize: 24,
                    color: "#5160E3",
                    letterSpacing: "1.5px",
                  }}
                >
                  PromptNext
                </span>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: "500",
                  color: darkMode ? "#cbd5e1" : "#1f2937",
                  marginTop: 6,
                }}
              >
                Work smarter, together.
              </div>
            </div>

            {/* Footer Updated */}

            <div
              style={{
                textAlign: "center",
                fontSize: 12,
                color: darkMode ? "#e2e8f0" : "#1b1b1b",
                paddingBottom: 12,
                lineHeight: "1.5",
              }}
            >
              Designed & developed by{" "}
              <strong>
                <br />
                Sumanth Sanathi
              </strong>{" "}
              using <strong>AI</strong>
            </div>
          </div>
        </Sider>
      )}

      {/* Main Chat Area */}
      <Layout
        style={{
          marginLeft: collapsed ? 0 : 220,
          transition: "margin-left 0.3s ease",
          background: darkMode ? "#000000" : "#ffffff",
        }}
      >
        <Content
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            background: darkMode ? "#000000" : "#ffffff",
            color: theme.textBot,
            padding: "20px",
            position: "relative",
            transition: "all 0.3s ease",
          }}
        >
          {/* Controls Top Right */}
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              display: "flex",
              alignItems: "center",
              gap: "16px",
              background: darkMode
                ? "rgba(30,30,30,0.6)"
                : "rgba(255,255,255,0.6)",
              borderRadius: "30px",
              padding: "8px 16px",
              boxShadow: darkMode
                ? "0 0 6px rgba(255,255,255,0.1)"
                : "0 0 6px rgba(0,0,0,0.1)",
              backdropFilter: "blur(4px)",
              zIndex: 1000,
            }}
          >
            <Tooltip title={collapsed ? "Open sidebar" : "Close sidebar"}>
              <Button
                shape="circle"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
              />
            </Tooltip>

            <Tooltip title="Switch dark/light mode">
              <Switch
                checked={darkMode}
                onChange={(checked) = > setDarkMode(checked)}
                style={{
                  backgroundColor: darkMode ? "#1677ff" : "#d9d9d9",
                }}
              />
            </Tooltip>
          </div>

          {/* Chat Section */}
          <div
            style={{
              width: "100%",
              maxWidth: "800px",
              height: "90vh",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              background: darkMode ? "#000000" : "#ffffff",
              borderRadius: "12px",
              padding: "0",
              color: theme.textBot,
              boxShadow: "none",
              transition: "background 0.3s ease, color 0.3s ease",
            }}
          >
            {/* Hero */}
            {/* Hero Section with suggestions restored */}
            <div style={{ textAlign: "center", padding: "24px 16px 8px" }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: "22px",
                  fontWeight: "600",
                  color: darkMode ? "#f1f5f9" : "#1f2937",
                }}
              >
                Hello 👋 there! Welcome to PromptNext - Work smarter, together.
              </h2>
              <p
                style={{
                  margin: "8px 0",
                  fontSize: "16px",
                  color: darkMode ? "#cbd5e1" : "#555",
                }}
              >
                How can I assist you today?
              </p>

              {/* Suggestion Buttons */}
              <div
                style={{
                  marginTop: "16px",
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: "12px",
                }}
              >
                {[
                  "Bring the absence report",
                  // "Access Jenkins job for deployment",
                  // "Show current sprint status",
                  // "Check today's attendance",
                  "Apply for leave",
                  // "List open Jira tickets",
                  // "Show automation test results",
                  // "Fetch build logs from Jenkins",
                  "Update daily standup summary",
                ].map((sug, i) => (
                  <Button
                    key={i}
                    onClick={() => handleSend(sug)}
                    style={{
                      borderRadius: "20px",
                      padding: "6px 16px",
                      fontSize: "12px",
                      backgroundColor: darkMode ? "#1a1a1a" : "#f5f5f5",
                      border: "1px solid #444",
                      color: darkMode ? "#e2e8f0" : "#333",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = darkMode
                        ? "#333"
                        : "#e6f0ff")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = darkMode
                        ? "#1a1a1a"
                        : "#f5f5f5")
                    }
                  >
                    {sug}
                  </Button>
                ))}
              </div>
            </div>

            {/* Chat History */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {history.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent:
                      msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      background:
                        msg.role === "user"
                          ? theme.bubbleUser
                          : theme.bubbleBot,
                      color:
                        msg.role === "user" ? theme.textUser : theme.textBot,
                      padding: "12px 16px",
                      borderRadius: "12px",
                      maxWidth: "80%",
                      fontSize: "14px",
                      lineHeight: "1.4",
                      position: "relative",
                      paddingRight: "40px",
                      wordBreak: "break-word",
                    }}
                  >
                    {msg.role === "bot" ? (
                      <>
                        <ResponseRenderer
                          msg={msg}
                          onSuggestionClick={(sug) => handleSend(sug)}
                          theme={theme}
                        />
                        <Button
                          type="text"
                          size="small"
                          icon={<CopyOutlined />}
                          onClick={() => {
                            navigator.clipboard.writeText(
                              msg.text || (msg.suggestions || []).join(", ")
                            );
                            message.success("Copied!");
                          }}
                          style={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            color: theme.textBot,
                            background: "transparent",
                          }}
                        />
                      </>
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div
              style={{
                padding: "10px",
                borderTop: `1px solid ${darkMode ? "#333" : "#ddd"}`,
                display: "flex",
                gap: "8px",
                background: darkMode ? "#000000" : "#ffffff",
              }}
            >
              <Input
                placeholder="Type your command..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onPressEnter={() => handleSend()}
                style={{
                  flex: 1,
                  fontSize: "14px",
                  padding: "4px 10px",
                  background: darkMode ? "#1a1a1a" : "#ffffff",
                  color: theme.textBot,
                  border: "1px solid #444",
                  borderRadius: "8px",
                }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={() => handleSend()}
                style={{
                  backgroundColor: theme.buttonPrimary,
                  height: "36px",
                  borderRadius: "8px",
                }}
              />
              <Button
                type="primary"
                danger
                shape="circle"
                icon={<DeleteOutlined />}
                onClick={clearChat}
                style={{
                  backgroundColor: theme.buttonDanger,
                  height: "36px",
                  width: "36px",
                }}
              />
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
