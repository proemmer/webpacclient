import {Component, OnInit, Input} from "@angular/core";
import {Http, Response} from "@angular/http";

import {WebpacService, DataChangeEvent} from "../../services/webpac.service";


export class PlcItem {
    active: boolean;
    name: string;
    value: string;

    constructor(name: string, value: string) {
        this.name = name;
        this.value = value;
    }
}

@Component({
    selector: 'webpac-viewer',
    templateUrl: 'app/components/plcviewer/plcviewer.component.html',
    styleUrls: ['app/components/plcviewer/plcviewer.component.css'],
})
export class PlcViewerComponent implements OnInit {

    public symbols: Array<string> = [];
    public selectedSymbol: string;
    public reads: Array<PlcItem> = null;
    public activeVars: Array<string> = [];
    public area: string = "DB1112";
    public address: string = "W0";
    public rawRed: string;
    public activeatedRawChanges: boolean;

    constructor(private _webPacService: WebpacService) {
    }

    public ngOnInit() {
        this._webPacService.getSymbols().subscribe((symbols) => {
            if (symbols != null && symbols.length > 0) {
                try {
                    this.symbols = symbols;
                } catch (error) {
                    console.error(error);
                }
            } else {
                console.warn("no data red!");
            }
        });
    }


    public onSelect(symbol: string) {
        this.selectedSymbol = symbol;
    }


    public onActivateDataChange() {
        try {
            let variables: Array<string> = [];
            if (this.reads != null) {
                this.reads.forEach(variable => {
                    if (variable.active) {
                        variables.push(variable.name);
                        console.info("active variable " + variable.name + " for mapping " + this.selectedSymbol);
                    }
                });

                this._webPacService.subscribe(this.selectedSymbol, variables).subscribe(
                    (dce: DataChangeEvent) => {
                        this.dataUpdated(dce);
                    },
                    (error: any) => {
                        console.warn("Attempt to join channel failed!", error);
                    }
                )
            }
        } catch (error) {
            console.error(error);
        }
    }


    public onActivateRawChanges() {
        let addresses: Array<string> = [];
        addresses.push(this.address);
        this.activeatedRawChanges = true;
        this._webPacService.subscribeRaw(this.area, addresses).subscribe(
            (dce: DataChangeEvent) => {
                this.dataUpdated(dce);
            },
            (error: any) => {
                console.warn("Attempt to join channel failed!", error);
            }
        )
    }

    public onDeactivateRawChanges() {
        let addresses: Array<string> = [];
        addresses.push(this.address);
        this.activeatedRawChanges = false;
        this._webPacService.unsubscribeRaw(this.area, addresses).subscribe(
            (dce: DataChangeEvent) => {
                this.dataUpdated(dce);
            },
            (error: any) => {
                console.warn("Attempt to join channel failed!", error);
            }
        )
    }


    public onRead() {
        try {
            this._webPacService.readSymbolicVariable(this.selectedSymbol, "This").subscribe((data: any) => {
                try {
                    if (data != null && data.This != null) {
                        this.reads = new Array<PlcItem>();
                        this.resolveObject(this.reads, data.This, null, false);
                    } else {
                        console.warn("no data red!");
                    }
                } catch (error) {
                    console.warn("no data red!");
                }
            });
        } catch (error) {
            console.error(error);
        }
    }

    public onWrite(item: PlcItem) {
        try {
            this._webPacService.writeSymbolicVariable(this.selectedSymbol, item.name, item.value).subscribe((data: any) => {
                console.warn(data);
            });
        } catch (error) {
            console.error(error);
        }
    }

    private dataUpdated(ev: DataChangeEvent): void {
        console.warn(`onEvent - ${ev.Mapping}.${ev.Variable}=${ev.Value}`);

        if(ev.IsRaw){
            if(ev.Mapping == this.area && ev.Variable == this.address){
                this.rawRed = ev.Value;
            }
        }
        else{
            let updated = this.reads.find((y) => y.name == ev.Variable);
            if (updated != null)
                updated.value = ev.Value;
        }

    }


    public onReadRaw() {
        try {
            this._webPacService.readAbsoluteVariable(this.area, this.address).subscribe((data: any) => {
                try {
                    if (data != null) {
                        this.rawRed = data;
                    } else {
                        console.warn("no data red!");
                    }
                } catch (error) {
                    console.warn("no data red!");
                }
            });
        } catch (error) {
            console.error(error);
        }
    }

    public onWriteRaw() {
        try {
            this._webPacService.writeAbsoluteVariable(this.area, this.address, this.rawRed).subscribe((data: any) => {
                console.warn(data);
            });
        } catch (error) {
            console.error(error);
        }
    }


    private resolveObject(result: Array<PlcItem>, object: any, prefix: string, onlyVarNames: boolean) {
        let isArray = Array.isArray(object);

        //no prefix -> set it to null to handle only one value in the loop
        if (prefix == "")
            prefix = null;

        //onlyVarNames is true -> if this object isn't an array, clear prefix
        if (prefix != null && (!isArray && onlyVarNames))
            prefix = null;

        //loop through the object
        for (var property in object) {
            if (object.hasOwnProperty(property)) {

                //get name and data
                var value = object[property];
                var name = prefix != null ?
                    isArray ? prefix + "[" + property + "]" : prefix + "." + property :
                    isArray ? "[" + property + "]" : property;

                if (value === Object(value)) {
                    //property is an object, so step up to handle these properties
                    this.resolveObject(result, value, name, onlyVarNames);
                } else {
                    //normal property, so save it to resultSet
                    result.push(new PlcItem(name, String(value)));
                }
            }
        }
    }
}
