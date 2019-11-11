import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from "@angular/router";
import { Observable } from "rxjs";
import { KeycloakService } from "./keycloak.service";


@Injectable({
    providedIn: "root"
})
export class AuthGuard implements CanActivate {

    constructor(private keycloakService: KeycloakService) {

    }

    canActivate(route: ActivatedRouteSnapshot,
                state: RouterStateSnapshot
    ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        if (this.keycloakService.isAuthenticated()) {
            return true;
        } else {
            this.keycloakService.redirectToLogin();
            return false;
        }
    }

}
