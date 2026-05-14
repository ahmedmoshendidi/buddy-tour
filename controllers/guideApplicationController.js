const pool = require('../config/database');
const emailService = require('../utils/emailService');

// Submit a tour guide application
const submitGuideApplication = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      fullName,
      email,
      phone,
      age,
      currentCity,
      educationLevel,
      currentOccupation,
      tourExperience,
      languages,
      licenses,
      preferredCities,
      availableDays,
      tourTypes,
      groupSizePreference,
      knowledgeAreas,
      specialSkills,
      motivation,
      uniqueValue,
      portfolio,
      references,
      bankName,
      bankAccountNumber,
      accountHolderName
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !phone || !age || !currentCity || 
        !educationLevel || !languages || !preferredCities || 
        !availableDays || !tourTypes || !knowledgeAreas || 
        !motivation || !uniqueValue || !bankName || !bankAccountNumber || !accountHolderName) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['fullName', 'email', 'phone', 'age', 'currentCity', 'educationLevel', 
                  'languages', 'preferredCities', 'availableDays', 'tourTypes', 
                  'knowledgeAreas', 'motivation', 'uniqueValue', 'bankName', 'bankAccountNumber', 'accountHolderName']
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate age
    if (age < 18 || age > 70) {
      return res.status(400).json({ error: 'Age must be between 18 and 70' });
    }

    // Check if email already exists
    const existingApplication = await client.query(
      'SELECT id FROM guide_applications WHERE email = $1',
      [email]
    );

    if (existingApplication.rows.length > 0) {
      return res.status(409).json({ error: 'Application with this email already exists' });
    }

    await client.query('BEGIN');

    // Insert the application
    const result = await client.query(
      `INSERT INTO guide_applications (
        full_name, email, phone, age, current_city,
        education_level, current_occupation, tour_experience,
        languages, licenses, preferred_cities, available_days,
        tour_types, group_size_preference, knowledge_areas,
        special_skills, motivation, unique_value,
        portfolio, guide_references, status,
        bank_name, bank_account_number, account_holder_name
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 'pending',
        $21, $22, $23
      ) RETURNING id, created_at`,
      [
        fullName, email, phone, age, currentCity,
        educationLevel, currentOccupation, tourExperience,
        JSON.stringify(languages), licenses, JSON.stringify(preferredCities),
        JSON.stringify(availableDays), JSON.stringify(tourTypes),
        groupSizePreference, JSON.stringify(knowledgeAreas),
        specialSkills, motivation, uniqueValue,
        portfolio, references,
        bankName, bankAccountNumber, accountHolderName
      ]
    );

    await client.query('COMMIT');

    const newApplication = result.rows[0];

    console.log(`✅ New guide application submitted: ${fullName} (${email}) - ID: ${newApplication.id}`);

    // Send email notification to admin (non-blocking)
    const applicationData = {
      fullName,
      email,
      phone,
      age,
      currentCity,
      educationLevel,
      currentOccupation,
      tourExperience,
      languages,
      preferredCities,
      tourTypes,
      motivation,
      uniqueValue
    };

    emailService.sendNewApplicationNotification(applicationData)
      .then(result => {
        if (result.success) {
          console.log('📧 Admin notification sent successfully');
        } else {
          console.log('📧 Admin notification failed:', result.message || result.error);
        }
      })
      .catch(error => {
        console.error('📧 Error sending admin notification:', error);
      });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: newApplication.id,
      submittedAt: newApplication.created_at
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error submitting guide application:', error);
    
    // Handle specific PostgreSQL errors
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Application with this email already exists' });
    }
    
    res.status(500).json({ 
      error: 'Internal server error while processing application',
      message: 'Please try again later'
    });
  } finally {
    client.release();
  }
};

// Get all applications (admin only)
const getAllApplications = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

    let query = `
      SELECT 
        id, full_name, email, phone, age, current_city,
        education_level, current_occupation, languages,
        preferred_cities, available_days, tour_types,
        knowledge_areas, status, created_at, updated_at,
        reviewed_by, reviewed_at
      FROM guide_applications
    `;
    
    const queryParams = [];
    let whereClause = '';

    // Add status filter if provided
    if (status) {
      whereClause = ' WHERE status = $1';
      queryParams.push(status);
    }

    // Add sorting and pagination
    query += whereClause + ` ORDER BY ${sortBy} ${sortOrder} LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) FROM guide_applications${whereClause}`;
    const countParams = status ? [status] : [];
    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      applications: result.rows,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + result.rows.length < totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single application details (admin only)
const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM guide_applications WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update application status (admin only)
const updateApplicationStatus = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { status, adminNotes, reviewedBy } = req.body;

    if (!status || !['pending', 'under_review', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        validStatuses: ['pending', 'under_review', 'approved', 'rejected']
      });
    }

    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE guide_applications 
       SET status = $1, admin_notes = $2, reviewed_by = $3, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [status, adminNotes, reviewedBy, id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Application not found' });
    }

    await client.query('COMMIT');

    const updatedApplication = result.rows[0];

    // Send email notification to applicant for approved/rejected status (non-blocking)
    if (status === 'approved' || status === 'rejected') {
      const applicationData = {
        fullName: updatedApplication.full_name,
        email: updatedApplication.email
      };

      emailService.sendApplicationStatusUpdate(applicationData, status, adminNotes)
        .then(emailResult => {
          if (emailResult.success) {
            console.log(`📧 Status update email sent to ${updatedApplication.email}`);
          } else {
            console.log(`📧 Failed to send status email: ${emailResult.message || emailResult.error}`);
          }
        })
        .catch(error => {
          console.error('📧 Error sending status update email:', error);
        });
    }

    // If approved, create guide record
    if (status === 'approved') {
      try {
        const app = updatedApplication;
        
        // Convert languages array of objects to text array if necessary
        // In the table it's text[], in app it's jsonb [{language: '...', proficiency: '...'}]
        const languageNames = app.languages.map(l => l.language);

        await client.query(
          `INSERT INTO guides (
            name, bio, languages, location, 
            bank_account_number, bank_name, account_holder_name
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            app.full_name, 
            app.motivation, // Use motivation as initial bio
            languageNames, 
            app.current_city,
            app.bank_account_number,
            app.bank_name,
            app.account_holder_name
          ]
        );
        console.log(`✅ Guide record created for: ${app.full_name}`);
      } catch (guideErr) {
        console.error('❌ Failed to create guide record:', guideErr);
        // We don't rollback the application status update, but we log the error
      }
    }

    res.json({
      success: true,
      message: `Application ${status} successfully`,
      application: updatedApplication
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating application status:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

module.exports = {
  submitGuideApplication,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus
};