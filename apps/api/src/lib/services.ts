import services from "@package/services";
import { apiEnv } from "../env.js";
import { configureApiServices } from "./create-services.js";

configureApiServices(services, apiEnv);

export { services as s };
