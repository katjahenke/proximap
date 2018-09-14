import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {ActivatedRoute} from '@angular/router';
import {NgRedux, select} from '@angular-redux/store/lib/src';
import {Feature} from 'geojson';
import {HttpClient} from '@angular/common/http';
import {Observable, Subscription} from 'rxjs';
import {DataService} from '../data.service';
import {isObject} from 'util';
import {CHANGE_CITY, CHANGE_LANG, CHANGE_MODE, CLOSE_DETAIL, DESELECT_FOUNTAIN, UPDATE_FILTER_CATEGORIES} from '../actions';
import {FilterCategories, FountainSelector, IAppState} from '../store';

export interface QueryParams {
  lang: string,
  mode: string,
  queryType?: string,
  database?: string,
  idval?: string,
  lat?: number,
  lng?: number,
  onlyOlderThan?: number,
  onlyNotable?: boolean,
  onlySpringwater?: string,
  filterText?: string
}

@Injectable({
  providedIn: 'root'
})
export class RouteValidatorService {
  // Validates route names

  allowedValues = {
    lang: {
      action: CHANGE_LANG,
      values: [
        {
          name: 'English',
          code: 'en',
          aliases: ['english', 'anglais', 'englisch', 'en']
        }, {
          name: 'Français',
          code: 'fr',
          aliases: ['french', 'französisch', 'franzoesisch', 'francais', 'fr']
        }, {
          name: 'Deutsch',
          code: 'de',
          aliases: ['german', 'allemand', 'deutsch', 'de']
        }
      ]
    },
    mode: {
      action: CHANGE_MODE,
      values: [
        {
          aliases: ['map', 'karte', 'carte'],
          code: 'map'
        },
        {
          aliases: ['details'],
          code: 'details'
        },
        {
          aliases: ['navigate', 'directions', 'navigieren', 'navigation'],
          code: 'directions'
        },
      ]
    },
    city: {
      action: CHANGE_CITY,
      values: [
        {
          code: 'zurich',
          aliases: ['zuerich', 'zuri', 'zürich ', 'zurich']
        },
        {
          code: 'geneva',
          aliases: ['genève', 'geneve', 'genf', 'geneva', '/gen%C3%A8ve']
        },
        {
          code: 'basel',
          aliases: ['bale', 'bâle', 'basel', '/b%C3%A2le']
        }
      ]
    }
  };

  constructor(public router: Router,
              private route: ActivatedRoute,
              private http: HttpClient,
              private ngRedux: NgRedux<IAppState>,
              private dataService: DataService) {
  }

  validate(key: string, value: any): void {
    if (value !== null) {
      for (let i = 0; i < this.allowedValues[key].values.length; ++i) {
        // find matching lang
        let index = this.allowedValues[key].values[i].aliases.indexOf(value.toLowerCase());
        if (index >= 0) {
          let code = this.allowedValues[key].values[i].code;
          // update lang if new
          if (code !== this.ngRedux.getState()[key]) {
            this.ngRedux.dispatch({type: this.allowedValues[key].action, payload: code});
          }
        }
      }
    }
  }

  validateFilter(filterCategories:FilterCategories): void{
    if(JSON.stringify(filterCategories) !== JSON.stringify(this.ngRedux.getState().filterCategories)){
      this.ngRedux.dispatch({type: UPDATE_FILTER_CATEGORIES, payload: filterCategories})
    }
  }

  getQueryParams(): QueryParams {
    let state = this.ngRedux.getState();
    let queryParams: QueryParams = {
      lang: state.lang,
      mode: state.mode,
    };
    if (state.fountainSelector !== null) {
      for (let p of ['queryType', 'database', 'idval', 'lat', 'lng']) {
        if (state.fountainSelector[p] !== null) {
          queryParams[p] = state.fountainSelector[p];
        }
      }
    }
    // if (state.filterCategories !== null) {
    //   for (let p of ['onlyOlderThan', 'onlyNotable', 'onlySpringwater', 'filterText']) {
    //     if (state.filterCategories[p] ) {
    //       queryParams[p] = state.filterCategories[p];
    //     }
    //   }
    // }
    return queryParams;
  }

  updateFromRouteParams(params):void {
    let state = this.ngRedux.getState();

    // validate lang
    this.validate('lang', params.get('lang'));

    // validate mode
    this.validate('lang', params.get('lang'));

    // validate fountain selector
    if(params.keys.indexOf('queryType')>=0){
      let fountainSelector:FountainSelector = {
        queryType: params.get('queryType'),
        database: params.get('database'),
        idval: params.get('idval'),
      };
      if(JSON.stringify(fountainSelector)!== JSON.stringify(state.fountainSelector)){
        this.dataService.selectFountainBySelector(fountainSelector);
      }
    }else{
      // deselect fountain
      if (state.fountainSelector !== null){
        this.ngRedux.dispatch({type: CLOSE_DETAIL})
      }
    }

    // // validate filter categories
    // let filterCategories:FilterCategories = {
    //   onlyOlderThan: parseInt(params.get('onlyOlderThan')) || null,
    //   onlyNotable: Boolean(params.get('onlyNotable')),
    //   onlySpringwater: Boolean(params.get('onlySpringwater')),
    //   filterText: params.get('filterText') || ''
    // };
    // if(JSON.stringify(filterCategories) !== JSON.stringify(state.filterCategories)){
    //   this.ngRedux.dispatch({type: UPDATE_FILTER_CATEGORIES, payload: filterCategories})
    // }
  }
}
