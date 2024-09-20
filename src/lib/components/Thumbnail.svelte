<script>
  import { CaretRight, Star, CopySimple } from "phosphor-svelte";
  import { generateHTML, Node, mergeAttributes } from "@tiptap/core";
  import StarterKit from "@tiptap/starter-kit";
  import Underline from "@tiptap/extension-underline";
  import { templatesStore } from "$lib/stores/templates";
  import { showContent } from "$lib/stores/showContent.js";

  export let type = "template";
  export let id = null;
  export let name = null;
  export let content = "";

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

  console.log("content: ", content);

  let templateContentHTML = "";

  if (content && content.content) {
    try {
      templateContentHTML = generateHTML(content.content, [
        StarterKit,
        Variable,
        Underline,
      ]);
      console.log(templateContentHTML);
    } catch (error) {
      console.error("Error generating HTML:", error);
    }
  } else {
    console.error("Invalid content format:", content);
  }

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
</script>

{#if type == "template"}
  <a href="/{type}/{id}" class="thumbnail" data-type={type}>
    <h3>{name}</h3>
    <div class="content" data-show={$showContent}>
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
          data-tooltip="Toevoegen aan favorieten"
          on:click={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Your button click logic here
          }}
        >
          <span class="icon">
            {#if 1 == 2}
              <Star size="18" weight="fill" />
            {:else}
              <Star size="18" />
            {/if}
          </span>
        </button>
        <button
          class="button basic"
          data-flow="top"
          data-tooltip="Mail kopiëren"
          on:click={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Your button click logic here
          }}
        >
          <span class="icon">
            <CopySimple size="18" />
          </span>
        </button>
      </div>
      <button class="button basic link" data-flow="top" data-tooltip="Bekijken">
        <span class="icon">
          <CaretRight size="18" />
        </span>
      </button>
    </div>
  </a>
{:else}
  <a href="/{type}/{id}" class="thumbnail" data-type={type}>
    <h3>{name}<span>{countTemplatesInCategory($templatesStore, id)}</span></h3>
    <CaretRight size={14} />
  </a>
{/if}

<style lang="scss">
  .thumbnail {
    padding: 15px;
    position: relative;
    border-radius: var(--border-radius-small, 5px);
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
    &:hover {
      // background-color: var(--gray-100);
      border-color: var(--gray-400);
    }
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

      span {
        // background-color: var(--gray-200);
        // display: inline-flex;
        // border-radius: 5px;
        // padding: 0 8px;
        font-size: 1.2rem;
        color: var(--gray-400);
      }
    }

    &[data-type="template"] {
      flex-direction: column;
      align-items: stretch;
      padding: 30px;
      gap: 20px;

      h3 {
        font-size: 1.8rem;
        font-weight: 600;
        flex-grow: 0;
      }

      .content {
        display: flex;
        flex-direction: column;
        gap: 0.25em;
        margin-bottom: 30px;
        border-top: 1px solid var(--gray-300);
        padding-top: 20px;
        overflow: hidden;
        max-height: calc(4em * 2 + 40px);
        transition:
          max-height 0.3s ease-out,
          border-color 0.3s ease-out;
        &[data-show="false"] {
          max-height: 0;
          border-color: transparent;
        }

        &:empty {
          border: none;
        }
      }
      .actions {
        position: absolute;
        background: linear-gradient(
          1deg,
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
  }
</style>
