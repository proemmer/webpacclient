"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var core_1 = require('@angular/core');
var router_deprecated_1 = require('@angular/router-deprecated');
var plcviewer_component_1 = require("./plcviewer/plcviewer.component");
var webpac_service_1 = require("../services/webpac.service");
var AppComponent = (function () {
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
            template: "\n    <h1>{{title}}</h1>\n    <nav>\n      <a [routerLink]=\"['PlcView']\">PlcView</a>\n    </nav>\n    <router-outlet></router-outlet>\n  ",
            directives: [router_deprecated_1.ROUTER_DIRECTIVES],
            providers: [
                router_deprecated_1.ROUTER_PROVIDERS,
                webpac_service_1.WebpacService
            ]
        }),
        router_deprecated_1.RouteConfig([
            { path: '/plcview', name: 'PlcView', component: plcviewer_component_1.PlcViewerComponent, useAsDefault: true }
        ]), 
        __metadata('design:paramtypes', [webpac_service_1.WebpacService])
    ], AppComponent);
    return AppComponent;
}());
exports.AppComponent = AppComponent;
//# sourceMappingURL=app.component.js.map