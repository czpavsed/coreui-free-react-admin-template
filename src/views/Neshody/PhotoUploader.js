import React, { useState } from "react";
import axios from "axios";
import { CButton, CSpinner } from "@coreui/react";

const PhotoUploader = ({ zakaznikId, neshodaId, onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const API_ACCESS_KEY = import.meta.env.VITE_API_ACCESS_KEY;
  const API_BASE_URL = import.meta.env.VITE_API_API_URL;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file to upload.");
      return;
    }

    if (!zakaznikId || !neshodaId) {
      setError("ZakaznikId and NeshodaId are required.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setIsUploading(true);
      setError(null);

      const response = await axios.post(
        `${API_BASE_URL}upload-blob-storage?blobName=neshody/${zakaznikId}/${selectedFile.name}&neshodaId=${neshodaId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${API_ACCESS_KEY}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200 && response.data.url) {
        onUploadSuccess(response.data.url); // Informujeme rodičovský komponent o úspěšném uploadu
        setSelectedFile(null);
      } else {
        throw new Error(response.data.message || "Failed to upload the file.");
      }
    } catch (err) {
      console.error("Error uploading file:", err);
      setError("Failed to upload the file.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="photo-uploader">
      <input
        type="file"
        onChange={handleFileChange}
        disabled={isUploading}
        className="mb-2"
      />
      {selectedFile && (
        <div className="mb-2">
          <p><strong>Vybraná fotografie:</strong> {selectedFile.name}</p>
          <img
            src={URL.createObjectURL(selectedFile)}
            alt="Náhled"
            style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'cover' }}
          />
        </div>
      )}
      <CButton
        color="primary"
        onClick={handleUpload}
        disabled={isUploading || !selectedFile}
      >
        {isUploading ? <CSpinner size="sm" /> : "Nahrát fotografii"}
      </CButton>
      {error && <p className="text-danger mt-2">{error}</p>}
    </div>
  );
};

export default PhotoUploader;
