import { Principal } from "@dfinity/principal";

export function principalToString(p: Principal): string {
  return p.toString();
}

export function stringToPrincipal(s: string): Principal {
  return Principal.fromText(s);
} 