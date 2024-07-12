// src/lib/utils/create.js
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { clearCache } from "$lib/utils/get"; // Adjust import path as per your setup
import { db } from "$lib/firebase"; // Use the alias '@' to refer to the 'src' directory
import { browser } from "$app/environment";

// Function to generate an ID with 8 characters
const generateId = () => {
  return Math.random().toString(36).substr(2, 8);
};

export const createCategory = async (parentCategoryId, newCategoryName) => {
  try {
    if (!browser) return;

    const workspaceId = localStorage.getItem("workspace"); // Adjust according to your setup
    const docRef = doc(db, "workspaces", workspaceId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const workspaceData = docSnap.data();
      const newCategory = {
        id: generateId(), // Generate a unique ID for the new category
        name: newCategoryName,
        sub: [],
        templates: [],
      };

      const updatedCategories = addCategoryToData(
        workspaceData.categories,
        parentCategoryId,
        newCategory
      );

      await updateDoc(docRef, {
        categories: updatedCategories,
      });
      console.log(`Category with name "${newCategoryName}" added successfully`);
      clearCache();

      return newCategory; // Return the new category to update the UI
    } else {
      console.log("Workspace document not found");
    }
  } catch (error) {
    console.error("Error adding category:", error);
    throw error;
  }
};

// Function to recursively add a new category to the data array
export const addCategoryToData = (dataArray, parentCategoryId, newCategory) => {
  return dataArray.map((category) => {
    if (category.id === parentCategoryId) {
      // Add the new category to the sub array of the parent category
      return {
        ...category,
        sub: [...category.sub, newCategory],
      };
    } else if (category.sub && category.sub.length > 0) {
      // Category might be in sub-categories, recursively check
      const updatedSub = addCategoryToData(
        category.sub,
        parentCategoryId,
        newCategory
      );
      return {
        ...category,
        sub: updatedSub,
      };
    } else {
      return category; // No changes needed
    }
  });
};
