import { useState } from "react";
import axios from "axios";

function Chat() {
  const [file, setFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
const user_id = localStorage.getItem("user_id")  // Get user_id from local storage or set default
console.log(user_id); // Log the user_id for debugging

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Function to handle file upload
  const uploadFile = () => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }
    const filedata = new FormData();
    filedata.append("file", file);
    filedata.append("user_id", user_id); // Replace 1 with the actual user_id (e.g., from localStorage or global state)
    console.log(filedata); // Log the file data for debugging
    
    setLoading(true); // Set loading state to true while uploading
    axios
      .post("http://localhost:8000/upload", 
        filedata  
      )
      .then((response) => {
        console.log("Successfully uploaded file");
        setFileContent(response.data); // Set the file content from the server response
        setMessages((prevMessages) => [
          ...prevMessages,
          { role: "system", content: "File uploaded successfully!" },
        ]);
        setLoading(false); // Set loading state to false after response
      })
      .catch((e) => {
        console.log("Error while uploading file data", e);
        setLoading(false); // Set loading state to false in case of error
      });
  };

  // Function to handle query input and response
  const handleQuery = () => {
    if (!query) {
      alert("Please enter a query.");
      return;
    }
    setLoading(true); // Set loading state to true while fetching response

    // Add user message to the messages array
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "user", content: query },
    ]);
    axios
      .post("http://localhost:8000/query", { query, user_id })
      .then((response) => {
        const aiResponse = response.data.text || response.data;
        setMessages((prevMessages) => [
          ...prevMessages,
          { role: "ai", content: aiResponse },
        ]);
        setResponse(aiResponse); // Set the query response
        setLoading(false); // Set loading state to false after response
      })
      .catch((e) => {
        console.log("Error while querying data", e.response.data);
        setError(e.response.data); // Set error state
        setLoading(false); // Set loading state to false in case of error
      });

    setQuery(""); // Clear the query input field
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
        <h1 className="text-4xl font-lead text-center text-white py-2">Chat With Your Data</h1>
      <div className="w-full max-w-4xl bg-slate-600 shadow-lg rounded-xl overflow-hidden">
        {/* Chat Messages Section */}
        <div
          className="p-6 overflow-auto h-96"
          style={{ scrollBehavior: "smooth" }}
        >
          <div className="space-y-4">
            {/* Map over messages to display them */}
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`${
                  msg.role === "user" ? "text-right" : "text-left"
                }`}
              >
                <div
                  className={`${
                    msg.role === "user" ? "bg-blue-500 text-white" : "bg-blue-500 text-white"
                  } p-3 rounded-lg inline-block max-w-md`}
                >
                  <p>{msg.content}</p>
                </div>
              </div>
            ))}
            {
                error && (
                    <div className="text-red-500 text-center mt-4">
                    {error}
                    </div>
                )
                }
            
          </div>
        </div>

        {/* User Input Section */}
        <div className="p-6 bg-slate-400 flex items-cente text-3xl text-black">
          <input
            type="text"
            placeholder="Enter your query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleQuery}
            className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 cursor-pointer"
            disabled={loading}
          >
            {loading ? "Loading..." : "Send"}
          </button>
        </div>

        {/* File Upload Section */}
        <div className="p-6 bg-slate-400  flex items-center text-white">
          <input
            type="file"
            onChange={handleFileChange}
            className="mr-4 p-2 border rounded-lg bg-gray-400 cursor-pointer"
          />
          <button
            onClick={uploadFile}
            className="px-4 py-2 bg-black text-white rounded-lg  hover:text-yellow-500 disabled:opacity-50 cursor-pointer"
            disabled={loading}
          >
            {loading ? "Uploading..." : "Upload File"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;
