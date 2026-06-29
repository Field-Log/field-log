export interface HealthResponse {
  ok: boolean;
  service: string;
}

export interface ServiceInfoResponse {
  name: string;
  status: "ok";
}
