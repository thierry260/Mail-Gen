<script>
  import { onMount, onDestroy } from "svelte";
  import { browser } from "$app/environment";
  import { CaretRight, Star, CopySimple } from "phosphor-svelte";
  import { generateHTML, Node, mergeAttributes } from "@tiptap/core";
  import StarterKit from "@tiptap/starter-kit";
  import Underline from "@tiptap/extension-underline";
  import { templatesStore } from "$lib/stores/templates";
  import { showContent } from "$lib/stores/showContent.js";
  import { switchMobileNav } from "$lib/utils/utils.js";
  import { user } from "$lib/stores/user";
  import toast from "svelte-french-toast";

  export let type = "template";
  export let id = null;
  export let name = null;
  export let content = "";
  let contentEl;
  let isFavorite = false;

  let hasActiveSubscription = false;
  let currentUser;
  $: {
    currentUser = $user;

    if (currentUser && currentUser.subscriptionActive === true) {
      hasActiveSubscription = true;
    }
  }

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
        dom.setAttribute("contenteditable", "false");
        dom.textContent = `{{${node.attrs.placeholder || node.attrs.variable || ""}}}`;

        return {
          dom,
        };
      };
    },
  });

  let templateContentHTML = "";

  // console.log("content value: ", content);

  if (content && content.content) {
    try {
      templateContentHTML = generateHTML(content.content, [
        StarterKit,
        Variable,
        Underline,
      ]);
    } catch (error) {
      console.log("templateContentHTML - content.content:", content.content);
      // console.error("content content.content: Error generating HTML:", error);
    }
  } else if (content) {
    try {
      templateContentHTML = generateHTML(content, [
        StarterKit,
        Variable,
        Underline,
      ]);
      // console.log(templateContentHTML);
    } catch (error) {
      // console.log("templateContentHTML - content:", content);
      // console.error("content: Error generating HTML:", error);
    }
  }

  // console.log("templateContentHTML: ", templateContentHTML);

  function countTemplatesInCategory(categoryArray, targetId) {
    let templateCount = 0;
    let foundTarget = false;

    // Helper function to recursively search categories
    function searchCategory(category) {
      // If the current category matches the targetId or we are inside the target category, count its templates
      if (category.id === targetId) {
        foundTarget = true;
      }

      if (foundTarget && category.templates) {
        templateCount += category.templates.length;
      }

      // If there are subcategories, search them recursively
      if (category.sub && category.sub.length > 0) {
        category.sub.forEach((subCategory) => searchCategory(subCategory));
      }

      // Reset foundTarget to false when leaving a category, as this stops counting subcategories if the target is found
      if (category.id === targetId) {
        foundTarget = false;
      }
    }

    // Start searching in the provided category array
    categoryArray.forEach((category) => searchCategory(category));

    return templateCount;
  }

  const toggleFavorite = () => {
    isFavorite = !isFavorite;
    saveFavoriteState();
  };

  const saveFavoriteState = () => {
    if (browser) {
      let favoriteTemplates =
        JSON.parse(localStorage.getItem("favoriteTemplates")) || [];

      const index = favoriteTemplates.findIndex((item) => item.id === id);

      if (isFavorite && index === -1) {
        favoriteTemplates.unshift({
          id: id,
          name: name,
          content: content.content,
        });
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

      isFavorite = favoriteTemplates.some((item) => item.id === id);
    } else {
      console.warn("localStorage is not available in this environment.");
    }
  };

  function copyHtmlToClipboard(htmlElement) {
    if (!htmlElement) {
      console.error("htmlElement is null. Cannot copy.");
      return;
    }

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

  // Copy the generated content to clipboard
  const copyToClipboard = async (e) => {
    e.currentTarget.dataset.tooltip = "Gekopieerd";

    try {
      const htmlElement = document.querySelector(
        `.thumbnail[id="${id}"] .content`
      );
      copyHtmlToClipboard(contentEl);
      // copyPlainTextToClipboard(htmlElement);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const resetCopyTooltip = (e) => {
    const tooltipElement = e.currentTarget; // Store the reference before timeout
    const defaultTooltip = tooltipElement.dataset.default_tooltip; // Store the necessary data

    setTimeout(() => {
      tooltipElement.dataset.tooltip = defaultTooltip; // Use the stored reference
    }, 250);
  };

  onMount(() => {
    if (id) {
      loadFavoriteState();
    }
  });
</script>

{#if type == "template"}
  <a
    href="/{type}/{id}"
    class="thumbnail"
    data-type={type}
    data-id={id}
    on:click={(e) => switchMobileNav("browse")}
  >
    <h3>{name}</h3>
    <div class="content" data-show={$showContent} bind:this={contentEl}>
      {#if content}
        <!-- {content} -->
        {@html templateContentHTML}
      {/if}
    </div>
    <div class="actions">
      <div>
        <button
          class="button basic"
          data-flow="top"
          data-tooltip={isFavorite ? "Favoriet wissen" : "Favoriet maken"}
          on:click={(e) => {
            e.preventDefault();
            e.stopPropagation();

            if (hasActiveSubscription) {
              toggleFavorite();
            } else {
              toast.error("Actief abonnement vereist", {
                position: "bottom-right",
              });
            }
          }}
        >
          <span class="icon">
            {#if isFavorite}
              <Star size={16} weight="fill" color="var(--primary-darker)" />
            {:else}
              <Star size={16} />
            {/if}
          </span>
        </button>
        {#if templateContentHTML}
          <button
            class="button basic"
            data-flow="top"
            data-tooltip="Mail kopiëren"
            data-default_tooltip="Mail kopiëren"
            on:click={(e) => {
              e.preventDefault();
              e.stopPropagation();

              if (hasActiveSubscription) {
                copyToClipboard(e);
              } else {
                toast.error("Actief abonnement vereist", {
                  position: "bottom-right",
                });
              }
            }}
            on:mouseleave={resetCopyTooltip}
          >
            <span class="icon">
              <CopySimple size={16} />
            </span>
          </button>
        {/if}
      </div>
      <button class="button basic link" data-flow="top" data-tooltip="Bekijken">
        <span class="icon">
          <CaretRight size={16} />
        </span>
      </button>
    </div>
  </a>
{:else if type == "category"}
  <a href="/{type}/{id}" class="thumbnail" data-type={type} data-id={id}>
    <h3>{name}<span>{countTemplatesInCategory($templatesStore, id)}</span></h3>
    <span class="icon_outer"><CaretRight size={14} /></span>
  </a>
{:else}
  <a
    href="/template/{id}"
    class="thumbnail"
    data-type={type}
    data-id={id}
    on:click={(e) => switchMobileNav("browse")}
  >
    <h3>{name}<span></span></h3>
    <span class="icon_outer"><CaretRight size={14} /></span>
  </a>
{/if}

<style lang="scss">
  :global(.thumbnail .content *) {
    font-size: inherit;
    &:empty:last-child {
      display: flex;
      height: 1.5em;
      &:last-child {
        display: none;
      }
    }
  }
  :global(.thumbnail .content code) {
    font-size: 1.3rem;
    // padding: 4px 4px;
    // line-height: 100%;
  }
  .thumbnail {
    padding: 15px;
    position: relative;
    border-radius: var(--border-radius-medium, 12px);
    border: 1px solid var(--border);
    background-color: #fff;
    display: flex;
    flex-direction: row;
    align-items: center;
    cursor: pointer;
    text-decoration: none;
    transition:
      background-color 0.2s ease-out,
      border-color 0.2s ease-out;
    color: $black;
    user-select: none;

    &:active {
      color: inherit;
    }
    h3 {
      font-size: 1.6rem;
      flex-grow: 1;
      margin-bottom: 0;
      display: flex;
      align-items: center;
      gap: 10px;
      color: inherit;

      span {
        // background-color: var(--gray-200);
        // display: inline-flex;
        // border-radius: 5px;
        // padding: 0 8px;
        font-size: 1.2rem;
        color: var(--gray-400);
      }
    }

    .icon_outer {
      color: inherit;
      display: flex;
    }

    &[data-type="template"] {
      flex-direction: column;
      align-items: stretch;
      padding: 25px;
      gap: 20px;

      h3 {
        font-size: 1.8rem;
        font-weight: 600;
        flex-grow: 0;
      }

      .content {
        position: relative;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        gap: 0.5em;
        border-top: 1px solid var(--gray-300);
        padding-top: 20px;
        overflow: hidden;
        margin-bottom: 0;
        max-height: calc(4em * 2.2 + 30px);
        font-size: 1.4rem;
        transition:
          max-height 0.3s ease-out,
          border-color 0.3s ease-out,
          margin-bottom 0.3s ease-out;
        &:has(> p:first-child:last-child:empty),
        &:empty,
        &[data-show="false"] {
          max-height: 0;
          border-color: transparent;
          margin-bottom: 30px;
        }

        &:empty {
          border: none;
        }

        &::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            1deg,
            rgba(255, 255, 255, 1) 0%,
            rgba(255, 255, 255, 1) 5%,
            rgba(255, 255, 255, 0) 100%
          );
          top: unset;
          height: 30px;
        }
      }
      .actions {
        position: absolute;
        background: linear-gradient(
          0deg,
          rgba(255, 255, 255, 1) 0%,
          rgba(255, 255, 255, 1) 65%,
          rgba(255, 255, 255, 0) 100%
        );
        border-bottom-left-radius: inherit;
        border-bottom-right-radius: inherit;
        width: 100%;
        left: 0;
        bottom: 0;
        right: 0;
        padding: inherit;
        z-index: 1;
        display: flex;
        justify-content: space-between;
        gap: 10px;

        > div {
          display: flex;
          gap: inherit;
        }

        .button {
          overflow: unset;
          border-radius: 25px;

          &.link {
            @media (min-width: calc(#{$lg} + 1px)) {
              color: hsl(from var(--primary) h s calc(l - 70));
              background: var(--primary);
              border-color: var(--primary);
            }

            // background-color: hsl(from var(--primary) h s calc(l + 40));
            // color: var(--primary);
            // border-color: transparent;
          }
          .icon {
            display: flex;
          }

          &:last-child {
            align-self: flex-end;
          }
        }
      }
    }

    &.thumbnail {
      @media (max-width: $lg) {
        &[data-type="template"] {
          padding: 20px;
        }
      }
    }

    &:not(:has(.content:empty)):not(:has(.content[data-show="false"])):not(
        :has(.content > p:first-child:last-child:empty)
      )
      .actions {
      opacity: 0;
      pointer-events: none;
      transform: translateY(15px);
      transition:
        opacity 0.2s ease-out,
        transform 0.2s ease-out;

      @media (max-width: $lg) {
        opacity: 1;
        pointer-events: none;
        transform: translateY(0);
      }
    }
    &:hover {
      // background-color: var(--gray-100);
      border-color: var(--gray-400);

      &:not(:has(.content:empty)):not(:has(.content[data-show="false"])):not(
          :has(.content > p:first-child:last-child:empty)
        )
        .actions {
        opacity: 1;
        pointer-events: auto;
        transform: translateY(0);
      }
    }
  }
</style>
