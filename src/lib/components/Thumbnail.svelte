<script>
  import { CaretRight } from "phosphor-svelte";
  import { Editor, generateHTML, Node, mergeAttributes } from "@tiptap/core";
  import StarterKit from "@tiptap/starter-kit";
  import Underline from "@tiptap/extension-underline";

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
</script>

<a href="/{type}/{id}" class="thumbnail" data-type={type}>
  <h3>{name}</h3>
  <div class="content">
    {#if content}
      <!-- {content} -->
      {@html templateContentHTML}
    {/if}
  </div>
  <CaretRight size={14} />
</a>

<style lang="scss">
  .thumbnail {
    padding: 15px;
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
    }
  }
</style>
