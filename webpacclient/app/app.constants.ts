import { Injectable } from '@angular/core';
 
@Injectable()
export class Configuration {
    public Server: string = "http://localhost:5000/";
    public ApiUrl: string = "api/";
    public SignalRUrl: string = "signalr";
    public HubName: string = "webpac"
    public ServerWithApiUrl = this.Server + this.ApiUrl;
    public ServerWithSignalRUrl = this.Server + this.SignalRUrl;
    public UseSignalR = true;
}