import { Component, OnInit, Inject } from '@angular/core';
import { InventoryService } from 'app/app-modules/inventory/shared/service/inventory.service';
import { MdDialogRef, MD_DIALOG_DATA } from '@angular/material';
import { filter } from '@angular/cdk/rxjs';
import { SetLanguageComponent } from 'app/app-modules/core/components/set-language.component';
import { LanguageService } from 'app/app-modules/core/services/language.service';

@Component({
  selector: 'app-view-stock-adjustment-draft-details',
  templateUrl: './view-stock-adjustment-draft-details.component.html',
  styleUrls: ['./view-stock-adjustment-draft-details.component.css']
})
export class ViewStockAdjustmentDraftDetailsComponent implements OnInit {

  filterTerm: string;

  stock: any;
  adjustmentList = [];
  filteredAdjustmentList = [];
  currentLanguageSet: any;
  languageComponent: SetLanguageComponent;

  constructor(
    private http_service: LanguageService,
    @Inject(MD_DIALOG_DATA) public input: any,
    public dialogRef: MdDialogRef<ViewStockAdjustmentDraftDetailsComponent>,
    private inventoryService: InventoryService) { }

  ngOnInit() {
    this.fetchLanguageResponse();
    if (this.input && this.input.adjustmentID) {
      this.getStockAdjustmentDetails(this.input.adjustmentID);
    }
  }

  getStockAdjustmentDetails(adjustmentID) {
    let temp = parseInt(adjustmentID);
    this.inventoryService.getStockAdjustmentDraftDetails(temp)
      .subscribe(response => {
        this.stock = response;
        this.adjustmentList = response.stockAdjustmentItemDraftEdit.slice();
        this.filteredAdjustmentList = response.stockAdjustmentItemDraftEdit.slice();
      });
  }

  filterDetails(filterTerm) {
    if (!filterTerm)
      this.filteredAdjustmentList = this.adjustmentList.slice();
    else {
      this.filteredAdjustmentList = [];
      this.adjustmentList.forEach((item) => {
        for (let key in item) {
          if (key == 'itemName' || key == 'batchID' || key == 'reason' || key == 'quantityInHand' || key == 'adjustedQuantity' || key == 'isAdded') {
            let value: string = '' + item[key];
            if (key == 'isAdded') {
              if ('receipt'.indexOf(filterTerm.toLowerCase()) >= 0 && item[key]) {
                this.filteredAdjustmentList.push(item); break;
              }
              else if ('issue'.indexOf(filterTerm.toLowerCase()) >= 0 && !item[key]) {
                this.filteredAdjustmentList.push(item); break;
              }
            }
            if (value.toLowerCase().indexOf(filterTerm.toLowerCase()) >= 0) {
              this.filteredAdjustmentList.push(item); break;
            }
          }
        }
      });
    }
  }

  //AN40085822 29/9/2021 Integrating Multilingual Functionality --Start--
  ngDoCheck(){
    this.fetchLanguageResponse();
  }

  fetchLanguageResponse() {
    this.languageComponent = new SetLanguageComponent(this.http_service);
    this.languageComponent.setLanguage();
    this.currentLanguageSet = this.languageComponent.currentLanguageObject; 
  }
  //--End--
}
