// src/lib/utils.js
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { clearCache } from "$lib/utils/get"; // Adjust import path as per your setup
import { db } from "$lib/firebase"; // Use the alias '@' to refer to the 'src' directory

export const deleteCategory = async (categoryId) => {
  try {
    const workspaceId = "wms"; // Adjust according to your setup
    const docRef = doc(db, "workspaces", workspaceId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const workspaceData = docSnap.data();
      const updatedCategories = removeCategoryFromData(
        workspaceData.categories,
        categoryId
      );

      await updateDoc(docRef, {
        categories: updatedCategories,
      });
      console.log(`Category with ID ${categoryId} deleted successfully`);
      clearCache();
    } else {
      console.log("Workspace document not found");
    }
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
};

// Function to recursively remove category from data array
export const removeCategoryFromData = (dataArray, categoryIdToDelete) => {
  return dataArray
    .map((category) => {
      if (category.id === categoryIdToDelete) {
        // Category found at this level, remove it
        return null;
      } else if (category.sub && category.sub.length > 0) {
        // Category might be in sub-categories, recursively check
        const updatedSub = removeCategoryFromData(
          category.sub,
          categoryIdToDelete
        );
        return {
          ...category,
          sub: updatedSub.filter(Boolean), // Remove null entries
        };
      } else {
        return category; // No changes needed
      }
    })
    .filter(Boolean); // Remove null entries
};
