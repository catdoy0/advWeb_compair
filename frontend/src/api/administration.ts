import type { GetUsers, TotalUsers } from "../types/administration";
import { API_URL } from "./config";

const ADMINISTRATION = "administration"


export async function getUsers(howMany: number = 10, page: number = 1, search: string = ""): Promise<GetUsers[] | null>{
  const res = await fetch(`${API_URL}/${ADMINISTRATION}/get-users?how_many=${howMany}&page=${page}&search=${search}`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) return null;
  return await res.json();
}

export async function getTotalUsers(): Promise<TotalUsers | null>{
  const res = await fetch(`${API_URL}/${ADMINISTRATION}/get-total-users`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) return null;
  return await res.json();
}
