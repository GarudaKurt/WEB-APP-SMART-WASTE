import admin from "firebase-admin";
import path from "path";

const serviceAccount = path.resolve("../../config/serviceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://smart-waste-davao-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const ref = admin.database().ref("/activation/enabled");

ref.once("value")
  .then(snapshot => console.log("Firebase read OK:", snapshot.val()))
  .catch(err => console.error("Firebase read FAILED:", err));
