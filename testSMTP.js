require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('🧪 SMTP Configuration Test');
console.log('==========================');

// Display current settings from .env
console.log('📋 Current SMTP Settings:');
console.log(`   Host: ${process.env.SMTP_HOST || 'Not set'}`);
console.log(`   Port: ${process.env.SMTP_PORT || 'Not set'}`);
console.log(`   User: ${process.env.SMTP_USER || 'Not set'}`);
console.log(`   Pass: ${process.env.SMTP_PASS ? '***set***' : 'Not set'}`);
console.log(`   From: ${process.env.MAIL_FROM || 'Not set'}`);
console.log('');

async function testConfiguration(config, description) {
  console.log(`🔍 Testing ${description}...`);
  console.log(`   Host: ${config.host}:${config.port} (${config.secure ? 'SSL' : 'STARTTLS'})`);
  
  const transporter = nodemailer.createTransporter({
    ...config,
    logger: false, // Reduce noise for testing
    debug: false
  });

  try {
    // Test connection
    console.log('   ⏳ Verifying connection...');
    await transporter.verify();
    console.log('   ✅ Connection verified successfully!');

    // Test sending email
    console.log('   ⏳ Sending test email...');
    const testEmail = {
      from: `"SMTP Test" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Send to self
      subject: `🧪 SMTP Test - ${description} - ${new Date().toLocaleString()}`,
      text: `This is a test email using ${description}.\\n\\nTimestamp: ${new Date().toISOString()}\\nConfiguration: ${config.host}:${config.port}`,
      html: `
        <h2>🧪 SMTP Test Result</h2>
        <p><strong>Configuration:</strong> ${description}</p>
        <p><strong>Host:</strong> ${config.host}:${config.port}</p>
        <p><strong>Security:</strong> ${config.secure ? 'SSL' : 'STARTTLS'}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p>✅ <strong>Success!</strong> This configuration is working.</p>
      `
    };

    const info = await transporter.sendMail(testEmail);
    console.log('   ✅ Test email sent successfully!');
    console.log(`   📧 Message ID: ${info.messageId}`);
    console.log('   🎉 This configuration works!');
    console.log('');
    
    return {
      success: true,
      config: description,
      messageId: info.messageId
    };

  } catch (error) {
    console.log('   ❌ Test failed');
    
    // Show helpful messages based on error type
    if (error.code === 'ECONNECTION' || error.code === 'ENOTFOUND') {
      console.log('   💡 Connection issue - check host and port');
    } else if (error.code === 'EAUTH') {
      console.log('   💡 Authentication failed - check username/password');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('   💡 Connection timeout - try different port or increase timeout');
    } else if (error.message.includes('certificate')) {
      console.log('   💡 SSL/TLS certificate issue - may need rejectUnauthorized: false');
    } else if (error.responseCode === 535) {
      console.log('   💡 Authentication failed - check email credentials');
    } else if (error.responseCode === 550) {
      console.log('   💡 Mailbox error - check sender email address');
    }
    
    console.log(`   🔍 Error: ${error.message}`);
    console.log(`   🔍 Code: ${error.code || 'N/A'}`);
    console.log(`   🔍 Response: ${error.response || 'N/A'}`);
    console.log('');
    
    return {
      success: false,
      config: description,
      error: error.message,
      code: error.code
    };
  } finally {
    transporter.close();
  }
}

async function runTests() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('❌ Missing required SMTP environment variables');
    console.log('Please set: SMTP_HOST, SMTP_USER, SMTP_PASS in your .env file');
    return;
  }

  const configurations = [
    // Test 1: Port 465 with SSL (Recommended for Hostinger)
    {
      host: process.env.SMTP_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
      pool: false,
      maxConnections: 1,
      rateDelta: 20000,
      rateLimit: 5,
      tls: {
        servername: process.env.SMTP_HOST,
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      }
    },
    
    // Test 2: Port 587 with STARTTLS  
    {
      host: process.env.SMTP_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
      pool: false,
      maxConnections: 1,
      tls: {
        servername: process.env.SMTP_HOST,
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      }
    }
  ];

  const results = [];
  
  for (let i = 0; i < configurations.length; i++) {
    const config = configurations[i];
    const description = config.port === 465 ? 'Port 465 with SSL' : 'Port 587 with STARTTLS';
    
    const result = await testConfiguration(config, description);
    results.push(result);
    
    // Wait between tests to avoid rate limiting
    if (i < configurations.length - 1) {
      console.log('⏱️  Waiting 5 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // Summary
  console.log('📊 Test Results Summary:');
  console.log('========================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  if (successful.length > 0) {
    console.log('✅ Working configurations:');
    successful.forEach(result => {
      console.log(`   • ${result.config}`);
    });
    
    // Show recommended .env settings for the first working config
    const working = successful[0];
    const isSSL = working.config.includes('465');
    console.log('');
    console.log('🔧 Recommended .env settings:');
    console.log(`SMTP_HOST=${process.env.SMTP_HOST}`);
    console.log(`SMTP_PORT=${isSSL ? 465 : 587}`);
    console.log(`SMTP_USER=${process.env.SMTP_USER}`);
    console.log(`SMTP_PASS=your_password_here`);
    console.log(`MAIL_FROM=${process.env.SMTP_USER}`);
  }
  
  if (failed.length > 0) {
    console.log('');
    console.log('❌ Failed configurations:');
    failed.forEach(result => {
      console.log(`   • ${result.config}: ${result.error}`);
    });
  }

  if (successful.length === 0) {
    console.log('');
    console.log('❌ No working configurations found.');
    console.log('💡 Troubleshooting tips:');
    console.log('   • Verify your Hostinger email credentials');
    console.log('   • Check if 2FA is disabled for the email account');
    console.log('   • Try using an app-specific password instead');
    console.log('   • Contact Hostinger support about SMTP access');
  }
}

// Run the tests
runTests().catch(console.error);