# Ofside Management API

A comprehensive Node.js + Express backend for Ofside management and booking application with TypeScript, MongoDB, AWS S3, and advanced features.

## 🏗️ Architecture Overview

This backend follows a modular, scalable architecture with clear separation of concerns:

```
src/
├── config/          # Configuration files (database, AWS, environment)
├── models/          # MongoDB models with Mongoose
├── controllers/     # Request handlers and business logic
├── routes/          # Express route definitions with Swagger docs
├── middlewares/     # Authentication, error handling, rate limiting
├── utils/           # Helper functions (JWT, OTP, S3, validators)
├── types/           # TypeScript type definitions
├── app.ts           # Express application setup
└── server.ts        # Server entry point
```

## 🚀 Features

### Core Features
- **JWT-based Authentication** with OTP verification via SMS/Email
- **Role-based Access Control** (User, Venue Owner, Admin)
- **Venue & Court Management** with geolocation support
- **Advanced Booking System** with peak hour pricing
- **Player Analytics & Statistics** tracking
- **Sports Rulebook Management** for different sports
- **File Upload Integration** with AWS S3 pre-signed URLs
- **Email & SMS Notifications** for bookings and OTP

### Technical Features
- **TypeScript** for type safety and better development experience
- **MongoDB** with Mongoose ODM for data persistence
- **Comprehensive API Documentation** with Swagger/OpenAPI
- **Rate Limiting** and security middleware
- **Error Handling** with custom error types
- **Input Validation** using Zod schemas
- **Graceful Shutdown** handling
- **Environment-based Configuration**

## 📋 Prerequisites

- Node.js >= 16.x
- MongoDB >= 4.4
- AWS S3 bucket for file storage
- Twilio account for SMS
- SMTP service for emails

## 🛠️ Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Environment setup:**
```bash
cp .env.example .env
```

3. **Configure environment variables in `.env`:**
```env
# Database
MONGO_URI=mongodb://localhost:27017/sports-venue-db

# JWT Secrets
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=your-sports-venue-bucket

# Twilio SMS
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password
```

4. **Start development server:**
```bash
npm run dev
```

5. **Build for production:**
```bash
npm run build
npm start
```

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI:** `http://localhost:5000/api-docs`
- **Health Check:** `http://localhost:5000/health`

## 🔐 Authentication Flow

### User Signup
1. POST `/api/auth/signup` with user details
2. OTP sent via SMS/Email
3. POST `/api/auth/verify-otp` to verify OTP
4. User account activated, JWT tokens returned

### User Login  
1. POST `/api/auth/login` with mobile/email
2. OTP sent for verification
3. POST `/api/auth/verify-otp` to verify OTP
4. JWT tokens returned for authenticated requests

### Token Management
- **Access Token:** Short-lived (15 minutes)
- **Refresh Token:** Long-lived (7 days)
- Use `/api/auth/refresh-token` to get new access token

## 🏢 User Roles

### Role 0: User
- Book courts and join matches
- View sports rulebook
- Track personal statistics
- Manage own bookings

### Role 1: Venue Owner
- Create and manage venues
- Create and manage courts
- View venue bookings and revenue
- Manage court availability

### Role 2: Admin
- Approve venues
- Manage all users and venues
- Create/update sports rulebooks
- Access all system analytics

## 🏟️ Venue & Court Management

### Venue Creation
- Detailed venue information with address and amenities
- Geolocation support for location-based searches
- Duplicate prevention at same address coordinates
- Admin approval workflow

### Court Management
- Sport-specific court configurations
- Peak hour pricing with day/time flexibility
- Slot duration and capacity management
- Image upload via S3 pre-signed URLs

## 📅 Booking System

### Smart Booking Engine
- Prevents overlapping bookings
- Automatic price calculation with peak hour logic
- Real-time slot availability checking
- Cancellation policies with time restrictions

### Booking Features
- Multi-slot duration support
- Peak hour automatic price adjustment
- Email and SMS confirmations
- Revenue tracking for venue owners

## 📊 Player Analytics

### Performance Tracking
- Match-by-match statistics recording
- Sport-specific metrics (wins, scores, assists, goals)
- Win rate and average performance calculations
- Historical performance trends

### Dashboard Analytics
- Player performance dashboard
- Sport-wise statistics breakdown
- Recent matches and streaks
- Comparative analytics

## 🔒 Security Features

### API Security
- **Rate Limiting:** Prevents API abuse
- **Helmet.js:** Security headers
- **CORS:** Configured for specific origins
- **Input Validation:** Comprehensive request validation
- **JWT Authentication:** Secure token-based auth

### Data Protection
- **Password-free Authentication:** OTP-based system
- **Role-based Authorization:** Granular permissions
- **Request Size Limits:** Prevent large payloads
- **Error Sanitization:** No sensitive data in errors

## 📁 File Management

### AWS S3 Integration
- Pre-signed URL generation for secure uploads
- Organized folder structure (profiles, venues, courts, documents)
- Automatic file key generation with timestamps
- Support for images and documents

### Upload Process
1. Client requests pre-signed URL via `/api/upload/presigned-url`
2. Client uploads directly to S3 using pre-signed URL
3. Client saves returned public URL in database

## 📧 Notification System

### Multi-channel Notifications
- **SMS:** Twilio integration for OTP and booking confirmations
- **Email:** Nodemailer with HTML templates
- **Automatic Triggers:** Booking confirmations, cancellations

### Notification Types
- OTP verification codes
- Booking confirmations with details
- Booking cancellation alerts
- Payment status updates

## 🔄 Development Workflow

### Available Scripts
```bash
npm run dev      # Development server with hot reload
npm run build    # Production build
npm start        # Start production server
npm test         # Run tests (when implemented)
```

### Code Quality
- **TypeScript** for type safety
- **ESLint** configuration (add .eslintrc.js if needed)
- **Prettier** formatting (add .prettierrc if needed)
- **Git hooks** for pre-commit validation

## 🚀 Deployment

### Environment Setup
1. Set up MongoDB cluster (Atlas recommended)
2. Configure AWS S3 bucket with proper permissions
3. Set up Twilio account and phone number
4. Configure email service (Gmail, SendGrid, etc.)

### Production Configuration
- Enable MongoDB connection pooling
- Configure proper CORS origins
- Set up SSL/TLS certificates
- Enable production logging
- Configure health check endpoints

### Deployment Options
- **Digital Ocean Droplets**
- **AWS EC2/ECS**
- **Heroku**
- **Railway**
- **Google Cloud Run**

## 📈 Monitoring & Analytics

### Application Monitoring
- Health check endpoint (`/health`)
- Graceful shutdown handling
- Error logging and tracking
- Performance monitoring ready

### Business Analytics
- Booking revenue tracking
- User engagement metrics
- Venue performance analytics
- Popular sports and time slots

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- 📧 Email: support@sportsvenue.com
- 📖 Documentation: `/api-docs`
- 🐛 Issues: GitHub Issues

---

**Built with ❤️ for the sports community**#   o f s i d e - a p p - b a c k e n d  
 