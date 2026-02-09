import { Session } from "@shopify/shopify-api";
import { firestore } from "./firebase.server";

const COLLECTION = "shopify_sessions";

/** Convert Firestore data → Shopify Session instance */
function hydrateSession(data) {
    if (!data) return undefined;

    const session = new Session({
        id: data.id,
        shop: data.shop,
        state: data.state,
        isOnline: data.isOnline,
    });

    session.scope = data.scope ?? null;
    session.accessToken = data.accessToken ?? null;
    session.expires = data.expires ? new Date(data.expires) : null;
    session.onlineAccessInfo = data.onlineAccessInfo ?? null;

    return session;
}

export const firebaseSessionStorage = {
    /** Store session in Firestore */
    async storeSession(session) {
        const sessionData = {
            id: session.id,
            shop: session.shop,
            state: session.state,
            isOnline: session.isOnline ?? false,
            scope: session.scope ?? null,
            accessToken: session.accessToken ?? null,
            expires: session.expires ? session.expires.toISOString() : null,
            onlineAccessInfo: session.onlineAccessInfo ?? null,
            clientId: session.apiKey,
            pixelID: null,
        };

        // Firestore-safe: remove any undefined
        Object.keys(sessionData).forEach(
            (key) => sessionData[key] === undefined && (sessionData[key] = null)
        );

        await firestore.collection(COLLECTION).doc(session.id).set(sessionData, {
            merge: true,
        });

        return session;
    },

    /** Load session by ID */
    async loadSession(id) {
        const snap = await firestore.collection(COLLECTION).doc(id).get();
        if (!snap.exists) return undefined;

        return hydrateSession(snap.data());
    },

    /** Delete one session */
    async deleteSession(id) {
        await firestore.collection(COLLECTION).doc(id).delete();
    },

    /** Delete multiple sessions */
    async deleteSessions(ids) {
        const batch = firestore.batch();
        ids.forEach((id) => {
            const ref = firestore.collection(COLLECTION).doc(id);
            batch.delete(ref);
        });
        await batch.commit();
    },

    /** Find all sessions for a shop (required by Shopify billing / reinstall logic) */
    async findSessionsByShop(shop) {
        const snap = await firestore
            .collection(COLLECTION)
            .where("shop", "==", shop)
            .get();

        if (snap.empty) return [];

        return snap.docs.map((doc) => hydrateSession(doc.data()));
    },
};
