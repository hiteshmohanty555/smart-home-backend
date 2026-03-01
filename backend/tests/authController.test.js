const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const OTP = require('../src/models/OTP');
const authRoutes = require('../src/routes/authRoutes');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Controller Integration Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/testdb', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await User.deleteMany({});
    await OTP.deleteMany({});
  });

  test('Registration flow: send OTP, verify OTP, register user', async () => {
    const phone = '+917608045737';
    const userData = {
      name: 'Test User',
      phone,
      email: 'testuser@example.com',
      address: '123 Test St',
    };

    // Send OTP for registration
    const sendOtpRes = await request(app)
      .post('/api/auth/send-otp')
      .send({ phone, isRegistration: true });
    expect(sendOtpRes.statusCode).toBe(200);
    expect(sendOtpRes.body.success).toBe(true);

    // Get OTP from DB (simulate)
    const otpRecord = await OTP.findOne({ phone: phone.replace(/^\+/, '') });
    expect(otpRecord).not.toBeNull();

    // Verify OTP
    const verifyOtpRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone, otp: otpRecord.otp, isRegistration: true });
    expect(verifyOtpRes.statusCode).toBe(200);
    expect(verifyOtpRes.body.success).toBe(true);

    // Register user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ ...userData });
    expect(registerRes.statusCode).toBe(200);
    expect(registerRes.body.success).toBe(true);
    expect(registerRes.body.user.phone).toBe('7608045737'); // normalized phone

    // Confirm user in DB
    const userInDb = await User.findOne({ phone: '7608045737' });
    expect(userInDb).not.toBeNull();
    expect(userInDb.email).toBe(userData.email);
  });

  test('Login flow: send OTP, verify OTP, login user', async () => {
    const phone = '+917608045737';
    const user = new User({
      name: 'Existing User',
      phone: '7608045737',
      email: 'existing@example.com',
      address: '456 Existing St',
    });
    await user.save();

    // Send OTP for login
    const sendOtpRes = await request(app)
      .post('/api/auth/send-otp')
      .send({ phone, isRegistration: false });
    expect(sendOtpRes.statusCode).toBe(200);
    expect(sendOtpRes.body.success).toBe(true);

    // Get OTP from DB
    const otpRecord = await OTP.findOne({ phone: '7608045737' });
    expect(otpRecord).not.toBeNull();

    // Verify OTP
    const verifyOtpRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone, otp: otpRecord.otp, isRegistration: false });
    expect(verifyOtpRes.statusCode).toBe(200);
    expect(verifyOtpRes.body.success).toBe(true);
    expect(verifyOtpRes.body.user.email).toBe(user.email);
  });
});
