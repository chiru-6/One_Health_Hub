import React, { useState, useEffect } from 'react';
import { Plus, Clock, X, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, isAfter, isBefore, addMinutes, startOfDay, isSameDay } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import MedicationCalendar from '../components/MedicationCalendar';

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

  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString;
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }
    if (user) {
      fetchMedications();
      const interval = setInterval(checkUpcomingMedications, 60000);
      return () => clearInterval(interval);
    }
  }, [user, loading, navigate]);

  const fetchMedications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/medication/user/${user.id}/active`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch medications');
      }

      const data = await response.json();
      setMedications(data || []);
    } catch (error) {
      console.error('Error fetching medications:', error);
      toast.error('Failed to fetch medications');
      setMedications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const checkUpcomingMedications = () => {
    const now = new Date();
    const fifteenMinutesFromNow = addMinutes(now, 15);
    const today = startOfDay(now);

    const upcoming = medications.filter((med) => {
      if (med.status !== 'active') return false;

      return med.timings.some(timing => {
        const [hours, minutes] = timing.time.split(':');
        const medTime = new Date();
        medTime.setHours(parseInt(hours, 10));
        medTime.setMinutes(parseInt(minutes, 10));

        const isTakenToday = timing.takenDates?.some(date => 
          startOfDay(new Date(date)).getTime() === today.getTime()
        );

        return !isTakenToday && isAfter(medTime, now) && isBefore(medTime, fifteenMinutesFromNow);
      });
    });

    setUpcomingMedications(upcoming);

    upcoming.forEach((med) => {
      med.timings.forEach(timing => {
        const [hours, minutes] = timing.time.split(':');
        const medTime = new Date();
        medTime.setHours(parseInt(hours, 10));
        medTime.setMinutes(parseInt(minutes, 10));

        if (isAfter(medTime, now) && isBefore(medTime, fifteenMinutesFromNow)) {
          toast(
            <div className="flex items-center">
              <Bell className="h-5 w-5 mr-2 text-blue-500" />
              <div>
                <p className="font-medium">Time to take medication!</p>
                <p className="text-sm">
                  {med.pillName} ({med.dosage}) at {formatTime(timing.time)}
                </p>
              </div>
            </div>,
            {
              duration: 10000,
              position: 'top-right',
            }
          );
        }
      });
    });
  };

  const handleTimeChange = (index, value) => {
    const newTimings = [...newMedication.timings];
    newTimings[index] = { ...newTimings[index], time: value };
    setNewMedication({ ...newMedication, timings: newTimings });
  };

  const addTiming = () => {
    setNewMedication({
      ...newMedication,
      timings: [...newMedication.timings, { time: '', taken: false }]
    });
  };

  const removeTiming = (index) => {
    if (newMedication.timings.length > 1) {
      const newTimings = newMedication.timings.filter((_, i) => i !== index);
      setNewMedication({ ...newMedication, timings: newTimings });
    }
  };

  const addMedication = async () => {
    try {
      if (!user) {
        toast.error('Please log in to add medications');
        navigate('/login');
        return;
      }

      if (!newMedication.name || newMedication.timings.some(t => !t.time)) {
        toast.error('Please fill in all required fields');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/medication`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pillName: newMedication.name,
          dosage: newMedication.dosage,
          timings: newMedication.timings,
          frequency: 'daily',
          startDate: newMedication.startDate || new Date(),
          endDate: newMedication.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          description: newMedication.description,
          foodTiming: newMedication.beforeFood ? 'before' : 'after',
          userId: user.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add medication');
      }

      const data = await response.json();
      setMedications([...medications, data]);
      setNewMedication({
        name: '',
        dosage: '',
        timings: [{ time: '', taken: false }],
        beforeFood: true,
        description: '',
        startDate: '',
        endDate: ''
      });
      setShowAddForm(false);
      toast.success('Medication added successfully!');
    } catch (error) {
      console.error('Error adding medication:', error);
      toast.error(error.message || 'Failed to add medication');
    }
  };

  const toggleTakenForDate = async (medicationId, timingId, date) => {
    try {
      const response = await fetch(`${API_BASE_URL}/medication/${medicationId}/timing/${timingId}/taken`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: startOfDay(date).toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update medication status');
      }

      const updatedMedication = await response.json();
      
      // Update the medications state with the new data
      setMedications(prevMedications => 
        prevMedications.map(med => {
          if (med._id === medicationId) {
            return {
              ...med,
              timings: med.timings.map(timing => {
                if (timing._id === timingId) {
                  const takenDates = timing.takenDates || [];
                  const dateExists = takenDates.some(d => isSameDay(new Date(d), date));
                  
                  return {
                    ...timing,
                    takenDates: dateExists 
                      ? takenDates.filter(d => !isSameDay(new Date(d), date))
                      : [...takenDates, date]
                  };
                }
                return timing;
              })
            };
          }
          return med;
        })
      );
      
      const timing = updatedMedication.timings.find(t => t._id === timingId);
      const timeStr = formatTime(timing.time);
      const dateStr = format(date, 'MMM d, yyyy');
      const isTaken = timing.takenDates?.some(d => isSameDay(new Date(d), date));
      
      toast.success(`${timeStr} dose ${isTaken ? 'marked as taken' : 'unmarked'} for ${dateStr}`);
    } catch (error) {
      console.error('Error updating medication status:', error);
      toast.error('Failed to update medication status');
    }
  };

  const deleteMedication = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/medication/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete medication');
      }

      setMedications(medications.filter((med) => med._id !== id));
      toast.success('Medication deleted successfully!');
    } catch (error) {
      console.error('Error deleting medication:', error);
      toast.error(error.message || 'Failed to delete medication');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

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

          {upcomingMedications.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Upcoming Medications</h3>
              <div className="space-y-2">
                {upcomingMedications.map((med) => (
                  <div key={med._id} className="flex items-center justify-between p-2 bg-white rounded-md shadow-sm">
                    <div>
                      <p className="font-medium">{med.pillName}</p>
                      <p className="text-sm text-gray-600">
                        {med.dosage} - Next doses: {med.timings
                          .filter(t => {
                            const [hours, minutes] = t.time.split(':');
                            const medTime = new Date();
                            medTime.setHours(parseInt(hours, 10));
                            medTime.setMinutes(parseInt(minutes, 10));
                            return isAfter(medTime, new Date());
                          })
                          .map(t => formatTime(t.time))
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6">
            {medications && medications.length > 0 ? (
              medications.map((med) => (
                <div key={med._id} className="bg-white rounded-lg shadow-md p-4 mb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{med.pillName}</h3>
                      <p className="text-gray-600">{med.dosage}</p>
                      <p className="text-gray-600">Take {med.foodTiming} food</p>
                      <p className="text-gray-600">
                        Duration: {format(new Date(med.startDate), 'MMM d, yyyy')} - {format(new Date(med.endDate), 'MMM d, yyyy')}
                      </p>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          Times: {med.timings.map(t => formatTime(t.time)).join(', ')}
                        </p>
                      </div>
                      {med.description && <p className="text-gray-600 mt-2">{med.description}</p>}
                    </div>
                    <button
                      onClick={() => deleteMedication(med._id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <MedicationCalendar
                    medication={med}
                    onToggleDay={(date, timingId) => toggleTakenForDate(med._id, timingId, date)}
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No medications found. Add your first medication!</p>
              </div>
            )}
          </div>

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
                      onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
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
                      onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
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
                        onChange={(e) => setNewMedication({ ...newMedication, startDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="date"
                        value={newMedication.endDate}
                        onChange={(e) => setNewMedication({ ...newMedication, endDate: e.target.value })}
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
                      onChange={(e) => setNewMedication({ ...newMedication, beforeFood: e.target.value === 'true' })}
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
                      onChange={(e) => setNewMedication({ ...newMedication, description: e.target.value })}
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