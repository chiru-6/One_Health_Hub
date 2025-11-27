import React, { useState, useEffect } from 'react';
import { Plus, Clock, X, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, isAfter, isBefore, addMinutes } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

function PillTracking() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [medications, setMedications] = useState([]);
  const [upcomingMedications, setUpcomingMedications] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    timings: [{ time: '', taken: false }],
    beforeFood: true,
    description: '',
    startDate: '',
    endDate: ''
  });

  // ... existing code ...

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Medication Tracking</h2>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Medication
            </button>
          </div>

          {/* Upcoming Medications Section */}
          {upcomingMedications.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Upcoming Medications</h3>
              <div className="space-y-2">
                {upcomingMedications.map(med => (
                  <div key={med._id} className="flex items-center justify-between p-2 bg-white rounded-md shadow-sm">
                    <div>
                      <p className="font-medium">{med.pillName}</p>
                      <p className="text-sm text-gray-600">
                        {med.dosage} at {med.timings.map(t => formatTime(t.time)).join(', ')}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleTaken(med._id, med.timings[0]._id)}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
                    >
                      Mark as Taken
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medication List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {medications && medications.length > 0 ? (
              medications.map(med => (
                <div key={med._id} className="bg-white rounded-lg shadow-md p-4 mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{med.pillName}</h3>
                      <p className="text-gray-600">{med.dosage}</p>
                      <p className="text-gray-600">Take {med.foodTiming} food</p>
                      <div className="mt-2">
                        {med.timings && med.timings.length > 0 ? (
                          med.timings.map((timing, index) => (
                            <div key={index} className="flex items-center justify-between mb-2">
                              <p className="text-gray-600">Time: {formatTime(timing.time)}</p>
                              <button
                                onClick={() => toggleTaken(med._id, timing._id)}
                                className={`px-3 py-1 rounded-md ${
                                  timing.taken
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {timing.taken ? 'Taken' : 'Mark as Taken'}
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500">No timings set</p>
                        )}
                      </div>
                      {med.description && <p className="text-gray-600">{med.description}</p>}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => deleteMedication(med._id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">No medications found. Add your first medication!</p>
              </div>
            )}
          </div>

          {/* Add Medication Form */}
          {showAddForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-semibold mb-4">Add New Medication</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medication Name
                    </label>
                    <input
                      type="text"
                      value={newMedication.name}
                      onChange={(e) =>
                        setNewMedication({ ...newMedication, name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dosage
                    </label>
                    <input
                      type="text"
                      value={newMedication.dosage}
                      onChange={(e) =>
                        setNewMedication({ ...newMedication, dosage: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timings
                    </label>
                    {newMedication.timings.map((timing, index) => (
                      <div key={index} className="flex items-center space-x-2 mb-2">
                        <input
                          type="time"
                          value={timing.time}
                          onChange={(e) => handleTimeChange(index, e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => removeTiming(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={20} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addTiming}
                      className="mt-2 text-blue-600 hover:text-blue-800"
                    >
                      + Add Another Time
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="date"
                        value={newMedication.startDate}
                        onChange={(e) =>
                          setNewMedication({ ...newMedication, startDate: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="date"
                        value={newMedication.endDate}
                        onChange={(e) =>
                          setNewMedication({ ...newMedication, endDate: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Food Timing
                    </label>
                    <select
                      value={newMedication.beforeFood}
                      onChange={(e) =>
                        setNewMedication({
                          ...newMedication,
                          beforeFood: e.target.value === 'true'
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="true">Before Food</option>
                      <option value="false">After Food</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Notes
                    </label>
                    <textarea
                      value={newMedication.description}
                      onChange={(e) =>
                        setNewMedication({
                          ...newMedication,
                          description: e.target.value
                        })
                      }
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addMedication}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Add Medication
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PillTracking; 