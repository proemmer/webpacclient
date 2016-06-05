System.register(['@angular/platform-browser-dynamic', "@angular/core", '@angular/router', '@angular/http', './components/app.component', './app.constants', "./services/webpac.service", 'rxjs/add/operator/map'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var platform_browser_dynamic_1, core_1, router_1, http_1, app_component_1, app_constants_1, webpac_service_1;
    var config, services;
    return {
        setters:[
            function (platform_browser_dynamic_1_1) {
                platform_browser_dynamic_1 = platform_browser_dynamic_1_1;
            },
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (router_1_1) {
                router_1 = router_1_1;
            },
            function (http_1_1) {
                http_1 = http_1_1;
            },
            function (app_component_1_1) {
                app_component_1 = app_component_1_1;
            },
            function (app_constants_1_1) {
                app_constants_1 = app_constants_1_1;
            },
            function (webpac_service_1_1) {
                webpac_service_1 = webpac_service_1_1;
            },
            function (_1) {}],
        execute: function() {
            config = new app_constants_1.Configuration();
            services = [
                router_1.ROUTER_PROVIDERS,
                http_1.HTTP_PROVIDERS,
                app_constants_1.Configuration,
                webpac_service_1.WebpacService,
                core_1.provide(webpac_service_1.SignalrWindow, { useValue: window })
            ];
            platform_browser_dynamic_1.bootstrap(app_component_1.AppComponent, services);
        }
    }
});
//# sourceMappingURL=main.js.map