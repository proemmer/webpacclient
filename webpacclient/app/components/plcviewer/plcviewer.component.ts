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
})
export class PlcViewerComponent implements OnInit {

    public symbols: Array<string> = [];
    public selectedSymbol: string;
    public reads: Array<PlcItem> = null;
    public activeVars: Array<string> = [];

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


    public onRead() {
        try {
            this._webPacService.readVariable(this.selectedSymbol, "This").subscribe((data: any) => {
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
            this._webPacService.writeVariable(this.selectedSymbol, item.name, item.value).subscribe((data: any) => {
                console.warn(data);
            });
        } catch (error) {
            console.error(error);
        }
    }

    private dataUpdated(ev: DataChangeEvent): void {
        console.warn(`onEvent - ${ev.Mapping}.${ev.Variable}=${ev.Value}`);

        let updated = this.reads.find((y) => y.name == ev.Variable);
        if (updated != null)
            updated.value = ev.Value;
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
