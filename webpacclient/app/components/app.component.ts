import { Component } from '@angular/core';
import { RouteConfig, ROUTER_DIRECTIVES, ROUTER_PROVIDERS } from '@angular/router-deprecated';
import { Observable } from "rxjs/Observable";
import { PlcViewerComponent } from "./plcviewer/plcviewer.component";
import { LoginComponent } from "./login/login.component";

import { WebpacService, ConnectionState } from "../services/webpac.service";

@Component({
  selector: 'webpac-client-app',
  template: `
    <h1>{{title}}</h1>
    <nav>
      <a [routerLink]="['Home']">Home</a>
      <a [routerLink]="['Login']">Login/out</a>
    </nav>
    <router-outlet></router-outlet>
  `,
  directives: [ROUTER_DIRECTIVES],
  providers: [
    ROUTER_PROVIDERS,
    WebpacService
  ]
})
@RouteConfig([
  { path: '/', component: LoginComponent, name: 'Login', useAsDefault:true },
  { path: '/Home', name: 'Home', component: PlcViewerComponent}
])
export class AppComponent{ 
    title = 'Webpac Sample';
    // An internal "copy" of the connection state stream used because
    //  we want to map the values of the original stream. If we didn't 
    //  need to do that then we could use the service's observable 
    //  right in the template.
    //   
    public connectionState: Observable<string>;

    constructor( private _webpacService: WebpacService) {

      if(this._webpacService != null){
        // Let's wire up to the signalr observables
        //
        this.connectionState = this._webpacService.connectionState
          .map((state: ConnectionState) => { return ConnectionState[state]; });

        this._webpacService.error.subscribe(
            (error: any) => { console.warn(error); },
            (error: any) => { console.error("errors$ error", error); }
        );

        // Wire up a handler for the starting$ observable to log the
        //  success/fail result
        //
        this._webpacService.starting.subscribe(
            () => { console.log("signalr service has been started"); },
            () => { console.warn("signalr service failed to start!"); }
        );
      }
    }

}