"use client"
import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import * as XLSX from "xlsx";
import { AlertCircle, Upload } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function UploadExcelPage() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    setSelectedFile(file);
    setError("");
  };

  const validateData = (data) => {
    return data.every(row => 
      row.id && 
      row.name && 
      row.mobile && 
      row.email &&
      typeof row.id === 'string' || typeof row.id === 'number'
    );
  };

  const uploadData = async () => {
    if (!selectedFile) {
      setError("Please upload an Excel file.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      // First parse the Excel file
      const reader = new FileReader();
      
      const parseResult = await new Promise((resolve, reject) => {
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) {
              reject(new Error("The Excel file is empty."));
              return;
            }

            if (!validateData(jsonData)) {
              reject(new Error("Invalid data format. Please ensure all records have id, name, mobile, and email fields."));
              return;
            }

            resolve(jsonData);
          } catch (err) {
            reject(new Error("Failed to parse Excel file. Please check the file format."));
          }
        };

        reader.onerror = () => {
          reject(new Error("Failed to read the file."));
        };

        reader.readAsArrayBuffer(selectedFile);
      });

      // Then upload the parsed data
      const response = await fetch("http://localhost:8000/customers/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parseResult),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload customer data");
      }

      setSelectedFile(null);
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";
      
      alert("Customer data uploaded successfully!");
    } catch (err) {
      setError(err.message || "An error occurred during the process");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto font-sans">
      <h1 className="text-2xl font-bold text-center mb-6">Upload Excel File</h1>
      
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            onChange={handleFileChange}
            className="border p-2 rounded"
            disabled={uploading}
          />
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <Button
          onClick={uploadData}
          disabled={uploading || !selectedFile}
          className="flex items-center gap-2"
        >
          {uploading ? (
            "Processing..."
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload Data
            </>
          )}
        </Button>
      </div>
    </div>
  );
}