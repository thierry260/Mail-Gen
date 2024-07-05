// src/lib/workspaceService.js
import { doc, getDoc } from "firebase/firestore";
import db from "$lib/firebase"; // Use the alias '@' to refer to the 'src' directory

let cachedTemplateData = {};

export async function fetchTemplateData(templateId) {
    if (cachedTemplateData[templateId]) {
      return cachedTemplateData[templateId];
    }
  
    try {
    console.log(templateId);
      const templateDocRef = doc(db, "workspaces", "wms", "templates", templateId);
      const templateDocSnap = await getDoc(templateDocRef);
      console.log("template - getDoc");
  
      if (templateDocSnap.exists()) {
        cachedTemplateData[templateId] = templateDocSnap.data();
        return cachedTemplateData[templateId];
      } else {
        console.log(`Template with ID ${templateId} not found`);
        return null;
      }
    } catch (error) {
      console.error("Error fetching template document:", error);
      return null;
    }
  }
