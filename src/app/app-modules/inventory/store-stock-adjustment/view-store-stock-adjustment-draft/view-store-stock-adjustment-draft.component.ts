import { Component, OnInit } from '@angular/core';
import { InventoryService } from 'app/app-modules/inventory/shared/service/inventory.service';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { ViewStockAdjustmentDraftDetailsComponent } from 'app/app-modules/inventory/store-stock-adjustment/view-stock-adjustment-draft-details/view-stock-adjustment-draft-details.component';
import { MdDialog } from '@angular/material';

import * as moment from 'moment';
import { DataStorageService } from 'app/app-modules/inventory/shared/service/data-storage.service';
import { SetLanguageComponent } from 'app/app-modules/core/components/set-language.component';
import { LanguageService } from 'app/app-modules/core/services/language.service';


@Component({
  selector: 'app-view-store-stock-adjustment-draft',
  templateUrl: './view-store-stock-adjustment-draft.component.html',
  styleUrls: ['./view-store-stock-adjustment-draft.component.css']
})
export class ViewStoreStockAdjustmentDraftComponent implements OnInit {

  today: any;
  fromDate: any;
  toDate: any;
  stockAdjustmentList = [];

  filterTerm: any;
  filteredStockAdjustmentList = [];
  languageComponent: SetLanguageComponent;
  currentLanguageSet: any;

  constructor(
    private location: Location,
    private router: Router,
    private dialog: MdDialog,
    private http_service: LanguageService,
    private dataStorageService: DataStorageService,
    private inventoryService: InventoryService) { }

  ngOnInit() {
    this.fromDate = new Date();
    this.fromDate.setHours(0, 0, 0, 0);
    this.toDate = new Date();

    this.today = new Date();
    this.viewRecords();
    this.fetchLanguageResponse();
  }

  viewRecords() {
    let startDate: Date = new Date(this.fromDate);
    startDate.setHours(0);
    startDate.setMinutes(0);
    startDate.setSeconds(0);
    startDate.setMilliseconds(0)

    let endDate: Date = new Date(this.toDate);
    endDate.setHours(23);
    endDate.setMinutes(59);
    endDate.setSeconds(59);
    endDate.setMilliseconds(0);
    

    let temp = {
      fromDate: new Date(startDate.valueOf() - 1 * startDate.getTimezoneOffset() * 60 * 1000),
      toDate: new Date(endDate.valueOf() - 1 * endDate.getTimezoneOffset() * 60 * 1000),
      facilityID: localStorage.getItem('facilityID') ? +(localStorage.getItem('facilityID')) : undefined
    };

    this.inventoryService.getStockAdjustmentDraftList(temp)
      .subscribe(response => {
        this.stockAdjustmentList = response.slice();
        this.filteredStockAdjustmentList = response.slice();
      })
  }

  filterStockAdjustmentList(filterTerm) {
    if (!filterTerm)
      this.filteredStockAdjustmentList = this.stockAdjustmentList.slice();
    else {
      this.filteredStockAdjustmentList = [];
      this.stockAdjustmentList.forEach((item) => {
        for (let key in item) {
          if (key == 'stockAdjustmentDraftID' || key == 'refNo' || key == 'draftDesc' || key == 'createdBy') {
            let value: string = '' + item[key];
            if (value.toLowerCase().indexOf(filterTerm.toLowerCase()) >= 0) {
              this.filteredStockAdjustmentList.push(item); break;
            }
          }
        }
      });
    }
  }

  viewStockAdjustmentDraftDetails(draftID) {
    this.dialog.open(ViewStockAdjustmentDraftDetailsComponent, {
      width: "80%",
      panelClass: 'fit-screen',
      data: {
        adjustmentID: draftID
      }
    }).afterClosed().subscribe(response => {
      if (response) {
        console.log(response);
        const printableData = this.createPrintableData(response);
        this.dataStorageService.adjustment = printableData;
        let URL = 'adjustment'
        this.router.navigate(['/inventory/dynamicPrint/', URL])
      }
    })
  }

  goBack() {
    this.location.back();
  }

  goToUpdateAdjustmentDraft(draftID) {
    this.router.navigate(["inventory/storeStockAdjustment/update", draftID]);
  }
  createPrintableData(adjustmentDetials) {
    let facilityDetail = JSON.parse(localStorage.getItem('facilityDetail'))
    let facilityName = facilityDetail.facilityName;
    let adjustedItemList = []
    let i = 0;
    
    adjustmentDetials.stockAdjustmentItemDraftEdit.forEach((stock) => {
      i = i + 1;
      let temp = {
        'sNo': i,
        'itemName': stock.itemName,
        'batchID': stock.batchID,
        'quantityInHand': stock.quantityInHand,
        'adjustedQuantity': stock.adjustedQuantity,
        'adjustmentType': stock.isAdded != undefined && stock.isAdded ? 'Receipt' : 'Issue',
        'reason': stock.reason
      }
      adjustedItemList.push(temp);
    });
    
    let headerDetails = Object.assign({ facilityName: facilityName, createDate: moment(adjustmentDetials.createdDate).format('DD-MM-YYYY') }, adjustmentDetials);
    let printableData = Object.assign({}, { title: this.title }, { headerColumn: this.headerColumn }, { headerDetail: headerDetails }, { columns: this.columns }, { printableData: adjustedItemList });
    return printableData;
  }

  title = {
    modalTitle: '',
    headerTitle: 'Adjustment Detail',
    tableTitle: ''
  }

  columns = [
    {
      "keyName": "sNo",
      "columnName": "S No."
    },
    {
      "keyName": "itemName",
      "columnName": "Item Name"
    },
    {
      "keyName": "batchID",
      "columnName": "Batch No"
    },
    {
      "keyName": "quantityInHand",
      "columnName": "Quantity on Hand"
    },
    {
      "keyName": "adjustedQuantity",
      "columnName": "Adjusted Quantity"
    },
    {
      "keyName": "adjustmentType",
      "columnName": "Adjustment Type"
    },
    {
      'columnName': 'Reason',
      'keyName': 'reason',
    }
  ]

  headerColumn = [
    {
      columnName: 'Adjustment Draft ID :',
      keyName: 'stockAdjustmentDraftID',
    },
    {
      columnName: 'Facility ID :',
      keyName: 'facilityID',
    },
    {
      columnName: 'Reference No :',
      keyName: 'refNo',
    },
    {
      columnName: 'Draft Description :',
      keyName: 'draftDesc',
    },
    {
      columnName: 'Created By :',
      keyName: 'createdBy',
    },
    {
      columnName: 'Created Date :',
      keyName: 'createDate',
    }
  ]

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