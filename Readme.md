# VolunteerHub

A full-stack volunteer management system designed to connect volunteers with community initiatives through a centralized platform for registration, event participation, application tracking, and administrative management.

**Live Demo:** https://volunteer-system-glyq.onrender.com

---

## Overview

VolunteerHub simplifies the process of managing volunteers and community events by providing dedicated dashboards for administrators and volunteers. The platform enables organizations to track volunteer applications, manage events, monitor participation, and streamline communication through automated email notifications.

---

## Features

### Role-Based Authentication

* Secure user registration and login
* Separate dashboards for Administrators and Volunteers
* Password encryption using bcrypt
* Session-based authentication and authorization

### Admin Dashboard

* Overview of volunteer statistics
* Recent registration tracking
* Skill-based analytics
* Centralized management interface

### Volunteer Management

* Review volunteer applications
* Update application status (Pending, Approved, Rejected)
* Record volunteer service hours
* Add administrative notes

### Event Management

* Create and manage community events
* Define required skills for participation
* Allow approved volunteers to join events
* Monitor event registrations

### Email Notifications

* Welcome emails for new registrations
* Status update notifications
* Automated communication using Nodemailer

### Data Export

* Export volunteer records in CSV format
* Support reporting and external analysis

### Responsive User Interface

* Mobile-friendly design
* Responsive navigation system
* Clean and intuitive user experience

---

## Technology Stack

| Layer          | Technology                    |
| -------------- | ----------------------------- |
| Backend        | Node.js, Express.js           |
| Frontend       | EJS, HTML5, CSS3              |
| Database       | TiDB Cloud (MySQL-Compatible) |
| Authentication | Express Session, bcrypt       |
| Email Service  | Nodemailer                    |
| Data Export    | csv-stringify                 |
| Deployment     | Render                        |

---

## Installation and Setup

### Prerequisites

* Node.js (v18 or higher)
* TiDB Cloud Account
* Gmail Account with App Password enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/kaifansari-11/volunteer-system.git

# Navigate to the project directory
cd volunteer-system

# Install dependencies
npm install

# Create environment configuration
cp .env.example .env

# Configure environment variables
# Add TiDB credentials, session secret, and Gmail app password

# Run the database schema in TiDB Cloud
# Execute db/schema.sql using the TiDB SQL Editor

# Start the development server
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

---

## Database Configuration

1. Create a Serverless Cluster in TiDB Cloud.
2. Open the **Connect** section and obtain:

   * Host
   * Port
   * Username
   * Password
3. Open the **SQL Editor** and execute the contents of `db/schema.sql`.
4. Add the database credentials to your `.env` file.

---

## Application Routes

| Method    | Route                   | Description              |
| --------- | ----------------------- | ------------------------ |
| GET       | `/`                     | Landing Page             |
| GET, POST | `/auth/login`           | User Login               |
| GET, POST | `/auth/register`        | Volunteer Registration   |
| GET       | `/admin/dashboard`      | Administrative Dashboard |
| GET, POST | `/admin/volunteers/:id` | Manage Volunteer Records |
| GET       | `/admin/export`         | Export Volunteer Data    |
| GET, POST | `/admin/events`         | Manage Events            |
| GET       | `/volunteer/dashboard`  | Volunteer Dashboard      |
| GET, POST | `/volunteer/profile`    | Update Volunteer Profile |
| POST      | `/volunteer/events/:id` | Join Event               |

---

## Deployment

### Render

1. Push the repository to GitHub.
2. Create a new Web Service on Render.
3. Connect the GitHub repository.
4. Configure the service:

```text
Build Command: npm install
Start Command: node app.js
```

5. Add all required environment variables.
6. Deploy the application.

---

## Project Structure

```text
volunteer-system/
├── routes/
│   ├── auth.js
│   ├── volunteers.js
│   └── admin.js
│
├── views/
│   ├── partials/
│   │   ├── sidebar-admin.ejs
│   │   └── sidebar-volunteer.ejs
│   │
│   ├── auth/
│   │   ├── login.ejs
│   │   ├── register.ejs
│   │   └── success.ejs
│   │
│   ├── admin/
│   │   ├── dashboard.ejs
│   │   ├── volunteers.ejs
│   │   ├── volunteer-detail.ejs
│   │   └── events.ejs
│   │
│   ├── volunteer/
│   │   ├── dashboard.ejs
│   │   ├── profile.ejs
│   │   └── events.ejs
│   │
│   ├── landing.ejs
│   ├── 404.ejs
│   └── 500.ejs
│
├── middleware/
│   └── auth.js
│
├── utils/
│   └── mailer.js
│
├── db/
│   ├── connection.js
│   └── schema.sql
│
├── public/
│   └── css/
│       └── style.css
│
├── app.js
└── package.json
```

---

## Author

**Kaif Ansari**

Portfolio: https://kaifansari-dev.netlify.app

GitHub: https://github.com/kaifansari-11

---

## License

This project is intended for educational, portfolio, and learning purposes.
