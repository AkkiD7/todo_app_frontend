import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashAlt, faEdit } from "@fortawesome/free-solid-svg-icons";

const getTimestampFromId = (id) => {
  const timestamp = parseInt(id.substring(0, 8), 16) * 1000;
  return new Date(timestamp);
};

const formatTime = (date) => {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDate = (date) => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const API_URL = "https://todo-app-backend-akki.vercel.app/todos";

const TodoPage = () => {
  const [todos, setTodos] = useState([]);
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editTodo, setEditTodo] = useState(null);

  const refreshTodos = useCallback(async () => {
    try {
      const response = filter
        ? await axios.get(`${API_URL}/filter?status=${filter}`)
        : await axios.get(API_URL);

      
      const sortedTodos = response.data.sort((a, b) => {
        const dateA = getTimestampFromId(a._id);
        const dateB = getTimestampFromId(b._id);
        return dateB - dateA; 
      });

      setTodos(sortedTodos);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to fetch todos");
    }
  }, [filter]);

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError("Task description cannot be empty");
      return;
    }

    try {
      await axios.post(API_URL, { description, status: "pending" });
      resetForm();
      refreshTodos();
    } catch (err) {
      console.error(err);
      setError("Failed to add todo");
    }
  };

  const handleEditTodo = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError("Task description cannot be empty");
      return;
    }

    try {
      await axios.put(`${API_URL}/${editTodo._id}`, { description });
      resetForm();
      refreshTodos();
    } catch (err) {
      console.error(err);
      setError("Failed to update todo");
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("file", file);

    try {
      if (file) {
        const response = await axios.post(`${API_URL}/upload`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        console.log("File uploaded successfully:", response.data);
        setFile(null);
        setShowUploadModal(false);
        refreshTodos();
      } else {
        setError("No file selected.");
      }
    } catch (err) {
      console.error(
        "File upload error:",
        err.response ? err.response.data : err.message
      );
      setError("Failed to upload file");
    }
  };

  const handleDownload = async () => {
    try {
      const response = await axios.get(`${API_URL}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "todos.csv");
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error(err);
      setError("Failed to download todos");
    }
  };

  const handleStatusChange = async (todo) => {
    try {
      await axios.put(`${API_URL}/${todo._id}`, {
        ...todo,
        status: todo.status === "pending" ? "completed" : "pending",
      });
      refreshTodos();
    } catch (err) {
      console.error(err);
      setError("Failed to update todo status");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      refreshTodos();
    } catch (err) {
      console.error(err);
      setError("Failed to delete todo");
    }
  };

  const resetForm = () => {
    setDescription("");
    setEditTodo(null);
    setShowAddTaskForm(false);
    setError("");
  };

  useEffect(() => {
    refreshTodos();
  }, [filter, refreshTodos]);

  return (
    <div className="container mx-auto p-6 lg:p-32">
      <h1 className="text-2xl lg:text-3xl font-bold text-gray-700 mb-4 w-full text-center">
        Todo List
      </h1>

      <div className="flex flex-col lg:flex-row justify-between items-center mb-4">
        <button
          onClick={() => setShowAddTaskForm(true)}
          className="p-2 bg-[#626ff1] text-white rounded mb-2 lg:mb-0 lg:w-auto w-full"
        >
          Add Task
        </button>
        <select
          onChange={(e) => setFilter(e.target.value)}
          className="p-2 border rounded w-full lg:w-auto"
          value={filter}
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div
        className="mb-4 p-4"
        style={{ backgroundColor: "#ececf8" }}
      >
        {todos.length === 0 ? (
          <p className="text-center text-gray-500">No tasks to show here</p>
        ) : (
          todos.map((todo) => (
            <div
              key={todo._id}
              className="flex flex-col p-4 border rounded mb-2 bg-white"
            >
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={todo.status === "completed"}
                  onChange={() => handleStatusChange(todo)}
                  className="mr-2"
                />
                <span
                  className={`flex-1 ${
                    todo.status === "completed" ? "line-through" : ""
                  }`}
                >
                  {todo.description}
                </span>
                <button
                  onClick={() => {
                    setEditTodo(todo);
                    setDescription(todo.description);
                    setShowAddTaskForm(true);
                  }}
                  className="p-1 bg-[#ECECF8] text-black rounded ml-2"
                >
                  <FontAwesomeIcon icon={faEdit} />
                </button>
                <button
                  onClick={() => handleDelete(todo._id)}
                  className="p-1 bg-[#ECECF8] text-black rounded ml-2"
                >
                  <FontAwesomeIcon icon={faTrashAlt} />
                </button>
              </div>
              <span className="text-gray-500 text-sm">
                {formatTime(getTimestampFromId(todo._id))},{" "}
                {formatDate(getTimestampFromId(todo._id))}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col lg:flex-row justify-between mb-4">
        <button
          onClick={() => setShowUploadModal(true)}
          className="p-2 bg-[#626ff1] text-white rounded mb-2 lg:mb-0 lg:w-auto w-full"
        >
          Upload CSV
        </button>
        <button
          onClick={handleDownload}
          className="p-2 bg-[#626ff1] text-white rounded w-full lg:w-auto"
        >
          Download CSV
        </button>
      </div>

      {error && <p className="text-red-500 text-center mb-4">{error}</p>}

      {showAddTaskForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 lg:w-96">
            <h2 className="text-xl font-semibold mb-4">
              {editTodo ? "Edit Task" : "Add New Task"}
            </h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <form onSubmit={editTodo ? handleEditTodo : handleAddTodo}>
              <input
                type="text"
                className="p-2 border border-gray-300 rounded w-full mb-4"
                placeholder="Task description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="p-2 bg-[#626ff1] text-white rounded mr-2"
                >
                  {editTodo ? "Save Changes" : "Add Task"}
                </button>
                <button
                  type="button"
                  onClick={() => resetForm()}
                  className="p-2 bg-gray-300 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 lg:w-96">
            <h2 className="text-xl font-semibold mb-4">Upload CSV</h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <form onSubmit={handleFileUpload}>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files[0])}
                className="p-2 border border-gray-300 rounded w-full mb-4"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="p-2 bg-[#626ff1] text-white rounded mr-2"
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setError("");
                  }}
                  className="p-2 bg-gray-300 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoPage;
