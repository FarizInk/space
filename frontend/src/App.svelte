<script lang="ts">
  import "./app.css";
  import { Router, type RouteConfig, type RouteResult } from "@mateothegreat/svelte5-router";
  import Index from "./pages/Index.svelte";
  import Settings from "./pages/Settings.svelte";
  import Products from "./pages/Products.svelte";
  import User from "./pages/User.svelte";
  import { Toaster } from "$lib/components/ui/sonner/index.js";
  
  const routes: RouteConfig[] = [
    {
      component: Index,
    },
    {
      path: "products",
      component: Products,
    },
    {
      path: "/settings",
      component: Settings,
    },
    {
      path: "/users/(?<id>.*)",
      component: User,
    },
  ];
  
  // This is a global pre hook that can be applied to all routes.
  // Here you could check if the user is logged in or perform some other
  // authentication checks:
  const globalAuthGuardHook = async (route: RouteResult): Promise<boolean> => {
    console.warn("globalAuthGuardHook", route);
    // Return true so that the route can continue down its evaluation path.
    return true;
  };
</script>

<Toaster richColors position="bottom-center" closeButton />
<Router {routes} />
