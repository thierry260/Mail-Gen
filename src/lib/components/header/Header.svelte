<script>
  import Breadcrumbs from "$lib/components/header/Breadcrumbs.svelte";
  import ToggleSwitch from "$lib/components/ToggleSwitch.svelte";
  import { showContent } from "$lib/stores/showContent.js";
  import { get } from "svelte/store";
  import { Lifebuoy, Info } from "phosphor-svelte";
  import { browser } from "$app/environment";
  import { switchMobileNav } from "$lib/utils/utils.js";
  import { writable } from "svelte/store";
  import SupportModal from "$lib/components/header/SupportModal.svelte"; // Import the modal

  import "intro.js/introjs.css";
  import "intro.js/introjs-cstm.css";
  import introJs from "intro.js";

  export let type = "overview";

  // Get the initial value from the store
  let checked = get(showContent);
  let isModalVisible = writable(false);

  function closeModal() {
    isModalVisible.set(false);
  }

  function openModal() {
    isModalVisible.set(true);
  }

  // Update the store when the switch changes
  function handleToggleChange(event) {
    showContent.set(event.detail.checked);
  }

  const startHomeTour = () => {
    if (!browser) return;

    document.cookie =
      "introjs-dontShowAgain=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/"; // Remove cookie

    const isMobile = window.matchMedia("(max-width: 992px)").matches;

    const activeTab = document.querySelector("[name='nav']:checked").value;

    const steps = isMobile
      ? [
          {
            title: "Welkom 👋",
            intro:
              "Leuk dat je er bent! We leggen je graag het een en ander uit.",
          },
          {
            title: "Favorieten",
            element: document.querySelector(
              ".layout > .mobile_home > .favorite_templates"
            ),
            intro:
              "Hier vind je je favoriete templates. Voeg templates toe aan deze lijst via het hart-icoon.",
          },
          {
            title: "Recent bekeken",
            element: document.querySelector(
              ".layout > .mobile_home > .recently_viewed"
            ),
            intro: "Hier vind je recent bekeken templates.",
          },
          {
            title: "Bladeren",
            element: document.querySelector(
              ".mobile_nav label:has(input#browse)"
            ),
            intro:
              "Binnen deze tab kun je door de templates en categorieën bladeren",
          },
          {
            title: "Categorieën",
            element: document.querySelector("main > div .categories"),
            intro: "Hier vind je de categorieën terug.",
          },
          {
            title: "Templates",
            element: document.querySelector("main > div .templates"),
            intro: "Hier vind je de templates terug.",
          },
          {
            title: "Voorbeelden",
            element: document.querySelector(".toggle_label_outer"),
            intro:
              "Zet deze optie aan om een deel van de emailinhoud te tonen in het overzicht.",
          },
          {
            title: "Zoeken",
            element: document.querySelector(
              ".mobile_nav label:has(input#search)"
            ),
            intro:
              "Binnen deze tab kun je alle categorieën en templates inzien en eenvoudig terugvinden via de zoekbalk.",
          },
          {
            title: "Templates",
            element: document.querySelector("aside > .sidebar .templates"),
            intro: "Hier vind je al je categorieën en templates terug.",
          },
          {
            title: "Zoeken",
            element: document.querySelector("aside > .sidebar .search"),
            intro:
              "Tip: Gebruik de zoekbalk om snel de juiste template te vinden.",
          },
          {
            title: "Succes! 💪",
            intro: "Hopelijk hebben we je hiermee op weg geholpen.",
          },
        ]
      : [
          {
            title: "Welkom 👋",
            intro:
              "Leuk dat je er bent! We leggen je graag het een en ander uit.",
          },
          {
            title: "Templates",
            element: document.querySelector("aside > .sidebar .templates"),
            intro: "Hier vind je al je categorieën en templates terug.",
          },
          {
            title: "Zoeken",
            element: document.querySelector("aside > .sidebar .search"),
            intro:
              "Tip: Gebruik de zoekbalk om snel de juiste template te vinden.",
          },
          {
            title: "Categorieën",
            element: document.querySelector("main > div .categories"),
            intro: "Hier vind je de categorieën terug.",
          },
          {
            title: "Templates",
            element: document.querySelector("main > div .templates"),
            intro: "Hier vind je de templates terug.",
          },
          {
            title: "Voorbeelden",
            element: document.querySelector(".toggle_label_outer"),
            intro:
              "Zet deze optie aan om een deel van de emailinhoud te tonen in het overzicht.",
          },
          {
            title: "Succes! 💪",
            intro: "Hopelijk hebben we je hiermee op weg geholpen.",
          },
        ];

    setTimeout(() => {
      introJs()
        .onbeforechange(function (targetElement) {
          const layoutSelector =
            targetElement.closest(".layout > .mobile_home") ||
            targetElement.closest(".layout > main") ||
            targetElement.closest(".layout > aside");

          if (isMobile && layoutSelector) {
            if (layoutSelector.matches(".layout > .mobile_home")) {
              switchMobileNav("home");
            } else if (layoutSelector.matches(".layout > main")) {
              switchMobileNav("browse");
            } else if (layoutSelector.matches(".layout > aside")) {
              switchMobileNav("search");
            }
          } else if (
            isMobile &&
            targetElement.classList.contains("introjsFloatingElement")
          ) {
            switchMobileNav("home");
          }

          console.log(targetElement);
          console.log(targetElement.classList);
        })
        .onexit(function () {
          document
            .querySelector(".layout.no_transition")
            ?.classList.remove("no_transition");
          switchMobileNav(activeTab);
          console.log("switch to: ", activeTab);
        })
        .oncomplete(function () {
          document
            .querySelector(".layout.no_transition")
            ?.classList.remove("no_transition");
          switchMobileNav(activeTab);
          console.log("switch to: ", activeTab);
        })
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
          steps: steps,
        })
        .start();

      if (introJs().isActive()) {
        console.log("tour active");
        document.querySelector(".layout")?.classList.add("no_transition");
      }
    }, 550);
  };
</script>

<header>
  <div class="title">
    <Breadcrumbs type />
  </div>
  <div class="actions">
    {#if type == "template"}
      <slot></slot>
    {:else if type !== "settings"}
      <div class="help">
        <button
          class="button basic action"
          data-tooltip="Info"
          data-flow="bottom"
          on:click={startHomeTour}
        >
          <div class="flex">
            <Info size={18} />
          </div>
        </button>
        <button
          class="button basic action"
          data-tooltip="Support"
          data-flow="bottom"
          on:click={openModal}
        >
          <div class="flex">
            <Lifebuoy size={18} />
          </div>
        </button>
      </div>
      <label class="action toggle_label_outer">
        <span class="legend toggle_label"
          ><span class="desktop">Toon voorbeelden</span><span class="mobile"
            >Voorbeelden</span
          ></span
        >
        <ToggleSwitch bind:checked on:change={handleToggleChange} />
      </label>
    {/if}
  </div>
</header>

<SupportModal visible={$isModalVisible} {closeModal} />

<style lang="scss">
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-block: 30px;
    border-bottom: 1px solid var(--gray-250);
    margin-bottom: 30px;
    position: sticky;
    top: 0;
    background-color: var(--body-background, #f8f8f8);
    top: -50px;
    margin-top: -50px;
    z-index: 9;
    gap: 20px;

    @media (max-width: $lg) {
      padding-block: 10px;
      top: -30px;
      margin-top: -30px;
      min-height: 59px;
    }

    .title {
      overflow: hidden;
      @media (max-width: $lg) {
        // overflow: unset;
      }
    }

    .toggle_label {
      .mobile {
        display: none;
      }
      @media (max-width: $xs) {
        .mobile {
          display: inline-block;
        }
        .desktop {
          display: none;
        }
      }
    }
    .toggle_label_outer {
      cursor: pointer;
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 12px;
      @media (max-width: $xs) {
        gap: 10px;
      }

      .help {
        display: flex;
        align-items: center;
        gap: 5px;
        @media (max-width: $xs) {
          gap: 5px;
        }

        &:not(:last-child) {
          padding-right: 10px;
          margin-right: 3px;
          position: relative;
          // border-right: 1px solid var(--border);

          &::after {
            content: "";
            width: 1px;
            height: 18px;
            position: absolute;
            top: 50%;
            translate: 0 -50%;
            right: 0;
            /* max-height: 12px; */
            display: block;
            background-color: var(--border);
          }
          // margin-right: 12px;
        }
      }
    }

    .action {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 5px;

      .legend {
        font-size: 1.3rem;
      }
      &:first-of-type {
        margin-top: 10px;
      }
      &:last-of-type {
        margin-bottom: 10px;
      }
      .legend {
        margin-block: 0;
      }

      &.button {
        background-color: transparent;
        box-shadow: none;
        border-color: transparent;
        margin: 0;
        padding: 6px;
        &:hover {
          background-color: #fff;
        }
      }
    }
  }
</style>
