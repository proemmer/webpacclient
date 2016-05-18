import {Injectable} from '@angular/core';
import {Http, URLSearchParams, Headers} from '@angular/http';
import {Observable} from 'rxjs/Rx';
import {Configuration} from '../app.constants';

@Injectable()
export class WebpacService{
    private _headers: Headers;
    private _blocksActionUrl : string;
    private _symbolsActionUrl : string;
    private _absoluteActionUrl : string;
    
    constructor(private _http: Http, private _configuration: Configuration) {
        this._blocksActionUrl = _configuration.ServerWithApiUrl + "blocks/";
        this._symbolsActionUrl = _configuration.ServerWithApiUrl + "symbols/";
        this._absoluteActionUrl = _configuration.ServerWithApiUrl + "absolutes/";
        
        this._headers = new Headers();
        this._headers.append('Content-Type', 'application/json');
        this._headers.append('Accept', 'application/json');
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