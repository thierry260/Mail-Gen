<script>
  import { onMount, onDestroy } from "svelte";
  import { page } from "$app/stores";
  import { writable } from "svelte/store";
  import { goto } from "$app/navigation";
  import { fetchWorkspaceData, fetchTemplateData } from "$lib/utils/get";
  import { updateTemplateNameinDB } from "$lib/utils/set";
  import { deleteTemplate } from "$lib/utils/delete";
  import { templatesStore } from "$lib/stores/templates";
  import { get } from "svelte/store";
  import { browser } from "$app/environment";
  import { updateDoc, doc, getDoc, setDoc } from "firebase/firestore"; // Import Firestore update function
  import { db } from "$lib/firebase"; // Adjust the import path if necessary
  import Header from "$lib/components/header/Header.svelte";
  import { user } from "$lib/stores/user";
  import toast from "svelte-french-toast";
  import Sortable from "sortablejs";

  import {
    Star,
    TrashSimple,
    PencilSimple,
    X,
    CopySimple,
    EnvelopeSimple,
    ListBullets,
    ListNumbers,
    ArrowUUpLeft,
    ArrowUUpRight,
    FloppyDisk,
    BracketsCurly,
    DotsSixVertical,
    GearSix,
    CaretRight,
  } from "phosphor-svelte";
  import { Editor, generateHTML, Node, mergeAttributes } from "@tiptap/core";
  import StarterKit from "@tiptap/starter-kit";
  import Placeholder from "@tiptap/extension-placeholder";
  import BulletList from "@tiptap/extension-bullet-list";
  import OrderedList from "@tiptap/extension-ordered-list";
  import ListItem from "@tiptap/extension-list-item";
  import History from "@tiptap/extension-history";
  import Underline from "@tiptap/extension-underline";
  import Bold from "@tiptap/extension-bold";
  import Italic from "@tiptap/extension-italic";
  import BubbleMenu from "@tiptap/extension-bubble-menu";

  import "intro.js/introjs.css";
  import introJs from "intro.js";

  let id;
  let templateData = {};
  let templateContentHTML = "";
  let workspaceVariables = { variables: {} }; // Ensure workspaceVariables is initialized with a default structure
  let userInput = {};
  let isNextStage = false; // Control the visibility of stages
  let mail = {};
  let isActive = false;
  let isEditMode = false; // Toggle for edit mode
  let selectedVariable = ""; // Track the selected variable for insertion
  let isFavorite = false;
  let showVariablePopup = false; // State to control the popup visibility
  let variableSearchQuery = "";
  let newVariable = { field_name: "", placeholder: "" };
  let variableInput = false;
  let showPlaceholderField = false; // State to control placeholder field visibility
  let inputRefs = []; // Array to hold references to each input
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  let editorElement;
  let editor;
  let addVariableEl;
  let shouldShow = false;
  let editingVariable = false;
  let focusedId = -1;

  $: {
    if (inputRefs[0]) {
      setTimeout(() => {
        inputRefs[0].focus();
        inputRefs[0].select();
      }, 50);
    }
  }

  $: console.log("should show state: ", shouldShow);

  let hasActiveSubscription = false;
  let currentUser;
  $: {
    currentUser = $user;

    if (currentUser && currentUser.subscriptionActive === true) {
      hasActiveSubscription = true;
    }
  }

  // Subscribe to the page store to get the ID parameter
  $: id = $page.params.id;
  const Variable = Node.create({
    name: "variable",
    group: "inline",
    inline: true,
    atom: true,

    addAttributes() {
      return {
        id: {
          default: null,
        },
        variable: {
          default: null,
        },
        placeholder: {
          default: "",
        },
      };
    },

    parseHTML() {
      return [
        {
          tag: "code[data-variable][data-id][data-placeholder]",
        },
      ];
    },

    renderHTML({ HTMLAttributes, node }) {
      return [
        "code",
        mergeAttributes(HTMLAttributes, {
          "data-id": node.attrs.id || "",
          "data-variable": node.attrs.variable || "",
          "data-placeholder": node.attrs.placeholder || "",
          // contenteditable: "true",
        }),
        `{{${node.attrs.placeholder || node.attrs.variable || ""}}}`,
      ];
    },

    addNodeView() {
      return ({ node, getPos, view }) => {
        const dom = document.createElement("code");
        dom.classList.add("variable");
        dom.setAttribute("data-id", node.attrs.id || "");
        dom.setAttribute("data-variable", node.attrs.variable || "");
        dom.setAttribute("data-placeholder", node.attrs.placeholder || "");
        // dom.setAttribute("contenteditable", "true");
        // dom.textContent = `{{${node.attrs.variable || node.attrs.placeholder || ""}}}`; // Discuss
        dom.textContent = `{{${node.attrs.placeholder || node.attrs.variable || ""}}}`;

        dom.addEventListener("click", () => {
          if (!view) {
            console.error("Editor view is not available");
            return;
          }
          editingVariable = true;
          shouldShow = true;
          if (editor) {
            editor.chain().focus().run();
          }
          // const variable = prompt("Edit variable", node.attrs.variable);
          // if (variable) {
          //   view.dispatch(
          //     view.state.tr.setNodeMarkup(getPos(), null, { variable })
          //   );
          // }
        });

        return {
          dom,
        };
      };
    },
  });

  function isJson(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  // Fetch all data for the component
  const fetchWorkspaceAndTemplateData = async () => {
    try {
      templateData = await fetchTemplateData(id);

      workspaceVariables = (await fetchWorkspaceData()) || { variables: {} }; // Ensure workspaceVariables is not null

      // Ensure workspaceVariables has a variables property
      if (!workspaceVariables.variables) {
        workspaceVariables.variables = {};
      }

      // Helper function to extract variable IDs from nested content
      const extractVariableIds = (content) => {
        const variableIds = [];
        const extract = (items) => {
          if (Array.isArray(items)) {
            // console.log("items is array");
            items.forEach((item) => {
              if (item.type === "variable" && item.attrs && item.attrs.id) {
                // console.log("item with type variable found");
                variableIds.push(item.attrs.id);
              }
              if (item.content && Array.isArray(item.content)) {
                // console.log("go deeper");
                extract(item.content);
              }
            });
          } else {
            // console.log("items is not array");
          }
        };
        extract(content);
        return variableIds;
      };

      const variableIds = extractVariableIds(templateData.content.content);

      // Initialize user input fields with placeholders
      if (variableIds.length > 0) {
        userInput = {};
        variableIds.forEach((variableId) => {
          if (workspaceVariables.variables[variableId]) {
            userInput[variableId] =
              workspaceVariables.variables[variableId].placeholder || "";
          }
        });
      }

      if (
        templateData &&
        templateData.content &&
        typeof templateData.content === "object" &&
        !Array.isArray(templateData.content) &&
        templateData.content !== null
      ) {
        templateContentHTML = generateHTML(templateData.content, [
          StarterKit,
          BulletList,
          OrderedList,
          ListItem,
          Variable,
          History,
          Bold,
          Italic,
          Underline,
        ]);
      } else {
        templateContentHTML = templateData.content;
      }

      // console.log(templateContentHTML);

      templateData.id = id;

      // Save to localStorage as recently viewed template
      saveRecentlyViewedTemplate(templateData);

      // Load favorite state after fetching template data
      loadFavoriteState();
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  $: {
    if (id) {
      // Clear the previous template content and data
      templateData = {};
      templateContentHTML = "";
      userInput = {}; // Clear user inputs as well
      updatePreviewContent(); // Clear preview content immediately

      isNextStage = false;

      // Set whether the template is in edit mode
      isEditMode = browser && window.location.hash.includes("#edit");

      // Fetch the template and update the UI
      fetchWorkspaceAndTemplateData().then(() => {
        updatePreviewContent();
      });
    }
  }

  $: if (!isEditMode && editor) {
    editor.destroy();
  }

  $: if (shouldShow && variableInput) {
    setTimeout(() => {
      variableInput.focus();
    }, 251);
  }

  // Initialize the editor when isEditMode becomes true
  $: if (editorElement) {
    fetchWorkspaceAndTemplateData().then(() => {
      initializeEditor();
    });
  }

  // Store for the search query
  const variablesListSearch = writable("");
  let filteredVariables = [];

  $: {
    if (isEditMode && workspaceVariables.variables) {
      console.log("init sortable");
      // Reactive statement to filter variables based on the search query
      filteredVariables = Object.entries(workspaceVariables.variables).filter(
        ([id, data]) =>
          data.field_name
            .toLowerCase()
            .includes($variablesListSearch.toLowerCase())
      );

      setTimeout(() => {
        const list = document.getElementById("variables_list_ul");

        if (list) {
          // Initialize Sortable.js
          Sortable.create(list, {
            group: {
              name: "variables",
              pull: "clone",
              put: false, // prevents items from being moved within the list itself
            },
            sort: false, // Disable sorting within the list
            animation: 150,
            draggable: "li", // Draggable items are <li> elements
            onEnd(evt) {
              // This gets triggered when an item is dropped into another container
              const item = evt.item;
              const id = item.getAttribute("data-id");
              const variable = item.getAttribute("data-variable");
              const placeholder = item.getAttribute("data-placeholder");

              console.log(evt);

              // Insert the variable into the tiptap editor
              insertVariable({ id, variable, placeholder });
            },
          });
        }
      }, 20);
    }
  }

  const parseVariables = (content) => {
    const regex = /{{(.*?)}}/g;
    let match;
    const result = [];

    let lastIndex = 0;
    while ((match = regex.exec(content)) !== null) {
      const [fullMatch, variableName] = match;
      const startIndex = match.index;
      const endIndex = regex.lastIndex;

      if (lastIndex < startIndex) {
        result.push(content.slice(lastIndex, startIndex));
      }

      result.push({
        type: "variable",
        attrs: { variable: variableName },
      });

      lastIndex = endIndex;
    }

    if (lastIndex < content.length) {
      result.push(content.slice(lastIndex));
    }

    return result;
  };

  const initializeEditor = () => {
    if (!editorElement) return;

    const initialContent = templateContentHTML; // Fetch or define your initial content
    const parsedContent = parseVariables(initialContent);

    shouldShow = false;
    editingVariable = false;

    editor = new Editor({
      content: templateData.content,
      element: editorElement,
      extensions: [
        StarterKit.configure({
          history: false,
          heading: {
            levels: [1, 2, 3, 4, 5, 6],
          },
        }),
        Placeholder.configure({
          placeholder:
            "Begin met schrijven. Gebruik 'Shift + {' om een variabele toe te voegen.",
        }),
        BulletList,
        OrderedList,
        ListItem,
        Variable,
        History,
        Bold,
        Italic,
        Underline,
        BubbleMenu.configure({
          element: addVariableEl, // Set the element for the bubble menu
          tippyOptions: {
            placement: "bottom", // Position the menu below the cursor\
            animation: "shift-away",
            interactive: true,
          },
          shouldShow: ({ editor }) => {
            // Only show the bubble menu if there's a selection or focus on the editor
            return shouldShow;
          },
        }).extend({
          addKeyboardShortcuts() {
            return {
              "Mod-Shift-[": (e) => {
                shouldShow = true; // Show the bubble menu

                triggerEditorChange();
              },
            };
          },
        }),
      ],
      onTransaction: () => {
        editor = editor; // force re-render so `editor.isActive` works as expected
      },
    });

    // Add event listener to hide the bubble menu on click in the editor
    editorElement.addEventListener("click", (e) => {
      if (e.target.nodeName == "CODE" || e.target.nodeName == "BUTTON") return;
      console.log(e);
      console.log("clicked");
      shouldShow = false; // Hide the bubble menu
      editingVariable = false;
      triggerEditorChange();
    });
  };

  const toggleFavorite = () => {
    if (!hasActiveSubscription) {
      toast.error("Actief abonnement vereist", {
        position: "bottom-right",
      });
      return;
    }

    isFavorite = !isFavorite;
    saveFavoriteState();

    if (isFavorite) {
      toast.success("Favoriet toegevoegd", {
        position: "bottom-right",
      });
    } else {
      toast.success("Favoriet verwijderd", {
        position: "bottom-right",
      });
    }
  };

  const saveFavoriteState = () => {
    if (browser) {
      let favoriteTemplates =
        JSON.parse(localStorage.getItem("favoriteTemplates")) || [];

      const index = favoriteTemplates.findIndex(
        (item) => item.id === templateData.id
      );

      if (isFavorite && index === -1) {
        favoriteTemplates.unshift(templateData);
      } else if (!isFavorite && index !== -1) {
        favoriteTemplates.splice(index, 1);
      }

      localStorage.setItem(
        "favoriteTemplates",
        JSON.stringify(favoriteTemplates)
      );
    } else {
      console.warn("localStorage is not available in this environment.");
    }
  };

  const loadFavoriteState = () => {
    if (browser) {
      let favoriteTemplates =
        JSON.parse(localStorage.getItem("favoriteTemplates")) || [];

      isFavorite = favoriteTemplates.some(
        (item) => item.id === templateData.id
      );
    } else {
      console.warn("localStorage is not available in this environment.");
    }
  };

  const triggerEditorChange = () => {
    const { state, view } = editor;
    const { from, to } = state.selection; // Get the current cursor position

    if (from == to) {
      editor
        .chain()
        .focus()
        .insertContent(" ") // Insert the space
        .run();
      document.execCommand("delete");
      editor.chain().focus().run(); // Execute the selection
    }
  };

  // Function to handle key combination
  function handleKeyDown(event) {
    // Check if the active element is an input or textarea
    const isInputFocused =
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement;

    // Check for Ctrl/Cmd + C
    if ((event.ctrlKey || event.metaKey) && event.key === "c") {
      if (!isInputFocused) {
        // Only trigger if not focused on an input element
        event.preventDefault(); // Prevent the default copy action
        copyToClipboard(false);
      }
      return; // Exit early to prevent further processing
    }

    if (!isEditMode) return; // Edit mode shortcuts below

    // Check for Ctrl/Cmd + S
    if ((event.ctrlKey || event.metaKey) && event.key === "s") {
      event.preventDefault(); // Prevent the default save action in the browser
      saveTemplate(); // Trigger the saveTemplate function
    }

    // Check for Escape key
    if (event.key === "Escape") {
      if (shouldShow) {
        shouldShow = false;
        editingVariable = false;
        triggerEditorChange();
      }
    }
  }

  // Call updatePreviewContent initially after fetching data
  onMount(() => {
    if (id) {
      fetchWorkspaceAndTemplateData().then(() => {
        updatePreviewContent();
      });
      fetchVariables();
      document.addEventListener("keydown", handleKeyDown);
    }

    if (!isEditMode) {
      startTemplateTour();

      document
        .querySelector(".preview-content")
        .addEventListener("click", function (event) {
          // Check if the clicked element or any of its parents is a `code[data-variable]` element
          const codeElement = event.target.closest("code[data-variable]");
          // If a matching element is found, log 'test'
          if (codeElement) {
            const id = codeElement.dataset.id;
            const inputElement = document.querySelector(
              `.variables input[id="${id}"]`
            );
            if (inputElement) {
              inputElement.focus();
              inputElement.select();
            }
          }
        });
    } else {
      startEditTemplateTour();
    }
  });

  onDestroy(() => {
    document.removeEventListener("keydown", handleKeyDown);
    if (editor) {
      editor.destroy();
    }
  });

  const templateTour = introJs();
  const startTemplateTour = () => {
    if (!browser) return;

    setTimeout(() => {
      templateTour
        .setOptions({
          showProgress: true,
          showBullets: false,
          showStepNumbers: true,
          dontShowAgain: true,
          hidePrev: true,
          exitOnOverlayClick: false,
          dontShowAgainLabel: "Laat dit niet meer zien",
          stepNumbersOfLabel: "van",
          nextLabel: "Volgende",
          prevLabel: "Vorige",
          doneLabel: "Klaar",
          buttonClass: "button",
          dontShowAgainCookie: "template-dontShowAgain",
          steps: [
            {
              title: "Template uitleg 👀",
              intro: "We helpen je graag op weg met een korte uitleg.",
            },
            {
              title: "Variabelen",
              element: document.querySelector(".template > .variables"),
              intro:
                "Hier vind je de variabelen die zijn toegewezen aan deze template. Pas deze aan om de gewenste email voor te bereiden.",
            },
            {
              title: "Voorbeeld",
              element: document.querySelector(".template > .preview"),
              intro:
                "In het voorbeeld vind je de mail die is opgesteld op basis van de ingevoerde variabelen.",
            },
            {
              title: "Actieknoppen",
              element: document.querySelector("main > .buttons"),
              intro:
                "Wanneer je tevreden bent met de mail, kun je de mail met deze knoppen in gebruik nemen.",
            },
            {
              title: "Kopiëren",
              element: document.querySelector("main > .buttons .copy_mail"),
              intro:
                "Met deze knop kun je de email kopiëren. Je kunt de mail vervolgens plakken op een gewenste locatie.",
            },
            {
              title: "Mailen",
              element: document.querySelector("main > .buttons .mail_mail"),
              intro:
                "Met deze knop kun je direct je email programma openen. Het enige wat je nog hoeft te doen is te plakken.",
            },
            {
              title: "Actieknoppen",
              element: document.querySelector("header > .actions"),
              intro:
                "Deze knoppen maken het mogelijk om de template aan te passen, te verwijderen of op te slaan als favoriet.",
            },
          ],
        })
        .start();
    }, 550);
  };

  const editTemplateTour = introJs();
  const startEditTemplateTour = () => {
    if (!browser) return;

    setTimeout(() => {
      editTemplateTour
        .setOptions({
          showProgress: true,
          showBullets: false,
          showStepNumbers: true,
          dontShowAgain: true,
          hidePrev: true,
          exitOnOverlayClick: false,
          dontShowAgainLabel: "Laat dit niet meer zien",
          stepNumbersOfLabel: "van",
          nextLabel: "Volgende",
          prevLabel: "Vorige",
          doneLabel: "Klaar",
          buttonClass: "button",
          dontShowAgainCookie: "templateEdit-dontShowAgain",
          steps: [
            {
              title: "Template aanpassen ✏️",
              intro: "We helpen je graag op weg met een korte uitleg.",
            },
            {
              title: "Template naam",
              element: document.querySelector("#editTemplateName"),
              intro: "Hier kun je de naam van de template aanpassen.",
            },
            {
              title: "Template inhoud",
              element: document.querySelector(".editor_outer"),
              intro: "Hier pas je de inhoud van de template aan.",
            },
            {
              title: "Opmaak",
              element: document.querySelector(
                ".editor_outer .editor_buttons .formatting"
              ),
              intro: "Met deze knoppen kun je de opmaak van de selectie.",
            },
            {
              title: "Aanpassingen beheren",
              element: document.querySelector(
                ".editor_outer .editor_buttons .actions"
              ),
              intro:
                "Met deze knoppen kun je eenvoudig aanpassingen terugdraaien of opnieuw instellen.",
            },
            {
              title: "Opmaak",
              element: document.querySelector(".editor_outer .editor code"),
              intro:
                "Dit is een variabele. Een variabele kan worden ingevuld bij het gebruiken van een template. Tip: Je kunt een variabele vervangen door erop te klikken en te zoeken naar een alternatieve variabele.",
            },
            {
              title: "Opmaak",
              element: document.querySelector(
                ".editor_outer button.add_variable"
              ),
              intro: `Via deze knop kun je variabelen toevoegen. Je kunt erop klikken of de toetsenbord shortcut ${isMac ? "Cmd" : "Ctrl"}+Shift+[ gebruiken.`,
            },
            {
              title: "Acties",
              element: document.querySelector(".edit_template .edit_buttons"),
              intro:
                "Via deze knoppen kun je de wijzigingen opslaan of annuleren.",
            },
          ],
        })
        .start();
    }, 550);
  };

  const updateTemplateName = (id, newName) => {
    templatesStore.update((categories) => {
      const updateNestedTemplates = (items) => {
        for (const item of items) {
          if (item.templates) {
            const templateIndex = item.templates.findIndex(
              (template) => template.id === id
            );
            if (templateIndex !== -1) {
              item.templates[templateIndex].name = newName;
              return true; // Exit after updating
            }
          }
          if (item.sub) {
            if (updateNestedTemplates(item.sub)) {
              return true; // Exit after updating
            }
          }
        }
        return false;
      };
      updateNestedTemplates(categories);
      return categories;
    });
  };

  const removeTemplateFromStore = (id) => {
    let categoryId = null;

    templatesStore.update((categories) => {
      const removeNestedTemplate = (items) => {
        for (const item of items) {
          if (item.templates) {
            const templateIndex = item.templates.findIndex(
              (template) => template.id === id
            );
            if (templateIndex !== -1) {
              item.templates.splice(templateIndex, 1); // Remove the template
              categoryId = item.id; // Store the category id
              return true; // Exit after removing
            }
          }
          if (item.sub) {
            if (removeNestedTemplate(item.sub)) {
              return true; // Exit after removing
            }
          }
        }
        return false;
      };
      removeNestedTemplate(categories);
      return categories;
    });

    return categoryId;
  };

  // Reactive statement to update the preview content
  $: previewContent = replaceVariables(templateContentHTML, userInput);

  // Replace variables in content based on user input
  const replaceVariables = (content, variables) => {
    if (!content) return ""; // Check if content is defined

    return content.replace(/{{(.*?)}}/g, (match, p1) => {
      const variable = Object.entries(workspaceVariables.variables).find(
        ([id, data]) => {
          return data.placeholder === p1.trim();
        }
      );
      const value = variable ? variables[variable[0]] || match : match;
      return value;
    });
  };

  const handleInputChange = (variableId, event) => {
    userInput = { ...userInput, [variableId]: event.target.value };

    updatePreviewContent(); // Ensure the preview content updates

    const id = event.target.id;

    if (event.target.classList.contains("invalid")) {
      event.target.classList.remove("invalid");
    }

    setTimeout(() => {
      document
        .querySelectorAll(`.preview-content code[data-id="${id}"]`)
        .forEach((el) => {
          el.classList.add("active");
        });
    }, 0);
  };

  const handleInputFocus = (variableId, event) => {
    const id = event.target.id;
    let scrolled = false;

    // Select all matching elements and loop through them to add the class
    document
      .querySelectorAll(`.preview-content code[data-id="${id}"]`)
      .forEach((el) => {
        el.classList.add("active");

        // Only scroll into view if the viewport is wider than 768px
        if (!scrolled && window.innerWidth > 768) {
          el.scrollIntoView({
            behavior: "smooth", // Optional: Adds smooth scrolling effect
            block: "center", // Optional: Scrolls the element into the center of the view
          });
          scrolled = true;
        }
      });
  };

  const handleInputBlur = (variableId, event) => {
    document.querySelectorAll(`.preview-content code.active`).forEach((el) => {
      el.classList.remove("active");
    });
  };

  const updatePreviewContent = () => {
    // const previewElement = document.querySelector(".preview-content");
    // if (previewElement) {
    //   previewElement.innerHTML = replaceVariables(
    //     templateContentHTML,
    //     userInput
    //   );
    // }
  };

  // Handle click on variable span
  const handleVariableClick = (variableId) => {
    console.log("Clicked variable:", variableId);
    const inputElement = document.getElementById(variableId);
    console.log("Input element:", inputElement);
    if (inputElement) {
      inputElement.focus();
      inputElement.select();
    }
  };

  function copyPlainTextToClipboard(htmlElement) {
    // Get the raw text content (without automatic line breaks)
    let plainText = htmlElement.textContent;

    // Optional: Remove any excessive blank lines or clean up line breaks
    // Remove extra line breaks
    plainText = plainText.replace(/\n{2,}/g, "\n\n"); // Converts multiple line breaks into a single double line break for paragraphs.

    // Create a temporary textarea element to store the plain text
    const textArea = document.createElement("textarea");
    textArea.value = plainText;

    // Temporarily add the textarea to the document body
    document.body.appendChild(textArea);

    // Select the text in the textarea
    textArea.select();

    try {
      // Execute the copy command to copy the plain text to the clipboard
      document.execCommand("copy");
      console.log("Plain text content copied to clipboard");
    } catch (err) {
      console.error("Failed to copy: ", err);
    }

    // Clean up by removing the temporary textarea from the document
    document.body.removeChild(textArea);
  }

  function copyHtmlToClipboard(htmlElement) {
    // Clone the original element to manipulate safely
    const clone = htmlElement.cloneNode(true);

    // Strip out any <code> tags in the cloned element
    clone.querySelectorAll("code").forEach((codeTag) => {
      // Replace the <code> tag with its text content (stripping the tag itself)
      const textNode = document.createTextNode(codeTag.innerText);
      codeTag.replaceWith(textNode);
    });

    // Temporarily append the cloned element to the body (off-screen)
    clone.style.position = "absolute";
    clone.style.left = "-9999px";
    clone.style.background = "#fff";
    clone.style.color = "unset";
    document.body.appendChild(clone);

    // Create a range object to select the content of the modified clone
    const range = document.createRange();
    range.selectNodeContents(clone);

    // Create a selection object and add the range to it
    const selection = window.getSelection();
    selection.removeAllRanges(); // Clear any existing selections
    selection.addRange(range);

    try {
      // Execute the copy command to copy the selection to the clipboard
      document.execCommand("copy");
      console.log("Content copied to clipboard");
    } catch (err) {
      console.error("Failed to copy: ", err);
    }

    // Clean up by removing the selection range and the temporary clone
    selection.removeAllRanges();
    document.body.removeChild(clone);
  }

  function copyHtmlToClipboardPromise(htmlElement) {
    return new Promise((resolve, reject) => {
      // Clone the original element to manipulate safely
      const clone = htmlElement.cloneNode(true);

      // Strip out any <code> tags in the cloned element
      clone.querySelectorAll("code").forEach((codeTag) => {
        // Replace the <code> tag with its text content (stripping the tag itself)
        const textNode = document.createTextNode(codeTag.innerText);
        codeTag.replaceWith(textNode);
      });

      // Temporarily append the cloned element to the body (off-screen)
      clone.style.position = "absolute";
      clone.style.left = "-9999px";
      clone.style.background = "#fff";
      clone.style.color = "unset";
      document.body.appendChild(clone);

      // Create a range object to select the content of the modified clone
      const range = document.createRange();
      range.selectNodeContents(clone);

      // Create a selection object and add the range to it
      const selection = window.getSelection();
      selection.removeAllRanges(); // Clear any existing selections
      selection.addRange(range);

      try {
        // Execute the copy command to copy the selection to the clipboard
        const successful = document.execCommand("copy");
        if (successful) {
          console.log("Content copied to clipboard");

          // Introduce a short delay before resolving
          setTimeout(() => {
            resolve("Content copied successfully");
          }, 1000); // 1.5-second delay
        } else {
          reject("Copy command was not successful");
        }
      } catch (err) {
        reject("Failed to copy: " + err.message);
      }

      // Clean up by removing the selection range and the temporary clone
      selection.removeAllRanges();
      document.body.removeChild(clone);
    });
  }

  // Copy the generated content to clipboar

  const copyToClipboard = async (openMail = false) => {
    if (!hasActiveSubscription) {
      toast.error("Actief abonnement vereist", {
        position: "bottom-right",
      });
      return;
    }

    // Check if any inputs in .template .variables are empty
    const inputs = document.querySelectorAll(".template .variables input");
    let hasEmptyFields = false;

    inputs.forEach((input) => {
      if (!input.value.trim()) {
        input.classList.add("invalid"); // Add 'invalid' class to empty inputs
        hasEmptyFields = true; // Flag that there are empty fields
      } else {
        input.classList.remove("invalid"); // Remove 'invalid' class if the field is not empty
      }
    });

    // If any fields are empty, show error toast and stop the function
    if (hasEmptyFields) {
      document.querySelector(".template .input")?.scrollIntoView({
        behavior: "smooth", // Optional: Adds smooth scrolling effect
        block: "center", // Optional: Scrolls the element into the center of the view
      });

      toast.error("Je hebt nog niet iedere variabele ingevuld", {
        position: "bottom-right",
      });
      return;
    }

    try {
      const htmlElement = document.querySelector(".preview-content");
      const copyPromise = copyHtmlToClipboardPromise(htmlElement);

      const successMessage = openMail
        ? "Email gekopieerd! Je kunt het nu plakken in je e-mail programma."
        : "Email gekopieerd!";

      toast.promise(
        copyPromise,
        {
          loading: "Bezig met kopiëren...",
          success: successMessage,
          error: "Kopiëren mislukt. Probeer het opnieuw.",
        },
        {
          position: "bottom-right",
          duration: 8000, // Display the success/error message for 5 seconds
        }
      );

      if (openMail) {
        // Open the email client after copying
        copyPromise.then(() => {
          window.open("mailto:");
        });
      }
    } catch (err) {
      toast.error("Er is een fout opgetreden bij het kopiëren.", {
        position: "bottom-right",
        duration: 5000,
      });
      console.error("Failed to copy: ", err);
    }
  };

  // Function to save the recently viewed template to localStorage
  const saveRecentlyViewedTemplate = (template) => {
    if (browser) {
      let recentlyViewed =
        JSON.parse(localStorage.getItem("recentlyViewed")) || [];
      // Check if the template is already in the recently viewed list
      const index = recentlyViewed.findIndex((item) => item.id === template.id);
      if (index !== -1) {
        recentlyViewed.splice(index, 1); // Remove the template from the list to re-add it later
      }
      recentlyViewed.unshift(template); // Add the template at the beginning of the array
      // Limit to storing only the last 4 viewed templates
      if (recentlyViewed.length > 4) {
        recentlyViewed = recentlyViewed.slice(0, 4);
      }
      localStorage.setItem("recentlyViewed", JSON.stringify(recentlyViewed));
    } else {
      console.warn("localStorage is not available in this environment.");
    }
  };

  // Move to the prev stage
  const prevPage = () => {
    isNextStage = false;
  };

  // Move to the next stage
  const nextPage = () => {
    if (!hasActiveSubscription) {
      toast.error("Actief abonnement vereist", {
        position: "bottom-right",
      });
      return;
    }

    isNextStage = true;
  };

  function sendEmail() {
    if (!hasActiveSubscription) {
      toast.error("Actief abonnement vereist", {
        position: "bottom-right",
      });
      return;
    }

    try {
      const htmlElement = document.querySelector(".preview-content");
      copyHtmlToClipboard(htmlElement);
      // copyPlainTextToClipboard(htmlElement);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }

    // Construct the email body with the correct spaces
    const bodyContent = "Gebruik Ctrl/Cmd + V om de mail te plakken.";

    const params = new URLSearchParams({
      subject: mail.subject,
      body: bodyContent,
    });

    if (mail.cc) {
      params.append("cc", mail.cc);
    }

    if (mail.bcc) {
      params.append("bcc", mail.bcc);
    }

    // Manually encode the parameters
    const encodedParams = Array.from(params.entries())
      .map(([key, value]) => {
        return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      })
      .join("&");

    const mailtoLink = `mailto:${encodeURIComponent(mail.to)}${encodedParams ? `?${encodedParams}` : ""}`;
    console.log("mailtoLink", mailtoLink);

    window.open(mailtoLink);
  }

  // Toggle edit mode
  const toggleEditMode = () => {
    if (!hasActiveSubscription) {
      toast.error("Actief abonnement vereist", {
        position: "bottom-right",
      });
      return;
    }

    isEditMode = !isEditMode;

    if (isEditMode) {
      startEditTemplateTour();
      // Add #edit to the current URL
      goto(`${window.location.pathname}#edit`, { replaceState: true });
    } else {
      // Remove #edit from the URL
      goto(window.location.pathname, { replaceState: true });
    }
  };

  const confirmAndDelete = () => {
    if (!hasActiveSubscription) {
      toast.error("Actief abonnement vereist", {
        position: "bottom-right",
      });
      return;
    }

    const confirmDelete = window.confirm(
      "Weet je zeker dat je deze template wilt verwijderen?"
    );
    if (confirmDelete) {
      deleteTemplate(templateData.id)
        .then(() => {
          toast.success("Template verwijderd", {
            position: "bottom-right",
          });

          const templateCatId = removeTemplateFromStore(templateData.id);
          goto(`/category/${templateCatId}`);
        })
        .catch((error) => {
          // Handle error, e.g., show error message
          console.error("Error deleting template:", error);

          toast.error(error.message, {
            position: "bottom-right",
          });
        });
    }
  };

  // Handle save button click
  const saveTemplate = async () => {
    if (!hasActiveSubscription) {
      toast.error("Actief abonnement vereist", {
        position: "bottom-right",
      });
      return;
    }

    templateData.content = editor.getJSON();
    console.log(templateData.content);
    try {
      const docRef = doc(
        db,
        `workspaces/${localStorage.getItem("workspace")}/templates`,
        id
      );
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // Document exists, so update it
        await updateDoc(docRef, {
          content: templateData.content,
          name: templateData.name,
          variables: templateData.variables,
        });
      } else {
        // Document does not exist, so create it
        await setDoc(docRef, {
          content: templateData.content,
          name: templateData.name,
          variables: templateData.variables,
          createdAt: new Date(),
        });
      }

      toggleEditMode();

      // updateTemplateLastUpdated(id);
      updateTemplateName(id, templateData.name);
      updateTemplateNameinDB(id, templateData.name);
      fetchWorkspaceAndTemplateData(); // Refresh the data

      toast.success("Template opgeslagen", {
        position: "bottom-right",
      });
    } catch (e) {
      console.error("Error updating document: ", e);
    }
  };

  // Function to update the lastUpdated timestamp in the category
  const updateTemplateLastUpdated = async (templateId) => {
    const workspaceRef = doc(
      db,
      "workspaces",
      localStorage.getItem("workspace")
    );
    const workspaceSnap = await getDoc(workspaceRef);

    if (workspaceSnap.exists()) {
      let categories = workspaceSnap.data().categories || [];

      const findAndUpdateTemplate = (categories) => {
        for (let category of categories) {
          const template = category.templates?.find((t) => t.id === templateId);

          if (template) {
            // Update lastUpdated timestamp for the specific template
            template.lastUpdated = new Date();
            return true;
          }

          // Recursively check subcategories if they exist
          if (category.sub) {
            if (findAndUpdateTemplate(category.sub)) {
              return true;
            }
          }
        }
        return false;
      };

      findAndUpdateTemplate(categories);

      // Update categories in the workspace document
      await updateDoc(workspaceRef, {
        categories: categories,
      });
    }
  };

  const addNewVariable = async () => {
    if (newVariable.field_name && newVariable.placeholder) {
      const id =
        "var_" +
        Date.now().toString(36) +
        Math.random().toString(36).substr(2, 9);
      const variable = {
        field_name: newVariable.field_name,
        placeholder: newVariable.placeholder,
      };
      workspaceVariables.variables[id] = variable;

      console.log("New Variable ID:", id);
      console.log("New Variable:", variable);

      // Update the Firestore document with the new variable
      const docRef = doc(db, "workspaces", localStorage.getItem("workspace"));
      await updateDoc(docRef, {
        [`variables.${id}`]: variable,
      });

      newVariable = { field_name: "", placeholder: "" };
      selectedVariable = id;

      return { id, ...variable }; // Return the object containing the new variable's attributes
    }
    return null; // Ensure that a null value is returned if no variable is added
  };

  const insertVariable = (variable) => {
    console.log("Inserting Variable:", variable);

    shouldShow = false;
    editingVariable = false;

    editor
      .chain()
      .focus()
      .insertContent({
        type: "variable",
        attrs: {
          id: variable.id,
          variable: variable.variable,
          placeholder: variable.placeholder,
        },
      })
      .run();

    showVariablePopup = false;
    variableSearchQuery = "";
    showPlaceholderField = false;
  };

  const handleVariableSearch = (e) => {
    variableSearchQuery = e.target.value;
    console.log(workspaceVariables);
    let existingVariable = {};
    if (workspaceVariables.variables) {
      console.log(workspaceVariables.variables);
      existingVariable = Object.entries(workspaceVariables.variables).filter(
        ([id, data]) =>
          data.field_name
            .toLowerCase()
            .includes(variableSearchQuery.toLowerCase())
      );
    }

    if (existingVariable.length > 0) {
      // If existing variable is found
      selectedVariable = existingVariable[0];
      showPlaceholderField = false;
    } else if (variableSearchQuery) {
      // If no existing variable is found, allow adding new variable
      selectedVariable = "";
      newVariable.field_name = variableSearchQuery;
      showPlaceholderField = true;
    } else {
      showPlaceholderField = false;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      addVariableAction();
    } else if (e.key === "Escape") {
      console.log("Escape clicked");

      shouldShow = false;
      editingVariable = false;
    }
  };

  const addVariableAction = async () => {
    if (selectedVariable) {
      console.log(selectedVariable);
      insertVariable({
        id: selectedVariable[0],
        variable: selectedVariable[1].field_name,
        placeholder: selectedVariable[1].placeholder,
      });
    } else if (newVariable.field_name && newVariable.placeholder) {
      console.log("custom var");
      const newVariableData = await addNewVariable(); // Wait for the Promise to resolve
      if (newVariableData) {
        insertVariable(newVariableData);
      }
    }
  };

  // Fetch existing variables from the workspace
  const fetchVariables = async () => {
    if (!browser) return;
    workspaceVariables = await fetchWorkspaceData("variables");

    if (workspaceVariables) {
      console.log("Workspace Variables:", workspaceVariables);
    } else {
      console.log("No such document!");
    }
  };

  const extractVariablesFromContent = (content) => {
    const regex = /{{(.*?)}}/g;
    const matches = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      matches.push(match[1].trim());
    }
    return matches;
  };
</script>

<Header type={"template"}>
  {#if !isEditMode}
    <button
      class="button basic hide_text_mobile has_text"
      on:click={toggleEditMode}
    >
      <PencilSimple size="18" />Aanpassen
    </button>
  {/if}
  {#if !isEditMode}
    <button class="button basic" on:click={confirmAndDelete}>
      <TrashSimple size="18" />
    </button>
    <button class="button basic favorite_button" on:click={toggleFavorite}>
      {#if isFavorite}
        <Star size="18" weight="fill" color="var(--primary-darker)" />
      {:else}
        <Star size="18" />
      {/if}
    </button>
  {/if}
</Header>

{#if isEditMode}
  <div class="edit_template">
    <label class="input_wrapper flex">
      <input
        type="text"
        id="editTemplateName"
        bind:value={templateData.name}
        placeholder="&nbsp;"
      />
      <span>Template naam</span>
    </label>

    <div class="edit_template_main">
      <div class="editor_outer">
        {#if editor}
          <div class="editor_buttons">
            <div class="formatting">
              <button
                on:click={() =>
                  editor.chain().focus().toggleHeading({ level: 5 }).run()}
                class:active={editor.isActive("heading", { level: 5 })}
              >
                H
              </button>
              <button
                on:click={() => editor.chain().focus().setParagraph().run()}
                class:active={editor.isActive("paragraph")}
              >
                P
              </button>
              <button
                on:click={() => editor.chain().focus().toggleBold().run()}
                class:active={editor.isActive("bold")}
              >
                B
              </button>
              <button
                on:click={() => editor.chain().focus().toggleItalic().run()}
                class:active={editor.isActive("italic")}
              >
                I
              </button>
              <button
                on:click={() => editor.chain().focus().toggleUnderline().run()}
                class:active={editor.isActive("underline")}
              >
                U
              </button>
              <button
                on:click={() => editor.chain().focus().toggleBulletList().run()}
                class:active={editor.isActive("bulletList")}
              >
                <ListBullets size="14" />
              </button>
              <button
                on:click={() =>
                  editor.chain().focus().toggleOrderedList().run()}
                class:active={editor.isActive("orderedList")}
              >
                <ListNumbers size="14" />
              </button>
            </div>
            <div class="actions">
              <button
                on:click={() => editor.chain().focus().undo().run()}
                class:disabled={!editor.can().undo()}
                ><ArrowUUpLeft size="18" /></button
              >
              <button
                on:click={() => editor.chain().focus().redo().run()}
                class:disabled={!editor.can().redo()}
                ><ArrowUUpRight size="18" /></button
              >
            </div>
          </div>
        {/if}
        <div class="editor" bind:this={editorElement}>
          <button
            class="button outline add_variable"
            on:click={() => {
              // shouldShow = true; // Show the bubble menu
              if (editor) {
                editor.chain().focus().run();
              }
              shouldShow = true; // Show the bubble menu
            }}
          >
            <!-- <BracketsCurly size={16} /> -->
            + Voeg variabele toe
            <div class="shortcut-bubble">
              {isMac ? "Cmd" : "Ctrl"}+Shift+[
            </div></button
          >
        </div>
      </div>
      {#if workspaceVariables.variables}
        <div class="variables_list">
          <label class="variables_list_top">
            <input
              type="checkbox"
              name="toggle_variables_list"
              id="toggle_variables_list"
            />
            <span class="flex caret"><CaretRight size={16} /></span>
            <span class="label">Beschikbare variabelen</span>
            <a href="/settings" target="_blank" class="flex"
              ><GearSix size={16} /></a
            >
          </label>
          <div class="variables_list_content">
            <input
              type="text"
              placeholder="Zoek variabelen"
              bind:value={$variablesListSearch}
              class="search-input"
            />
            <ul id="variables_list_ul">
              {#if filteredVariables.length}
                {#each filteredVariables as [id, data]}
                  <li
                    class="variable draggable"
                    data-id={id}
                    data-variable={data.field_name}
                    data-placeholder={data.placeholder}
                    on:click={() =>
                      insertVariable({
                        id: id,
                        variable: data.field_name,
                        placeholder: data.placeholder,
                      })}
                  >
                    <span class="flex"><DotsSixVertical size={16} /></span>
                    {data.field_name}
                  </li>
                {/each}
              {:else}
                <p class="empty">Geen variabelen gevonden</p>
              {/if}
            </ul>
          </div>
        </div>
      {/if}
    </div>
    <div class="buttons edit_buttons">
      <span data-flow="top" data-tooltip="Wijzigingen ongedaan maken">
        <button class="button basic has_text" on:click={toggleEditMode}>
          <X size="18" />Annuleren
        </button>
      </span>
      <span class="relative">
        <button class="button" on:click={saveTemplate}
          ><FloppyDisk size={18} />Opslaan</button
        >
        <span class="shortcut-bubble">{isMac ? "Cmd" : "Ctrl"} + S</span>
      </span>
    </div>
  </div>

  <div class="popup" bind:this={addVariableEl}>
    <span
      class="close"
      on:click={() => {
        if (editor) {
          editor.chain().focus().run();
        }
        shouldShow = false; // Show the bubble menu
        editingVariable = false;
      }}><X size={10} /></span
    >
    <input
      type="text"
      placeholder={editingVariable
        ? "Variabele vervangen"
        : "Variabele toevoegen"}
      bind:value={variableSearchQuery}
      bind:this={variableInput}
      on:input={handleVariableSearch}
      on:keypress={handleKeyPress}
    />
    {#if variableSearchQuery && workspaceVariables.variables && !showPlaceholderField}
      <span class="label">Zoekresultaten</span>
      <ul>
        {#each Object.entries(workspaceVariables.variables).filter( ([id, data]) => data.field_name
              .toLowerCase()
              .includes(variableSearchQuery.toLowerCase()) ) as [id, data]}
          <li
            on:click={() =>
              insertVariable({
                id: id,
                variable: data.field_name,
                placeholder: data.placeholder,
              })}
          >
            {data.field_name}
          </li>
        {/each}
      </ul>
    {/if}
    {#if showPlaceholderField}
      <input
        type="text"
        placeholder="Placeholder"
        bind:value={newVariable.placeholder}
        on:keypress={handleKeyPress}
      />
    {/if}
    <!-- <button class="button simple" on:click={addVariableAction}
      >+ Toevoegen</button
    > -->
  </div>
{:else}
  <div class="template">
    {#if Object.keys(userInput) && Object.keys(userInput).length > 0}
      <div class="input">
        <div class="sticky">
          <span class="label var_label">Variabelen</span>
          <div class="variables">
            {#each Object.keys(userInput) as variableId, index}
              {#if workspaceVariables.variables && workspaceVariables.variables[variableId]}
                <div>
                  <label class="input_wrapper">
                    <input
                      type="text"
                      placeholder="&nbsp;"
                      id={variableId}
                      value=""
                      on:input={(e) => handleInputChange(variableId, e)}
                      on:focus={(e) => handleInputFocus(variableId, e)}
                      on:blur={(e) => handleInputBlur(variableId, e)}
                      bind:this={inputRefs[index]}
                    />
                    <span
                      >{workspaceVariables.variables[variableId]
                        .field_name}</span
                    >
                  </label>
                </div>
              {/if}
            {/each}
          </div>
        </div>
      </div>
    {/if}
    <div class="output">
      <!-- <span class="label preview_label">Voorbeeld</span> -->
      <div class="preview">
        <div class="preview-content">
          {@html previewContent ||
            "<em style='opacity:0.6;'>Deze template is nog leeg..</em>"}
        </div>
      </div>
    </div>
  </div>
  <div class="buttons">
    <span class="relative">
      <button class="button copy_mail" on:click={() => copyToClipboard(false)}
        ><CopySimple size="18" />Kopiëren</button
      >
      <span class="shortcut-bubble">{isMac ? "Cmd" : "Ctrl"} + C</span>
    </span>
    <span data-flow="top" data-tooltip="Kopiëren en mail openen">
      <button
        class="button outline mail_mail"
        on:click={() => copyToClipboard(true)}
        ><EnvelopeSimple size="18" />Mailen</button
      >
    </span>
  </div>
{/if}

<style lang="scss">
  :global(.relative) {
    position: relative;
  }
  .top {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: 10px;
    align-items: center;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 20px;
    h1 {
      flex-grow: 1;
      margin-bottom: 0;
    }
  }
  .template {
    display: flex;
    flex-direction: column;
    gap: 20px;

    display: grid;
    grid-template-columns: 5fr 7fr;
    background-color: #fff;
    border: 1px solid var(--border);
    border-radius: var(--border-radius-bigger, 10px);
    gap: 0;

    > div {
      display: flex;
      flex-direction: column;
      gap: inherit;

      gap: 20px;
      padding: 40px;

      &.input {
        border-right: 1px solid var(--border);
        background-color: var(--gray-150, hsl(0 0% 92% / 1));
        border-top-left-radius: inherit;
        border-bottom-left-radius: inherit;

        .sticky {
          display: flex;
          flex-direction: column;
          gap: inherit;
          position: sticky;
          top: 80px;
        }
      }
    }

    .variables {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      grid-template-columns: 100%;
      gap: 15px;
      > * {
        display: flex;
        flex-direction: column;
        gap: 0;
      }

      .input_wrapper input {
        outline: revert;
      }
    }
    .preview {
      padding: 0;
      border-radius: unset;
      border: none;
    }

    @media (max-width: $md) {
      grid-template-columns: 100%;

      > div {
        padding: 30px;
        &.input {
          grid-row: 2;
          border-top-left-radius: 0;
          border-bottom-right-radius: inherit;
          border-right: 0;
        }
      }
    }
  }

  .var_label {
    margin-bottom: 0;
  }
  .preview_label {
    margin-top: 1em;
    margin-bottom: 0;
  }
  .preview {
    background-color: #fff;
    border: 1px solid var(--border);
    border-radius: var(--border-radius-bigger, 10px);
    padding: 30px;
    user-select: none;
    h2 {
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.5em;
    }
    .preview-content {
      line-height: 1.5;
      p:empty {
        display: flex;
        height: 1.5em;
      }
      p {
        font-size: 16px;
      }
    }
    .variable {
      text-decoration: underline; /* Voor onderstreping */
      cursor: pointer; /* Verander cursor naar pointer bij hover */
      /* Of gebruik bijvoorbeeld background-color voor achtergrondmarkering */
    }
  }

  .mail_actions {
    margin-top: 20px;
  }
  .buttons {
    display: flex;
    gap: 12px;
    margin-top: 10px;

    position: sticky;
    bottom: -50px;
    padding: 30px 0px 30px;
    background: linear-gradient(
      1deg,
      #f8f8f8 0%,
      #f8f8f8a6 65%,
      #f8f8f800 100%
    );
    display: flex;
    align-items: stretch;
    justify-content: center;
    z-index: 5;

    @media (max-width: $lg) {
      bottom: -30px;
    }

    .shortcut-bubble {
      position: absolute;
      right: 10px;
      top: 2px;
      transform: translate(0, -50%);
      background-color: #323232;
      padding: 3px 6px;
      font-size: 1rem;
      border-radius: 10px;
      color: #fff;
      background-color: var(--gray-700);
      pointer-events: none;
      transition:
        opacity 0.2s ease-out,
        transform 0.2s ease-out;
    }
    // .button:hover + .shortcut-bubble {
    //   opacity: 0;
    //   transform: translate(0, 0);
    // }
  }
  .email-details {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
    > div {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
  }

  .edit_template_main {
    display: flex;
    flex-direction: row;
    gap: inherit;
    align-items: stretch;

    @media (max-width: $xl) {
      flex-direction: column;
    }
  }

  .editor_outer {
    border: 1px solid var(--border);
    border-radius: var(--border-radius);
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    min-width: 1px;
    .editor_buttons {
      border-bottom: 1px solid var(--border);
      background-color: var(--gray-100);
      border-top-left-radius: inherit;
      border-top-right-radius: inherit;
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 5px;
      padding: 5px;

      position: sticky;
      top: 29px;
      z-index: 9;
      .formatting {
        flex-grow: 1;
        display: flex;
        align-items: center;
        gap: 5px;
      }
      .actions {
        display: flex;
        align-items: center;
        gap: 5px;
        justify-content: center;

        @media (max-width: $xs) {
          display: none;
        }
        button {
          display: flex;
        }
        .disabled {
          pointer-events: none;
          opacity: 0.5;
        }
      }
      button {
        background-color: transparent;
        border: 1px solid transparent;
        margin: 0;
        padding: 8px;
        border-radius: var(--border-radius);
        transition: background-color 0.2s ease-out;
        min-width: 32px;
        &.active {
          border-color: var(--border);
        }
        &:hover {
          background-color: var(--gray-200);
        }
      }
    }

    .editor {
      border-bottom-left-radius: inherit;
      border-bottom-right-radius: inherit;
      background-color: #fff;
      display: flex;
      flex-direction: column;
      flex-grow: 1;

      button {
        order: 1;
      }
      .add_variable {
        padding: 10px 15px;
        display: inline-flex;
        font-size: 1.4rem;
        font-family: inherit;
        font-weight: 400;
        margin: 4px 5px;
        background-color: #fff;
        align-items: center;
        align-self: flex-start;

        margin: 0 12px 20px;
        /* padding: 0; */
        border: none;
        box-shadow: none;
        opacity: 1;
        font-size: 1.4rem;
        gap: 6px;
        color: var(--gray-400);

        // @media (max-width: $md) {
        //   display: none;
        // }
        &:hover {
          // box-shadow: inset 0 0 0 1px var(--border);
          background-color: var(--gray-100);
          color: var(--gray-600);
        }

        .shortcut-bubble {
          background-color: #fff;
          box-shadow: 0 0 0 1px var(--border);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 1.3rem;
          color: var(--gray-600);
          transform: translateY(1px);
        }
      }
    }
  }

  .variables_list {
    --padding: 20px;
    padding-inline: var(--padding, 30px);
    border: 1px solid var(--border);
    border-radius: var(--border-radius);
    background-color: #fff;
    background-color: var(--gray-800);
    width: 300px;
    flex-shrink: 0;
    max-height: 500px;
    height: 100vh;
    overflow-y: auto;
    position: sticky;
    top: 60px;

    /* ===== Scrollbar CSS ===== */
    scrollbar-width: auto;
    // scrollbar-color: #ebebeb #ffffff;

    /* Chrome, Edge, and Safari */
    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background-color: rgba(255, 255, 255, 0.25);
      border-radius: 10px;
      border: px solid transparent;
    }

    .variables_list_top {
      padding-block: var(--padding, 30px) calc(var(--padding, 30px) - 5px);
      position: sticky;
      top: 0;
      background-color: inherit;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 5px;
      justify-content: space-between;

      input {
        display: none;
      }

      .label {
        margin-bottom: 0;
        flex-grow: 1;
      }
      .caret {
        color: rgba(255, 255, 255, 0.6);
        display: none;
      }
      a {
        color: rgba(255, 255, 255, 0.6);
      }
    }
    .search-input.search-input {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%234a4a4a' viewBox='0 0 256 256'%3E%3Cpath d='M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z'%3E%3C/path%3E%3C/svg%3E");
      background-position: left 10px center;
      font-size: 1.5rem;
      background-repeat: no-repeat;
      background-size: 16px;
      // margin-top: 10px;
      margin-bottom: 10px;
      padding: 8px;
      padding-left: 30px;
      width: 100%;
      box-sizing: border-box;
      border-radius: 5px;
    }
    .empty {
      background-color: var(--gray-700);
      border: none;
      line-height: 1.2;
      padding: 15px;
      color: hsl(var(--response-color), 60%);
      font-size: 1.3rem;
    }
    ul {
      padding-bottom: var(--padding, 30px);
      margin-bottom: 10px;
      list-style: none;
      padding-left: 0;
      margin-left: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
      li {
        .variable {
        }
      }
    }

    @media (max-width: $xl) {
      // display: none;
      width: 100%;
      display: grid;
      grid-template-rows: max-content 0fr;
      width: 100%;
      height: max-content;
      padding: 0;
      transition: grid-template-rows 0.6s ease;
      .variables_list_top {
        padding: calc(var(--padding, 30px) - 5px) 20px;
        cursor: pointer;
        .caret {
          display: flex;
          transition: rotate 0.4s ease;
        }
      }
      .variables_list_content {
        // mask-image: linear-gradient(
        //   180deg,
        //   rgb(0, 0, 0),
        //   rgb(0, 0, 0) 95%,
        //   rgba(0, 0, 0, 0) 100%
        // );
        overflow: hidden;
        opacity: 0;
        transition: opacity 0.6s ease;

        /* ===== Scrollbar CSS ===== */
        scrollbar-width: auto;
        // scrollbar-color: #ebebeb #ffffff;

        /* Chrome, Edge, and Safari */
        &::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        &::-webkit-scrollbar-track {
          background: transparent;
        }

        &::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.25);
          border-radius: 10px;
          border: px solid transparent;
        }

        > * {
          max-width: calc(100% - 40px);
          margin-inline: auto;
          display: flex;
        }
      }

      &:has(input:checked) {
        grid-template-rows: max-content 1fr;

        .variables_list_content {
          overflow-y: auto;
          opacity: 1;
        }

        .caret {
          rotate: 90deg;
        }
      }
    }
  }

  :global(.variable.variable.draggable.draggable) {
    border: 1px solid var(--border);
    background-color: var(--gray-100);
    padding: 8px 6px;
    display: flex;
    align-items: center;
    gap: 2px;
    cursor: pointer;
    margin: 0;

    border: 1px solid rgba(255, 255, 255, 0.15);
    border: none;
    background-color: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.9);
    font-weight: 400;

    .flex {
      cursor: move;
    }
  }

  :global(.preview-content p) {
    font-size: unset;
  }

  .popup {
    background-color: white;
    padding: 10px;
    border-radius: var(--border-radius-biggest, 12px);
    border: 1px solid var(--border);
    // box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    z-index: 999;
    max-width: 320px;
    width: 70vw;
    display: flex;
    flex-direction: column;
    gap: 15px;
    outline: 100vmax solid rgba(0, 0, 0, 0.1);
    margin-left: -20px;

    opacity: 0; /* Ensure it's initially hidden */
    transform: translateY(-10px);
    animation: popup-animation 0.2s ease-out forwards;

    .close {
      position: absolute;
      top: 1px;
      right: 1px;
      display: flex;
      /* opacity: .3; */
      transform: translate(50%, -50%);
      background-color: var(--gray-500);
      border-radius: 50%;
      padding: 2px;
      color: #fff;
      cursor: pointer;
      transition: background-color 0.2s ease-out;
      &:hover {
        background-color: var(--gray-700);
      }
    }

    @keyframes popup-animation {
      0% {
        opacity: 0;
        transform: translateY(-10px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .label {
      margin-bottom: -5px;
      font-weight: 500;
    }

    ul {
      list-style-type: none;
      padding: 0;
    }

    li {
      padding: 10px;
      background: #f0f0f0;
      margin-bottom: 5px;
      cursor: pointer;
    }

    li:hover {
      background: #e0e0e0;
    }

    &::before {
      content: "";
      position: absolute;
      top: -3px;
      left: calc(50%);
      transform: translate(-50%, calc(-100% + 3px));
      // left: 14px;
      // transform: translate(0, calc(-100% + 3px));
      width: 0px;
      height: 0px;
      border-style: solid;
      border-width: 0 6px 6px 6px;
      border-color: transparent transparent var(--border) transparent;
    }
    &::after {
      content: "";
      position: absolute;
      top: -1px;
      left: 50%;
      transform: translate(-50%, calc(-100% + 3px));
      // left: 15px;
      // transform: translate(0, calc(-100% + 2px));
      width: 0px;
      height: 0px;
      border-style: solid;
      border-width: 0 6px 6px 6px;
      border-color: transparent transparent #fff transparent;
    }
  }

  :global(main > .popup.popup.popup.popup) {
    display: none;
  }

  :global([data-placement="top"] .popup.popup.popup) {
    &::before {
      top: unset;
      bottom: -3px;
      transform: translate(-50%, calc(100% - 3px));
      border-width: 7px 7px 0 7px;
      border-color: var(--border) transparent transparent transparent;
    }
    &::after {
      top: unset;
      bottom: -1px;
      transform: translate(-50%, calc(100% - 2px));
      border-width: 6px 6px 0 6px;
      border-color: #fff transparent transparent transparent;
    }
  }

  .edit_template {
    display: flex;
    flex-direction: column;
    gap: 30px;
    @media (max-width: $xl) {
      gap: 20px;
    }
    h2 {
      margin-top: 1em;
      margin-bottom: 0.5em;
      font-size: 2rem;
    }
  }

  :global(input.invalid.invalid.invalid.invalid.invalid) {
    --error: #e74c3c;
    border-color: var(--error, #f00);
    background-color: hsl(from var(--error) h s calc(l + 40));
    + span {
      --error: #e74c3c;
      color: var(--error);
    }
  }
</style>
