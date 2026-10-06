import type { GetUser, TotalUsers } from "../types/administration";
import { API_URL } from "./config";

const ADMINISTRATION = "administration"


export async function getUsers(howMany: number = 10, page: number = 1, search: string = ""): Promise<GetUser[] | null>{
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


export async function setUserActive(userId: number, isActive: boolean): Promise<string | null>{
  const res = await fetch(`${API_URL}/${ADMINISTRATION}/set-user-active?user_id=${userId}&is_active=${isActive}`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) return null;
  const data =  await res.json();
  return data.details;
}


export async function editUser(user: GetUser): Promise<string | null>{
  const res = await fetch(`${API_URL}/${ADMINISTRATION}/edit-user`, {
    method: "POST",
    credentials: "include",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(user),
  });
  if (!res.ok) return null;
  return  await res.json();
}
