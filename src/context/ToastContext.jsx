import { ToastCtx } from "./toastContextDef";

export function ToastProvider({ children, value }) {
  return <ToastCtx.Provider value={value}>{children}</ToastCtx.Provider>;
}

export default ToastProvider;
