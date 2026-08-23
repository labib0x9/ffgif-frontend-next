import { createContext } from "react";

export const ToastCtx = createContext({ push: () => {} });
export default ToastCtx;
