import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from "@angular/router";
import { Observable } from "rxjs";
import { KeycloakService } from "./keycloak.service";
import { GuardRoles } from "./keycloak.models";

@Injectable({
    providedIn: "root"
})
export class RoleGuard implements CanActivate {

    constructor(private keycloakService: KeycloakService, private router: Router) {

    }

    canActivate(route: ActivatedRouteSnapshot,
                state: RouterStateSnapshot
    ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

        if (!this.keycloakService.isAuthenticated()) {
            this.keycloakService.redirectToLogin();
            return false;
        }

        const data = route.data as GuardRoles;

        if (data.requiredRoles && data.requiredRoles.length > 0) {
            const ownedRequiredRoles = data.requiredRoles.filter(role => {
                return this.keycloakService.hasRole(role);
            });

            if (ownedRequiredRoles.length > 0) {
                return true;
            } else {

                if (!KeycloakService.configuration.forbiddenPage) {
                    this.router.navigate(["/403"]);
                } else if (KeycloakService.configuration.forbiddenPage.external) {
                    window.location.href = KeycloakService.configuration.forbiddenPage.url;
                } else {
                    this.router.navigate([KeycloakService.configuration.forbiddenPage.url]);
                }
                return false;
            }
        }
        return true;
    }

}
