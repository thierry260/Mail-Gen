<script>
  import { Toaster } from "svelte-french-toast";
</script>

<div class="layout">
  <aside>
    <img class="logo" src="/img/MailGen-visual.svg" alt="MailGen logo" />
  </aside>
  <main>
    <slot />
  </main>
  <Toaster />
</div>

<style lang="scss">
  .layout {
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    display: grid;
    grid-template-columns: 1fr 1fr;

    aside {
      background: linear-gradient(
        230deg,
        hsl(from var(--primary) h s calc(l - 50)),
        hsl(from var(--primary) h s calc(l - 75))
      );
      background: var(--gray-200);
      background: #fff;

      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      img {
        max-width: 500px;
      }
    }
    main {
      flex: 1;
      padding: 40px;
      overflow-y: auto;
      display: flex;
      // align-items: center;
      justify-content: center;
      flex-direction: column;
      background: #fff;
      background: var(--gray-100);

      @media (max-width: $lg) {
        padding: 30px;
      }
    }

    @media (max-width: $lg) {
      grid-template-columns: 100%;
      aside {
        display: none;
      }
    }
  }
</style>
