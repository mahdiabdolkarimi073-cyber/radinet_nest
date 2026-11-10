declare namespace Express {
  interface UserPayload {
    sub: string;
    email: string;
    role: string;
    name?: string;
    organizationId?: string | null;
  }

  interface Request {
    user?: UserPayload;
    headers: Record<string, string | string[] | undefined>;
    body?: Record<string, unknown>;
    params?: Record<string, string>;
    query?: Record<string, string | string[] | undefined>;
    method?: string;
    url?: string;
    originalUrl?: string;
    ip?: string;
  }

  interface Response {
    statusCode?: number;
    setHeader(name: string, value: number | string | readonly string[]): this;
    getHeader(name: string): number | string | string[] | undefined;
    status(code: number): this;
    json(body?: unknown): this;
    send(body?: unknown): this;
    end(chunk?: unknown): this;
  }
}

declare module 'express' {
  export type Request = Express.Request;
  export type Response = Express.Response;
  export type NextFunction = (err?: unknown) => void;
}
