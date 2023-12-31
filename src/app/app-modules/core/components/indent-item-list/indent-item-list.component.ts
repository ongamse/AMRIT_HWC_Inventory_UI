import { Component, OnInit, Inject } from '@angular/core';
import { MdDialog, MdDialogRef, MD_DIALOG_DATA } from '@angular/material';
import { ConfirmationService } from '../../services/confirmation.service';
import { Observable, Subject } from 'rxjs';
import { BatchSearchService } from '../../services/batch-search.service';
import { SetLanguageComponent } from '../set-language.component';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-indent-item-list',
  templateUrl: './indent-item-list.component.html',
  styleUrls: ['./indent-item-list.component.css']
})
export class IndentItemListComponent implements OnInit {

  searchTerms: string;
  items: Observable<any>;
  selectedItemList = [];
  
  languageComponent: SetLanguageComponent;
  currentLanguageSet: any;

  constructor(
    @Inject(MD_DIALOG_DATA) public input: any,
    private confirmationService: ConfirmationService,
    public dialogRef: MdDialogRef<IndentItemListComponent>,
    public http_service: LanguageService,
    private batchSearchService: BatchSearchService) { }

  ngOnInit() {
    this.search(this.input.searchTerm);
    this.fetchLanguageResponse();
  }

  search(term: string): void {
    this.items = this.batchSearchService.searchItem(term);
  }
  selectItem(event, item) {
    if (event.checked) {
      item.selected = true;
      this.selectedItemList.push(item);
    } else {
      let index = this.selectedItemList.indexOf(item);
      this.selectedItemList.splice(index, 1);
      item.selected = false;
    }
  }
  disableSelection(item) {
    let addedIndent = this.input.addedIndent;
    let temp = addedIndent.filter(indent => indent.itemName == item.itemName);
    if (temp.length > 0)
      return true;
    else
      return false;
  }
  submitIndentList() {
    this.dialogRef.close(this.selectedItemList);
  }

  // AV40085804 29/09/2021 Integrating Multilingual Functionality -----Start-----
  ngDoCheck() {
    this.fetchLanguageResponse();
  }

  fetchLanguageResponse() {
    this.languageComponent = new SetLanguageComponent(this.http_service);
    this.languageComponent.setLanguage();
    this.currentLanguageSet = this.languageComponent.currentLanguageObject;
  }
  // -----End------
}
