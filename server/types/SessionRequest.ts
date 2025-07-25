import type { Request } from "express";

export interface SessionRequest extends Request {
  session: {
    user?: {
      id: string;
      email: string | null;
      username: string;
      firstName: string;
      lastName: string;
      profileImageUrl: string | null;
    };
    destroy(callback: (err: any) => void): void;
    regenerate(callback: (err: any) => void): void;
    save(callback: (err: any) => void): void;
  };
}
