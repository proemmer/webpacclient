System.register(['@angular/core', '@angular/router-deprecated', "./plcviewer/plcviewer.component", "./login/login.component", "../services/webpac.service"], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata = (this && this.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    var core_1, router_deprecated_1, plcviewer_component_1, login_component_1, webpac_service_1;
    var AppComponent;
    return {
        setters:[
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (router_deprecated_1_1) {
                router_deprecated_1 = router_deprecated_1_1;
            },
            function (plcviewer_component_1_1) {
                plcviewer_component_1 = plcviewer_component_1_1;
            },
            function (login_component_1_1) {
                login_component_1 = login_component_1_1;
            },
            function (webpac_service_1_1) {
                webpac_service_1 = webpac_service_1_1;
            }],
        execute: function() {
            AppComponent = (function () {
                function AppComponent(_webpacService) {
                    this._webpacService = _webpacService;
                    this.title = 'Webpac Sample';
                    if (this._webpacService != null) {
                        // Let's wire up to the signalr observables
                        //
                        this.connectionState = this._webpacService.connectionState
                            .map(function (state) { return webpac_service_1.ConnectionState[state]; });
                        this._webpacService.error.subscribe(function (error) { console.warn(error); }, function (error) { console.error("errors$ error", error); });
                        // Wire up a handler for the starting$ observable to log the
                        //  success/fail result
                        //
                        this._webpacService.starting.subscribe(function () { console.log("signalr service has been started"); }, function () { console.warn("signalr service failed to start!"); });
                    }
                }
                AppComponent = __decorate([
                    core_1.Component({
                        selector: 'webpac-client-app',
                        template: "\n    <h1>{{title}}</h1>\n    <nav>\n      <a [routerLink]=\"['Home']\">Home</a>\n      <a [routerLink]=\"['Login']\">Login/out</a>\n    </nav>\n    <router-outlet></router-outlet>\n  ",
                        directives: [router_deprecated_1.ROUTER_DIRECTIVES],
                        providers: [
                            router_deprecated_1.ROUTER_PROVIDERS,
                            webpac_service_1.WebpacService
                        ]
                    }),
                    router_deprecated_1.RouteConfig([
                        { path: '/', component: login_component_1.LoginComponent, name: 'Login', useAsDefault: true },
                        { path: '/Home', name: 'Home', component: plcviewer_component_1.PlcViewerComponent }
                    ]), 
                    __metadata('design:paramtypes', [webpac_service_1.WebpacService])
                ], AppComponent);
                return AppComponent;
            }());
            exports_1("AppComponent", AppComponent);
        }
    }
});
//# sourceMappingURL=app.component.js.map