import admin from 'firebase-admin';
const serviceAccount = require('../../serviceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
// for using firestore database and initializing all db collections and export them
const db = admin.firestore();
const usersCollection = db.collection('users');

export { admin, usersCollection };
