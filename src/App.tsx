import { useEffect, useState } from "react";
import DirectorLoginPage from "./features/auth/DirectorLoginPage";
import DirectorRegisterPage from "./features/auth/DirectorRegisterPage";
import DirectorDatabaseSetupPage from "./features/auth/DirectorDatabaseSetupPage";
import RoleRouter from "./features/router/RoleRouter";
import { DirectorUser } from "./core/types/auth";
import {
  logoutDirector,
  subscribeDirectorSession,
} from "./features/auth/useCLevelAuth";

export default function App() {
  const [mode, setMode] = useState<"login" | "register" | "setup">("login");
  const [user, setUser] = useState<DirectorUser | null>(null);
  const [sessionResolved, setSessionResolved] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeDirectorSession((nextUser) => {
      setUser(nextUser);
      setSessionResolved(true);
      if (nextUser) {
        setMode("login");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await logoutDirector();
    setUser(null);
    setMode("login");
  };

  if (!sessionResolved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-300">
        Memulihkan sesi direksi...
      </div>
    );
  }

  if (user) {
    return <RoleRouter user={user} onLogout={handleLogout} />;
  }

  if (mode === "register") {
    return (
      <DirectorRegisterPage
        onRegistered={setUser}
        onGoLogin={() => setMode("login")}
        onGoSetup={() => setMode("setup")}
      />
    );
  }

  if (mode === "setup") {
    return (
      <DirectorDatabaseSetupPage
        onGoLogin={() => setMode("login")}
        onGoRegister={() => setMode("register")}
      />
    );
  }

  return (
    <DirectorLoginPage
      onLogin={setUser}
      onGoRegister={() => setMode("register")}
    />
  );
}
