/*
 * Copyright 2018. University of Southern California
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {ButtonModel} from "../model/ButtonModel"
import {ISearchRequest, ISearchResult, Searcher} from "./Searcher"

export class WikiSearcher extends Searcher {

  constructor() {
    super("Wikipedia Search")
  }

  protected performSearch = async (request: ISearchRequest): Promise<ISearchResult[] | undefined> => {
    if (request.data === undefined || request.query.trim().length === 0) {
      return undefined
    }

    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({query: request.query.trim()})
    };
    const response = await fetch('http://localhost:5000/search', requestOptions);
    const dataJson = await response.json();

    if(dataJson != undefined && dataJson['errors'].length !== 0){
        const documents = dataJson['documents']
        var results = []
        for(var document of documents){
            results.push({buttonID:new ButtonModel({
                badges: {},
                color:"",
                id: document['id'],
                label: document['title'],
                tooltip: document['contents'],
                transitions: {},
              })})
        }
    }

    return results;
  }
}
