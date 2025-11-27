const Medication = require('../models/Medication');
const { format, addMinutes } = require('date-fns');

class ReminderService {
  constructor() {
    this.reminderInterval = null;
    this.checkInterval = 60000; // Check every minute
  }

  start() {
    console.log('Reminder service started');
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
    }

    this.reminderInterval = setInterval(async () => {
      await this.checkUpcomingMedications();
    }, this.checkInterval);
  }

  stop() {
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
      this.reminderInterval = null;
    }
  }

  async checkUpcomingMedications() {
    try {
      const now = new Date();
      const currentTime = format(now, 'HH:mm');
      const fifteenMinutesFromNow = format(addMinutes(now, 15), 'HH:mm');
      
      console.log('Checking medications at:', currentTime);
      console.log('Looking for medications between:', currentTime, 'and', fifteenMinutesFromNow);
      
      // Find medications that are due within the next 15 minutes
      const medications = await Medication.find({
        status: 'active'
      }).populate('userId', 'name email');

      console.log('Found medications:', medications.map(m => ({
        name: m.pillName,
        timings: m.timings,
        status: m.status
      })));

      // Filter medications that are due within the next 15 minutes
      const dueMedications = medications.filter(med => {
        return med.timings.some(timing => {
          if (timing.taken) return false;
          const medTime = timing.time;
          console.log('Checking medication:', med.pillName, 'at', medTime);
          return medTime >= currentTime && medTime <= fifteenMinutesFromNow;
        });
      });

      console.log('Due medications:', dueMedications.map(m => m.pillName));

      // Process each medication that needs a reminder
      for (const medication of dueMedications) {
        await this.sendReminder(medication);
      }
    } catch (error) {
      console.error('Error checking upcoming medications:', error);
    }
  }

  async sendReminder(medication) {
    try {
      const dueTimings = medication.timings.filter(timing => {
        if (timing.taken) return false;
        const now = new Date();
        const currentTime = format(now, 'HH:mm');
        const fifteenMinutesFromNow = format(addMinutes(now, 15), 'HH:mm');
        return timing.time >= currentTime && timing.time <= fifteenMinutesFromNow;
      });

      if (dueTimings.length === 0) return;

      console.log(`Sending reminder for ${medication.pillName} (${medication.dosage}) at times:`, 
        dueTimings.map(t => t.time).join(', '));
      
      // Update the medication to mark that a reminder was sent
      medication.lastReminderSent = new Date();
      await medication.save();
    } catch (error) {
      console.error('Error sending reminder:', error);
    }
  }
}

module.exports = new ReminderService(); 