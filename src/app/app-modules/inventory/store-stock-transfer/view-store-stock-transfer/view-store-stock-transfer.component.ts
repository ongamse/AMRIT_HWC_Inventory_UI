import { Component, OnInit, HostListener, ViewChild } from '@angular/core';
import {
  ViewStoreStockTransferDetailsComponent
} from './view-store-stock-transfer-details/view-store-stock-transfer-details.component';
import { MdDialogRef, MdDialog, MdDialogConfig } from '@angular/material';
import { Location } from '@angular/common';
import { InventoryService } from '../../shared/service/inventory.service';
import { DataStorageService } from './../../shared/service/data-storage.service';
import * as moment from 'moment';
import { Router } from '@angular/router';
import { SetLanguageComponent } from 'app/app-modules/core/components/set-language.component';
import { LanguageService } from 'app/app-modules/core/services/language.service';
@Component({
  selector: 'app-view-store-stock-transfer',
  templateUrl: './view-store-stock-transfer.component.html',
  styleUrls: ['./view-store-stock-transfer.component.css']
})
export class ViewStoreStockTransferComponent implements OnInit {



  _minDate: any;
  _today: any;

  _dateRange: Date[] = [];
  _dateRangePrevious: Date[] = [];

  _stockEntryList = [];
  _filteredStockEntryList = [];
  blankTable = [1, 2, 3, 4, 5];
  filterTerm;
  ourStore: any;
  searched: Boolean = false;
  languageComponent: SetLanguageComponent;
  currentLanguageSet: any;



  constructor(
    private location: Location,
    private inventoryService: InventoryService,
    private dataStorageService: DataStorageService,
    private dialog: MdDialog,
    private http_service: LanguageService,
    private router: Router
  ) {

  }


  ngOnInit() {
    this.setDateDefault();
    this.fetchLanguageResponse();

    this.getPastEntries();
    this.ourStore = localStorage.getItem('facilityID');
  }



  setDateDefault() {
    this._today = new Date();
    this._minDate = new Date();
    this._minDate.setFullYear(this._today.getFullYear() - 1);
    this._dateRange[0] = this._today;
    this._dateRange[1] = this._today;

    // const date = new Date(); // Now
    // date.setDate(date.getDate() - 30);
    // this._dateRange = [date, new Date()]
    console.log(this._dateRange, 'dateRange')
  }


  getPastEntries() {
    const obj = this.getViewServiceObject();
    this.inventoryService.viewStockTransferEntry(obj)
      .subscribe((res) => {
        this.searched = true;
        this.loadEntries(res);
      })
  }

  getViewServiceObject() {
    let startDate: Date = new Date(this._dateRange[0]);
    startDate.setHours(0);
    startDate.setMinutes(0);
    startDate.setSeconds(0);
    startDate.setMilliseconds(0)

    let endDate: Date = new Date(this._dateRange[1]);
    endDate.setHours(23);
    endDate.setMinutes(59);
    endDate.setSeconds(59);
    endDate.setMilliseconds(0);

    return {
      facilityID: localStorage.getItem('facilityID'),
      fromDate: new Date(startDate.valueOf() - 1 * startDate.getTimezoneOffset() * 60 * 1000),
      toDate: new Date(endDate.valueOf() - 1 * endDate.getTimezoneOffset() * 60 * 1000)
    }
  }
  preventTyping(e: any) {
    if (e.keyCode === 9) {
      return true;
    } else {
      return false;
    }
  }

  updateDate() {
    // if (this._dateRange !== this._dateRangePrevious) {
    // this._dateRangePrevious = this._dateRange;
    // console.log(JSON.stringify(this._dateRange, null, 4), 'callservice');
    this.getPastEntries();

    // }
  }


  loadEntries(entriesObject) {
    console.log(entriesObject);
    const newObject = [];
    if (entriesObject) {
      entriesObject.forEach(element => {
        newObject.push({
          refNo: element.refNo,
          stockTransferID: element.stockTransferID,
          transferFromID: element.transferFromFacilityID,
          transferToID: element.transferToFacilityID,
          transferFromFacility: element.transferFromFacility.facilityName,
          transferToFacility: element.transferToFacility.facilityName,
          createdBy: element.createdBy,
          createdDate: element.createdDate || 'Not Available'
        })


      });
    }
    this._stockEntryList = newObject;
    this._filteredStockEntryList = newObject;
    this.filterTerm = '';
  }

  filterConsumptionList(searchTerm: string) {
    if (!searchTerm)
      this._filteredStockEntryList = this._stockEntryList;
    else {
      this._filteredStockEntryList = [];
      this._stockEntryList.forEach((item) => {
        for (let key in item) {
          if (key == 'refNo' || key == 'stockTransferID' || key == 'transferFromFacility' || key == 'transferToFacility' || key == 'createdBy') {
            let value: string = '' + item[key];
            if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
              this._filteredStockEntryList.push(item); break;
            }
          }
        }
      });
    }
  }

  loadEntryDetails(entry) {
    if (entry && entry.stockTransferID) {
      this.inventoryService.getParticularStockTransferEntry(entry.stockTransferID)
        .subscribe(res => this.popOutEntryDetails(entry, res))
    }
  }

  popOutEntryDetails(entry, stockEntryResponse) {
    console.warn(entry, stockEntryResponse)
    if (stockEntryResponse) {
      const mdDialogRef:
        MdDialogRef<ViewStoreStockTransferDetailsComponent>
        = this.dialog.open(ViewStoreStockTransferDetailsComponent, {
          // height: '90%',
          width: '80%',
          panelClass: 'fit-screen',
          data: { stockEntry: entry, entryDetails: stockEntryResponse },
          disableClose: false
        });
      mdDialogRef.afterClosed().subscribe((result) => {
        if (result) {
          if (result.print != null && result.print == true) {
            if (result.print) {
              const printableData = this.createPrintableData(entry, stockEntryResponse);
              this.dataStorageService.stockTransfer = printableData;
              let uRL = 'stockTransfer'
              this.router.navigate(['/inventory/dynamicPrint/', uRL])
            }
          }
        }
      });
    }
  }

  createPrintableData(entry, stockEntryResponse) {
    let facilityDetail = JSON.parse(localStorage.getItem('facilityDetail'))
    let facilityName = facilityDetail.facilityName
    let printableData = []
    let i = 0;
    console.log('stockEntryResponse', JSON.stringify(stockEntryResponse, null, 4))
    stockEntryResponse.forEach((batch) => {
      i = i + 1;
      let consumedBatch = {
        'sNo': i,
        'itemName': batch.itemName,
        'batchNo': batch.batchNo,
        'expiryDate': moment(batch.expiryDate).format('DD-MM-YYYY'),
        'qod': batch.quantity
      }
      printableData.push(consumedBatch);
    })
    console.log('consumptionDetails', JSON.stringify(entry, null, 4));
    let entryDetails = Object.assign({ facilityName: facilityName, createDate: moment(entry.createdDate).format('DD-MM-YYYY') }, entry)
    console.log('consumptionResponse', JSON.stringify(printableData, null, 4));
    let stockEntered = Object.assign({}, { title: this.title }, { headerColumn: this.headerColumn }, { headerDetail: entryDetails }, { columns: this.columns }, { printableData: printableData });
    return stockEntered;
  }

  goBack() {
    this.location.back();
  }

  title = {
    modalTitle: '',
    headerTitle: 'Stock Transfer Detail',
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
      "keyName": "batchNo",
      "columnName": "Batch No"
    },
    {
      "keyName": "expiryDate",
      "columnName": "Expiry Date"
    },
    {
      "keyName": "qod",
      "columnName": "Quantity"
    },
  ]
  headerColumn = [
    {
      columnName: 'Stock Transfer ID :',
      keyName: 'stockTransferID',
    },
    {
      columnName: 'Reference No :',
      keyName: 'refNo',
    },
    {
      columnName: 'Transfer From ID :',
      keyName: 'transferFromID',
    },

    {
      columnName: 'Transfer From Facility :',
      keyName: 'transferFromFacility',
    },
    {
      columnName: 'Transfer To ID :',
      keyName: 'transferToID',
    },
    {
      columnName: 'Transfer To Facility :',
      keyName: 'transferToFacility',
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
