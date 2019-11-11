import { HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { KeycloakService } from "./keycloak.service";
import { Injectable } from "@angular/core";
import { catchError, switchMap } from "rxjs/operators";

@Injectable({
    providedIn: "root"
})
export class AuthInterceptor implements HttpInterceptor {

    constructor(private keycloakService: KeycloakService) {

    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (this.keycloakService.isAuthenticated()) {
            return this.keycloakService
                .refreshToken()
                .pipe(
                    catchError((err: Error) => {
                        this.keycloakService.logout();
                        return throwError(err);
                    }),
                    switchMap(() => {
                        const token = this.keycloakService.getToken();
                        let headers: HttpHeaders = req.headers;
                        if (token !== null) {
                            headers = headers.set("Authorization", `Bearer ${token}`);
                        }

                        return next.handle(req.clone({
                            headers
                        }));
                    })
                );
        }
        return next.handle(req);
    }

}
