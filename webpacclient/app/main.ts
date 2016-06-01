import { bootstrap }    from '@angular/platform-browser-dynamic';
import { provide } from "@angular/core";
import { ROUTER_PROVIDERS } from '@angular/router';
import { HTTP_PROVIDERS } from '@angular/http';
import { AppComponent } from './components/app.component';
import { Configuration } from './app.constants';
import { WebpacService, SignalrWindow} from "./services/webpac.service";
import 'rxjs/add/operator/map';

let config = new Configuration();

var services = [
    ROUTER_PROVIDERS,
    HTTP_PROVIDERS,
    Configuration,
    WebpacService,
    provide(SignalrWindow, {useValue: window})
];

bootstrap(AppComponent, services);