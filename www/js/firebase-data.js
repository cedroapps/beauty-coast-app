import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import {
    getFirestore,
    doc,
    collection,
    getDoc,
    getDocs,
    onSnapshot,
    setDoc,
    writeBatch,
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: 'AIzaSyD3J6dYitKBESGCr2f0uSw1T30akg96UOI',
    authDomain: 'agenda-beauty-58b31.firebaseapp.com',
    projectId: 'agenda-beauty-58b31',
    storageBucket: 'agenda-beauty-58b31.appspot.com',
    messagingSenderId: '302320173631',
    appId: '1:302320173631:web:ba77b140734e181b07ee8a',
    measurementId: 'G-2GM2S15L6S',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const cache = new Map();
let currentUid = null;
let userDataUnsubscribers = [];

const arrayCollections = {
    bc_appointments: 'appointments',
    bc_products: 'products',
};

function userDocument(path) {
    return doc(db, 'users', currentUid, ...path);
}

async function replaceCollection(key, value) {
    const collectionName = arrayCollections[key];
    const records = JSON.parse(value || '[]');
    const reference = collection(db, 'users', currentUid, collectionName);
    const existing = await getDocs(reference);
    const incomingIds = new Set(records.map(record => String(record.id)));
    const batch = writeBatch(db);

    existing.forEach(snapshot => {
        if (!incomingIds.has(snapshot.id)) batch.delete(snapshot.ref);
    });
    records.forEach(record => batch.set(doc(reference, String(record.id)), record));
    await batch.commit();
}

async function persist(key, value) {
    if (!currentUid) return;
    if (arrayCollections[key]) {
        await replaceCollection(key, value);
        return;
    }

    const settingsKeys = ['bc_settings', 'themeMode', 'themeIndex', 'bc_inv_sort', 'bc_onboarding_completed'];
    if (settingsKeys.includes(key)) {
        const profile = JSON.parse(cache.get('bc_settings') || '{}');
        await setDoc(userDocument(['settings', 'profile']), {
            ...profile,
            themeMode: cache.get('themeMode') === 'true',
            themeIndex: Number(cache.get('themeIndex') || 0),
            inventorySortMode: cache.get('bc_inv_sort') || 'brand',
            onboardingCompleted: cache.get('bc_onboarding_completed') === 'true',
        });
    }
}

window.userDataStore = {
    getItem(key) {
        return cache.get(key) ?? null;
    },
    setItem(key, value) {
        const normalizedValue = String(value);
        cache.set(key, normalizedValue);
        persist(key, normalizedValue).catch(error => console.error('Erro ao salvar dados:', error));
    },
    clear() {
        cache.clear();
    },
};

async function hydrateUserData(user) {
    currentUid = user.uid;
    userDataUnsubscribers.forEach(unsubscribe => unsubscribe());
    userDataUnsubscribers = [];
    cache.clear();

    const settingsSnapshot = await getDoc(userDocument(['settings', 'profile']));
    const settings = settingsSnapshot.exists() ? settingsSnapshot.data() : null;
    if (settings) {
        const { themeMode, themeIndex, inventorySortMode, onboardingCompleted, ...profile } = settings;
        cache.set('bc_settings', JSON.stringify(profile));
        cache.set('themeMode', String(Boolean(themeMode)));
        cache.set('themeIndex', String(themeIndex ?? 0));
        cache.set('bc_inv_sort', inventorySortMode || 'brand');
        cache.set('bc_onboarding_completed', String(Boolean(onboardingCompleted)));
    }

    for (const [key, collectionName] of Object.entries(arrayCollections)) {
        const snapshots = await getDocs(collection(db, 'users', currentUid, collectionName));
        cache.set(key, JSON.stringify(snapshots.docs.map(snapshot => snapshot.data())));
    }

    window.dispatchEvent(new CustomEvent('user-data-ready', { detail: { user } }));

    userDataUnsubscribers.push(onSnapshot(userDocument(['settings', 'profile']), snapshot => {
        if (!snapshot.exists()) return;
        const { themeMode, themeIndex, inventorySortMode, onboardingCompleted, ...profile } = snapshot.data();
        cache.set('bc_settings', JSON.stringify(profile));
        cache.set('themeMode', String(Boolean(themeMode)));
        cache.set('themeIndex', String(themeIndex ?? 0));
        cache.set('bc_inv_sort', inventorySortMode || 'brand');
        cache.set('bc_onboarding_completed', String(Boolean(onboardingCompleted)));
        window.dispatchEvent(new CustomEvent('user-data-ready', { detail: { user } }));
    }));

    for (const [key, collectionName] of Object.entries(arrayCollections)) {
        userDataUnsubscribers.push(onSnapshot(collection(db, 'users', currentUid, collectionName), snapshots => {
            cache.set(key, JSON.stringify(snapshots.docs.map(snapshot => snapshot.data())));
            window.dispatchEvent(new CustomEvent('user-data-ready', { detail: { user } }));
        }));
    }
}

onAuthStateChanged(auth, async user => {
    if (!user) {
        currentUid = null;
        userDataUnsubscribers.forEach(unsubscribe => unsubscribe());
        userDataUnsubscribers = [];
        cache.clear();
        window.dispatchEvent(new CustomEvent('user-data-cleared'));
        return;
    }

    try {
        await hydrateUserData(user);
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        window.dispatchEvent(new CustomEvent('user-data-error', { detail: { error } }));
    }
});

window.firebaseAuth = auth;
window.firebaseDB = db;