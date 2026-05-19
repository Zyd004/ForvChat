import { useState, useEffect } from "react";
import "./App.css";

const API = "http://127.0.0.1:8000";

function App() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadFiles = async () => {
    const res = await fetch(`${API}/files`);
    const data = await res.json();
    setFiles(data.files);
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    await fetch(`${API}/upload`, {
      method: "POST",
      body: formData,
    });

    loadFiles();
  };

  const removeFile = async (filename) => {
    await fetch(`${API}/files/${filename}`, {
      method: "DELETE",
    });

    loadFiles();
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    setLoading(true);
    setResponse("");

    const res = await fetch(`${API}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      const chunk = decoder.decode(value);

      setResponse((prev) => prev + chunk);
    }

    setLoading(false);
  };

  return (
    <div className="app">

      <div className="sidebar">
        <h2>FORVCHAT</h2>

        <label className="upload-btn">
          Upload File
          <input type="file" onChange={handleUpload} hidden />
        </label>

        <div className="files">
          <h3>Workspace Files</h3>

          {files.map((file, index) => (
            <div className="file-item" key={index}>
              <span>{file}</span>

              <button onClick={() => removeFile(file)}>
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-container">

        <div className="chat-header">
          <h1>Codebase Files AI Assistant</h1>
        </div>

        <div className="response-box">
          <pre>{response}</pre>
        </div>

        <div className="input-area">
          <textarea
            placeholder="Ask Aider to modify your project..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <button onClick={sendMessage} disabled={loading}>
            {loading ? "Running..." : "Send"}
          </button>
        </div>

      </div>

    </div>
  );
}

export default App;