"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.firestoreAdmin = exports.auth = exports.db = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
console.log(clientEmail);
const privateKey = process.env.FIREBASE_PRIVATE_KEY;
if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase environment variables");
}
if (!firebase_admin_1.default.apps.length) {
    firebase_admin_1.default.initializeApp({
        credential: firebase_admin_1.default.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
    });
}
exports.db = firebase_admin_1.default.firestore();
exports.auth = firebase_admin_1.default.auth();
exports.firestoreAdmin = firebase_admin_1.default.firestore;
//# sourceMappingURL=firebase.js.map