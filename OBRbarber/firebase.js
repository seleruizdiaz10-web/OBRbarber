import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { 
    collection, getFirestore, addDoc, getDocs, onSnapshot, 
    deleteDoc, doc, getDoc, updateDoc 
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBthyywvch8cWK8Lzvf6HHFT45b7e7awi0",
  authDomain: "obrbarber.firebaseapp.com",
  projectId: "obrbarber",
  storageBucket: "obrbarber.firebasestorage.app",
  messagingSenderId: "79548204734",
  appId: "1:79548204734:web:a947f4e972d75b3e03c0ef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore();

export const saveTurno = (turno) => addDoc(collection(db, 'turnos'), turno);
export const onGetTurnos = (callback) => onSnapshot(collection(db, 'turnos'), callback);
export const deleteTurno = (id) => deleteDoc(doc(db, 'turnos', id));
export const getTurno = (id) => getDoc(doc(db, 'turnos', id));
export const updateTurno = (id, campos) => updateDoc(doc(db, 'turnos', id), campos);

export const saveUsuario = (usuario) => addDoc(collection(db, 'usuarios'), usuario);
export const getUsuarios = () => getDocs(collection(db, 'usuarios'));