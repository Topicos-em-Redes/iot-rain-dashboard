const { initializeApp } = require("firebase/app");
const { getDatabase } = require("firebase/database");

const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

module.exports = {
    db: getDatabase(app)
};