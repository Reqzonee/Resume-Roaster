import React, { useState, useRef } from "react";
import axios from 'axios';
import '../styles.css'; // Import the CSS file

const DragDropFiles = () => {
  const [files, setFiles] = useState(null);
  const [roastText, setRoastText] = useState(null);
  const [loading, setLoading] = useState(false); // Add loading state
  const inputRef = useRef();

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setFiles(event.dataTransfer.files);
  };

  const handleUpload = async () => {
    setLoading(true); // Set loading to true when upload starts
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("Files", file);
    });

    try {
      const response = await axios.post(process.env.REACT_APP_BASE_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Upload response:', response.data);
      if (response.data && response.data.roast) {
        setRoastText(response.data.roast);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setLoading(false); // Set loading to false after response is received
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="item-container">
            <div className="custom-loader"></div>
          {/* <h2>Loading...</h2> Show loading indicator */}
        </div>
      </div>
    );
  }

  if (roastText) {
    return (
      <div className="container">
        <div className="item-container">
          <h2>Your Royal Roast Awaits!</h2>
          <p>{roastText}</p>
          <button onClick={() => setRoastText(null)}>
            Clear Roast
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" onDragOver={handleDragOver} onDrop={handleDrop}>
      <div className="item-container dropzone">
        <h1>Resume Roaster</h1>
        <h1>Prepare for Roast😉</h1>
        <input 
          type="file"
          multiple
          onChange={(event) => setFiles(event.target.files)}
          hidden
          accept="application/pdf, image/png, image/jpeg"
          ref={inputRef}
        />
        <button onClick={() => inputRef.current.click()}>
          Select Files
        </button>
        {files && (
          <div className="actions">
            <button onClick={() => setFiles(null)}>
              Cancel
            </button>
            <button onClick={handleUpload}>
              Upload
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DragDropFiles;
