import type { Dispatch, SetStateAction } from "react";

export function setIfChanged<T>(setter: Dispatch<SetStateAction<T>>, next: T): void {
  setter((current) => JSON.stringify(current) === JSON.stringify(next) ? current : next);
}
