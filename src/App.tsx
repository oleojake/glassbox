import { useRoute } from "./lib/router";
import { Landing } from "./components/Landing";
import { Demo } from "./components/Demo";
import { Docs } from "./components/Docs";
import { Connect } from "./components/Connect";
import { I18nProvider } from "./lib/i18n";

export function App() {
  const route = useRoute();
  return <I18nProvider>{route.name === "landing" ? <Landing /> : route.name === "connect" ? <Connect /> : route.name === "docs" ? <Docs /> : <Demo route={route} />}</I18nProvider>;
}
