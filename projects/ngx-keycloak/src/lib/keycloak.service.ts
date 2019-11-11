import { EventEmitter, Injectable } from "@angular/core";
import { KeycloakInitOptions, KeycloakInstance } from "keycloak-js";
import * as Keycloak_ from "keycloak-js";
import { KeycloakOptions, KeycloakServiceConfiguration, KeycloakTokenPayload } from "./keycloak.models";
import { Observable, of, throwError } from "rxjs";
import { fromPromise } from "rxjs/internal-compatibility";
import { catchError, map } from "rxjs/operators";

const Keycloak = Keycloak_;

@Injectable({
    providedIn: "root"
})
export class KeycloakService {

    private static instance: KeycloakInstance = null;

    private static REFRESH_BEFORE = -1;

    private authEvent: EventEmitter<boolean> = new EventEmitter<boolean>();

    public static configuration: KeycloakServiceConfiguration = null;

    public static async initialize(options: KeycloakOptions): Promise<void> {
        options = KeycloakService.setDefaults(options);

        KeycloakService.REFRESH_BEFORE = options.refreshTokenBefore * 1000;

        const keycloakInstance: KeycloakInstance = KeycloakService.createInstance(options);

        const config: KeycloakInitOptions = {
            promiseType: "native",
            onLoad: options.allowAnonymousAccess ? "check-sso" : "login-required"
        };

        try {
            await keycloakInstance.init(config);
            KeycloakService.instance = keycloakInstance;
            KeycloakService.setConfiguration(options);
            KeycloakService.validateMinimalRequiredRole();
        } catch (err) {
            throw err;
        }
    }

    private static validateMinimalRequiredRole(): boolean {
        const role = KeycloakService.configuration.minimalRequiredRole;
        if (!role) {
            return true;
        }
        if (KeycloakService.instance.authenticated) {
            if (KeycloakService.instance.hasRealmRole(role)) {
                return true;
            } else {
                return KeycloakService.configuration.roleClients.filter(client => {
                    return KeycloakService.instance.hasResourceRole(role, client);
                }).length > 0;
            }
        }
        return false;
    }

    private static setConfiguration(options: KeycloakOptions): void {
        const roleClients = [];

        if (!options.roleClients) {
            roleClients.push(KeycloakService.instance.clientId);
        } else if (Array.isArray(options.roleClients)) {
            if (options.roleClients.length > 0) {
                roleClients.concat(options.roleClients);
            } else {
                roleClients.push(KeycloakService.instance.clientId);
            }
        } else {
            roleClients.push(options.roleClients);
        }

        KeycloakService.configuration = {
            allowAnonymousAccess: options.allowAnonymousAccess,
            roleClients,
            minimalRequiredRole: options.minimalRequiredRole,
            forbiddenPage: {
                url: options.forbiddenPage.url || "/403",
                external: options.forbiddenPage.external
            }
        };
    }

    public refreshToken(): Observable<void> {
        const payload = this.getTokenPayload<KeycloakTokenPayload>();
        if (!payload) {
            throwError(new Error("Can't read access token payload!"));
        }

        const iat = new Date(payload.iat * 1000);
        const exp = new Date(payload.exp * 1000);
        const now = new Date();

        const timeUntilExpiry = exp.getTime() - now.getTime();
        const validityTime = (exp.getTime() - iat.getTime()) * 2;

        if (timeUntilExpiry <= KeycloakService.REFRESH_BEFORE) {
            // token is about to expire
            if (timeUntilExpiry > 0) {
                // token is not yet expired
                return fromPromise(KeycloakService.instance.updateToken(validityTime))
                    .pipe(
                        map(() => null),
                        catchError((err) => {
                            return throwError(err);
                        })
                    );
            } else {
                // access token has already expired
                const refreshTokenPayload = this.getRefreshTokenPayload<KeycloakTokenPayload>();
                if (!refreshTokenPayload) {
                    throwError(new Error("Can't read refresh token payload!"));
                }

                const refreshExp = new Date(refreshTokenPayload.exp * 1000);
                const timeUntilRefreshExpiry = refreshExp.getTime() - now.getTime();

                if (timeUntilRefreshExpiry > KeycloakService.REFRESH_BEFORE) {
                    // refresh token is still valid - update access token
                    return fromPromise(KeycloakService.instance.updateToken(validityTime))
                        .pipe(
                            map(() => null),
                            catchError((err) => {
                                return throwError(err);
                            })
                        );
                } else {
                    // refresh token is about to expire, log out
                    return throwError(new Error("Token is about to expire! Logging out..."));
                }
            }
        } else {
            // token is still valid
            return of(null);
        }
    }

    /**
     * @deprecated Use observable instead
     */
    public async refreshTokenPromise(): Promise<void> {
        const payload = this.getTokenPayload<KeycloakTokenPayload>();
        if (!payload) {
            throw new Error("Can't read access token payload!");
        }

        const iat = new Date(payload.iat * 1000);
        const exp = new Date(payload.exp * 1000);
        const now = new Date();

        const timeUntilExpiry = exp.getTime() - now.getTime();
        const validityTime = (exp.getTime() - iat.getTime()) * 2;

        if (timeUntilExpiry <= KeycloakService.REFRESH_BEFORE) {
            // token is about to expire
            if (timeUntilExpiry > 0) {
                // token is not yet expired
                await KeycloakService.instance.updateToken(validityTime);
            } else {
                // access token has already expired

                const refreshTokenPayload = this.getRefreshTokenPayload<KeycloakTokenPayload>();
                if (!refreshTokenPayload) {
                    throw new Error("Can't read refresh token payload!");
                }

                const refreshExp = new Date(refreshTokenPayload.exp * 1000);
                const timeUntilRefreshExpiry = refreshExp.getTime() - now.getTime();

                if (timeUntilRefreshExpiry > KeycloakService.REFRESH_BEFORE) {
                    // refresh token is still valid - update access token
                    await KeycloakService.instance.updateToken(validityTime);
                } else {
                    // refresh token is about to expire, log out
                    throw new Error("Token is about to expire! Logging out...");
                }
            }
        }
    }


    public getTokenPayload<P extends KeycloakTokenPayload>(): P {
        if (KeycloakService.instance && KeycloakService.instance.tokenParsed) {
            return KeycloakService.instance.tokenParsed as P;
        }
        return null;
    }

    public getRefreshTokenPayload<P extends KeycloakTokenPayload>(): P {
        if (KeycloakService.instance && KeycloakService.instance.refreshTokenParsed) {
            return KeycloakService.instance.refreshTokenParsed as P;
        }
        return null;
    }

    public logout(redirectUri?: string): Promise<void> {
        return KeycloakService.instance.logout({redirectUri});
    }

    public redirectToLogin(redirectUri?: string): void {
        KeycloakService.instance.login({redirectUri});
    }

    public getToken(): string | null {
        if (KeycloakService.instance && KeycloakService.instance.token) {
            return KeycloakService.instance.token;
        }
        return null;
    }

    public isAuthenticated(): boolean {
        return KeycloakService.instance.authenticated;
    }

    public hasRealmRole(role: string): boolean {
        return this.isAuthenticated() && KeycloakService.instance.hasRealmRole(role);
    }

    public hasClientRole(role: string): boolean {
        if (!this.isAuthenticated()) {
            return false;
        }
        return KeycloakService.configuration.roleClients.filter(client => {
            return KeycloakService.instance.hasResourceRole(role, client);
        }).length > 0;
    }

    public hasRole(role: string): boolean {
        return this.hasRealmRole(role) || this.hasClientRole(role);
    }

    private static createInstance(options: KeycloakOptions): KeycloakInstance {
        if (options.jsonPath) {
            return Keycloak(options.jsonPath);
        } else {
            if (!options.url || !options.realm || !options.clientId) {
                throw new Error("Missing configuration for keycloak service!");
            }
            return Keycloak({
                url: options.url,
                realm: options.realm,
                clientId: options.clientId
            });
        }
    }

    private static setDefaults(options: KeycloakOptions): KeycloakOptions {
        const defaults: KeycloakOptions = {
            allowAnonymousAccess: false,
            refreshTokenBefore: 30
        };
        Object.keys(options).forEach(key => {
            if (!options.hasOwnProperty(key)) {
                options[key] = defaults[key];
            }
        });
        return options;
    }

}
