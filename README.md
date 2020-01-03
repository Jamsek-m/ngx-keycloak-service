# @mjamsek/ngx-keycloak-service
![Build Status](https://jenkins.mjamsek.com/buildStatus/icon?job=ngx-keycloak-service-lib)
> Library for integrating Keycloak IAM service with Angular application

## Introduction

## Documentation

### Installation

To install library simply execute command:

```bash
npm install --save @mjamsek/ngx-keycloak-service
```

### Usage

#### Initialization

Library's initialization method must be called at application startup, preferably, before any other code.

Two recommended ways:

* Register Angular application initializer (recommended - the Angular way)
* In `main.ts` file to wrap around Angular's bootstrap function

##### Application initializer

First, we will need to write factory function, which will call initialization method. For this we can create new file called `factories.ts` and put this code in it:

```typescript
import {KeycloakService} from "@mjamsek/ngx-keycloak-service";

export function AppAuthFactory() {
    return async () => {
        await KeycloakService.initialize({
            url: "http://keycloak.domain.com/auth",
            realm: "realm-name",
            clientId: "client-id",
            allowAnonymousAccess: true,
            roleClients: ["client-id"],
            forbiddenPage: {
                external: false,
                url: "/403"
            }
        });
    };
}
```

Next we need to let Angular know, to use this factory when initializing application. We can do this in `app.module.ts`:

```typescript
import {APP_INITIALIZER, NgModule} from "@angular/core";
import {AppAuthFactory} from "./factories";

@NgModule({
    declarations: [],
    imports: [],
    providers: [
        {provide: APP_INITIALIZER, useFactory: AppAuthFactory, multi: true}
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
```

##### Wrapping method

In file `main.ts`, bootstrap Angular method with own:

```typescript
import { enableProdMode } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { AppModule } from "./app/app.module";
import { environment } from "./environments/environment";
import { KeycloakService } from "@mjamsek/ngx-keycloak-service";

if (environment.production) {
    enableProdMode();
}
KeycloakService.initialize({jsonPath: "assets/keycloak.json"}).then(() => {
    platformBrowserDynamic().bootstrapModule(AppModule)
        .catch(err => console.error(err));
});
```
