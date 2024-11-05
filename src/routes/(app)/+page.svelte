<script>
  import { onMount } from "svelte";
  import { CaretRight, ArrowRight } from "phosphor-svelte";
  import { templatesStore } from "$lib/stores/templates";
  import Search from "$lib/components/Search.svelte";
  import Thumbnail from "$lib/components/Thumbnail.svelte";
  import Header from "$lib/components/header/Header.svelte";
  import { browser } from "$app/environment";
  import { switchMobileNav } from "$lib/utils/utils.js";

  import "intro.js/introjs.css";
  import introJs from "intro.js";

  let data = [];
  let recentlyViewed = [];
  let favoriteTemplates = [];
  let allTemplates = [];
  let searchInput = "";
  let searchResults = [];

  $: {
    data = $templatesStore;

    if (data) {
      console.log(data);
      allTemplates = [];
      data.forEach((category) => {
        allTemplates = extractTemplates(category, allTemplates);
      });
      data = data.map((category) => ({
        ...category,
      }));
    } else {
      console.log("Categories not found");
    }
  }

  onMount(async () => {
    // Function to retrieve recently viewed templates from localStorage
    const getRecentlyViewed = () => {
      return JSON.parse(localStorage.getItem("recentlyViewed")) || [];
    };

    // Function to retrieve favorite templates from localStorage
    const getFavoriteTemplates = () => {
      return JSON.parse(localStorage.getItem("favoriteTemplates")) || [];
    };

    // Retrieve recently viewed and favorite templates
    recentlyViewed = getRecentlyViewed();
    favoriteTemplates = getFavoriteTemplates();

    startHomeTour();
  });

  const extractTemplates = (category, templates = []) => {
    if (category.templates) {
      templates = templates.concat(category.templates);
    }
    if (category.sub) {
      category.sub.forEach((subcategory) => {
        templates = extractTemplates(subcategory, templates);
      });
    }
    return templates;
  };

  // Example function to start the tour
  const startHomeTour = () => {
    if (!browser) return;

    const isMobile = window.matchMedia("(max-width: 992px)").matches;

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
              document.querySelector(".layout")?.classList.add("no_transition");
              switchMobileNav("home");
              console.log("switch to home");
            } else if (layoutSelector.matches(".layout > main")) {
              document.querySelector(".layout")?.classList.add("no_transition");
              switchMobileNav("browse");
              console.log("switch to browse");
            } else if (layoutSelector.matches(".layout > aside")) {
              document.querySelector(".layout")?.classList.add("no_transition");
              switchMobileNav("search");
              console.log("switch to search");
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
        })
        .oncomplete(function () {
          document
            .querySelector(".layout.no_transition")
            ?.classList.remove("no_transition");
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
    }, 550);
  };
</script>

<Header />
<div class="home">
  <!-- <div class="search">
    <Search />
  </div> -->

  <div class="categories">
    <h2 class="introduction" data-intro="Hello step one!">Categorieën</h2>
    <div class="categories_grid">
      {#each data as item}
        <Thumbnail type={"category"} id={item.id} name={item.name} />
      {/each}
    </div>
  </div>

  <div class="templates">
    {#if favoriteTemplates && favoriteTemplates.length}
      <div class="favorite_templates">
        <h2>Favoriete templates</h2>
        <div class="recent_templates">
          {#each favoriteTemplates as template}
            {#if JSON.stringify($templatesStore).includes(template.id)}
              <Thumbnail
                type={"template"}
                id={template.id}
                name={template.name}
                content={template}
              />
            {/if}
          {/each}
        </div>
      </div>
    {/if}

    {#if recentlyViewed && recentlyViewed.length}
      <div class="recently_viewed">
        <h2>Recent bekeken</h2>
        <div class="recent_templates">
          {#each recentlyViewed as template}
            {#if JSON.stringify($templatesStore).includes(template.id)}
              <Thumbnail
                type={"template"}
                id={template.id}
                name={template.name}
                content={template}
              />
            {/if}
          {/each}
        </div>
      </div>
    {/if}

    {#if allTemplates && allTemplates.length}
      <div class="all_templates">
        <h2>Templates</h2>
        <div class="recent_templates">
          {#each allTemplates as template}
            <Thumbnail
              type={"template"}
              id={template.id}
              name={template.name}
              content={template.content}
            />
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .home {
    display: flex;
    flex-direction: column;
    gap: 40px;
  }

  .templates {
    display: flex;
    gap: inherit;
    flex-direction: column;
  }

  .favorite_templates,
  .recently_viewed {
    ~ .all_templates {
      display: none;
    }

    &:has(.recent_templates:empty) {
      display: none;
      ~ .all_templates {
        display: block;
      }
    }
  }

  .recent_templates {
    display: grid;
    flex-direction: column;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 480px), 1fr));
    gap: 20px;

    @media (max-width: $xs) {
      gap: 15px;
    }
  }
</style>
