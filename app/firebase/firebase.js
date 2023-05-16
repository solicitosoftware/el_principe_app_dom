import app from 'firebase/app';
import 'firebase/firestore';
import 'firebase/storage';
import 'firebase/auth';
import FirebaseConfig from './serviceAccountKeyQA';

//Constructor de metodos de firebase a utilizar
class Firebase {
  constructor() {
    if (!app.apps.length) {
      app.initializeApp(FirebaseConfig);
      app.firestore().settings({experimentalForceLongPolling: true});
    }
    this.db = app.firestore();
    this.storage = app.storage();
    this.auth = app.auth();
    this.time = app.firestore.FieldValue.serverTimestamp();
  }
}

const firebase = new Firebase();
export default firebase;
