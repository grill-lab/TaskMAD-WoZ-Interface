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

import {API_ROOT_URL } from "../../common/config"
import {ButtonModel} from "../model/ButtonModel"
import {ISearchRequest, ISearchResult, Searcher} from "./Searcher"

export class SeriousEatsSearcher extends Searcher {

    constructor() {
        super("SeriousEats Search")
    }

    protected performSearch = async (request: ISearchRequest): Promise<ISearchResult[] | undefined> => {
        if (request.data === undefined || request.query.trim().length === 0) {
            return undefined
        }

        const requestOptions = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({query: request.query.trim()})
        };
        let results = [];

        try {
            const response = await fetch(API_ROOT_URL + '/search/serious_eats', requestOptions);
            const dataJson = await response.json();
            if (dataJson !== undefined && dataJson['errors'].length === 0) {
                const documents = dataJson['documents']
                for (let document of documents) {
                    results.push({
                        buttonID: new ButtonModel({
                            badges: {},
                            color: "",
                            id: document['id'],
                            label: document['section_title'],
                            tooltip: document['contents'],
                            transitions: {},
                        })
                    })
                }
            }

        } catch (error) {
            console.log(error)
        }

        return results;
    }
}
