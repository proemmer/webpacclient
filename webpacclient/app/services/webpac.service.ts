import {Injectable} from '@angular/core';
import {Http, URLSearchParams, Headers} from '@angular/http';
import {Observable} from 'rxjs/Rx';
import {Configuration} from '../app.constants';
import {Subject} from "rxjs/Subject";

/**
 * When SignalR runs it will add functions to the global $ variable 
 * that you use to create connections to the hub. However, in this
 * class we won't want to depend on any global variables, so this
 * class provides an abstraction away from using $ directly in here.
 */
export class SignalrWindow extends Window {
    $: any;
}

export enum ConnectionState {
    Connecting = 1,
    Connected = 2,
    Reconnecting = 3,
    Disconnected = 4
}

export class DataChangeEvent {
    Mapping: string;
    Variable: string;
    Timestamp: Date;
    Value: any;
    Json: string;

    constructor() {
        this.Timestamp = new Date();
    }
}

class Subscriber{
    mapping: string;
    variables: string[];
    subject: Subject<DataChangeEvent>;
}

@Injectable()
export class WebpacService{
    private _headers: Headers;
    private _blocksActionUrl : string;
    private _symbolsActionUrl : string;
    private _absoluteActionUrl : string;
    
    /**
     * starting$ is an observable available to know if the signalr 
     * connection is ready or not. On a successful connection this
     * stream will emit a value.
     */
    public starting: Observable<any>;

    /**
     * connectionState$ provides the current state of the underlying
     * connection as an observable stream.
     */
    public connectionState: Observable<ConnectionState>;

    /**
     * error$ provides a stream of any error messages that occur on the 
     * SignalR connection
     */
    public error: Observable<string>;
    
    
    // These are used to feed the public observables 
    //
    private connectionStateSubject = new Subject<ConnectionState>();
    private startingSubject = new Subject<any>();
    private errorSubject = new Subject<any>();

    // These are used to track the internal SignalR state 
    //
    private _hubConnection: any;
    private _hubProxy: any;
    
    // An internal array to track what channel subscriptions exist 
    //
    private _subscribers = new Array<Subscriber>();
    
    
    constructor(private _http: Http, 
                private _configuration: Configuration,
                private _window: SignalrWindow) {
    
        this.configureSignalR();
        this.configureWebApi();  
    }
    
    private configureWebApi(){
                
        this._blocksActionUrl = this._configuration.ServerWithApiUrl + "blocks/";
        this._symbolsActionUrl = this._configuration.ServerWithApiUrl + "symbols/";
        this._absoluteActionUrl = this._configuration.ServerWithApiUrl + "absolutes/";
        
        this._headers = new Headers();
        this._headers.append('Content-Type', 'application/json');
        this._headers.append('Accept', 'application/json');
    }
    
    private configureSignalR(){
        
        if(!this._configuration.UseSignalR)
            return;
        
        if (this._window.$ === undefined || this._window.$.hubConnection === undefined) {
            throw new Error("The variable '$' or the .hubConnection() function are not defined...please check the SignalR scripts have been loaded properly");
        }
        
        // Set up our observables
        //
        this.connectionState = this.connectionStateSubject.asObservable();
        this.error = this.errorSubject.asObservable();
        this.starting = this.startingSubject.asObservable();

        this._hubConnection = this._window.$.hubConnection();
        this._hubConnection.url = this._configuration.ServerWithSignalRUrl;
        this._hubProxy = this._hubConnection.createHubProxy(this._configuration.HubName);
        
         // Define handlers for the connection state events
        //
        this._hubConnection.stateChanged((state: any) => {
            let newState = ConnectionState.Connecting;

            switch (state.newState) {
                case this._window.$.signalR.connectionState.connecting:
                    newState = ConnectionState.Connecting;
                    break;
                case this._window.$.signalR.connectionState.connected:
                    newState = ConnectionState.Connected;
                    break;
                case this._window.$.signalR.connectionState.reconnecting:
                    newState = ConnectionState.Reconnecting;
                    break;
                case this._window.$.signalR.connectionState.disconnected:
                    newState = ConnectionState.Disconnected;
                    break;
            }

            // Push the new state on our subject
            //
            this.connectionStateSubject.next(newState);
        });
        
         // Define handlers for any errors
        //
        this._hubConnection.error((error: any) => {
            // Push the error on our subject
            //
            this.errorSubject.next(error);
        });
        
        this._hubProxy.on("DataChanged", (mapping: string, variable: string, value: any) => {
            //console.log(`onEvent - ${channel} channel`, ev);

            // This method acts like a broker for incoming messages. We 
            //  check the interal array of subjects to see if one exists
            //  for the channel this came in on, and then emit the event
            //  on it. Otherwise we ignore the message.
            //
            let channelSub = this._subscribers.find((x: Subscriber) => {
                return x.mapping === mapping && x.variables.indexOf(variable) > -1 ;
            }) as Subscriber;

            // If we found a subject then emit the event on it
            //
            if (channelSub !== undefined) {
                let dce = new DataChangeEvent();
                dce.Mapping = mapping;
                dce.Variable = variable;
                dce.Value = value;
                return channelSub.subject.next(dce);
            }
        });
    }
    
     /**
     * Start the SignalR connection. The starting$ stream will emit an 
     * event if the connection is established, otherwise it will emit an
     * error.
     */
    private start(): void {
        // Now we only want the connection started once, so we have a special
        //  starting$ observable that clients can subscribe to know know if
        //  if the startup sequence is done.
        //
        // If we just mapped the start() promise to an observable, then any time
        //  a client subscried to it the start sequence would be triggered
        //  again since it's a cold observable.
        //
        this._hubConnection.start()
            .done(() => {
                this.startingSubject.next(null);
            })
            .fail((error: any) => {
                this.startingSubject.error(error);
            });
    }
    
    public subscribe(mapping: string,  variables: string[]): Observable<DataChangeEvent>{

        // Now we just create our internal object so we can track this subject
        //  in case someone else wants it too
        //
        let channelSub = new Subscriber();
        channelSub.mapping = mapping;
        channelSub.variables = variables;
        channelSub.subject = new Subject<DataChangeEvent>();
        this._subscribers.push(channelSub);

        // Now SignalR is asynchronous, so we need to ensure the connection is
        //  established before we call any server methods. So we'll subscribe to 
        //  the starting$ stream since that won't emit a value until the connection
        //  is ready
        //
        this.starting.subscribe(() => {
            this._hubProxy.invoke("Subscribe", mapping, variables)
                .done(() => {
                    console.log(`Successfully subscribed to  mapping ${mapping} and variable ${variables}`);
                })
                .fail((error: any) => {
                    channelSub.subject.error(error);
                });
        },
            (error: any) => {
                channelSub.subject.error(error);
            });

        return channelSub.subject.asObservable();      
    }
    
    
   /**
    * Return all available symbolc blocks
    */
    public getBlocks(): Observable<Array<string>> {
        return this._http.get(this._blocksActionUrl, { headers: this._headers }).map(res => res.json());
    }
  
      /**
     * Read a block or subvariables if given
     */
    public readBlockVariable(name : string, variable: string):Observable<any>{
        let search = new URLSearchParams();
        let accessUrl = this._blocksActionUrl + name;
        if(variable) {
           variable.split(".").forEach(element => {
               accessUrl += "/" +  element;
           });
        }
        return this._http.get(accessUrl, { headers: this._headers }).map(res => res.json());
    }
      
    /**
     * Read a block or subvariables if given
     */
    public readBlockVariables(name : string, ...variables: string[]):Observable<any>{
        let search = new URLSearchParams();
        let accessUrl = this._blocksActionUrl + name;
        if(variables) {
           let vars = "";
           variables.forEach(element => {
               if(vars.length > 0) vars += ",";
               vars += element;
           });
           search.set("variables",vars);
        }
        return this._http.get(accessUrl, { headers: this._headers }).map(res => res.json());
    }
    
    /**
     * Write data to a block
     */
    public writeBlock(name : string, data : any):Observable<boolean>{
        let accessUrl = this._blocksActionUrl + name;
        return this._http.put(accessUrl, data, { headers: this._headers }).map(res => res.json());
    }
    
    
       /**
    * Return all available symbols
    */
    public getSymbols(): Observable<Array<string>> {
        return this._http.get(this._symbolsActionUrl, { headers: this._headers }).map(res => res.json());
    }
    
    /**
     * Read a symbols data
     */
    public readSymbols(name : string, ...variables: string[]):Observable<any>{
        let accessUrl = this._symbolsActionUrl + name;
        if(variables) accessUrl += "/" + variables;
        return this._http.get(accessUrl, { headers: this._headers }).map(res => res.json());
    }
    
    /**
     * Write data to symbols
     */
    public writeSymbols(name : string, data : any):Observable<boolean>{
        let accessUrl = this._symbolsActionUrl + name;
        return this._http.put(accessUrl, data, { headers: this._headers }).map(res => res.json());
    }
}