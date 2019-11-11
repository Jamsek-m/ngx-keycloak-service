import { NgModule } from "@angular/core";
import { KeycloakService } from "./keycloak.service";
import { AuthInterceptor } from "../public-api";
import { AuthGuard } from "./auth.guard";
import { RoleGuard } from "./role.guard";


@NgModule({
    declarations: [],
    imports: [],
    exports: [],
    providers: [
        KeycloakService,
        AuthInterceptor,
        RoleGuard,
        AuthGuard
    ]
})
export class NgxKeycloakModule {
}
