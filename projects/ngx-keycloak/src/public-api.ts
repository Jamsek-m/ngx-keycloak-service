/*
 * Public API Surface of ngx-keycloak
 */

export { KeycloakService } from "./lib/keycloak.service";
export { AuthInterceptor } from "./lib/auth.interceptor";
export {
    KeycloakOptions,
    KeycloakTokenPayload,
    ExtendedKeycloakTokenPayload,
    KeycloakServiceConfiguration,
    GuardRoles,
    AccessRule,
    KeycloakLib
} from "./lib/keycloak.models";
export { AuthGuard } from "./lib/auth.guard";
export { RoleGuard } from "./lib/role.guard";
