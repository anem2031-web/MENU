import { Route, Switch } from "wouter";
import { HomePage } from "./pages/home-page";
import { AdminLoginPage } from "./pages/admin-login-page";
import { AdminPage } from "./pages/admin-page";

function HomeRoute() {
  return <HomePage />;
}

function PublicMenuRoute() {
  const segments = window.location.pathname
    .split("/")
    .filter(Boolean);

  const slug = decodeURIComponent(segments[1] ?? "");

  return <HomePage expectedSlug={slug} />;
}

export function App() {
  return (
    <Switch>
      <Route path="/" component={HomeRoute} />
      <Route path="/menu" component={HomeRoute} />
      <Route path="/menu/:slug" component={PublicMenuRoute} />
      <Route path="/admin/login" component={AdminLoginPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin/:rest*" component={AdminPage} />
      <Route>
        <main className="p-8">الصفحة غير موجودة.</main>
      </Route>
    </Switch>
  );
}
