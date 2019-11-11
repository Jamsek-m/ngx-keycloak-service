export interface KeycloakOptions extends Object {
    /**
     * @default false
     */
    allowAnonymousAccess?: boolean;
    /**
     * Refresh token X seconds before it expires
     */
    refreshTokenBefore?: number;
    url?: string;
    realm?: string;
    clientId?: string;
    jsonPath?: string;
    roleClients?: string | string[];
    minimalRequiredRole?: string;
    forbiddenPage?: {
        url: string;
        external?: boolean;
    };
}

export interface KeycloakServiceConfiguration {
    allowAnonymousAccess: boolean;
    roleClients: string[];
    minimalRequiredRole?: string;
    forbiddenPage?: {
        url: string;
        external?: boolean;
    };
}

export interface KeycloakTokenPayload {
    // Issued At
    iat: number;
    // Expires At
    exp: number;
    // Subject
    sub: string;
    // Issuer
    iss: string;
    // Audience
    aud: string;
    // Realm roles
    realm_access: {
        roles: string[];
    };
    // Client roles
    resource_access: {
        [resourceId: string]: {
            roles: string[];
        }
    };
}

export enum AccessRule {
    AND,
    OR
}

export class GuardRoles {

    public requiredRoles: string[];

    public accessRule: AccessRule;

    public static withRoles(requiredRoles: string[], rule?: AccessRule): GuardRoles {
        const data = new GuardRoles();
        data.requiredRoles = requiredRoles;
        data.accessRule = rule || AccessRule.AND;
        return data;
    }
}
