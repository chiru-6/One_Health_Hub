const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const MedicalRecord = require('../models/MedicalRecord');
const auth = require('../middleware/auth');
const { upload, cloudinary } = require('../config/cloudinary');
const axios = require('axios');

// Get all medical records for current user
router.get('/user/me', auth, async (req, res) => {
  try {
    console.log('Fetching medical records for user:', req.user.id);
    const records = await MedicalRecord.find({ userId: req.user.id });
    console.log('Found records:', records);
    res.json(records);
  } catch (err) {
    console.error('Error fetching medical records:', err);
    res.status(500).json({ message: 'Error fetching medical records', error: err.message });
  }
});

// Create a new hospital (without files)
router.post('/hospital', auth, async (req, res) => {
  try {
    console.log('Received request to create hospital:', req.body);
    
    const { hospitalName, reportDate, description } = req.body;

    if (!hospitalName) {
      return res.status(400).json({ message: 'Hospital name is required' });
    }

    const medicalRecord = new MedicalRecord({
      userId: req.user.id,
      hospitalName,
      reportDate: reportDate || new Date(),
      description: description || 'New hospital record',
      files: []
    });

    console.log('Saving medical record:', medicalRecord);
    await medicalRecord.save();
    
    res.status(201).json(medicalRecord);
  } catch (err) {
    console.error('Error creating hospital:', err);
    res.status(400).json({ message: err.message });
  }
});

// Upload files to an existing hospital
router.post('/:id/files', auth, (req, res) => {
  upload.array('files', 10)(req, res, async (err) => {
    try {
      console.log('=== FILE UPLOAD STARTED ===');
      console.log('Request details:', {
        hospitalId: req.params.id,
        userId: req.user.id,
        contentType: req.headers['content-type']
      });

      if (err) {
        console.error('Upload error:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File size too large. Maximum size is 10MB.' });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({ message: 'Too many files. Maximum is 10 files.' });
        }
        return res.status(400).json({ message: err.message });
      }

      // Check if files were received
      if (!req.files || req.files.length === 0) {
        console.error('No files received in request');
        console.log('Request body:', req.body);
        return res.status(400).json({ 
          message: 'No files uploaded',
          details: { body: req.body }
        });
      }

      const record = await MedicalRecord.findById(req.params.id);
      if (!record) {
        console.error('Hospital not found:', req.params.id);
        return res.status(404).json({ message: 'Hospital not found' });
      }

      if (record.userId.toString() !== req.user.id) {
        console.error('Unauthorized access attempt:', {
          recordUserId: record.userId,
          requestUserId: req.user.id
        });
        return res.status(403).json({ message: 'Not authorized' });
      }

      console.log('Processing uploaded files:', req.files.length);
      
      try {
        const files = req.files.map((file, index) => {
          console.log(`Processing file ${index + 1}:`, {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            filename: file.filename,
            secure_url: file.secure_url,
            public_id: file.public_id,
            format: file.format
          });

          // Ensure we have the required Cloudinary data
          if (!file.secure_url || !file.public_id) {
            console.error('Invalid Cloudinary response:', file);
            throw new Error('Invalid Cloudinary response - missing required fields');
          }

          // Extract Cloudinary ID from the URL if public_id is not available
          const cloudinaryId = file.public_id || file.secure_url.split('/').slice(-1)[0].split('.')[0];

          return {
            path: file.path || file.secure_url,
            url: file.secure_url,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size || 0,
            cloudinaryId: cloudinaryId,
            format: file.format || file.mimetype.split('/')[1]
          };
        });

        // Log the files being saved
        console.log('Files to be saved:', files.map(f => ({
          originalname: f.originalname,
          cloudinaryId: f.cloudinaryId,
          url: f.url
        })));

        // Update the record with new files
        record.files = [...record.files, ...files];
        await record.save();

        console.log('Files saved to database successfully:', {
          totalFiles: record.files.length,
          newFiles: files.length,
          fileDetails: files.map(f => ({
            url: f.url,
            cloudinaryId: f.cloudinaryId,
            format: f.format
          }))
        });
        console.log('=== FILE UPLOAD COMPLETED ===');
        
        // Send the updated record back
        res.json({
          message: 'Files uploaded successfully',
          files: files,
          record: record
        });
      } catch (saveError) {
        console.error('Error saving record:', saveError);
        console.error('Save error stack:', saveError.stack);
        res.status(500).json({ 
          message: 'Error saving record', 
          error: saveError.message,
          stack: saveError.stack
        });
      }
    } catch (err) {
      console.error('=== FILE UPLOAD ERROR ===');
      console.error('Error:', err);
      console.error('Error stack:', err.stack);
      console.error('Request details:', {
        body: req.body,
        files: req.files,
        headers: req.headers
      });
      console.error('=== FILE UPLOAD ERROR END ===');
      
      res.status(500).json({ 
        message: 'Error processing upload', 
        error: err.message,
        details: {
          name: err.name,
          code: err.code,
          stack: err.stack
        }
      });
    }
  });
});

// Delete a file from a medical record
router.delete('/:recordId/files/:fileIndex', auth, async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.recordId);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    if (record.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const fileIndex = parseInt(req.params.fileIndex);
    if (fileIndex < 0 || fileIndex >= record.files.length) {
      return res.status(400).json({ message: 'Invalid file index' });
    }

    const fileToDelete = record.files[fileIndex];
    
    // Delete from Cloudinary if cloudinaryId exists
    if (fileToDelete.cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(fileToDelete.cloudinaryId);
        console.log(`File deleted from Cloudinary: ${fileToDelete.cloudinaryId}`);
      } catch (cloudinaryErr) {
        console.error('Error deleting from Cloudinary:', cloudinaryErr);
        // Continue with database deletion even if Cloudinary deletion fails
      }
    }

    // Remove the file from the record
    record.files.splice(fileIndex, 1);
    await record.save();

    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error('Error deleting file:', err);
    res.status(500).json({ message: 'Error deleting file', error: err.message });
  }
});

// Get a specific medical record
router.get('/:id', auth, async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });
    if (record.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a medical record
router.patch('/:id', auth, upload.array('files', 10), async (req, res) => {
  try {
    const { hospitalName, reportDate, description } = req.body;
    
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });
    if (record.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (hospitalName) record.hospitalName = hospitalName;
    if (reportDate) record.reportDate = reportDate;
    if (description) record.description = description;
    
    // Handle file uploads if any
    if (req.files && req.files.length > 0) {
      const files = req.files.map(file => ({
        path: file.filename,
        url: file.path,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size || 0,
        cloudinaryId: file.cloudinaryId
      }));
      record.files = [...record.files, ...files];
    }

    await record.save();
    res.json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a medical record
router.delete('/:id', auth, async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });
    if (record.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete all files from Cloudinary
    for (const file of record.files) {
      if (file.cloudinaryId) {
        try {
          await cloudinary.uploader.destroy(file.cloudinaryId);
          console.log(`File ${file.cloudinaryId} deleted from Cloudinary`);
        } catch (cloudinaryErr) {
          console.error(`Error deleting file ${file.cloudinaryId} from Cloudinary:`, cloudinaryErr);
        }
      }
    }

    await record.remove();
    res.json({ message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get detailed medical term explanations
router.post('/explain-terms', auth, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }

    // Function to get explanation for a term
    const getTermExplanation = (term) => {
      const explanations = {
        'narrowing': 'a medical treatment that an instance of becoming narrow',
        'blockage': 'a medical treatment that the physical condition of blocking or filling a passage with an obstruction',
        'arteries': 'a medical treatment that a blood vessel that carries blood from the heart to the body',
        'blood': 'a medical treatment that the fluid (red in vertebrates) that is pumped through the body by the heart and contains plasma, blood cells, and platelets',
        'heart': 'a medical treatment that the locus of feelings and intuitions',
        'PAD': 'a medical treatment that a number of sheets of paper fastened together along one edge',
        'legs': 'a medical treatment that staying power',
        'feet': 'a medical treatment that the part of the leg of a human being below the ankle joint',
        'Aneurysms': 'a medical treatment that a cardiovascular disease characterized by a saclike widening of an artery resulting from weakening of the artery wall',
        'areas': 'a medical treatment that a particular geographical region of indefinite boundary (usually serving some special purpose or distinguished by its people or culture or geography)',
        'walls': 'a medical treatment that an architectural partition with a height and length greater than its thickness; used to divide or enclose an area or to support another structure',
        'vessels': 'a medical treatment that a tube in which a body fluid circulates',
        'lungs': 'a medical treatment that either of two saclike respiratory organs in the chest of vertebrates; serves to remove carbon dioxide and provide oxygen to the blood',
        'brain': 'a medical treatment that that part of the central nervous system that includes all the higher nervous centers; enclosed within the skull; continuous with the spinal cord',
        'stroke': 'a medical treatment that (sports) the act of swinging or striking at a ball with a club or racket or bat or cue or hand',
        'range': 'a medical treatment that an area in which something acts or operates or has power or control:',
        'tumors': 'a medical treatment that an abnormal new mass of tissue that serves no purpose'
      };
      return explanations[term.toLowerCase()] || '';
    };

    // Process the text and add explanations
    let processedText = text;
    const terms = Object.keys(getTermExplanation).concat(['CAD', 'PAD']);
    
    terms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const explanation = getTermExplanation(term);
      if (explanation) {
        processedText = processedText.replace(regex, `${term} (${explanation})`);
      }
    });

    // Create a dictionary of terms and their explanations
    const termsDictionary = {};
    terms.forEach(term => {
      const explanation = getTermExplanation(term);
      if (explanation) {
        termsDictionary[term] = explanation;
      }
    });

    res.json({
      processedText,
      termsDictionary
    });
  } catch (err) {
    console.error('Error processing medical terms:', err);
    res.status(500).json({ message: 'Error processing medical terms', error: err.message });
  }
});

// Remove the duplicate download route and combine functionality
router.get('/download/:fileId', auth, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    if (!fileId) {
      console.error('No file ID provided');
      return res.status(400).json({ message: 'No file ID provided' });
    }

    console.log('Download request for:', fileId);

    // First, try to find file in the database
    const record = await MedicalRecord.findOne({
      'files._id': fileId,
      userId: req.user.id
    });

    if (record) {
      const file = record.files.find(f => f._id.toString() === fileId);
      if (file) {
        console.log('File found in database:', file);
        
        // If file has cloudinaryId, use Cloudinary to serve it
        if (file.cloudinaryId) {
          try {
            const result = await cloudinary.api.resource(file.cloudinaryId, {
              resource_type: 'auto'
            });
            
            if (result && result.secure_url) {
              console.log('Found Cloudinary resource:', {
                public_id: result.public_id,
                format: result.format,
                url: result.secure_url
              });

              // Get the file from Cloudinary
              const response = await axios({
                url: result.secure_url,
                method: 'GET',
                responseType: 'arraybuffer',
                headers: {
                  'Accept': '*/*'
                }
              });

              // Determine content type
              const contentType = response.headers['content-type'] || file.mimetype || 'application/octet-stream';
              
              // Set response headers
              res.setHeader('Content-Type', contentType);
              res.setHeader('Content-Disposition', `attachment; filename="${file.originalname}"`);
              res.setHeader('Content-Length', response.data.length);
              
              // Send the file data
              return res.send(response.data);
            }
          } catch (cloudinaryError) {
            console.error('Cloudinary error:', cloudinaryError);
            // If Cloudinary fails, try to use the local file path as fallback
          }
        }
        
        // If no cloudinaryId or Cloudinary failed, try to use the local file path
        if (file.path) {
          const filePath = path.join(__dirname, '..', file.path);
          if (fs.existsSync(filePath)) {
            res.setHeader('Content-Type', file.mimetype || 'application/octet-stream');
            res.setHeader('Content-Disposition', `attachment; filename="${file.originalname}"`);
            return res.sendFile(filePath);
          } else {
            console.error('File not found on disk:', filePath);
          }
        }
        
        // If file has URL but no cloudinaryId or local path, try to use the URL directly
        if (file.url) {
          return res.redirect(file.url);
        }
      }
    }

    // If file not found in database or no download method worked, try Cloudinary directly
    try {
      const result = await cloudinary.api.resource(fileId, {
        resource_type: 'auto'
      });
      
      if (result && result.secure_url) {
        console.log('Found Cloudinary resource directly:', {
          public_id: result.public_id,
          format: result.format,
          url: result.secure_url
        });

        const response = await axios({
          url: result.secure_url,
          method: 'GET',
          responseType: 'arraybuffer'
        });

        const contentType = response.headers['content-type'] || 'application/octet-stream';
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${result.public_id}.${result.format}"`);
        res.setHeader('Content-Length', response.data.length);
        
        return res.send(response.data);
      }
    } catch (cloudinaryError) {
      console.error('Cloudinary direct access error:', cloudinaryError);
    }
    
    // If all methods fail, return not found
    return res.status(404).json({ message: 'File not found' });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Error downloading file', error: error.message });
  }
});

module.exports = router; 