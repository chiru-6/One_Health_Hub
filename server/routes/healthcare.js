const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Healthcare democratization endpoint
router.post('/healthcare_democratization', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Process the healthcare question and provide relevant information
    let answer;
    const questionLower = question.toLowerCase();

    // Basic healthcare information mapping
    if (questionLower.includes('angioplasty')) {
      answer = 'Angioplasty is a medical procedure used to treat blocked or narrowed arteries. During the procedure, a small balloon is inserted into the blocked artery and inflated to widen it. Often, a small mesh tube called a stent is also placed to help keep the artery open. This procedure helps improve blood flow and reduce symptoms like chest pain. It\'s commonly used to treat heart disease but can also be used for other blocked arteries in the body.';
    } else if (questionLower.includes('diabetes')) {
      answer = 'Diabetes is a chronic condition that affects how your body processes blood sugar (glucose). There are two main types: Type 1, where the body doesn\'t produce insulin, and Type 2, where the body doesn\'t use insulin properly. Common symptoms include increased thirst, frequent urination, hunger, fatigue, and blurred vision. Management typically involves monitoring blood sugar, medication or insulin therapy, healthy eating, and regular exercise.';
    } else if (questionLower.includes('hypertension') || questionLower.includes('blood pressure')) {
      answer = 'Hypertension, or high blood pressure, occurs when the force of blood against artery walls is consistently too high. Normal blood pressure is below 120/80 mmHg. It often has no symptoms but can lead to serious health problems like heart disease and stroke. Treatment includes lifestyle changes (diet, exercise, stress management) and sometimes medication.';
    } else if (questionLower.includes('covid') || questionLower.includes('coronavirus')) {
      answer = 'COVID-19 is a respiratory illness caused by the SARS-CoV-2 virus. Common symptoms include fever, cough, fatigue, and loss of taste or smell. Prevention measures include vaccination, wearing masks in high-risk situations, maintaining good hand hygiene, and staying home when sick. If you experience symptoms, contact your healthcare provider for guidance.';
    } else {
      answer = 'I understand you have a question about healthcare. For the most accurate and personalized medical advice, please consult with a qualified healthcare professional. They can provide guidance specific to your situation and medical history.';
    }

    const response = {
      answer,
      timestamp: new Date().toISOString(),
      disclaimer: 'This information is for educational purposes only and should not replace professional medical advice. Always consult with a qualified healthcare provider for personal medical decisions.'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in healthcare democratization:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 