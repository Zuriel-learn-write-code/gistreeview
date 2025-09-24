export interface User {
  id: string;
  email: string;
  role: "admin" | "officer" | "user";
}

export const setUserData = (user: User) => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.setItem("user", JSON.stringify(user));
  } catch (err) {
    // localStorage may be unavailable in some environments (file://, sandboxed iframe)
    // swallow the error and continue without throwing to avoid breaking the app render
    // eslint-disable-next-line no-console
    console.debug('auth.setUserData: localStorage unavailable', err);
  }
};

export const getUserData = (): User | null => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch {
        return null;
      }
    }
    return null;
  } catch (err) {
    // Access may be blocked by browser settings or sandbox; return null instead of throwing
    // eslint-disable-next-line no-console
    console.debug('auth.getUserData: localStorage unavailable', err);
    return null;
  }
};

export const getUserRole = (): "admin" | "officer" | "user" | null => {
  const user = getUserData();
  return user ? user.role : null;
};

export const clearUserData = () => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.removeItem("user");
  } catch (err) {
    // ignore
    // eslint-disable-next-line no-console
    console.debug('auth.clearUserData: localStorage unavailable', err);
  }
};
