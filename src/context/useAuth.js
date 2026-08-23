import { useContext } from "react";
import { AuthCtx } from "./authContextDef";

export function useAuth() {
  return useContext(AuthCtx);
}

export default useAuth;
