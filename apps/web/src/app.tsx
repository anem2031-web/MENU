import { Route, Switch } from "wouter";
import { HomePage } from "./pages/home-page";
import { AdminLoginPage } from "./pages/admin-login-page";
import { AdminPage } from "./pages/admin-page";

export function App() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/admin/login" component={AdminLoginPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin/:rest*" component={AdminPage} />
      <Route>
        <main className="p-8">الصفحة غير موجودة.</main>
      </Route>
    </Switch>
  );
}
