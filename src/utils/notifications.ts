import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { config } from '../config/env';

// Email transporter
const emailTransporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: false,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

// Twilio client
const twilioClient = config.twilio.accountSid && config.twilio.authToken && config.twilio.accountSid.startsWith('AC')
  ? twilio(config.twilio.accountSid, config.twilio.authToken)
  : null;

export const sendEmailOTP = async (email: string, otp: string): Promise<void> => {
  const mailOptions = {
    from: config.email.from,
    to: email,
    subject: 'Your OTP for Ofside',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Your OTP Code</h2>
        <p>Your One-Time Password (OTP) is:</p>
        <div style="font-size: 24px; font-weight: bold; color: #007bff; padding: 20px; background-color: #f8f9fa; border-radius: 5px; text-align: center;">
          ${otp}
        </div>
        <p>This OTP will expire in ${config.otp.expiryMinutes} minutes.</p>
        <p>If you did not request this OTP, please ignore this email.</p>
      </div>
    `,
  };

  await emailTransporter.sendMail(mailOptions);
};

export const sendSMSOTP = async (mobile: string, otp: string): Promise<void> => {
  if (!twilioClient) {
    throw new Error('Twilio client not configured. Please check your Twilio credentials.');
  }
  
  const message = `Your OTP for Ofside is: ${otp}. Valid for ${config.otp.expiryMinutes} minutes. Do not share this with anyone.`;
  
  if (!config.twilio.phoneNumber) {
    throw new Error('Twilio phone number not configured.');
  }
  await twilioClient.messages.create({
    body: message,
    from: config.twilio.phoneNumber,
    to: `+91${mobile}`, // Assuming Indian mobile numbers
  });
};

export const sendBookingConfirmation = async (
  identifier: string,
  type: 'email' | 'sms',
  bookingDetails: {
    venueName: string;
    courtName: string;
    date: string;
    time: string;
    amount: number;
  }
): Promise<void> => {
  const { venueName, courtName, date, time, amount } = bookingDetails;
  
  if (type === 'email') {
    const mailOptions = {
      from: config.email.from,
      to: identifier,
      subject: 'Booking Confirmation - Ofside',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">Booking Confirmed!</h2>
          <p>Your booking has been confirmed with the following details:</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Venue:</strong> ${venueName}</p>
            <p><strong>Court:</strong> ${courtName}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${time}</p>
            <p><strong>Amount:</strong> ₹${amount}</p>
          </div>
          <p>Please arrive 10 minutes before your scheduled time.</p>
          <p>Thank you for choosing Ofside!</p>
        </div>
      `,
    };

    await emailTransporter.sendMail(mailOptions);
  } else {
    if (!twilioClient) {
      throw new Error('Twilio client not configured. Please check your Twilio credentials.');
    }
    
    const message = `Booking confirmed! ${venueName} - ${courtName} on ${date} at ${time}. Amount: ₹${amount}. Arrive 10 mins early.`;

    if (!config.twilio.phoneNumber) {
      throw new Error('Twilio phone number not configured.');
    }
    
    await twilioClient.messages.create({
      body: message,
      from: config.twilio.phoneNumber,
      to: `+91${identifier}`,
    });
  }
};