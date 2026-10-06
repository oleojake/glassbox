import { useRoute } from "./lib/router";
import { Landing } from "./components/Landing";
import { Demo } from "./components/Demo";

export function App() {
  const route = useRoute();
  return route.name === "landing" ? <Landing /> : <Demo route={route} />;
}
