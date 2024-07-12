import { doc, updateDoc, getDoc, deleteDoc } from "firebase/firestore";
import { clearCache } from "$lib/utils/get"; // Adjust import path as per your setup
import { db } from "$lib/firebase"; // Use the alias '@' to refer to the 'src' directory
import { browser } from "$app/environment";

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

// export const deleteCategory = async (categoryId) => {
//   try {
//     if (!browser) return;

//     const workspaceId = localStorage.getItem("workspace"); // Adjust according to your setup
//     const docRef = doc(db, "workspaces", workspaceId);
//     const docSnap = await getDoc(docRef);

//     if (docSnap.exists()) {
//       const workspaceData = docSnap.data();
//       const { updatedCategories, templateIdsToDelete } =
//         removeCategoryAndCollectTemplates(workspaceData.categories, categoryId);

//       await updateDoc(docRef, {
//         categories: updatedCategories,
//       });

//       // Delete all template documents
//       const deleteTemplatePromises = templateIdsToDelete.map((templateId) => {
//         const templateDocRef = doc(
//           db,
//           "workspaces",
//           workspaceId,
//           "templates",
//           templateId
//         );
//         return deleteDoc(templateDocRef);
//       });
//       await Promise.all(deleteTemplatePromises);

//       console.log(
//         `Category with ID ${categoryId} and its templates deleted successfully`
//       );
//       clearCache();
//     } else {
//       console.log("Workspace document not found");
//     }
//   } catch (error) {
//     console.error("Error deleting category:", error);
//     throw error;
//   }
// };

// Function to recursively remove category from data array and collect template IDs
export const removeCategoryAndCollectTemplates = (
  dataArray,
  categoryIdToDelete
) => {
  let templateIdsToDelete = [];

  const updatedDataArray = dataArray
    .map((category) => {
      if (category.id === categoryIdToDelete) {
        // Collect template IDs from this category
        if (category.templates) {
          templateIdsToDelete = templateIdsToDelete.concat(
            category.templates.map((t) => t.id)
          );
        }
        // Category found at this level, remove it
        return null;
      } else if (category.sub && category.sub.length > 0) {
        // Category might be in sub-categories, recursively check
        const { updatedSub, subTemplateIds } =
          removeCategoryAndCollectTemplates(category.sub, categoryIdToDelete);
        templateIdsToDelete = templateIdsToDelete.concat(subTemplateIds);
        return {
          ...category,
          sub: updatedSub.filter(Boolean), // Remove null entries
        };
      } else {
        return category; // No changes needed
      }
    })
    .filter(Boolean); // Remove null entries from top level

  return { updatedCategories: updatedDataArray, templateIdsToDelete };
};

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
