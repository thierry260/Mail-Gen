// src/lib/workspaceService.js
import { doc, getDoc } from "firebase/firestore";
import db from "$lib/firebase"; // Use the alias '@' to refer to the 'src' directory

let cachedWorkspaceData = null;

export async function fetchWorkspaceData(fieldName = null) {
  if (!cachedWorkspaceData) {
    try {
      const docRef = doc(db, "workspaces", "wms"); // Pas aan naar jouw Firestore pad
      const docSnap = await getDoc(docRef);
      console.log("workspace - getDoc");

      if (docSnap.exists()) {
        cachedWorkspaceData = docSnap.data();
      } else {
        console.log("Document not found");
        return null;
      }
    } catch (error) {
      console.error("Error fetching document: ", error);
      return null;
    }
  }

  if (fieldName) {
    return cachedWorkspaceData[fieldName] ?? null;
  }

  return cachedWorkspaceData;
}

export function clearCache() {
  cachedWorkspaceData = null;
}
