const { initializeApp } = require("firebase/app");
const { getDatabase } = require("firebase/database");

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "",
  authDomain: "ttredes-iot.firebaseapp.com",
  databaseURL: "https://ttredes-iot-default-rtdb.firebaseio.com",
  projectId: "ttredes-iot",
  storageBucket: "ttredes-iot.appspot.com",
  messagingSenderId: process.env.FIREBASE_SENDER_ID || "",
  appId: process.env.FIREBASE_APP_ID || ""
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

module.exports = {
    db: getDatabase(app)
};