export type Role = "user" | "model";

export interface Message {
  role: Role;
  content: string;
}
