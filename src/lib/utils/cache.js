// src/lib/utils/cache.js
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  updateDoc,
  documentId,
} from "firebase/firestore";
import { db } from "$lib/firebase";
import { browser } from "$app/environment";

export async function updateWorkspaceArray(
  workspaceId,
  collection,
  docId,
  remove = false
) {
  if (!browser) return;

  const docRef = doc(db, "workspaces", workspaceId);

  const workspaceDoc = await getDoc(docRef);
  if (!workspaceDoc.exists()) return;

  const collectionData = workspaceDoc.data()[collection] || {};

  if (remove) {
    delete collectionData[docId];

    // Also remove from localStorage
    const cachedCollection = JSON.parse(localStorage.getItem(collection)) || {};
    delete cachedCollection[docId];
    localStorage.setItem(collection, JSON.stringify(cachedCollection));
  } else {
    collectionData[docId] = {
      lastUpdated: new Date(),
      // Any other necessary metadata can be added here
    };
  }

  await updateDoc(docRef, {
    [collection]: collectionData,
  });
}

// Function to add lastUpdated timestamp to templates in a recursive structure
export async function updateTemplatesWithTimestamp(
  workspaceId = localStorage.getItem("workspace")
) {
  if (!browser) return;

  if (!workspaceId) {
    throw new Error("Workspace ID is not set in local storage.");
  }

  // Get a reference to the workspace document
  const workspaceDocRef = doc(db, "workspaces", workspaceId);

  const workspaceDoc = await getDoc(workspaceDocRef);

  // Recursively update templates with lastUpdated timestamp
  function updateCategories(categories) {
    categories.forEach((category) => {
      // If templates exist, update each with the lastUpdated timestamp
      if (category.templates && Array.isArray(category.templates)) {
        category.templates = category.templates.map((template) => ({
          ...template,
          lastUpdated: new Date(),
        }));
      }

      // If subcategories exist, recursively update them
      if (category.sub && Array.isArray(category.sub)) {
        updateCategories(category.sub);
      }
    });
  }

  // Update the categories array with new timestamps
  const updatedCategories = [...workspaceDoc.data().categories];
  updateCategories(updatedCategories);

  // Update the workspace document in Firestore with the new data
  await updateDoc(workspaceDocRef, {
    categories: updatedCategories,
  });

  return updatedCategories;
}

const MAX_BATCH_SIZE = 10; // Firestore `in` operator limit

// Helper function to recursively traverse categories and update templates
function traverseCategories(categories, cachedData, idsToFetch) {
  return categories.map((category) => {
    if (category.templates) {
      // Update templates inside this category
      category.templates = category.templates.map((template) => {
        const templateId = template.id;
        const cachedTemplate = cachedData[templateId];
        const lastFetched = cachedTemplate?.lastFetched
          ? new Date(cachedTemplate.lastFetched)
          : null;
        const lastUpdated = template.lastUpdated
          ? new Date(
              template.lastUpdated.seconds * 1000 +
                template.lastUpdated.nanoseconds / 1000000
            )
          : null;

        if (lastFetched && lastUpdated && lastFetched > lastUpdated) {
          // Add cached content to the template
          return { ...template, content: cachedTemplate.data };
        } else {
          // Mark this template to be fetched later
          idsToFetch.push(templateId);
          return template; // Keep the structure, content will be added later
        }
      });
    }

    // Recursively handle subcategories
    if (category.sub && category.sub.length > 0) {
      category.sub = traverseCategories(category.sub, cachedData, idsToFetch);
    }

    return category;
  });
}

export async function getCategoriesAndCachedTemplates() {
  if (!browser) return;

  const workspaceId = localStorage.getItem("workspace");
  if (!workspaceId) {
    throw new Error("Workspace ID is not set in local storage.");
  }

  const workspaceDocRef = doc(db, "workspaces", workspaceId);
  const workspaceDocSnap = await getDoc(workspaceDocRef);

  if (!workspaceDocSnap.exists()) {
    throw new Error("Workspace document does not exist.");
  }

  const workspaceDoc = workspaceDocSnap.data();
  const categories = workspaceDoc.categories;

  if (!categories) {
    throw new Error("No categories found in the workspace document.");
  }

  const cachedTemplates = JSON.parse(localStorage.getItem("templates")) || {};
  const idsToFetch = [];

  // Traverse categories and update templates with cached content if available
  const updatedCategories = traverseCategories(
    categories,
    cachedTemplates,
    idsToFetch
  );

  console.log("IDs to fetch: ", idsToFetch);

  if (idsToFetch.length > 0) {
    for (let i = 0; i < idsToFetch.length; i += MAX_BATCH_SIZE) {
      const batchIds = idsToFetch.slice(i, i + MAX_BATCH_SIZE);

      // Construct the query to fetch the required templates by ID
      const collectionRef = collection(
        db,
        `workspaces/${workspaceId}/templates`
      );
      const q = query(collectionRef, where(documentId(), "in", batchIds));
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((docSnap) => {
        if (docSnap.exists()) {
          const templateId = docSnap.id;
          const templateData = docSnap.data();

          // Update or add the template in the cached data object
          cachedTemplates[templateId] = {
            lastFetched: new Date().toISOString(),
            data: templateData,
          };

          // Now update the `updatedCategories` structure to include the fetched data
          updatedCategories.forEach((category) => {
            category.templates = category.templates.map((template) => {
              if (template.id === templateId) {
                return { ...template, content: templateData };
              }
              return template;
            });

            if (category.sub) {
              category.sub.forEach((subcategory) => {
                subcategory.templates = subcategory.templates.map(
                  (template) => {
                    if (template.id === templateId) {
                      return { ...template, content: templateData };
                    }
                    return template;
                  }
                );
              });
            }
          });
        }
      });
    }

    // Save the updated categories data back to localStorage
    localStorage.setItem("templates", JSON.stringify(cachedTemplates));
  }

  // Return the updated categories structure with template content
  return updatedCategories;
}
