"use strict";
var platform_browser_dynamic_1 = require('@angular/platform-browser-dynamic');
var core_1 = require("@angular/core");
var router_1 = require('@angular/router');
var http_1 = require('@angular/http');
var app_component_1 = require('./components/app.component');
var app_constants_1 = require('./app.constants');
var webpac_service_1 = require("./services/webpac.service");
require('rxjs/add/operator/map');
var config = new app_constants_1.Configuration();
var services = [
    router_1.ROUTER_PROVIDERS,
    http_1.HTTP_PROVIDERS,
    app_constants_1.Configuration,
    webpac_service_1.WebpacService,
    core_1.provide(webpac_service_1.SignalrWindow, { useValue: window })
];
platform_browser_dynamic_1.bootstrap(app_component_1.AppComponent, services);
//# sourceMappingURL=main.js.map