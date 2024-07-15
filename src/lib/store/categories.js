import { writable } from 'svelte/store';
import { fetchWorkspaceData } from "$lib/utils/get"; // Adjust import path as per your setup

const loadInitialCategories = async () => {
    try {
        const initialCategories = await fetchWorkspaceData("categories");
        return initialCategories || [];
    } catch (error) {
        console.error("Error fetching initial categories:", error);
        return []; // Return an empty array or handle error as per your application's logic
    }
};

// Initialize writable store with initial value from API call
const categories = writable([]);

// Load initial categories asynchronously
loadInitialCategories().then(initialData => {
    categories.set(initialData);
});

// Function to toggle category open state
const toggleCategoryOpenRecursive = (categories, categoryId) => {
    return categories.map(category => {
        if (category.id === categoryId) {
            return { ...category, open: !category.open };
        }
        if (category.sub) {
            return {
                ...category,
                sub: toggleCategoryOpenRecursive(category.sub, categoryId)
            };
        }
        return category;
    });
};

export const toggleCategoryOpen = (categoryId) => {
    categories.update(currentCategories =>
        toggleCategoryOpenRecursive(currentCategories, categoryId)
    );
};

// Function to update categories while preserving open states
const preserveOpenStates = (oldCategories, newCategories) => {
    const openStateMap = new Map();
    const saveOpenState = (categories) => {
        categories.forEach((category) => {
            openStateMap.set(category.id, category.open);
            if (category.sub) {
                saveOpenState(category.sub);
            }
        });
    };
    saveOpenState(oldCategories);

    const applyOpenState = (categories) => {
        return categories.map((category) => {
            const open = openStateMap.get(category.id) || false;
            if (category.sub) {
                return {
                    ...category,
                    open,
                    sub: applyOpenState(category.sub)
                };
            }
            return { ...category, open };
        });
    };
    return applyOpenState(newCategories);
};

export const updateCategories = (newCategories) => {
    categories.update(oldCategories => preserveOpenStates(oldCategories, newCategories));
};

export default categories;
