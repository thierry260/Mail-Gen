<script>
  import { onMount, onDestroy } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { fetchWorkspaceData, fetchTemplateData } from "$lib/utils/get";
  import { updateTemplateNameinDB } from "$lib/utils/set";
  import { deleteTemplate } from "$lib/utils/delete";
  import { templatesStore } from "$lib/stores/templates";
  import { get } from "svelte/store";
  import { browser } from "$app/environment";
  import { updateDoc, doc, getDoc } from "firebase/firestore"; // Import Firestore update function
  import { db } from "$lib/firebase"; // Adjust the import path if necessary
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
  } from "phosphor-svelte";
  import { Editor } from "@tiptap/core";
  import { Node, mergeAttributes } from "@tiptap/core";
  import StarterKit from "@tiptap/starter-kit";
  import Placeholder from "@tiptap/extension-placeholder";
  import BulletList from "@tiptap/extension-bullet-list";
  import OrderedList from "@tiptap/extension-ordered-list";
  import ListItem from "@tiptap/extension-list-item";
  import History from "@tiptap/extension-history";
  import Underline from "@tiptap/extension-underline";
  import Bold from "@tiptap/extension-bold";
  import Italic from "@tiptap/extension-italic";

  let id;
  let templateData = {};
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
  let showPlaceholderField = false; // State to control placeholder field visibility

  // Subscribe to the page store to get the ID parameter
  $: id = $page.params.id;

  const Variable = Node.create({
    name: "variable",
    group: "inline",
    inline: true,
    atom: true,

    addAttributes() {
      return {
        variable: {
          default: null,
        },
      };
    },

    parseHTML() {
      return [
        {
          tag: "code[data-variable]",
        },
      ];
    },

    renderHTML({ HTMLAttributes }) {
      return [
        "code",
        mergeAttributes(HTMLAttributes, {
          "data-variable": this.attrs.variable,
        }),
        `{{${this.attrs.variable}}}`,
      ];
    },

    addNodeView() {
      return ({ node, getPos, view }) => {
        const dom = document.createElement("code");
        dom.classList.add("variable");
        dom.setAttribute("data-variable", node.attrs.variable);
        dom.textContent = `{{${node.attrs.variable}}}`;

        dom.addEventListener("click", () => {
          // Your custom behavior here
          alert(`Variable: ${node.attrs.variable}`);
        });

        return {
          dom,
        };
      };
    },
  });

  // Fetch all data for the component
  const fetchWorkspaceAndTemplateData = async () => {
    try {
      templateData = await fetchTemplateData(id);
      workspaceVariables = (await fetchWorkspaceData()) || { variables: {} }; // Ensure workspaceVariables is not null

      // Ensure workspaceVariables has a variables property
      if (!workspaceVariables.variables) {
        workspaceVariables.variables = {};
      }

      // Initialize user input fields with placeholders
      if (templateData.variables) {
        userInput = {}; // Reset userInput to avoid carrying over data from previous templates
        templateData.variables.forEach((variableId) => {
          if (workspaceVariables.variables[variableId]) {
            userInput[variableId] =
              workspaceVariables.variables[variableId].placeholder || "";
          }
        });
      }

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
      console.log("Fetching template details for template ID:", id);
      isEditMode = browser && window.location.hash.includes("#edit");
      fetchWorkspaceAndTemplateData();
    }
  }

  let editorElement;
  let editor;

  // Initialize the editor when isEditMode becomes true
  $: if (editorElement) {
    initializeEditor();
    console.log("init editor");
  }

  $: if (!isEditMode && editor) {
    editor.destroy();
  }

  const initializeEditor = () => {
    if (!editorElement) return;

    console.log(editorElement);

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
          placeholder: "Write something …",
        }),
        BulletList,
        OrderedList,
        ListItem,
        Variable,
        History,
        Bold,
        Italic,
        Underline,
      ],
      onTransaction: () => {
        editor = editor; // force re-render so `editor.isActive` works as expected
      },
    });

    console.log(editor);

    // Add keyboard shortcuts for undo/redo
    editor.view.dom.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "z") {
        event.preventDefault();
        editor.commands.undo();
      } else if (
        (event.ctrlKey || event.metaKey) &&
        (event.key === "y" || (event.shiftKey && event.key === "z"))
      ) {
        event.preventDefault();
        editor.commands.redo();
      } else if ((event.ctrlKey || event.metaKey) && event.key === "b") {
        event.preventDefault();
        editor.commands.setBold();
        // editor.commands.toggleBold();
      } else if ((event.ctrlKey || event.metaKey) && event.key === "i") {
        event.preventDefault();
        editor.commands.setItalic();
        // editor.commands.toggleItalic();
      } else if ((event.ctrlKey || event.metaKey) && event.key === "u") {
        event.preventDefault();
        editor.commands.setUnderline();
        // editor.commands.toggleUnderline();
      }
    });
  };

  const toggleFavorite = () => {
    isFavorite = !isFavorite;
    saveFavoriteState();
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

  onMount(() => {
    if (id) {
      fetchWorkspaceAndTemplateData();
      fetchVariables();
    }
  });

  onDestroy(() => {
    if (editor) {
      editor.destroy();
    }
  });

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

  // Replace variables in content based on user input
  const replaceVariables = (content, variables) => {
    if (!content) return ""; // Check if content is defined

    return content.replace(/{{(.*?)}}/g, (match, p1) => {
      const value = variables[p1] || match;
      return `<span class="variable" on:click={handleVariableClick.bind(null, p1)}>${value}</span>`;
    });
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

  // Copy the generated content to clipboard
  const copyToClipboard = async (e) => {
    e.currentTarget.parentNode.dataset.tooltip = "Gekopieerd";
    const content = document.querySelector(".preview-content").innerText;
    try {
      await navigator.clipboard.writeText(content);
      console.log(`Copied to clipboard:\n\n${content}`);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const resetCopyTooltip = (e) => {
    e.currentTarget.parentNode.dataset.tooltip =
      e.currentTarget.parentNode.dataset.default_tooltip;
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
    isNextStage = true;
  };

  function sendEmail() {
    mail.body = replaceVariables(templateData.content, userInput);
    // mail.body = "test";

    const params = new URLSearchParams({
      subject: mail.subject,
      body: mail.body,
    });

    if (mail.cc) {
      params.append("cc", mail.cc);
    }

    if (mail.bcc) {
      params.append("bcc", mail.bcc);
    }

    const mailtoLink = `mailto:${encodeURIComponent(mail.to)}${params.toString() ? `?${params.toString()}` : ""}`;
    console.log("mailtoLink", mailtoLink);

    window.open(mailtoLink);
  }

  // Toggle edit mode
  const toggleEditMode = () => {
    isEditMode = !isEditMode;
  };

  const confirmAndDelete = () => {
    const confirmDelete = window.confirm(
      "Weet je zeker dat je deze template wilt verwijderen?"
    );
    if (confirmDelete) {
      deleteTemplate(templateData.id)
        .then(() => {
          // Handle success, e.g., show success message or redirect
          console.log("Template deleted successfully");
          const templateCatId = removeTemplateFromStore(templateData.id);
          goto(`/category/${templateCatId}`);
        })
        .catch((error) => {
          // Handle error, e.g., show error message
          console.error("Error deleting template:", error);
        });
    }
  };

  // Handle save button click
  const saveTemplate = async () => {
    templateData.content = editor.getHTML();
    try {
      // Update the template data with the current content, name, and variables
      await updateDoc(doc(db, "workspaces/wms/templates", id), {
        content: templateData.content,
        name: templateData.name,
        variables: templateData.variables,
      });
      toggleEditMode();
      updateTemplateName(id, templateData.name);
      updateTemplateNameinDB(id, templateData.name);
      fetchWorkspaceAndTemplateData(); // Refresh the data
    } catch (e) {
      console.error("Error updating document: ", e);
    }
  };

  const addNewVariable = async () => {
    if (newVariable.field_name && newVariable.placeholder) {
      const id =
        "var_" +
        Date.now().toString(36) +
        Math.random().toString(36).substr(2, 9);
      workspaceVariables = { ...workspaceVariables, [id]: newVariable };

      // Update the Firestore document with the new variable
      const docRef = doc(db, "workspaces", localStorage.getItem("workspace"));
      await updateDoc(docRef, {
        [`variables.${id}`]: newVariable,
      });

      newVariable = { field_name: "", placeholder: "" };
      selectedVariable = id;
    }
  };

  const insertVariable = (variable) => {
    const html = `<code data-variable="${variable}">{{${variable}}}</code>`;
    editor.chain().focus().insertContent(html).run();
    showVariablePopup = false;
    variableSearchQuery = "";
    showPlaceholderField = false;
  };

  const handleVariableSearch = (e) => {
    variableSearchQuery = e.target.value;
    console.log(workspaceVariables);
    const existingVariable = Object.entries(workspaceVariables).filter(
      ([id, data]) =>
        data.field_name
          .toLowerCase()
          .includes(variableSearchQuery.toLowerCase())
    );

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
      if (selectedVariable) {
        insertVariable(selectedVariable[1].field_name);
      } else if (newVariable.field_name && newVariable.placeholder) {
        addNewVariable();
        insertVariable(newVariable.field_name);
      }
    }
  };

  // Fetch existing variables from the workspace
  const fetchVariables = async () => {
    if (!browser) return;
    const docRef = doc(db, "workspaces", localStorage.getItem("workspace"));
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      workspaceVariables = docSnap.data().variables || {};
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

{#if templateData.content}
  {#if !isNextStage}
    <div class="top">
      <h1>
        {templateData.name}
      </h1>
      <button class="button basic" on:click={toggleEditMode}>
        {#if isEditMode}
          <X size="18" />Annuleren
        {:else}
          <PencilSimple size="18" />Aanpassen
        {/if}
      </button>
      {#if !isEditMode}
        <button class="button basic" on:click={confirmAndDelete}>
          <TrashSimple size="18" />
        </button>
        <button class="button basic favorite_button" on:click={toggleFavorite}>
          {#if isFavorite}
            <Star size="18" weight="fill" />
          {:else}
            <Star size="18" />
          {/if}
        </button>
      {/if}
    </div>
    {#if isEditMode}
      <div class="edit-template">
        <h2>Template naam</h2>
        <input
          type="text"
          bind:value={templateData.name}
          placeholder="Template naam"
        />
        <h2>Template inhoud</h2>
        <div class="editor_outer">
          {#if editor}
            <div class="editor_buttons">
              <div class="formatting">
                <button
                  on:click={() =>
                    editor.chain().focus().toggleHeading({ level: 3 }).run()}
                  class:active={editor.isActive("heading", { level: 3 })}
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
                  on:click={() =>
                    editor.chain().focus().toggleUnderline().run()}
                  class:active={editor.isActive("underline")}
                >
                  U
                </button>
                <button
                  on:click={() =>
                    editor.chain().focus().toggleBulletList().run()}
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
          <div class="editor" bind:this={editorElement}></div>
        </div>
        <button
          class="button outline"
          on:click={() => (showVariablePopup = true)}
          >+ Voeg variabele toe</button
        >
        <!-- <textarea bind:value={templateData.content} placeholder="Email inhoud"
        ></textarea>
        <div>
          <h2>Variabele selecteren</h2>
          <select bind:value={selectedVariable}>
            <option value="" disabled>Selecteer</option>
            {#each Object.entries(workspaceVariables.variables) as [variableId, variableData]}
              <option value={variableId}>{variableData.field_name}</option>
            {/each}
          </select>
          <button on:click={insertVariable}>Voeg toe</button>
        </div> -->
        <button class="button" on:click={saveTemplate}>Opslaan</button>
      </div>

      {#if showVariablePopup}
        <div class="popup">
          <h2>Voeg een variabele toe</h2>
          <input
            type="text"
            placeholder="Variabele naam"
            bind:value={variableSearchQuery}
            on:input={handleVariableSearch}
            on:keypress={handleKeyPress}
          />
          {#if variableSearchQuery && workspaceVariables && !showPlaceholderField}
            <ul>
              {#each Object.entries(workspaceVariables).filter( ([id, data]) => data.field_name
                    .toLowerCase()
                    .includes(variableSearchQuery.toLowerCase()) ) as [id, data]}
                <li on:click={() => insertVariable(data.field_name)}>
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
          <button on:click={() => (showVariablePopup = false)}>Sluiten</button>
        </div>
      {/if}
    {:else}
      <div class="template">
        <div class="variables">
          {#each Object.keys(userInput) as variableId}
            {#if workspaceVariables.variables && workspaceVariables.variables[variableId]}
              <div>
                <label class="label" for={variableId}>
                  {workspaceVariables.variables[variableId].field_name}
                </label>
                <input
                  type="text"
                  id={variableId}
                  bind:value={userInput[variableId]}
                  placeholder={workspaceVariables.variables[variableId]
                    .placeholder}
                />
              </div>
            {/if}
          {/each}
        </div>
        <div class="preview">
          <div class="preview-content">
            {@html replaceVariables(templateData.content, userInput)}
          </div>
        </div>
        <div class="buttons">
          <span
            data-flow="top"
            data-tooltip="Klik om te kopiëren"
            data-default_tooltip="Klik om te kopiëren"
          >
            <button
              class="button outline"
              on:mouseleave={resetCopyTooltip}
              on:click={copyToClipboard}
              ><CopySimple size="18" />Kopiëren</button
            >
          </span>
          <button class="button outline" on:click={nextPage}
            ><EnvelopeSimple size="18" />Mailen</button
          >
        </div>
      </div>
    {/if}
  {:else}
    <h1>Email verzenden</h1>
    <div class="email-details">
      <label class="input_wrapper">
        <input
          type="text"
          id="subject"
          bind:value={mail.subject}
          placeholder="&nbsp;"
        />
        <span for="userEmail">Onderwerp</span>
      </label>
      <label class="input_wrapper">
        <input type="text" id="to" bind:value={mail.to} placeholder="&nbsp;" />
        <span for="userEmail">Aan</span>
      </label>
      <div class="input_columns">
        <label class="input_wrapper">
          <input
            type="email"
            id="cc"
            bind:value={mail.cc}
            placeholder="&nbsp;"
          />
          <span for="cc">CC</span>
        </label>
        <label class="input_wrapper">
          <input
            type="email"
            id="bcc"
            bind:value={mail.bcc}
            placeholder="&nbsp;"
          />
          <span for="bcc">BCC</span>
        </label>
      </div>
    </div>
    <span class="label">Preview</span>
    <div class="preview">
      <div class="preview-content">
        {@html replaceVariables(templateData.content, userInput)}
      </div>
    </div>
    <div class="buttons mail_actions">
      <button class="button outline" on:click={prevPage}>Vorige</button>
      <button class="button" on:click={sendEmail}>Versturen</button>
    </div>
  {/if}
{/if}

<style lang="scss">
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
    .variables {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      > * {
        display: flex;
        flex-direction: column;
        gap: 0;
      }
    }
  }
  .preview {
    background-color: #fff;
    border: 1px solid var(--border);
    border-radius: var(--border-radius);
    padding: 30px;
    h2 {
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.5em;
    }
    .preview-content {
      line-height: 1.5;
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
    gap: 10px;
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

  .editor_outer {
    border: 1px solid var(--border);
    border-radius: var(--border-radius);
    margin-bottom: 10px;
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
      .formatting {
        flex-grow: 1;
        display: flex;
        align-items: center;
        gap: 5px;
      }
      .actions {
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
    }
  }

  .popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: white;
    padding: 20px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    input {
      margin-bottom: 10px;
    }

    button {
      margin-right: 10px;
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
  }

  .edit-template {
    h2 {
      margin-top: 1em;
      margin-bottom: 0.5em;
      font-size: 2rem;
    }
  }
</style>
