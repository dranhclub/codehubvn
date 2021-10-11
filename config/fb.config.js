/* Firebase admin */ 
var admin = require('firebase-admin');
var serviceAccount = require("../codehubvn-firebase-adminsdk-gy7iq-c6cb57b8a7.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

/* Init database */

async function initDatabase() {
  const db = admin.firestore();
  // if (location.hostname === "localhost") {
  //   db.useEmulator("localhost", 8080);
  // }
  
  var ref = db.collection("metadata").doc("users");
  var snapshot = await ref.get();
  if (!snapshot.exists) {
    ref.set({
      lastId: 10000
    });
  }

  ref = db.collection("metadata").doc("questions");
  snapshot = await ref.get();
  if (!snapshot.exists) {
    ref.set({
      questionOrder: {
        normal: [],
        hard: []
      },
      payQuestion: {
        normal: 2,
        hard: 3
      },
      lastId: 0
    });
  }

  ref = db.collection("metadata").doc("others");
  snapshot = await ref.get();
  if (!snapshot.exists) {
    ref.set({
      playRule: "play rule"
    });
  }
}

initDatabase();

/* Firebase client */
var firebase = require("firebase/app");
require("firebase/analytics");
require("firebase/auth");
require("firebase/firestore");



var firebaseConfig = {
  apiKey: "AIzaSyCDfxUnzndLfCGAZfSfBQ4kFGYxetEsz2c",
  authDomain: "codehubvn.firebaseapp.com",
  projectId: "codehubvn",
  storageBucket: "codehubvn.appspot.com",
  messagingSenderId: "383165045388",
  appId: "1:383165045388:web:9cb01c6c15830a5402f9a9",
  measurementId: "G-JMWQXQ0LNB"
};

firebase.initializeApp(firebaseConfig);


