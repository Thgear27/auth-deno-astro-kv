/// <reference types="astro/client" />

declare namespace App {
  // Note: 'import {} from ""' syntax does not work in .d.ts files.
  interface Locals {
    session: import("./db/types").Session | null;
    user: import("./db/types").User | null;
  }
}
