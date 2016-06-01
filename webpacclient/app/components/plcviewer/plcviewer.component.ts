import {Component, OnInit, Input} from "@angular/core";
import {Http, Response} from "@angular/http";

import {WebpacService, DataChangeEvent} from "../../services/webpac.service";

@Component({
    selector: 'webpac-viewer',
    templateUrl: 'app/components/plcviewer/plcviewer.component.html',
})
export class PlcViewerComponent implements OnInit {
    
    public blocks: Array<string> = [];
    public selectedBlock: string;
    public mapping: string;
    public variables: Array<string> = [];
  
    constructor( private _webPacService: WebpacService) {

    }

    ngOnInit() {
        this._webPacService.getBlocks().subscribe( (blocks) =>{
            if(blocks != null && blocks.length > 0){
                this.blocks = blocks;
            }
        });
    }
    onSelect(block: string) { this.selectedBlock = block; }


    public onActivateDataChange(){
          this._webPacService.subscribe(this.mapping,this.variables).subscribe(
            (dce: DataChangeEvent) => {
                this.dataUpdated(dce);
            },
            (error: any) => {
                console.warn("Attempt to join channel failed!", error);
            }
        )
    }
    
    public onReadBlock(){
        this._webPacService.readBlockVariable(this.selectedBlock,"This").subscribe((data:any) =>{
            if(data != null){
                
            }
        });
    }

    private dataUpdated(ev: DataChangeEvent): void {
        console.warn(`onEvent - ${ev.Mapping}.${ev.Variable}=${ev.Value}`);
    }
    
    

}
