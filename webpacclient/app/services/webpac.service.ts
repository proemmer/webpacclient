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

interface Authentication {
    Authenticated: boolean;
    User: string;
    Role: string;
    Token: string;
    TokenExpires: string;
}

class Subscriber {
    mapping: string;
    variables: string[];
    subject: Subject<DataChangeEvent>;
}




@Injectable()
export class WebpacService {
    private _tokenActionUrl: string;
    private _symbolicActionUrl: string;
    private _absoluteActionUrl: string;
    private _loggedIn = false;

    private _connectionStateSubject = new Subject<ConnectionState>();
    private _startingSubject = new Subject<any>();
    private _errorSubject = new Subject<any>();
    private _authData = null;
    
    private _hubConnection: any;
    private _hubProxy: any;

    // An internal array to track what channel subscriptions exist 
    private _subscribers = new Array<Subscriber>();

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


    /***********************************************************************
     *          CTOR
     * ********************************************************************/

    constructor(private _http: Http,
        private _configuration: Configuration,
        private _window: SignalrWindow) {

        this.ensureAuthenticated();
        this.configureSignalR();
        this.configureWebApi();
    }




    /***********************************************************************
     *          LOGIN AND LOGOUT
     * ********************************************************************/

    public ensureAuthenticated(throwException: boolean = false): boolean {

        try {
            this._loggedIn = false;
            if (this._authData != null) {
                this._loggedIn = ((new Date(this._authData.TokenExpires).valueOf() - Date.now().valueOf()) > 0);
            } else {
                var token = localStorage.getItem('auth_token');
                if (token != null) {
                    this._authData = JSON.parse(token);
                    this._loggedIn = ((new Date(this._authData.TokenExpires).valueOf() - Date.now().valueOf()) > 0);
                }
            }
        } catch (error) {
            console.warn(error);
            this._authData = null;
        }

        if (throwException && !this._loggedIn)
            throw "not authenticated";
        return this._loggedIn;
    }


    public login(username: string, password: string): Observable<boolean> {
        let headers = new Headers();
        headers.append('Content-Type', 'application/json');

        return this._http
            .post(
            this._tokenActionUrl,
            JSON.stringify({ username, password }),
            { headers }
            )
            .map(res => res.json())
            .map((auth:Authentication) => {
                try {
                    if (auth.Authenticated) {
                        this._authData = auth;
                        let stringData = JSON.stringify(auth);
                        localStorage.setItem('auth_token', stringData);
                        this._loggedIn = true;

                        if (this._configuration.UseSignalR)
                            this.start();
                        console.warn("Authenticated!");
                    } else {
                        console.warn("Not Authenticated!");
                    }

                    return auth.Authenticated;
                } catch (error) {
                    console.warn(error);
                    return false;
                }

            });
    }

    public logout() {
        localStorage.removeItem('auth_token');
        this._loggedIn = false;
    }

    public isLoggedIn() {
        return this._loggedIn;
    }

    /***********************************************************************
     *          SIGNALR
     * ********************************************************************/

    private configureSignalR() {

        if (!this._configuration.UseSignalR)
            return;

        if (this._window.$ === undefined || this._window.$.hubConnection === undefined) {
            throw new Error("The variable '$' or the .hubConnection() function are not defined...please check the SignalR scripts have been loaded properly");
        }

        // Set up our observables
        this.connectionState = this._connectionStateSubject.asObservable();
        this.error = this._errorSubject.asObservable();
        this.starting = this._startingSubject.asObservable();

        this._hubConnection = this._window.$.hubConnection();
        this._hubConnection.url = this._configuration.ServerWithSignalRUrl;
        this._hubProxy = this._hubConnection.createHubProxy(this._configuration.HubName);

        // Define handlers for the connection state events
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
            this._connectionStateSubject.next(newState);
        });

        // Define handlers for any errors
        this._hubConnection.error((error: any) => {
            // Push the error on our subject
            this._errorSubject.next(error);
        });

        this._hubProxy.on("DataChanged", (mapping: string, variable: string, value: any) => {
            //console.log(`onEvent - ${channel} channel`, ev);

            // This method acts like a broker for incoming messages. We 
            //  check the interal array of subjects to see if one exists
            //  for the channel this came in on, and then emit the event
            //  on it. Otherwise we ignore the message.
            let channelSub = this._subscribers.find((x: Subscriber) => {
                return x.mapping === mapping && x.variables.indexOf(variable) > -1;
            }) as Subscriber;

            // If we found a subject then emit the event on it
            if (channelSub !== undefined) {
                let dce = new DataChangeEvent();
                dce.Mapping = mapping;
                dce.Variable = variable;
                dce.Value = value;
                return channelSub.subject.next(dce);
            }
        });


        if (this._loggedIn) {
            this.start();
        }
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
        this._hubConnection.start()
            .done(() => {
                this._startingSubject.next(null);
            })
            .fail((error: any) => {
                this._startingSubject.error(error);
            });
    }

    public subscribe(mapping: string, variables: string[]): Observable<DataChangeEvent> {
        this.ensureAuthenticated(true);
        // Now we just create our internal object so we can track this subject
        // in case someone else wants it too
        let channelSub = new Subscriber();
        channelSub.mapping = mapping;
        channelSub.variables = variables;
        channelSub.subject = new Subject<DataChangeEvent>();
        this._subscribers.push(channelSub);

        // Now SignalR is asynchronous, so we need to ensure the connection is
        // established before we call any server methods. So we'll subscribe to 
        // the starting$ stream since that won't emit a value until the connection
        // is ready
        this._hubProxy.invoke("Subscribe", mapping, variables)
            .done(() => {
                console.log(`Successfully subscribed to  mapping ${mapping} and variable ${variables}`);
            })
            .fail((error: any) => {
                channelSub.subject.error(error);
            });
        return channelSub.subject.asObservable();
    }


    /***********************************************************************
     *          WEB API
     * ********************************************************************/

    private configureWebApi() {
        this._tokenActionUrl = this._configuration.ServerWithApiUrl + "token/";
        this._symbolicActionUrl = this._configuration.ServerWithApiUrl + "symbolic/";
        this._absoluteActionUrl = this._configuration.ServerWithApiUrl + "absolutes/";
    }
    
     /***********************************************************************
     *          WEB API - Symbolic
     * ********************************************************************/

    /**
     * Return all available symbols
     */
    public getSymbols(): Observable<Array<string>> {
        this.ensureAuthenticated(true);
        return this._http.get(this._symbolicActionUrl, { headers: this.getHeaders() }).map(res => res.json());
    }

    /**
   * Read a varaible
   */
    public readSymbolicVariable(name: string, variable: string): Observable<any> {
        this.ensureAuthenticated(true);
        let search = new URLSearchParams();
        let accessUrl = this._symbolicActionUrl + name;
        if (variable) {
            variable.split(".").forEach(element => {
                accessUrl += "/" + element;
            });
        }
        return this._http.get(accessUrl, { headers: this.getHeaders() }).map(res => res.json());
    }

    /**
     * Read variables
     */
    //public readVariables(name: string, ...variables: Array<string>): Observable<any> {
    public readSymbolicVariables(name: string, variables: Array<string>): Observable<any> {
        this.ensureAuthenticated(true);
        let search = new URLSearchParams();
        let accessUrl = this._symbolicActionUrl + name;
        if (variables) {
            let vars = "";
            variables.forEach(element => {
                if (vars.length > 0) vars += ",";
                vars += element;
            });
            search.set("variables", vars);
        }
        return this._http.get(accessUrl, { headers: this.getHeaders() }).map(res => res.json());
    }

    /**
     * Write a variable
     */
    public writeSymbolicVariable(name: string, variable: string, data: any): Observable<any> {
        this.ensureAuthenticated(true);
        let accessUrl = this._symbolicActionUrl + name;
        return this._http.patch(accessUrl, "{ \"" + variable + "\": " + JSON.stringify(data) + " }", { headers: this.getHeaders() });
    }


     /***********************************************************************
     *          WEB API - Absolute
     * ********************************************************************/


    /**
   * Read a varaible
   */
    public readAbsoluteVariable(area: string, address: string): Observable<any> {
        this.ensureAuthenticated(true);
        let search = new URLSearchParams();
        let accessUrl = this._absoluteActionUrl + area + "/" + address;
        return this._http.get(accessUrl, { headers: this.getHeaders() }).map(res => res.json());
    }


    private getHeaders(): any {
        let headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.append('Accept', 'application/json');

        try {
            let authToken = localStorage.getItem('auth_token');
            headers.append('Authorization', `Bearer ${JSON.parse(authToken).Token}`);
        } catch (error) {
            console.warn("invald authentication token!")
        }

        return headers;
    }
}