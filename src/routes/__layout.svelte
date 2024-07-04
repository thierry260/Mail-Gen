<script context="module">
  export const prerender = true;
</script>

<nav>
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
    <li><a href="/contact">Contact</a></li>
  </ul>
</nav>

<main>
  <slot />
</main>

<style>
  nav {
    background-color: #333;
    color: white;
    padding: 1rem;
  }
  nav ul {
    list-style: none;
    padding: 0;
  }
  nav ul li {
    display: inline;
    margin-right: 1rem;
  }
  nav ul li a {
    color: white;
    text-decoration: none;
  }
  nav ul li a:hover {
    text-decoration: underline;
  }
  main {
    padding: 2rem;
  }
</style>
