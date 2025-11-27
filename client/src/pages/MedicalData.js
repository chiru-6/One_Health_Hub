import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Folder, File, Plus, X, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Configure axios with base URL
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true
});

// Add the server base URL for static files
const SERVER_BASE_URL = 'http://localhost:5000';

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

function MedicalData() {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [showNewHospitalForm, setShowNewHospitalForm] = useState(false);
  const [newHospitalName, setNewHospitalName] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState('');

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch hospitals on component mount
  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/medical/user/me');
      setHospitals(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      toast.error('Failed to fetch hospitals');
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedHospital || !selectedFiles.length) return;

    try {
      setLoading(true);
      console.log('Starting file upload:', {
        hospitalId: selectedHospital._id,
        fileCount: selectedFiles.length,
        files: selectedFiles.map(f => ({
          name: f.name,
          type: f.type,
          size: f.size
        }))
      });

      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('files', file);
        console.log('Added file to FormData:', {
          name: file.name,
          type: file.type,
          size: file.size
        });
      });

      // Use fetch with proper headers
      const response = await fetch(`${SERVER_BASE_URL}/api/medical/${selectedHospital._id}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      console.log('Upload response status:', response.status);
      const data = await response.json();
      console.log('Upload response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload files');
      }

      // Update the selected hospital with new files
      setSelectedHospital((prev) => ({
        ...prev,
        files: [...prev.files, ...data.files],
      }));

      // Update the hospitals list
      setHospitals(prevHospitals =>
        prevHospitals.map(hospital =>
          hospital._id === selectedHospital._id
            ? { ...hospital, files: [...hospital.files, ...data.files] }
            : hospital
        )
      );

      // Clear selected files and show success message
      setSelectedFiles([]);
      toast.success('Files uploaded successfully!');
      console.log('File upload completed successfully');
    } catch (error) {
      console.error('File upload error:', {
        error: error,
        message: error.message,
        stack: error.stack
      });
      toast.error(error.message || 'Failed to upload files');
      setError(error.message || 'Failed to upload files');
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      console.log('Files dropped:', acceptedFiles);
      setSelectedFiles(acceptedFiles);
      if (acceptedFiles.length > 0) {
        toast.success(`${acceptedFiles.length} file(s) selected`);
      }
    },
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
    onDropRejected: (rejectedFiles) => {
      console.log('Files rejected:', rejectedFiles);
      rejectedFiles.forEach(({ file, errors }) => {
        if (errors[0]?.code === 'file-too-large') {
          toast.error(`${file.name} is too large. Max size is 10MB`);
        } else if (errors[0]?.code === 'file-invalid-type') {
          toast.error(`${file.name} has an invalid file type`);
        } else {
          toast.error(`Error uploading ${file.name}`);
        }
      });
    }
  });

  const addNewHospital = async () => {
    if (newHospitalName.trim()) {
      try {
        setLoading(true);
        console.log('Adding new hospital:', newHospitalName);
        
        const response = await api.post('/medical/hospital', {
          hospitalName: newHospitalName,
          reportDate: new Date().toISOString(),
          description: 'New hospital record'
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('Hospital added successfully:', response.data);
        
        await fetchHospitals(); // Refresh the hospitals list
        setNewHospitalName('');
        setShowNewHospitalForm(false);
        toast.success('Hospital added successfully!');
      } catch (error) {
        console.error('Error adding hospital:', error);
        toast.error(error.response?.data?.message || 'Failed to add hospital');
      } finally {
        setLoading(false);
      }
    }
  };

  const deleteFile = async (hospitalId, fileIndex) => {
    try {
      setLoading(true);
      console.log('Deleting file:', { hospitalId, fileIndex });
      
      await api.delete(`/medical/${hospitalId}/files/${fileIndex}`);
      
      // Update the hospitals state
      setHospitals(prevHospitals => 
        prevHospitals.map(hospital => {
          if (hospital._id === hospitalId) {
            const updatedFiles = [...hospital.files];
            updatedFiles.splice(fileIndex, 1);
            return { ...hospital, files: updatedFiles };
          }
          return hospital;
        })
      );

      // Update selected hospital if it's the one being modified
      setSelectedHospital(prev => {
        if (prev._id === hospitalId) {
          const updatedFiles = [...prev.files];
          updatedFiles.splice(fileIndex, 1);
          return { ...prev, files: updatedFiles };
        }
        return prev;
      });

      toast.success('File deleted successfully!');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file) => {
    try {
      console.log('Starting download for file:', file);
      
      // If we have a file ID, use it
      if (file._id) {
        const response = await api.get(`/medical/download/${file._id}`, {
          responseType: 'blob'
        });
        
        if (response.data) {
          const blob = new Blob([response.data], { type: file.mimetype || 'application/octet-stream' });
          const downloadUrl = window.URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = file.originalname;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(downloadUrl);
          
          toast.success(`Downloading ${file.originalname}`);
          return;
        }
      }
      
      // Fallback to direct URL if available
      if (file.url) {
        window.open(file.url, '_blank');
        toast.success(`Opening ${file.originalname} in new tab`);
        return;
      }
      
      throw new Error('No download information available');
    } catch (error) {
      console.error('Download error:', {
        error: error,
        file: file
      });
      toast.error(`Failed to download ${file.originalname}`);
    }
  };

  // Helper function to validate file content
  const validateFileContent = (blob, expectedType) => {
    return new Promise((resolve) => {
      if (expectedType.startsWith('image/')) {
        // Validate image
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = URL.createObjectURL(blob);
      } else if (expectedType === 'application/pdf') {
        // Validate PDF (check for PDF header magic number)
        const reader = new FileReader();
        reader.onload = (e) => {
          const arr = new Uint8Array(e.target.result).subarray(0, 4);
          const header = Array.from(arr).map(c => 
            c.toString(16).padStart(2, '0')
          ).join('');
          // Check for PDF magic number (%PDF)
          resolve(header.startsWith('25504446'));
        };
        reader.onerror = () => resolve(false);
        reader.readAsArrayBuffer(blob);
      } else {
        // For other types, assume valid
        resolve(true);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Medical Records</h2>
            <button
              onClick={() => setShowNewHospitalForm(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Hospital
            </button>
          </div>

          {showNewHospitalForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  value={newHospitalName}
                  onChange={(e) => setNewHospitalName(e.target.value)}
                  placeholder="Enter hospital name"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addNewHospital}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowNewHospitalForm(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="col-span-1 bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Hospitals</h3>
              <div className="space-y-2">
                {hospitals.map(hospital => (
                  <button
                    key={hospital._id}
                    onClick={() => setSelectedHospital(hospital)}
                    className={`w-full text-left px-4 py-2 rounded-md flex items-center ${
                      selectedHospital?._id === hospital._id
                        ? 'bg-blue-100 text-blue-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <Folder className="h-5 w-5 mr-2" />
                    {hospital.hospitalName}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-span-3">
              {selectedHospital ? (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {selectedHospital.name} - Records
                  </h3>
                  
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center ${
                      isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <p className="text-gray-600">
                      Drag & drop files here, or click to select files
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Supported formats: Images (PNG, JPG) and PDF
                    </p>
                  </div>

                  {selectedHospital.files.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Uploaded Files</h4>
                      <div className="space-y-2">
                        {selectedHospital.files.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                          >
                            <div className="flex items-center space-x-3">
                              {file.mimetype?.startsWith('image/') ? (
                                <ImageIcon className="h-5 w-5 text-blue-500" />
                              ) : (
                                <File className="h-5 w-5 text-gray-500" />
                              )}
                              <span className="text-sm text-gray-700">{file.originalname}</span>
                            </div>
                            
                            <div className="flex items-center">
                              <button
                                onClick={() => handleDownload(file)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200 flex items-center gap-2"
                                title="Download file"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                <span className="text-sm">Download</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  Select a hospital to view and manage records
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MedicalData;