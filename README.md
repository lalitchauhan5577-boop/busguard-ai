# 🚌 BusGuard AI

### AI-Powered Smart Bus Boarding & Fare Fraud Prevention System

BusGuard AI is a smart transportation management system designed to make bus boarding faster, safer, and more transparent.

The project combines **face-based passenger verification, digital wallet management, automatic fare calculation, passenger tracking, and fraud monitoring** into a unified dashboard.

---

## 🚀 Key Features

* 🤖 **Face Verification Interface** — Webcam-based passenger identification workflow
* 👤 **Passenger Registration** — Register passengers with personal details and face capture
* 🚌 **Smart Boarding** — Verify passengers before boarding
* 💰 **Automatic Fare Deduction** — Calculate and deduct fares from the passenger wallet
* 🎫 **Digital Passenger Cards** — Automatically assign passenger/card IDs
* 🚨 **Fraud Monitoring** — Detect and flag suspicious boarding events
* 📊 **Operations Dashboard** — Monitor passengers, journeys, revenue, and alerts
* 🗄️ **Passenger Database** — View registered passengers and their travel information
* 📋 **Real-Time System Logs** — Track important system events
* 📱 **Responsive Web Interface** — Modern dark-themed transportation dashboard

---

## 🧠 System Workflow

```text
Passenger Registration
        ↓
Face Capture
        ↓
Passenger Verification
        ↓
Boarding Confirmation
        ↓
Journey Tracking
        ↓
Exit Detection
        ↓
Fare Calculation
        ↓
Wallet Deduction
        ↓
Dashboard & Fraud Monitoring
```

---

## 🛠️ Tech Stack

### Frontend

* React.js
* JavaScript
* HTML5
* CSS3
* React Webcam

### AI / Computer Vision Concept

* YOLOv8-based face detection workflow
* Face verification concept
* Webcam image capture

### Application Architecture

* Component-based React architecture
* Client-side data management
* REST API-ready architecture

---

## 📊 Dashboard

The BusGuard AI dashboard provides an overview of:

* Passengers currently onboard
* Registered passengers
* Daily revenue
* Monthly revenue
* Total journeys
* Active fraud alerts
* Recent passenger journeys

---

## 👤 Passenger Registration

The registration workflow allows a passenger to:

1. Enter personal information
2. Set an initial wallet balance
3. Capture a face image through the webcam
4. Receive an automatically generated Face ID
5. Receive a digital passenger card
6. Complete registration

---

## 🎥 Smart Boarding

The boarding interface provides two verification workflows:

### Face Scan

Passengers can be verified through the webcam-based face scanning interface.

### Name Search

A passenger can also be searched manually for demonstration and testing purposes.

After successful verification, the system allows the passenger to confirm boarding.

---

## 💳 Smart Fare System

When a passenger exits the bus, the system:

1. Calculates the number of stops travelled
2. Calculates the corresponding fare
3. Deducts the fare from the passenger wallet
4. Updates the passenger's trip count
5. Updates system revenue
6. Marks the journey as completed

---

## 🚨 Fraud Detection

BusGuard AI includes a fraud-monitoring workflow designed to identify suspicious events such as:

* Unknown passenger detection
* Tailgating
* Skip-scan events
* Unverified boarding attempts

Suspicious events are added to the dashboard's fraud-alert system for review.

---

## 📁 Project Structure

```text
busguard-ai/
│
├── public/
│
├── src/
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   ├── index.css
│   ├── App.test.js
│   ├── setupTests.js
│   └── reportWebVitals.js
│
├── package.json
├── package-lock.json
└── README.md
```

---

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/lalitchauhan5577-boop/busguard-ai.git
```

### 2. Enter the project directory

```bash
cd busguard-ai
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm start
```

The application will open at:

```text
http://localhost:3000
```

---

## 🧪 Available Scripts

### Start development server

```bash
npm start
```

### Run tests

```bash
npm test
```

### Create production build

```bash
npm run build
```

---

## 🔮 Future Enhancements

The current project provides a working frontend prototype and simulation of the smart transportation workflow.

Future versions can integrate:

* Real YOLOv8 model inference
* InsightFace-based face embeddings
* FastAPI backend
* PostgreSQL database
* Real NFC/RFID integration
* GPS-based bus tracking
* Live camera-stream processing
* Cloud deployment
* Authentication and role-based access
* Advanced fraud detection models
* Real-time notifications

---

## 🎯 Project Goal

The goal of BusGuard AI is to demonstrate how **AI, computer vision, and intelligent transportation systems** can work together to reduce fare fraud and improve the passenger boarding experience.

> **Board Smart · Ride Fair · Pay Automatically**

---

## 👨‍💻 Author

**Lalit kumar**
GitHub:
https://github.com/lalitchauhan5577-boop

⭐ If you find this project interesting, consider giving it a star!
